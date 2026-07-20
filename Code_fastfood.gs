// FastFood Omnia — Apps Script Backend (uno por cada restaurante cliente)
// Pega este código en script.google.com y despliega como Web App.
//
// PROPIEDADES DEL SCRIPT que debes configurar (⚙️ Configuración del proyecto
// → Propiedades del script) — NUNCA escribas la clave directo en el código:
//   ANTHROPIC_API_KEY   sk-ant-... (la clave del restaurante, cada uno paga su propio uso)

const SS_ID = SpreadsheetApp.getActiveSpreadsheet().getId();
const ANTHROPIC_MODEL = 'claude-sonnet-5';

function doGet(e) {
  const action = e.parameter.action || '';
  if (action === 'get') {
    const sheet = getSheet(e.parameter.sheet || 'menu');
    const rows = sheet.getDataRange().getValues();
    if (rows.length < 2) return json({ ok: true, data: [] });
    const headers = rows[0];
    const data = rows.slice(1)
      .filter(r => r.some(c => c !== '' && c !== null))
      .map(r => Object.fromEntries(headers.map((h, i) => [h, r[i]])));
    return json({ ok: true, data });
  }
  return json({ ok: false, error: 'Unknown action' });
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const { action, sheet: sheetName, data, id } = body;

    if (action === 'chatComplete') return handleChatComplete(body);

    if (action === 'sync_all') {
      Object.keys(data || {}).forEach(sheetKey => {
        const s = getSheet(sheetKey);
        const h = s.getRange(1, 1, 1, s.getLastColumn()).getValues()[0];
        const lastRow = s.getLastRow();
        if (lastRow > 1) s.deleteRows(2, lastRow - 1);
        (data[sheetKey] || []).forEach(d => s.appendRow(h.map(col => d[col] ?? '')));
      });
      return json({ ok: true });
    }

    const sheet = getSheet(sheetName || 'menu');
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

    if (action === 'upsert') {
      const rows = sheet.getDataRange().getValues();
      const keyCol = sheetName === 'config' ? headers.indexOf('key') : headers.indexOf('id');
      const keyVal = sheetName === 'config' ? data.key : data.id;
      const existing = rows.findIndex((r, i) => i > 0 && keyCol >= 0 && r[keyCol] === keyVal);
      const row = headers.map(h => data[h] ?? '');
      if (existing > 0) sheet.getRange(existing + 1, 1, 1, row.length).setValues([row]);
      else sheet.appendRow(row);
      return json({ ok: true });
    }
    if (action === 'delete') {
      const rows = sheet.getDataRange().getValues();
      const idCol = headers.indexOf('id');
      const idx = rows.findIndex((r, i) => i > 0 && r[idCol] === id);
      if (idx > 0) sheet.deleteRow(idx + 1);
      return json({ ok: true });
    }
    if (action === 'sync') {
      const lastRow = sheet.getLastRow();
      if (lastRow > 1) sheet.deleteRows(2, lastRow - 1);
      (data || []).forEach(d => sheet.appendRow(headers.map(h => d[h] ?? '')));
      return json({ ok: true });
    }
    return json({ ok: false, error: 'Unknown action' });
  } catch (err) {
    return json({ ok: false, error: err.toString() });
  }
}

// =====================================================================
// PROXY DEL CHAT — la clave de Anthropic vive AQUÍ, nunca en el navegador.
// El cliente (chat de Sofía) manda el historial de mensajes; este backend
// llama a la API real y regresa solo el texto de respuesta. La lógica de
// qué [[TOOL:...]] ejecutar sigue viviendo en el frontend, porque ahí es
// donde está el carrito/menú/reservaciones en memoria de esa conversación.
// =====================================================================
function handleChatComplete(body) {
  const apiKey = PropertiesService.getScriptProperties().getProperty('ANTHROPIC_API_KEY');
  if (!apiKey) return json({ ok: false, error: 'Este restaurante todavía no configuró su clave de Anthropic (ANTHROPIC_API_KEY) en las Propiedades del script.' });

  const { system, messages } = body;
  if (!messages || !Array.isArray(messages)) return json({ ok: false, error: 'Falta el historial de mensajes' });

  const payload = {
    model: ANTHROPIC_MODEL,
    max_tokens: 800,
    system: system || '',
    messages: messages,
  };

  const res = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  });

  const status = res.getResponseCode();
  const data = JSON.parse(res.getContentText());

  if (status !== 200) {
    return json({ ok: false, error: (data && data.error && data.error.message) || ('Error HTTP ' + status) });
  }

  const texto = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n').trim();
  return json({ ok: true, text: texto });
}

// =====================================================================
// UTILIDADES DE HOJA
// =====================================================================
function getSheet(name) {
  const ss = SpreadsheetApp.openById(SS_ID);
  let s = ss.getSheetByName(name);
  if (!s) {
    s = ss.insertSheet(name);
    const headers = {
      config:         ['key', 'value'],
      menu:           ['id', 'platillo', 'categoria', 'precio', 'disponible', 'descripcion', 'emoji', 'color', 'imagen'],
      pedidos:        ['id', 'origen', 'mesa', 'referencia', 'items', 'total', 'estado', 'hora', 'fecha'],
      reservaciones:  ['id', 'nombre_cliente', 'telefono', 'fecha', 'hora', 'personas', 'time'],
      tickets:        ['id', 'motivo', 'time'],
    };
    if (headers[name]) s.getRange(1, 1, 1, headers[name].length).setValues([headers[name]]);
  }
  return s;
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
