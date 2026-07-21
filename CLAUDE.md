# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

FastFood Omnia is a white-label Progressive Web App (PWA) sold to individual fast-food restaurants. Each restaurant runs its own copy of the frontend plus its own Google Apps Script backend + Google Sheet as its database. There is no build system, no package manager, and no test suite — this is plain HTML/CSS/JS meant to be deployed by pasting files into Google Apps Script and hosting the static files (e.g. GitHub Pages).

There are only 5 files, and almost all logic lives in one of them:

| File | Role |
|---|---|
| `index.html` | The entire frontend: markup, CSS, and ~1550 lines of vanilla JS. One page, four in-app "screens" swapped by JS. |
| `Code_fastfood.gs` | Per-restaurant Google Apps Script backend. Deployed separately by each restaurant via script.google.com; reads/writes their Google Sheet and proxies calls to the Anthropic API. |
| `sw.js` | Service worker — caches only the app shell (`index.html`, `manifest.json`). Data (menu, orders, license checks) is always fetched live, never from cache. |
| `manifest.json` | PWA manifest (icons, theme colors, standalone display). |
| `icon-192.png` / `icon-512.png` | App icons. |

There is no `npm install`, `build`, `lint`, or `test` command — verify changes by opening `index.html` directly in a browser (or via a static file server) and exercising the UI.

## Language convention

**All code, comments, UI strings, and variable/function names are in Spanish** (`ejecutarHerramienta`, `enviarMensajeChat`, `db.pedidos`, etc.). Keep new code consistent with this — do not switch to English identifiers or user-facing strings.

## Architecture

### Two-tier deployment model

1. **Omnia Control** (master, not in this repo) — a separate Apps Script the product owner runs, which issues/validates license keys per restaurant/device. `OMNIA_CONTROL_URL` and `PRODUCT_ID` in `index.html` point at it.
2. **Per-restaurant backend** (`Code_fastfood.gs`) — each client restaurant deploys their own copy as a Web App, backed by their own Google Sheet (`SS_ID` = the sheet the script is bound to). This is where their menu/orders/reservations live and where their own `ANTHROPIC_API_KEY` (Script Property, never in code) is used.

On first load the frontend walks through: license-key gate (`gateView`, talks to Omnia Control) → per-restaurant Sheet URL setup (`setupView`, only for non-demo/Pro licenses) → device role picker (`rolView`: "completo" / "mesero" / "cocina", stored once in `localStorage`) → the app itself.

### Frontend state model (`index.html`)

Everything is client-side, in-memory, mirrored to `localStorage`, and synced to the restaurant's Sheet:

