// FastFood Omnia — Apps Script Backend (uno por cada restaurante cliente)
// Pega este código en script.google.com y despliega como Web App.
//
// PROPIEDADES DEL SCRIPT que debes configurar (⚙️ Configuración del proyecto
// → Propiedades del script) — NUNCA escribas estos valores directo en el código:
//   ANTHROPIC_API_KEY   sk-ant-... (la clave del restaurante, cada uno paga su propio uso)
//   DASHBOARD_SECRET    la misma contraseña que capturas en la app al conectar el Sheet.
//                        Sin esto, CUALQUIERA que descubra la URL /exec podría leer y
//                        borrar tus datos, y hasta gastar tu ANTHROPIC_API_KEY sin límite.
//
// LOGS: cada evento importante (pedidos, errores, intentos con contraseña
// incorrecta, fallos del chat) se escribe como una línea JSON vía
// console.log — se ve en el editor en Ejecuciones ▸ Ver registros. Para
// poder buscar/filtrar por fecha o campo en vez de solo mirar la lista,
// vincula este proyecto a un proyecto estándar de Google Cloud
// (⚙️ Configuración del proyecto → Proyecto de Google Cloud Platform (GCP))
// y consulta ahí en Cloud Logging — es gratis para este volumen.

const SS_ID = SpreadsheetApp.getActiveSpreadsheet().getId();
const ANTHROPIC_MODEL = 'claude-sonnet-5';

function doGet(e) {
  if (!secretValido(e.parameter.secret)) {
    logEvento('warn', 'secreto_invalido', { via: 'doGet', accion: e.parameter.action || '' });
    return json({ ok: false, error: 'No autorizado' });
  }
  const action = e.parameter.action || '';
  if (action === 'get') {
    liberarPedidosProgramados();
    const sheet = getSheet(e.parameter.sheet || 'menu');
    const rows = sheet.getDataRange().getValues();
    if (rows.length < 2) return json({ ok: true, data: [] });
    const headers = rows[0];
    const data = rows.slice(1)
      .filter(r => r.some(c => c !== '' && c !== null))
      .map(r => Object.fromEntries(headers.map((h, i) => [h, r[i]])));
    return json({ ok: true, data });
  }
  logEvento('warn', 'accion_desconocida', { via: 'doGet', accion: action });
  return json({ ok: false, error: 'Unknown action' });
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    if (!secretValido(body.secret)) {
      logEvento('warn', 'secreto_invalido', { via: 'doPost', accion: body.action || '' });
      return json({ ok: false, error: 'No autorizado' });
    }
    const { action, sheet: sheetName, data, id, deviceId, rol } = body;
    // Se agrega a cada línea de log para poder ubicar qué dispositivo (mesero,
    // cocina, dueño) originó el evento — ver deviceId()/getRolDispositivo()
    // en index.html, que mandan esto en cada llamada.
    const origen = { deviceId: deviceId || '', rol: rol || '' };

    if (action === 'log') {
      // Reenvío de avisos/errores que pasan en el navegador (sin conexión,
      // almacenamiento lleno, fallo del chat, etc.) para que queden en el
      // mismo lugar que los del backend, no solo en la consola de esa
      // pantalla.
      logEvento(body.nivel || 'info', body.evento || 'evento_cliente', { origen: 'cliente', ...origen, ...(body.detalle || {}) });
      return json({ ok: true });
    }

    if (action === 'chatComplete') return handleChatComplete(body, origen);

    // Todo lo de aquí para abajo primero LEE el Sheet (para encontrar la fila
    // a actualizar) y hasta después ESCRIBE. En hora pico, con varios
    // meseros y clientes de chat mandando pedidos al mismo tiempo, dos
    // ejecuciones podían leer el mismo estado "viejo" y pisarse la escritura
    // una a la otra (una orden se perdía sin ningún error visible). El lock
    // serializa estas escrituras para que eso no pase.
    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      if (action === 'sync_all') {
        Object.keys(data || {}).forEach(sheetKey => {
          const s = getSheet(sheetKey);
          const h = s.getRange(1, 1, 1, s.getLastColumn()).getValues()[0];
          const lastRow = s.getLastRow();
          if (lastRow > 1) s.deleteRows(2, lastRow - 1);
          (data[sheetKey] || []).forEach(d => s.appendRow(h.map(col => d[col] ?? '')));
        });
        logEvento('info', 'sync_all', { ...origen, hojas: Object.keys(data || {}) });
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
        logEvento('info', 'upsert', {
          ...origen, sheet: sheetName, id: keyVal, nuevo: existing <= 0,
          // Campos de negocio útiles al buscar un pedido específico, cuando aplican.
          mesa: data.mesa ?? undefined, referencia: data.referencia ?? undefined,
          estado: data.estado ?? undefined, total: data.total ?? undefined,
        });
        return json({ ok: true });
      }
      if (action === 'delete') {
        const rows = sheet.getDataRange().getValues();
        const idCol = headers.indexOf('id');
        const idx = rows.findIndex((r, i) => i > 0 && r[idCol] === id);
        if (idx > 0) sheet.deleteRow(idx + 1);
        logEvento('info', 'delete', { ...origen, sheet: sheetName, id, encontrado: idx > 0 });
        return json({ ok: true });
      }
      if (action === 'sync') {
        const lastRow = sheet.getLastRow();
        if (lastRow > 1) sheet.deleteRows(2, lastRow - 1);
        (data || []).forEach(d => sheet.appendRow(headers.map(h => d[h] ?? '')));
        logEvento('info', 'sync', { ...origen, sheet: sheetName, filas: (data || []).length });
        return json({ ok: true });
      }
      logEvento('warn', 'accion_desconocida', { via: 'doPost', accion: action });
      return json({ ok: false, error: 'Unknown action' });
    } finally {
      lock.releaseLock();
    }
  } catch (err) {
    logEvento('error', 'excepcion_doPost', { mensaje: err.toString() });
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
function handleChatComplete(body, origen) {
  const apiKey = PropertiesService.getScriptProperties().getProperty('ANTHROPIC_API_KEY');
  if (!apiKey) {
    logEvento('error', 'chat_sin_api_key', origen);
    return json({ ok: false, error: 'Este restaurante todavía no configuró su clave de Anthropic (ANTHROPIC_API_KEY) en las Propiedades del script.' });
  }

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
    const mensaje = (data && data.error && data.error.message) || ('Error HTTP ' + status);
    logEvento('error', 'chat_error_anthropic', { ...origen, status, mensaje });
    return json({ ok: false, error: mensaje });
  }

  const texto = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n').trim();
  return json({ ok: true, text: texto });
}

