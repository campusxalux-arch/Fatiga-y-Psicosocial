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
    data.tiempoEmpleado || "00:00"
  ]);

  return { success: true };
}
