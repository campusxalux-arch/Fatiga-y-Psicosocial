/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { FATIGA_QUESTIONS, PSICOSOCIAL_QUESTIONS } from "./src/data/questions";
import { writeResultsToSheets } from "./src/utils/googleSheetsWriter";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;
const DEFAULT_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzPhh_irk4lmpo-LpPUs5EiVLkbOBv_EjUOa887tA8U2khYhGGH_5S_nWH0N2qtFUFXQQ/exec";

function getScriptUrl(): string {
  const envUrl = process.env.GOOGLE_APPS_SCRIPT_URL?.trim();
  if (envUrl && (envUrl.startsWith("http://") || envUrl.startsWith("https://"))) {
    try {
      new URL(envUrl);
      return envUrl;
    } catch {
      // Invalid URL in env
    }
  }
  return DEFAULT_SCRIPT_URL;
}

// Parse JSON request bodies
app.use(express.json());

/**
 * Sends payload to Google Apps Script Web App.
 * Uses GET with query parameter 'data' (most reliable for Google Apps Script Web Apps),
 * with fallback to POST redirection handling.
 */
async function sendToGoogleAppsScript(scriptUrl: string, payload: any): Promise<{ success: boolean; message: string; details?: any }> {
  const jsonBody = JSON.stringify(payload);

  // Method 1: POST request with redirect follow (most reliable for Google Apps Script doPost)
  try {
    console.log("[GAS] Intentando envío por POST a:", scriptUrl);
    const res = await fetch(scriptUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: jsonBody,
      redirect: "follow",
    });

    const text = await res.text();
    console.log(`[GAS] Respuesta POST (status ${res.status}):`, text.substring(0, 300));

    if (res.ok && !text.includes("<!DOCTYPE html>") && !text.includes("<html")) {
      let parsed: any = null;
      try { parsed = JSON.parse(text); } catch {}
      if (parsed && (parsed.success === true || parsed.result?.success === true)) {
        return {
          success: true,
          message: "Resultados guardados y sincronizados con Google Sheets correctamente.",
          details: parsed,
        };
      }
    }
  } catch (err) {
    console.warn("[GAS] Error en intento POST:", err);
  }

  // Method 2: GET request with JSON data param + query params as fallback
  try {
    console.log("[GAS] Intentando envío por GET con parámetro data a:", scriptUrl);
    const queryParams = new URLSearchParams();
    queryParams.append("data", jsonBody);
    for (const [k, v] of Object.entries(payload)) {
      if (k !== "data") {
        queryParams.append(k, typeof v === "object" && v !== null ? JSON.stringify(v) : String(v ?? ""));
      }
    }
    const getUrl = `${scriptUrl}${scriptUrl.includes("?") ? "&" : "?"}${queryParams.toString()}`;

    const res = await fetch(getUrl, {
      method: "GET",
      redirect: "follow",
    });

    const text = await res.text();
    console.log(`[GAS] Respuesta GET (status ${res.status}):`, text.substring(0, 300));

    if (res.ok && !text.includes("<!DOCTYPE html>") && !text.includes("<html")) {
      let parsed: any = null;
      try { parsed = JSON.parse(text); } catch {}
      if (parsed && (parsed.success === true || parsed.result?.success === true)) {
        return {
          success: true,
          message: "Resultados guardados y sincronizados con Google Sheets correctamente.",
          details: parsed,
        };
      }
    }
  } catch (err) {
    console.warn("[GAS] Error en intento GET:", err);
  }

  return {
    success: false,
    message: "Guardado en servidor local. No se pudo sincronizar automáticamente con Google Sheets.",
  };
}

/**
 * Sends payload to Google Apps Script Web App with automatic exponential backoff retries.
 */
