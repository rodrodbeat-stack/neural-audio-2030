# NEURAL COMMUNITY — configuración de Supabase

Esta versión agrega el panel de subida y el catálogo comunitario al sitio GitHub Pages.
**La subida global no funciona hasta configurar el proyecto Supabase.** El ZIP incluye el frontend y el esquema inicial de base de datos.

## 1. Crear proyecto
1. Abre https://supabase.com y crea un proyecto.
2. En el panel del proyecto, ve a **SQL Editor**.
3. Copia y ejecuta el contenido de `supabase-schema.sql`.
4. En **Project Settings → API**, copia Project URL y la clave pública `anon`/`publishable` (nunca la `service_role`).

## 2. Configurar la web
Edita `community-config.js` y reemplaza:
- `PEGA_AQUI_TU_SUPABASE_PROJECT_URL`
- `PEGA_AQUI_TU_SUPABASE_PUBLISHABLE_O_ANON_KEY`

Guarda y sube todos los archivos al repositorio GitHub Pages.

## 3. Moderación
Los audios enviados quedan en estado `pending` y no aparecen en el catálogo público hasta aprobarlos. Para aprobar:
1. Abre Supabase → Table Editor → `tracks`.
2. Revisa artista, título, descripción y audio.
3. Cambia `status` a `published`.

**Advertencia:** la demo admite subidas anónimas y tiene un límite de 20 MB. Antes de abrirla al público, recomendamos añadir registro/inicio de sesión, CAPTCHA/rate limits, reportes, moderación y políticas de almacenamiento más estrictas. No pongas jamás la clave `service_role` en `community-config.js`.

## 4. Funciones contempladas en la base de datos
El esquema crea tablas para perfiles, tracks, comentarios, favoritos y playlists. En esta primera entrega del frontend están activos el envío de audio, la cola de revisión y el catálogo de tracks aprobados; el login, comentarios, playlists y favoritos requieren completar sus pantallas y las políticas/RPC correspondientes antes de anunciarse como funcionales.

## 5. GitHub Pages
Sube el contenido de esta carpeta a la raíz de tu repositorio, incluyendo `community-config.js`, `community.js`, `supabase-schema.sql`, `assets/` y `music/`.


## 6. Solución: error “Bucket not found” al subir videos
1. Abre Supabase → **SQL Editor** → **New query**.
2. Abre el archivo `FIX-BUCKET-VIDEOS.sql` incluido en este ZIP, copia todo su contenido y ejecútalo con **Run**.
3. La consulta final debe devolver una fila cuyo `id` sea exactamente `community-videos`.
4. En Storage, confirma que exista el bucket `community-videos`; luego recarga la web y vuelve a intentar.

El nombre distingue el bucket que usa el código: `community-videos` (con guion). No lo crees como `community_videos`, `videos` ni `community-video`. Si después aparece un error de permisos, vuelve a ejecutar el archivo SQL completo. No publiques nunca la clave `service_role` en el frontend.
