# 888 Digital Factory — Neural Audio 2050 / Neural Community

Web estática cyberpunk para GitHub Pages, con reproductor de audio y panel comunitario de publicaciones.

## Incluye
- `index.html`, `styles.css`, `app.js`: dashboard y reproductor.
- `community.js`, `community-config.js`: panel de subida y catálogo conectado a Supabase.
- `supabase-schema.sql`: esquema inicial, RLS y bucket de audio.
- `SETUP-SUPABASE.md`: instrucciones de conexión y moderación.
- `music/neural-drift-demo.wav`: pista original de demostración.
- `assets/neural-audio-hero.png`: arte visual del dashboard.

## Importante
El panel se ve sin configurar backend, pero para que las subidas sean globales debes crear y configurar Supabase. Las publicaciones quedan pendientes de moderación. El frontend implementa subida, catálogo y añade las canciones subidas/aprobadas a la playlist continua; perfiles/login, comentarios, playlists y favoritos están previstos en el esquema pero necesitan pantallas y lógica adicionales.

## Publicación
1. Crea un repositorio en GitHub.
2. Sube el contenido de esta carpeta a la raíz.
3. Configura Supabase siguiendo `SETUP-SUPABASE.md`.
4. En GitHub, Settings → Pages → Deploy from a branch → `main` → `/(root)`.


## Video animado en portada
La portada utiliza `assets/hero-video.mp4` como fondo en bucle, silenciado y compatible con móviles. Para verlo en GitHub Pages, sube y publica **todo el contenido** de esta carpeta en el repositorio (incluida la carpeta `assets`) y luego recarga la web sin caché. Abrir el ZIP o reemplazar archivos solo en tu dispositivo no actualiza automáticamente la web publicada.
