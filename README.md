# Evaluación Teórica para Conductores 🚗📝

Aplicación web responsive móvil-primero diseñada para realizar exámenes teóricos de conducción de manera profesional, intuitiva y segura. Cuenta con registro completo de aspirantes, selección aleatoria de 30 preguntas no repetitivas de un banco integrado y sincronización bidireccional en tiempo real con **Google Sheets** y **Google Docs** a través de **Google Apps Script**.

---

## 🛠️ Tecnologías Utilizadas

- **Frontend:** React 19 (con TypeScript) + Tailwind CSS v4 + Framer Motion (animaciones fluidas).
- **Backend:** Express (Node.js) como servidor proxy que oculta la URL del Google Apps Script para evitar CORS y exposición de endpoints sensibles.
- **Base de Datos y Almacenamiento:** Google Sheets (Resultados) y Google Docs (Banco de preguntas).
- **Integración:** Google Apps Script Web App (API REST).

---

## 📋 Requisitos de Integración con Google Workspace

La sincronización se realiza mediante una Web App de Google Apps Script. Sigue estos pasos para configurarla:

### Paso 1: Configurar la Hoja de Cálculo en Google Sheets
1. Crea una hoja de cálculo nueva en tu Google Drive.
2. Cambia el nombre del archivo, por ejemplo, a `Evaluación Teórica - Resultados`.
3. Anota la URL del documento. El script creará automáticamente dos pestañas (`Resultados` y `Detalles_Respuestas`) con las cabeceras correspondientes en su primera ejecución.

### Paso 2: Configurar el Banco de Preguntas en Google Docs
1. Crea un documento de Google Docs.
2. Agrega las preguntas en el siguiente formato para permitir que el script las lea automáticamente:
   ```text
   1. ¿Cuál es el límite de velocidad en zonas escolares?
   a) 50 km/h
   b) 30 km/h*
   c) 40 km/h
   d) 20 km/h
   ```
   *Nota: Agrega un asterisco (`*`) al final de la opción correcta para que el script la detecte automáticamente.*
3. Obtén el ID de este documento desde su URL (es el código largo entre `/d/` y `/edit`).

### Paso 3: Pegar el Script en Google Sheets
1. Desde tu hoja de cálculo de Google Sheets, ve al menú superior y selecciona **Extensiones > Apps Script**.
2. Borra cualquier código existente en el archivo `Código.gs` y pega el código que se encuentra en el archivo `apps-script.js` de este proyecto.
3. Actualiza las constantes al inicio del script con el ID de tu documento de Google Docs:
   ```javascript
   const GOOGLE_DOC_ID = "TU_ID_DE_GOOGLE_DOC_AQUÍ";
   ```
4. Guarda el proyecto haciendo clic en el icono del disquete.

### Paso 4: Desplegar como Aplicación Web (¡CRUCIAL!)
1. Haz clic en el botón superior derecho **Implementar > Nueva implementación**.
2. En tipo de implementación, selecciona **Aplicación web** (haciendo clic en el engranaje de configuración si no aparece).
3. Configura los parámetros obligatorios:
   - **Descripción:** API de Examen Teórico.
   - **Ejecutar como:** Tú (Tu correo de Google).
   - **Quién tiene acceso:** **Cualquiera** (Anyone) *(Esto permite que el backend de nuestra app envíe resultados de forma anónima).*
4. Haz clic en **Implementar**.
5. Copia la **URL de la aplicación web** generada (termina en `/exec`).

---

## ⚙️ Configuración de Variables de Entorno

Declara la URL de Apps Script en tu entorno de producción o archivo `.env` local:

```env
# .env o Panel de Secretos de AI Studio / Vercel
GOOGLE_APPS_SCRIPT_URL="TU_URL_DE_APPS_SCRIPT_OBTENIDA_EN_EL_PASO_4"
```

*El sistema cuenta con un fallback de 40 preguntas realistas integradas en `/src/data/questions.ts`, de manera que la aplicación siempre cargará y funcionará de manera fluida, incluso si el servicio de Google tiene caídas o la red falla.*

---

## 🚀 Despliegue en Vercel

Esta aplicación está optimizada y lista para desplegarse en Vercel como un proyecto Full Stack Node.js.

### Opción A: Despliegue Rápido desde GitHub
1. Sube este proyecto a un repositorio privado o público en tu cuenta de GitHub.
2. Ve a [Vercel](https://vercel.com/) e inicia sesión.
3. Haz clic en **Add New > Project** e importa tu repositorio.
4. En la configuración del proyecto:
   - **Environment Variables:** Agrega la variable `GOOGLE_APPS_SCRIPT_URL` con tu URL de Apps Script.
5. Haz clic en **Deploy**. ¡Tu aplicación estará en línea en pocos segundos!

---

## 🛡️ Características de Seguridad y Calidad del Código

- **Prevención de Duplicados:** Al finalizar la prueba, el botón de "Finalizar" bloquea envíos adicionales, impidiendo que recargar o hacer clics sucesivos registre datos repetidos.
- **Manejo de Errores Resiliente:** Si el servidor de Google sheets responde lento, el frontend retiene los datos y permite al usuario reintentar o imprimir el reporte.
- **Firma Digital & Imprimir:** Permite exportar los resultados del examen como un reporte de auditoría completo o guardarlo como PDF en un formato adaptado a hojas tamaño carta (vía CSS `@media print`).
- **Mobile First:** Diseño optimizado mediante un simulador de chasis móvil interactivo para PC, lo que garantiza una apariencia 100% nativa en teléfonos móviles, permitiendo su distribución rápida mediante código QR.
