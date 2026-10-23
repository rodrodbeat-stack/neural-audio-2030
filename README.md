# 888 Digital Factory — Neural Audio 2050

Web estática para GitHub Pages con estética cyberpunk rojo/negro y reproductor de audio funcional.

## Qué incluye
- `index.html`: dashboard y controles.
- `styles.css`: interfaz adaptable a escritorio y móvil.
- `app.js`: reproductor, cola, siguiente/anterior, aleatorio, volumen, progreso y generador visual.
- `music/neural-drift-demo.wav`: loop de audio synth original de demostración.
- `assets/neural-audio-hero.png`: arte de cabecera fusionado.

## Publicar en GitHub Pages
1. Crea un repositorio, por ejemplo `neural-audio-2050`.
2. Descomprime el ZIP en tu computador.
3. Sube el contenido de la carpeta (no la carpeta contenedora) a la raíz del repositorio. Debes ver `index.html`, `styles.css`, `app.js`, `assets/` y `music/` en la raíz.
4. En GitHub abre **Settings → Pages**.
5. En **Build and deployment**, selecciona **Deploy from a branch**, branch `main`, carpeta `/(root)`, y guarda.
6. Espera a que termine el despliegue y abre la URL de GitHub Pages.

## Añadir tus canciones reales
Sube tus archivos MP3 a `music/`. Después edita `app.js` y cambia el campo `src` de cada pista, por ejemplo:
`src: "music/mi-tema.mp3"`

Importante: por ahora las cinco pistas del dashboard usan el mismo audio de demostración; los nombres y la cola son de muestra. Para que cada canción suene diferente, coloca tus temas propios en `music/` y asigna un archivo distinto a cada pista. El navegador puede bloquear el autoplay; inicia con el botón **INITIALIZE AUDIO** o **▶**.
