# Narración en español (pendiente)

Las escenas ya están cableadas para reproducir narración en español vía ElevenLabs
(ver `<Audio src={staticFile("audio/...")} />` en cada `src/scenes/Scene*.tsx`),
pero los archivos de audio todavía no están en este directorio. Colócalos aquí con
estos nombres exactos:

| Archivo | Escena | Guion (es) | Duración objetivo |
|---|---|---|---|
| `scene-intro-es.mp3` | Intro | "FastFood Omnia. Tu restaurante, más inteligente." | ~3.9s (cabe en 130 frames / 4.33s a 30fps) |
| `scene-chat-es.mp3` | Chat | "Tus clientes piden por chat, como si hablaran con un mesero." | ~3.6s (cabe en 150 frames / 5s) |
| `scene-roles-es.mp3` | Roles | "Mesero, cocina, caja y dueño: todo conectado en una sola app." | ~4.4s (cabe en 145 frames / 4.83s) |
| `scene-dashboard-es.mp3` | Dashboard | "Reportes y ventas en tiempo real, todos los días." | ~3.7s (cabe en 125 frames / 4.17s) |
| `scene-outro-es.mp3` | Outro | "Pide, sirve y cobra. Todo en una sola app. Descúbrelo hoy." | ~4.0s (cabe en 135 frames / 4.5s) |

Generado y verificado con la voz ElevenLabs "Bella" (`voice_id: eba85120-4ed5-5202-a6f6-696e2c6fe2b6`,
modelo `text2speech_v2`, variant `elevenlabs`) — las duraciones de la tabla son las medidas
en esa generación. Las duraciones de las escenas en `src/PromoVideo.tsx` ya se ajustaron
para darle espacio a esa narración; si usas otra voz o el audio queda más largo/corto,
ajusta `INTRO_DURATION`, `CHAT_DURATION`, `ROLES_DURATION`, `DASHBOARD_DURATION` y
`OUTRO_DURATION` ahí para que la narración no se corte.

No se pudieron incluir los .mp3 en este commit: la política de red de este entorno
bloqueó la descarga del host que sirve el audio generado, y una transferencia manual
de los bytes resultó corrupta (verificado por checksum), así que se descartó en vez
de subir un archivo dañado.
