// AtendIA — Apps Script Backend
// Pega este código en script.google.com y despliega como Web App (Ejecutar como: yo, Acceso: cualquiera)
//
// Antes de usarlo en producción, configura en Propiedades del script
// (Editor → ⚙️ Configuración del proyecto → Propiedades del script):
//   ANTHROPIC_API_KEY = tu clave de api.anthropic.com (empieza con sk-ant-...)
//
// La clave NUNCA se expone al navegador del cliente: todas las llamadas a Claude
// pasan por este backend (acción "chat"), igual que Stripe se maneja server-side
// en paginas-conmemorativas/Codigo.js — nunca poner la API key en el HTML.

const SS_ID = SpreadsheetApp.getActiveSpreadsheet().getId();
const ANTHROPIC_MODEL = 'claude-sonnet-5';

function doGet(e) {
  const action = e.parameter.action || '';

  if (action === 'ping') {
    return json({ ok: true, msg: 'pong', ts: new Date().toISOString() });
  }

  if (action === 'get') {
    const sheet = getSheet(e.parameter.sheet || 'menu');
    const rows = sheet.getDataRange().getValues();
    const headers = rows[0];
    const data = rows.slice(1).map(r => Object.fromEntries(headers.map((h, i) => [h, r[i]])));
    return json({ ok: true, data });
  }

  return json({ ok: false, error: 'Unknown action' });
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const action = body.action;

    if (action === 'chat') {
      return json(llamarClaude_(body.system, body.messages));
    }

    const sheetName = body.sheet || 'menu';
    const data = body.data;
    const id = body.id;
    const sheet = getSheet(sheetName);
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

    if (action === 'upsert') {
      const rows = sheet.getDataRange().getValues();
      // La hoja "config" usa 'key' como identificador único, el resto usa 'id'
      const keyCol = sheetName === 'config' ? headers.indexOf('key') : headers.indexOf('id');
      const keyVal = sheetName === 'config' ? data.key : data.id;
      const existing = rows.findIndex((r, i) => i > 0 && keyCol >= 0 && r[keyCol] === keyVal);
      const row = headers.map(h => (data[h] !== undefined ? data[h] : ''));
      if (existing > 0) sheet.getRange(existing + 1, 1, 1, row.length).setValues([row]);
      else sheet.appendRow(row);
      return json({ ok: true });
    }

    if (action === 'update') {
      const rows = sheet.getDataRange().getValues();
      const idCol = headers.indexOf('id');
      const idx = rows.findIndex((r, i) => i > 0 && r[idCol] === id);
      if (idx > 0) {
        Object.keys(data || {}).forEach(key => {
          const col = headers.indexOf(key);
          if (col >= 0) sheet.getRange(idx + 1, col + 1).setValue(data[key]);
        });
      }
      return json({ ok: true });
    }

    if (action === 'delete') {
      const rows = sheet.getDataRange().getValues();
      const idCol = headers.indexOf('id');
      const idx = rows.findIndex((r, i) => i > 0 && r[idCol] === id);
      if (idx > 0) sheet.deleteRow(idx + 1);
      return json({ ok: true });
    }

    return json({ ok: false, error: 'Unknown action' });
  } catch (err) {
    return json({ ok: false, error: err.toString() });
  }
}

// Reenvía la conversación a la API de Claude. La clave vive solo aquí, en el
// servidor — el navegador del cliente nunca la ve ni puede robarla.
function llamarClaude_(system, messages) {
  const apiKey = PropertiesService.getScriptProperties().getProperty('ANTHROPIC_API_KEY');
  if (!apiKey) {
    return { ok: false, error: 'Falta configurar ANTHROPIC_API_KEY en Propiedades del script.' };
  }
  const resp = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    payload: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 800,
      system: system,
      messages: messages,
    }),
    muteHttpExceptions: true,
  });
  const data = JSON.parse(resp.getContentText());
  if (resp.getResponseCode() !== 200) {
    return { ok: false, error: (data.error && data.error.message) || 'Error al llamar a Claude' };
  }
  const texto = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n');
  return { ok: true, texto: texto };
}

function getSheet(name) {
  const ss = SpreadsheetApp.openById(SS_ID);
  let s = ss.getSheetByName(name);
  if (!s) {
    s = ss.insertSheet(name);
    const headers = {
      menu: ['id', 'platillo', 'categoria', 'precio', 'disponible', 'descripcion', 'emoji', 'color', 'imagenUrl'],
      pedidos: ['id', 'origen', 'mesa', 'referencia', 'items', 'total', 'estado', 'hora'],
      reservaciones: ['id', 'nombre_cliente', 'telefono', 'fecha', 'hora', 'personas', 'time'],
      tickets: ['id', 'motivo', 'time'],
      config: ['key', 'value'],
    };
    if (headers[name]) s.getRange(1, 1, 1, headers[name].length).setValues([headers[name]]);
  }
  return s;
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
