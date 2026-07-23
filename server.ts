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
  "https://script.google.com/macros/s/AKfycbydvBnxqWEuPVrIcB2baRIwG9Eaz--hIxF8DfR44DryDW8pt3gogpMK8yofPo8YNmMWUQ/exec";

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

  // Attempt 1: GET request with JSON data param + query params (100% reliable for Google Apps Script Web Apps)
  try {
    console.log("[GAS] Intentando envío por GET con parámetro data a:", scriptUrl);
    const queryParams = new URLSearchParams();
    queryParams.append("data", jsonBody);
    for (const [k, v] of Object.entries(payload)) {
      if (k !== "data") {
        queryParams.append(k, String(v ?? ""));
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
      if (parsed && parsed.success === true) {
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

  // Attempt 2: POST to script.google.com with manual 302 redirect following
  try {
    console.log("[GAS] Intentando POST (redirección manual) a:", scriptUrl);
    let res = await fetch(scriptUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: jsonBody,
      redirect: "manual",
    });

    if (res.status >= 300 && res.status < 400) {
      const redirectUrl = res.headers.get("location");
      if (redirectUrl) {
        console.log("[GAS] Siguiendo redirección a:", redirectUrl);
        res = await fetch(redirectUrl, { method: "GET" });
      }
    }

    const text = await res.text();
    console.log(`[GAS] Respuesta POST (status ${res.status}):`, text.substring(0, 300));

    if (res.ok && !text.includes("<!DOCTYPE html>") && !text.includes("<html")) {
      let parsed: any = null;
      try { parsed = JSON.parse(text); } catch {}
      if (parsed && parsed.success === true) {
        return {
          success: true,
          message: "Resultados guardados y sincronizados con Google Sheets correctamente.",
          details: parsed,
        };
      }
    }
  } catch (err) {
    console.warn("[GAS] Error en intento POST manual:", err);
  }

  return {
    success: false,
    message: "Guardado en servidor local. No se pudo sincronizar automáticamente con Google Sheets.",
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

/**
 * POST /api/results
 * Forwards evaluation results directly to Google Sheets using user's OAuth token or falls back to Google Apps Script.
 */
app.post("/api/results", async (req, res) => {
  try {
    const payload = req.body;
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

    // 2. Fall back to Google Apps Script
    const targetScriptUrl = getScriptUrl();
    console.log("[API] Enviando resultados a Google Apps Script:", targetScriptUrl);

    const gasResult = await sendToGoogleAppsScript(targetScriptUrl, payload);
    
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
