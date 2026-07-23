/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

interface EvaluationPayload {
  tipoIdentificacion: string;
  numeroIdentificacion: string;
  nombreCompleto: string;
  edad: number | string;
  empresa: string;
  antiguedad: number | string;
  tipoLicencia: string;
  fatigaScore: number;
  fatigaNivel: string;
  fatigaInterpretacion: string;
  psicosocialScore: number;
  psicosocialNivel: string;
  psicosocialInterpretacion: string;
  tiempoEmpleado: string;
  fecha?: string;
  hora?: string;
}

export function extractSpreadsheetId(urlOrId: string): string {
  if (!urlOrId) return "";
  const match = urlOrId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : urlOrId.trim();
}

/**
 * Writes evaluation results directly to Google Sheets using Sheets API.
 * Ensures sheet "Evaluaciones Fatiga y Psicosocial" or "Resultados" exists with the updated headers.
 */
export async function writeResultsToSheets(
  spreadsheetId: string,
  accessToken: string,
  data: EvaluationPayload
): Promise<{ success: boolean; message: string; details?: any }> {
  const parsedSpreadsheetId = extractSpreadsheetId(spreadsheetId);
  if (!parsedSpreadsheetId) {
    throw new Error("ID de Google Sheet inválido.");
  }

  const now = new Date();
  const fecha = data.fecha || now.toLocaleDateString("es-CO", { timeZone: "America/Bogota" });
  const hora = data.hora || now.toLocaleTimeString("es-CO", { timeZone: "America/Bogota" });

  const headers = {
    "Authorization": `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };

  try {
    const metaRes = await fetch(
      `https://sheets.googleapis.com/v1/spreadsheets/${parsedSpreadsheetId}`,
      { headers }
    );

    if (!metaRes.ok) {
      const errText = await metaRes.text();
      throw new Error(`No se pudo acceder a la hoja de cálculo: ${errText}`);
    }

    const meta = await metaRes.json();
    const sheetNames = (meta.sheets || []).map((s: any) => s.properties.title);
    const targetSheetName = sheetNames.includes("Resultados") ? "Resultados" : "Evaluaciones";

    if (!sheetNames.includes(targetSheetName)) {
      await fetch(
        `https://sheets.googleapis.com/v1/spreadsheets/${parsedSpreadsheetId}:batchUpdate`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            requests: [{ addSheet: { properties: { title: targetSheetName } } }]
          })
        }
      );
    }

    // Check header row
    const headCheck = await fetch(
      `https://sheets.googleapis.com/v1/spreadsheets/${parsedSpreadsheetId}/values/${targetSheetName}!A1:P1`,
      { headers }
    );
    const headData = headCheck.ok ? await headCheck.json() : null;

    const officialHeaders = [
      "FECHA",
      "HORA",
      "TIPO IDENTIFICACIÓN",
      "NÚMERO IDENTIFICACIÓN",
      "NOMBRE COMPLETO",
      "EDAD",
      "EMPRESA",
      "AÑOS ANTIGÜEDAD",
      "TIPO LICENCIA",
      "PUNTAJE FATIGA (15-75)",
      "NIVEL FATIGA",
      "INTERPRETACIÓN FATIGA",
      "PUNTAJE PSICOSOCIAL (15-75)",
      "NIVEL PSICOSOCIAL",
      "INTERPRETACIÓN PSICOSOCIAL",
      "TIEMPO EMPLEADO"
    ];

    if (!headData || !headData.values || headData.values.length === 0) {
      await fetch(
        `https://sheets.googleapis.com/v1/spreadsheets/${parsedSpreadsheetId}/values/${targetSheetName}!A1:P1?valueInputOption=USER_ENTERED`,
        {
          method: "PUT",
          headers,
          body: JSON.stringify({ values: [officialHeaders] })
        }
      );
    }

    const rowValue = [
      fecha,
      hora,
      data.tipoIdentificacion || "",
      data.numeroIdentificacion || "",
      data.nombreCompleto || "",
      Number(data.edad) || 0,
      data.empresa || "",
      Number(data.antiguedad) || 0,
      data.tipoLicencia || "",
      Number(data.fatigaScore) || 0,
      data.fatigaNivel || "",
      data.fatigaInterpretacion || "",
      Number(data.psicosocialScore) || 0,
      data.psicosocialNivel || "",
      data.psicosocialInterpretacion || "",
      data.tiempoEmpleado || "00:00"
    ];

    const appendRes = await fetch(
      `https://sheets.googleapis.com/v1/spreadsheets/${parsedSpreadsheetId}/values/${targetSheetName}!A1:append?valueInputOption=USER_ENTERED`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({ values: [rowValue] })
      }
    );

    if (!appendRes.ok) {
      const errText = await appendRes.text();
      throw new Error(`Error al registrar en Google Sheets: ${errText}`);
    }

    return {
      success: true,
      message: "Resultados sincronizados exitosamente en Google Sheets.",
      details: { spreadsheetId: parsedSpreadsheetId, sheet: targetSheetName }
    };

  } catch (error) {
    console.error("[Sheets] Error escribiendo resultados a Google Sheets:", error);
    throw error;
  }
}