async function sendToGoogleAppsScriptWithRetry(
  scriptUrl: string,
  payload: any,
  maxRetries = 3,
  initialDelayMs = 1000
): Promise<{ success: boolean; message: string; details?: any }> {
  let attempt = 0;
  let delay = initialDelayMs;

  while (attempt <= maxRetries) {
    if (attempt > 0) {
      console.log(`[GAS] Reintento de conexión ${attempt}/${maxRetries} en ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 2; // Retraso exponencial: 1s, 2s, 4s...
    }

    const result = await sendToGoogleAppsScript(scriptUrl, payload);
    if (result.success) {
      if (attempt > 0) {
        console.log(`[GAS] Sincronización exitosa con Google Sheets tras ${attempt} reintentos.`);
      }
      return result;
    }

    attempt++;
  }

  return {
    success: false,
    message: "Guardado en servidor local. Se agotaron los reintentos de conexión con Google Sheets.",
  };
}

// API Routes

/**
 * GET /api/questions
 * Returns local Fatiga and Psicosocial questions.
 */
app.get("/api/questions", async (req, res) => {
  return res.json({
    fatiga: FATIGA_QUESTIONS,
    psicosocial: PSICOSOCIAL_QUESTIONS,
  });
});

function formatAnswersSummaryServer(map: any): string {
  if (!map) return "";
  const parts: string[] = [];
  for (let i = 1; i <= 15; i++) {
    const val = map[i] || map[i.toString()] || "-";
    parts.push(`P${i}: ${val}`);
  }
  return parts.join(", ");
}

/**
 * POST /api/results
 * Forwards evaluation results directly to Google Sheets using user's OAuth token or falls back to Google Apps Script.
 */
app.post("/api/results", async (req, res) => {
  try {
    const payload = req.body || {};
    
    // Auto-calculate fatiga level and interpretation if missing
    const fatigaScore = Number(payload.fatigaScore) || 0;
    if (!payload.fatigaNivel && fatigaScore > 0) {
      if (fatigaScore <= 30) {
        payload.fatigaNivel = "Fatiga Baja - Estado Óptimo";
        payload.fatigaInterpretacion = "El conductor se encuentra apto para iniciar o continuar la marcha de forma segura.";
      } else if (fatigaScore <= 50) {
        payload.fatigaNivel = "Fatiga Moderada - Alerta";
        payload.fatigaInterpretacion = "Existen signos claros de cansancio. Se recomienda realizar una pausa activa de 15 a 20 minutos, hidratarse y caminar antes de continuar.";
      } else {
        payload.fatigaNivel = "Fatiga Alta - Riesgo Crítico";
        payload.fatigaInterpretacion = "Alto riesgo de microdormidas o accidentes. El conductor NO debe continuar manejando. Es obligatorio realizar un descanso prolongado o el relevo del conductor.";
      }
    }

    // Auto-calculate psicosocial level and interpretation if missing
    const psicosocialScore = Number(payload.psicosocialScore) || 0;
    if (!payload.psicosocialNivel && psicosocialScore > 0) {
      if (psicosocialScore <= 30) {
        payload.psicosocialNivel = "Baja Agresividad - Conducción Prosocial";
        payload.psicosocialInterpretacion = "El conductor demuestra tolerancia, adecuado autocontrol emocional y manejo de la frustración en la vía.";
      } else if (psicosocialScore <= 50) {
        payload.psicosocialNivel = "Agresividad Moderada - Riesgo Intermedio";
        payload.psicosocialInterpretacion = "Existen conductas reactivas e impulsividad ocasional. Se recomienda capacitación en inteligencia emocional, técnicas de manejo de estrés y conducción defensiva.";
      } else {
        payload.psicosocialNivel = "Agresividad Alta - Riesgo Crítico";
        payload.psicosocialInterpretacion = "Alto nivel de hostilidad, reactividad y predisposición a la \"ira al volante\" (Road Rage). Requiere evaluación psicológica especializada e intervención conductual antes de asumir la responsabilidad de un vehículo.";
      }
    }

    // Auto-populate answers summary & individual question fields if present in maps
    if (payload.fatigaAnswers && !payload.respuestasFatiga) {
      payload.respuestasFatiga = formatAnswersSummaryServer(payload.fatigaAnswers);
    }
    if (payload.psicosocialAnswers && !payload.respuestasPsicosocial) {
      payload.respuestasPsicosocial = formatAnswersSummaryServer(payload.psicosocialAnswers);
    }

    if (payload.fatigaAnswers) {
      for (let i = 1; i <= 15; i++) {
        if (!payload[`f${i}`]) {
          payload[`f${i}`] = payload.fatigaAnswers[i] || payload.fatigaAnswers[i.toString()] || "";
        }
      }
    }

    if (payload.psicosocialAnswers) {
      for (let i = 1; i <= 15; i++) {
        if (!payload[`p${i}`]) {
          payload[`p${i}`] = payload.psicosocialAnswers[i] || payload.psicosocialAnswers[i.toString()] || "";
        }
      }
    }

    const authHeader = req.headers["authorization"] || "";
    const token = authHeader.replace(/^bearer\s+/i, "").trim() || payload.accessToken;
    const spreadsheetId = payload.spreadsheetId;

    console.log("[API] Recibiendo resultados de evaluación para:", payload.nombreCompleto);

    // 1. Try DIRECT Google Sheets API write if both token and spreadsheetId are provided
    if (token && spreadsheetId) {
      try {
        console.log(`[API] Intentando guardar resultados DIRECTAMENTE en Google Sheet: ${spreadsheetId}`);
        const writeResult = await writeResultsToSheets(spreadsheetId, token, payload);
        return res.json(writeResult);
      } catch (directWriteErr) {
        console.error("[API] Error al escribir directamente en Google Sheets:", directWriteErr);
      }
    }

    // 2. Fall back to Google Apps Script with exponential backoff retry
    const targetScriptUrl = getScriptUrl();
    console.log("[API] Enviando resultados a Google Apps Script:", targetScriptUrl);

    const gasResult = await sendToGoogleAppsScriptWithRetry(targetScriptUrl, payload);
    
    // Save locally regardless so data is never lost
    try {
      const dataDir = path.join(process.cwd(), "data");
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      const jsonFile = path.join(dataDir, "evaluations.json");
      let current: any[] = [];
      if (fs.existsSync(jsonFile)) {
        try {
          current = JSON.parse(fs.readFileSync(jsonFile, "utf-8"));
        } catch {}
      }
      current.push({ ...payload, timestamp: new Date().toISOString() });
      fs.writeFileSync(jsonFile, JSON.stringify(current, null, 2), "utf-8");
      console.log(`[API] Evaluación guardada localmente en data/evaluations.json (Total: ${current.length})`);
    } catch (saveErr) {
      console.warn("[API] No se pudo guardar copia local en disco:", saveErr);
    }

    return res.json(gasResult);
  } catch (error) {
    console.error("[API] Error al enviar resultados:", error);
    return res.json({
      success: false,
      message: "No se pudo conectar con el servidor de Google Sheets.",
      error: error instanceof Error ? error.message : String(error),
      savedLocal: true
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
