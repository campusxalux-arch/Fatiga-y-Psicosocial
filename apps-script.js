/**
 * ====================================================================
 * INSTRUCCIONES DE DESPLIEGUE EN GOOGLE APPS SCRIPT:
 * ====================================================================
 * 1. En tu hoja de Google Sheets, ve a: Extensiones > Apps Script.
 * 2. Borra todo el código existente en el editor y pega este código completo.
 * 3. Haz clic en "Guardar" (icono de disco 💾).
 * 4. Haz clic en el botón azul arriba a la derecha: "Implementar" > "Nueva implementación".
 * 5. Haz clic en el engranaje ⚙️ junto a "Seleccionar tipo" y elige "Aplicación web".
 * 6. Configura lo siguiente (¡CRUCIAL!):
 *    - Descripción: Sincronización Evaluaciones
 *    - Ejecutar como: "Yo (tu correo)"
 *    - Quién tiene acceso: "Cualquier persona" (Anyone)  <-- ¡ES OBLIGATORIO ELEGIR "Cualquier persona"!
 * 7. Haz clic en "Implementar".
 * 8. Autoriza los permisos que solicite Google ("Avanzado" > "Ir a Proyecto (no seguro)").
 * 9. Copia la "URL de la aplicación web" (que termina en /exec) y pégala aquí en el chat.
 * ====================================================================
 */

function doGet(e) {
  try {
    // Si se enviaron datos mediante query string GET (ej: ?data=... o parámetros individuales)
    if (e && e.parameter && (e.parameter.data || e.parameter.nombreCompleto)) {
      let data = {};
      if (e.parameter.data) {
        data = JSON.parse(e.parameter.data);
      } else {
        data = e.parameter;
      }
      const result = saveResultsToSheets(data);
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: "Resultados guardados correctamente mediante GET",
        result: result
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ 
      status: "online", 
      message: "Servidor de Evaluación Fatiga y Psicosocial Activo en Google Apps Script"
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
    let data = null;

    if (e && e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (err) {
        data = e.parameter;
      }
    } else if (e && e.parameter && Object.keys(e.parameter).length > 0) {
      data = e.parameter;
    }

    if (!data) {
      throw new Error("No se recibieron datos en la petición.");
    }
    
    const result = saveResultsToSheets(data);
    
    return ContentService.createTextOutput(JSON.stringify({ 
      success: true, 
      message: "Resultados de evaluación guardados con éxito en Google Sheets",
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

function helperFormatAnswers(map) {
  if (!map) return "";
  var parts = [];
  for (var i = 1; i <= 15; i++) {
    var val = map[i] || map[i.toString()] || "-";
    parts.push("P" + i + ": " + val);
  }
  return parts.join(", ");
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
    "TIEMPO EMPLEADO",
    "RESPUESTAS FATIGA (RESUMEN)",
    "RESPUESTAS PSICOSOCIAL (RESUMEN)",
    "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12", "F13", "F14", "F15",
    "P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8", "P9", "P10", "P11", "P12", "P13", "P14", "P15"
  ];

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(officialHeaders);
    sheet.getRange(1, 1, 1, officialHeaders.length)
      .setFontWeight("bold")
      .setBackground("#1e3a8a")
      .setFontColor("white");
  }

  const fecha = data.fecha || new Date().toLocaleDateString("es-CO");
  const hora = data.hora || new Date().toLocaleTimeString("es-CO");

  // Calcular Nivel e Interpretación de Fatiga si no vienen definidos
  const fatigaScore = Number(data.fatigaScore) || 0;
  let fatigaNivel = data.fatigaNivel || "";
  let fatigaInterpretacion = data.fatigaInterpretacion || "";

  if (!fatigaNivel && fatigaScore > 0) {
    if (fatigaScore <= 30) {
      fatigaNivel = "Fatiga Baja - Estado Óptimo";
      fatigaInterpretacion = "El conductor se encuentra apto para iniciar o continuar la marcha de forma segura.";
    } else if (fatigaScore <= 50) {
      fatigaNivel = "Fatiga Moderada - Alerta";
      fatigaInterpretacion = "Existen signos claros de cansancio. Se recomienda realizar una pausa activa de 15 a 20 minutos, hidratarse y caminar antes de continuar.";
    } else {
      fatigaNivel = "Fatiga Alta - Riesgo Crítico";
      fatigaInterpretacion = "Alto riesgo de microdormidas o accidentes. El conductor NO debe continuar manejando. Es obligatorio realizar un descanso prolongado o el relevo del conductor.";
    }
  }

  // Calcular Nivel e Interpretación Psicosocial si no vienen definidos
  const psicosocialScore = Number(data.psicosocialScore) || 0;
  let psicosocialNivel = data.psicosocialNivel || "";
  let psicosocialInterpretacion = data.psicosocialInterpretacion || "";

  if (!psicosocialNivel && psicosocialScore > 0) {
    if (psicosocialScore <= 30) {
      psicosocialNivel = "Baja Agresividad - Conducción Prosocial";
      psicosocialInterpretacion = "El conductor demuestra tolerancia, adecuado autocontrol emocional y manejo de la frustración en la vía.";
    } else if (psicosocialScore <= 50) {
      psicosocialNivel = "Agresividad Moderada - Riesgo Intermedio";
      psicosocialInterpretacion = "Existen conductas reactivas e impulsividad ocasional. Se recomienda capacitación en inteligencia emocional, técnicas de manejo de estrés y conducción defensiva.";
    } else {
      psicosocialNivel = "Agresividad Alta - Riesgo Crítico";
      psicosocialInterpretacion = "Alto nivel de hostilidad, reactividad y predisposición a la \"ira al volante\" (Road Rage). Requiere evaluación psicológica especializada e intervención conductual antes de asumir la responsabilidad de un vehículo.";
    }
  }

  // Extraer respuestas individuales de Fatiga y Psicosocial
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
    fatigaScore,
    fatigaNivel,
    fatigaInterpretacion,
    psicosocialScore,
    psicosocialNivel,
    psicosocialInterpretacion,
    data.tiempoEmpleado || "00:00",
    respuestasFatiga,
    respuestasPsicosocial,
    f1, f2, f3, f4, f5, f6, f7, f8, f9, f10, f11, f12, f13, f14, f15,
    p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12, p13, p14, p15
  ]);

  return { success: true };
}
