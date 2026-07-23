/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * GOOGLE APPS SCRIPT - SCRIPT DE SINCRONIZACIÓN
 * EVALUACIÓN FATIGA Y PSICOSOCIAL
 */

function doGet(e) {
  try {
    return ContentService.createTextOutput(JSON.stringify({ 
      status: "online", 
      message: "Servidor de Evaluación Fatiga y Psicosocial Activo"
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ 
      success: false, 
      error: error.toString() 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    if (!e.postData || !e.postData.contents) {
      throw new Error("No se recibieron datos de formulario.");
    }
    
    const data = JSON.parse(e.postData.contents);
    const result = saveResultsToSheets(data);
    
    return ContentService.createTextOutput(JSON.stringify({ 
      success: true, 
      message: "Resultados de evaluación guardados con éxito",
      result: result 
    }))
    .setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ 
      success: false, 
      error: error.toString() 
    }))
    .setMimeType(ContentService.MimeType.JSON);
  }
}

function saveResultsToSheets(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName("Resultados") || ss.getSheetByName("Evaluaciones");
  
  if (!sheet) {
    sheet = ss.getSheets()[0];
    sheet.setName("Resultados");
  }

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

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(officialHeaders);
    sheet.getRange(1, 1, 1, officialHeaders.length).setFontWeight("bold").setBackground("#1e3a8a").setFontColor("white");
  }

  const fecha = data.fecha || new Date().toLocaleDateString("es-CO");
  const hora = data.hora || new Date().toLocaleTimeString("es-CO");

  sheet.appendRow([
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
  ]);

  return { success: true };
}
