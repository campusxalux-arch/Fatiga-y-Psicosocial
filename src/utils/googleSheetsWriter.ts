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
  respuestasFatiga?: string;
  respuestasPsicosocial?: string;
  fatigaAnswers?: Record<number, number>;
  psicosocialAnswers?: Record<number, number>;
  [key: string]: any;
}

function helperFormatAnswers(map?: Record<number, number>): string {
  if (!map) return "";
  const parts: string[] = [];
  for (let i = 1; i <= 15; i++) {
    const val = map[i] || (map as any)[i.toString()] || "-";
    parts.push(`P${i}: ${val}`);
  }
  return parts.join(", ");
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
      "TIEMPO EMPLEADO",
      "RESPUESTAS FATIGA (RESUMEN)",
      "RESPUESTAS PSICOSOCIAL (RESUMEN)",
      "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12", "F13", "F14", "F15",
      "P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8", "P9", "P10", "P11", "P12", "P13", "P14", "P15"
    ];

    if (!headData || !headData.values || headData.values.length === 0) {
      await fetch(
        `https://sheets.googleapis.com/v1/spreadsheets/${parsedSpreadsheetId}/values/${targetSheetName}!A1:AT1?valueInputOption=USER_ENTERED`,
        {
          method: "PUT",
          headers,
          body: JSON.stringify({ values: [officialHeaders] })
        }
      );
    }

    const fatigaMap = data.fatigaAnswers || {};
    const psicosocialMap = data.psicosocialAnswers || {};

    const respuestasFatiga = data.respuestasFatiga || helperFormatAnswers(fatigaMap);
    const respuestasPsicosocial = data.respuestasPsicosocial || helperFormatAnswers(psicosocialMap);

    const f1 = data.f1 || fatigaMap[1] || fatigaMap["1"] || "";
    const f2 = data.f2 || fatigaMap[2] || fatigaMap["2"] || "";
    const f3 = data.f3 || fatigaMap[3] || fatigaMap["3"] || "";
    const f4 = data.f4 || fatigaMap[4] || fatigaMap["4"] || "";
    const f5 = data.f5 || fatigaMap[5] || fatigaMap["5"] || "";
    const f6 = data.f6 || fatigaMap[6] || fatigaMap["6"] || "";
    const f7 = data.f7 || fatigaMap[7] || fatigaMap["7"] || "";
    const f8 = data.f8 || fatigaMap[8] || fatigaMap["8"] || "";
    const f9 = data.f9 || fatigaMap[9] || fatigaMap["9"] || "";
    const f10 = data.f10 || fatigaMap[10] || fatigaMap["10"] || "";
    const f11 = data.f11 || fatigaMap[11] || fatigaMap["11"] || "";
    const f12 = data.f12 || fatigaMap[12] || fatigaMap["12"] || "";
    const f13 = data.f13 || fatigaMap[13] || fatigaMap["13"] || "";
    const f14 = data.f14 || fatigaMap[14] || fatigaMap["14"] || "";
    const f15 = data.f15 || fatigaMap[15] || fatigaMap["15"] || "";

    const p1 = data.p1 || psicosocialMap[1] || psicosocialMap["1"] || "";
    const p2 = data.p2 || psicosocialMap[2] || psicosocialMap["2"] || "";
    const p3 = data.p3 || psicosocialMap[3] || psicosocialMap["3"] || "";
    const p4 = data.p4 || psicosocialMap[4] || psicosocialMap["4"] || "";
    const p5 = data.p5 || psicosocialMap[5] || psicosocialMap["5"] || "";
    const p6 = data.p6 || psicosocialMap[6] || psicosocialMap["6"] || "";
    const p7 = data.p7 || psicosocialMap[7] || psicosocialMap["7"] || "";
    const p8 = data.p8 || psicosocialMap[8] || psicosocialMap["8"] || "";
    const p9 = data.p9 || psicosocialMap[9] || psicosocialMap["9"] || "";
    const p10 = data.p10 || psicosocialMap[10] || psicosocialMap["10"] || "";
    const p11 = data.p11 || psicosocialMap[11] || psicosocialMap["11"] || "";
    const p12 = data.p12 || psicosocialMap[12] || psicosocialMap["12"] || "";
    const p13 = data.p13 || psicosocialMap[13] || psicosocialMap["13"] || "";
    const p14 = data.p14 || psicosocialMap[14] || psicosocialMap["14"] || "";
    const p15 = data.p15 || psicosocialMap[15] || psicosocialMap["15"] || "";

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
      data.tiempoEmpleado || "00:00",
      respuestasFatiga,
      respuestasPsicosocial,
      f1, f2, f3, f4, f5, f6, f7, f8, f9, f10, f11, f12, f13, f14, f15,
      p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12, p13, p14, p15
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