- `cfg` — restaurant configuration (hours, PIN, delivery model, prices...). Loaded from `localStorage` (`ff_cfg`), overlaid with rows from the `config` sheet on load.
- `db = { menu, pedidos, reservaciones, tickets }` — the working dataset, persisted to `localStorage` (`ff_db`) and synced to the Sheet via `syncFast`/`deleteFast` (fire-and-forget POSTs) and pulled via `cargarTodoDesdeSheet()` / periodic `refrescarPedidosSilencioso()` (every 20s, only while on the cocina/mesero screens).
- **Read semantics matter**: `apiGet` returns `null` on a failed/invalid response and an array (possibly empty) on success. Callers must preserve this distinction — `null` means "keep whatever is already on this device", `[]` means "the Sheet really has nothing". Don't collapse these back into one case.
- `cambiosLocalesRecientes` / `VENTANA_PROTECCION_MS` (8s) — guards against the 20s poll clobbering an order status you *just* changed locally before the write round-trips to the Sheet.
- Four screens (`chatScreen`, `meseroScreen`, `cocinaScreen`, `duenoScreen`) toggled via `.active` class by `irAPantalla()`; `pantallaActual` tracks which is showing. Bottom nav tabs are filtered per device role by `NAV_POR_ROL` (`dueno` tab is always reachable as a PIN-protected backdoor to reconfigure a device's role).

### The chat assistant ("Sofía") and its fake tool-calling protocol

The Anthropic model has no native tool use in this setup. Instead, `construirSystemPrompt()` builds a system prompt (in Spanish) instructing the model to emit a specific text pattern when it wants to invoke a tool:

```
[[TOOL:nombre_herramienta]]{"parametro":"valor"}[[/TOOL]]
```

Frontend flow, in `procesarTurnoChat()`:
1. POST `{action:'chatComplete', system, messages}` to the restaurant's Apps Script backend (which holds the real `ANTHROPIC_API_KEY` and calls `api.anthropic.com/v1/messages`).
2. `extraerLlamadaHerramienta()` regex-parses the model's raw text response for a `[[TOOL:...]]` block.
3. If found, `ejecutarHerramienta(nombre, input)` runs it **locally in the browser** (it has direct access to `db`/`cfg`/`chatCarrito` — the cart lives only in that browser tab's memory, since a conversation's context is per-device).
4. The tool's result is appended back into `chatHistory` as `[[TOOL_RESULT:nombre]]{...}[[/TOOL_RESULT]]` and the loop POSTs again (capped at 8 iterations) until the model produces plain text or a UI-rendering tool (`mostrar_botones`, `mostrar_lista`, `mostrar_selector_cantidad`) that requires the human to respond next.
5. `transferir_a_humano` sets `chatHandoff = true`, freezing the input box until the owner reactivates the ticket from the Dueño panel.

Tools: `verificar_disponibilidad_mesas`, `crear_reservacion`, `verificar_existencia_menu`, `mostrar_selector_cantidad`, `enviar_link_pago` (creates the actual `pedido` in `db.pedidos`), `transferir_a_humano`, `mostrar_botones`, `mostrar_lista`. If you add a new tool, it must be declared in **both** the system prompt text in `construirSystemPrompt()` and the `switch` in `ejecutarHerramienta()` — they aren't otherwise connected.

**Demo mode**: when the license is a `demo` (checked via `Omnia Control`), `esDemoSinIA = true` and the entire chat is instead driven by `procesarTurnoSimulado()` — a hand-written state machine (`demoEtapa`) that never calls the real AI backend, so demos work without any restaurant having configured an API key. It reuses the same `ejecutarHerramienta()` local tool implementations. Keep both paths (`procesarTurnoChat` and `procesarTurnoSimulado`) in sync when changing cart/order/reservation behavior.

### Mesero (waiter) flow

Single-page state machine driven by `meseroVista` (`mesas` → `categoria` → `platillos` → `comanda`), `meseroMesaActiva`, and `comandasEnCurso` (an in-memory draft order per table, not yet sent). `enviarACocina()` always creates a **new**, separate `pedido` for each send — orders from the same table are intentionally never merged, so the kitchen always sees a fresh "Nuevo" card even if a prior order for that table is already "listo"/"servido". Paying out a table (`cobrarMesaConMetodo`) marks *all* of that table's unpaid orders `cobrado` at once and combines their items into one printable ticket (`imprimirTicket`, via `window.print()` and the `#ticketImprimible` / `@media print` CSS).

### Cocina (kitchen) flow

Pure Kanban read view over `db.pedidos`, columns defined by `COLUMNAS_COCINA` (`nuevo` → `preparacion` → `listo` → servido, terminal). `marcarEstadoPedido()` is the only mutation, shared with the mesero screen.

### Dueño (owner) panel

PIN-gated (`cfg.pin_dueno`, plaintext in the Sheet's `config` sheet — this is a low-security convenience PIN, not real auth). Tabs: menu CRUD (`viewDuenoMenu`/`guardarPlatilloDueno`/`renderModalPlatillo`, images stored as base64 data URIs via `FileReader`), reservations/orders read-only tables (`viewTablaSimple`), tickets (reactivating a human-handoff conversation), and config (restaurant hours, delivery model, capacity, PIN — written back to the Sheet's `config` sheet row by row).

### Backend (`Code_fastfood.gs`)

Minimal REST-ish dispatcher over a Google Sheet, one tab per collection (`menu`, `pedidos`, `reservaciones`, `tickets`, `config` — see `getSheet()` for header schemas, auto-created on first access):

- `doGet` — only `action=get&sheet=X`, returns all rows as objects keyed by header row.
- `doPost` — `upsert` (keyed by `id`, or `key` for the `config` sheet), `delete` (by `id`), `sync`/`sync_all` (wholesale replace a sheet's rows), and `chatComplete` (the Anthropic proxy — this is the only place the API key is used; the frontend never sees it).

## Conventions to preserve

- No frameworks, no build step, no bundler. Adding a dependency means adding a `<script src>` tag or inlining code — don't introduce npm/webpack/etc. unless explicitly asked.
- All persistent app data flows through `db`/`cfg` + `syncFast`/`deleteFast`/`cargarTodoDesdeSheet` — don't bypass this with direct fetches scattered elsewhere.
- Preserve the `null` (failed fetch) vs `[]` (empty but valid) distinction described above whenever touching `apiGet` or its callers.
- Money is always in MXN, formatted via `mxn()`; user-generated strings are always escaped via `esc()` before being interpolated into `innerHTML`.
- `ANTHROPIC_MODEL` in `Code_fastfood.gs` is currently `'claude-sonnet-5'` — this is the per-restaurant model choice, not related to the model you (Claude Code) are running as.