// =====================================================================
// LOGS ESTRUCTURADOS — una línea JSON por evento (ver nota al inicio del
// archivo sobre dónde consultarlos). "nivel" es 'info' | 'warn' | 'error';
// nunca se le pasa aquí ninguna contraseña ni la clave de Anthropic.
// =====================================================================
function logEvento(nivel, evento, detalle) {
  console.log(JSON.stringify({ ts: new Date().toISOString(), nivel, evento, ...(detalle || {}) }));
}

// =====================================================================
// SEGURIDAD — todo doGet/doPost exige la contraseña del panel.
// =====================================================================
function secretValido(recibido) {
  const esperado = PropertiesService.getScriptProperties().getProperty('DASHBOARD_SECRET') || '';
  return !!esperado && recibido === esperado;
}

// =====================================================================
// Pasa a "nuevo" (visible en cocina) los pedidos "programado" cuya
// hora_liberacion ya se cumplió. Se ejecuta en cada lectura (doGet) para
// no depender de configurar un disparador por tiempo aparte en Apps Script:
// mesero/cocina ya consultan el Sheet cada 20s mientras están abiertos.
// =====================================================================
function liberarPedidosProgramados() {
  // No bloqueante: si justo ahora hay un doPost escribiendo, no vale la pena
  // esperar aquí (esto corre en cada lectura) — se reintenta solo en la
  // próxima consulta, unos segundos después.
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(2000)) return;
  try {
    const sheet = getSheet('pedidos');
    const rows = sheet.getDataRange().getValues();
    if (rows.length < 2) return;
    const headers = rows[0];
    const estadoCol = headers.indexOf('estado');
    const liberacionCol = headers.indexOf('hora_liberacion');
    if (estadoCol < 0 || liberacionCol < 0) return;
    const ahora = Date.now();
    const idCol = headers.indexOf('id');
    const liberados = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row[estadoCol] !== 'programado') continue;
      const liberacion = row[liberacionCol];
      if (!liberacion) continue;
      const t = new Date(liberacion).getTime();
      if (!isNaN(t) && t <= ahora) {
        sheet.getRange(i + 1, estadoCol + 1).setValue('nuevo');
        liberados.push(idCol >= 0 ? row[idCol] : i + 1);
      }
    }
    if (liberados.length) logEvento('info', 'pedidos_liberados', { ids: liberados });
  } finally {
    lock.releaseLock();
  }
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
