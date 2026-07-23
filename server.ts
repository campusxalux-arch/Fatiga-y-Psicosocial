/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { FATIGA_QUESTIONS, PSICOSOCIAL_QUESTIONS } from "./src/data/questions";
import { writeResultsToSheets } from "./src/utils/googleSheetsWriter";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;
const DEFAULT_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzm7qOogIAwemimo0npcIHm3o3OXyMnrBaj_IB3sveQSCnxPzBuq4sZaCAd00HfhI4wyA/exec";

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
 * Handles HTTP 302 redirects properly without losing POST method/body,
 * and falls back to GET/query-params if needed.
 */
async function sendToGoogleAppsScript(scriptUrl: string, payload: any): Promise<{ success: boolean; message: string; details?: any }> {
  const jsonBody = JSON.stringify(payload);

  // Attempt 1: Manual redirect handling preserving POST method & body
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
        res = await fetch(redirectUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: jsonBody,
        });
      }
    }

    const text = await res.text();
    console.log(`[GAS] Respuesta POST (status ${res.status}):`, text.substring(0, 300));

    if (res.ok && !text.includes("<!DOCTYPE html>") && !text.includes("<html")) {
      let parsed = null;
      try { parsed = JSON.parse(text); } catch {}
      return {
        success: true,
        message: "Resultados guardados y sincronizados con Google Sheets correctamente.",
        details: parsed || text,
      };
    }
  } catch (err) {
    console.warn("[GAS] Error en intento POST manual:", err);
  }

  // Attempt 2: Standard fetch POST with redirect follow
  try {
    console.log("[GAS] Intentando POST directo...");
    const res = await fetch(scriptUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: jsonBody,
      redirect: "follow",
    });

    const text = await res.text();
    console.log(`[GAS] Respuesta POST directo (status ${res.status}):`, text.substring(0, 300));

    if (res.ok && !text.includes("<!DOCTYPE html>") && !text.includes("<html")) {
      let parsed = null;
      try { parsed = JSON.parse(text); } catch {}
      return {
        success: true,
        message: "Resultados guardados y sincronizados con Google Sheets correctamente.",
        details: parsed || text,
      };
    }
  } catch (err) {
    console.warn("[GAS] Error en intento POST directo:", err);
  }

  // Attempt 3: GET request with query params (for scripts implemented via doGet)
  try {
    console.log("[GAS] Intentando GET con parámetros URL...");
    const queryParams = new URLSearchParams();
    for (const [k, v] of Object.entries(payload)) {
      queryParams.append(k, String(v ?? ""));
    }
    const getUrl = `${scriptUrl}${scriptUrl.includes("?") ? "&" : "?"}${queryParams.toString()}`;

    const res = await fetch(getUrl, {
      method: "GET",
      redirect: "follow",
    });

    const text = await res.text();
    console.log(`[GAS] Respuesta GET (status ${res.status}):`, text.substring(0, 300));

    if (res.ok && !text.includes("<!DOCTYPE html>") && !text.includes("<html")) {
      let parsed = null;
      try { parsed = JSON.parse(text); } catch {}
      return {
        success: true,
        message: "Resultados guardados y sincronizados con Google Sheets correctamente.",
        details: parsed || text,
      };
    }
  } catch (err) {
    console.warn("[GAS] Error en intento GET:", err);
  }

  return {
    success: false,
    message: "No se pudo sincronizar automáticamente con Google Sheets. Verifica la URL o los permisos del Web App script.",
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
