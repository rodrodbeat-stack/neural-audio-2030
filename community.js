(() => {
"use strict";

const cfg = window.NEURAL_COMMUNITY_CONFIG || {};

const status = document.getElementById("uploadStatus");
const form = document.getElementById("uploadForm");
const fileInput = document.getElementById("uploadFile");
const fileHint = document.getElementById("fileHint");
const list = document.getElementById("communityTracks");
const empty = document.getElementById("communityEmpty");
const recentList = document.getElementById("recentCommunityTracks");
const recentStatus = document.getElementById("recentStatus");
const refreshButton = document.getElementById("refreshCommunity");

const ready = Boolean(
window.supabase &&
cfg.supabaseUrl &&
cfg.supabaseAnonKey &&
cfg.supabaseUrl.startsWith("http://") &&
!cfg.supabaseUrl.includes("PEGA_AQUI") &&
!cfg.supabaseAnonKey.includes("PEGA_AQUI")
);

let client = null;
let publishedTracks = [];
let recentInitialized = false;

const say = (message, error = false) => {
if (!status) return;
status.textContent = message;
status.style.color = error ? "#ff6570" : "var(--green)";
};

  const safe = value =>
  String(value ?? "").replace(/[&<>"']/g, ch => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[ch]));

const formatDate = value => {
if (!value) return "NUEVO";

const date = new Date(value);

return Number.isNaN(date.getTime())
  ? "NUEVO"
  : date.toLocaleDateString("es-CL");

};

const formatDuration = seconds => {
if (!Number.isFinite(Number(seconds)) || Number(seconds) <= 0) {
return "—:—";
}

const value = Math.floor(Number(seconds));

return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;

};

function setRecentStatus(message) {
if (recentStatus) {
recentStatus.textContent = message;
}
}

function renderRecentTracks() {
if (!recentList) return;

recentList.replaceChildren();

if (!publishedTracks.length) {
  const message = document.createElement("p");
  message.className = "muted";
  message.textContent = ready
    ? "NO HAY CANCIONES PUBLICADAS TODAVÍA."
    : "ESPERANDO CONEXIÓN CON SUPABASE.";
  recentList.appendChild(message);
  return;
}

publishedTracks.forEach((track, index) => {
  const row = document.createElement("button");

  row.type = "button";
  row.className = "track-row community-recent-row";
  row.setAttribute("aria-label", `Reproducir ${track.title} de ${track.artist}`);

  const number = document.createElement("span");
  number.textContent = `▶ ${index + 1}`;

  const title = document.createElement("span");
  title.textContent = track.title || "Sin título";

  const artist = document.createElement("span");
  artist.textContent = track.artist || "Artista independiente";

  const genre = document.createElement("span");
  genre.textContent = track.genre || "COMMUNITY";

  const duration = document.createElement("span");
  duration.textContent = formatDuration(track.duration_seconds);

  row.append(number, title, artist, genre, duration);

  row.addEventListener("click", () => {
    if (typeof window.addCommunityTrack !== "function") {
      say("El reproductor central todavía no está listo.", true);
      return;
    }

    const indexInPlaylist = window.addCommunityTrack({
      id: track.id,
      title: track.title,
      artist: track.artist,
      genre: track.genre,
      src: track.audio_url,
      duration: track.duration_seconds
    });

    if (indexInPlaylist >= 0) {
      const queueButtons = document.querySelectorAll("#queue .queue-item");
      const queueButton = queueButtons[indexInPlaylist];

      if (queueButton) {
        queueButton.click();
      } else {
        say("Canción añadida. Revisa la playlist central.");
      }
    }
  });

  recentList.appendChild(row);
});

}

function renderCommunityFeed() {
if (!list) return;

list.querySelectorAll(".remote-track").forEach(card => card.remove());

if (empty) {
  empty.hidden = publishedTracks.length > 0;
}

publishedTracks.forEach(track => {
  const card = document.createElement("article");
  card.className = "community-track remote-track";

  const art = document.createElement("div");
  art.className = "track-art";
  if (track.cover_url) {
    const image = document.createElement("img");
    image.src = track.cover_url;
    image.alt = `Portada de ${track.title || "track"}`;
    image.loading = "lazy";
    art.appendChild(image);
  } else {
    art.textContent = "888";
  }

  const info = document.createElement("div");
  info.className = "community-track-info";

  const title = document.createElement("b");
  title.textContent = track.title || "Sin título";

  const artist = document.createElement("span");
  artist.textContent = `${track.artist || "Artista independiente"} · ${formatDate(track.created_at)}`;

  const details = document.createElement("small");
  details.textContent = `${track.genre || "COMMUNITY"}${track.description ? " · " + track.description : ""}`;

  info.append(title, artist, details);

  const audioPlayer = document.createElement("audio");
  audioPlayer.controls = true;
  audioPlayer.preload = "none";
  audioPlayer.src = track.audio_url;
  audioPlayer.setAttribute("aria-label", `Escuchar ${track.title || "canción comunitaria"}`);

  const actions = document.createElement("div");
  actions.className = "community-actions";

  const likeButton = document.createElement("button");
  likeButton.type = "button";
  likeButton.className = "like-button";
  likeButton.dataset.id = track.id;
  likeButton.textContent = `♡ ${Number(track.likes_count) || 0} ME GUSTA`;

  const publishedLabel = document.createElement("span");
  publishedLabel.textContent = "PUBLICADO";

  actions.append(likeButton, publishedLabel);
  card.append(art, info, audioPlayer, actions);
  list.appendChild(card);
});

}

function addTracksToPlayer() {
if (typeof window.addCommunityTrack !== "function") return;

publishedTracks.forEach(track => {
  window.addCommunityTrack({
    id: track.id,
    title: track.title,
    artist: track.artist,
    genre: track.genre,
    src: track.audio_url,
    duration: track.duration_seconds
  });
});

}

async function loadTracks() {
if (!client) {
setRecentStatus("SUPABASE NO CONFIGURADO");
renderRecentTracks();
return;
}

setRecentStatus("CARGANDO...");

try {
  const { data, error } = await client
    .from("tracks")
    .select("id,artist,title,genre,description,audio_url,cover_url,created_at,likes_count")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) throw error;

  publishedTracks = (data || []).filter(
    track => typeof track.audio_url === "string" &&
             track.audio_url.startsWith("https://")
  );

  renderRecentTracks();
  renderCommunityFeed();
  addTracksToPlayer();

  setRecentStatus(`${publishedTracks.length} PUBLICADAS`);

  if (!recentInitialized) {
    recentInitialized = true;
  }

  if (status && !form?.matches(":focus-within")) {
    // No sobrescribir mensajes de carga o publicación mientras el usuario interactúa.
  }
} catch (error) {
  console.error("Neural Community: error al cargar canciones", error);
  setRecentStatus("ERROR DE CONEXIÓN");

  if (recentList) {
    recentList.replaceChildren();

    const message = document.createElement("p");
    message.className = "muted";
    message.textContent = "No se pudieron cargar las canciones. Comprueba Supabase y sus políticas de lectura.";
    recentList.appendChild(message);
  }

  say(`No se pudo cargar la comunidad: ${error.message || "revisa las políticas de Supabase"}`, true);
}

}

async function uploadTrack(event) {
event.preventDefault();

if (!client) {
  say("Configura Supabase antes de publicar.", true);
  return;
}

const file = fileInput?.files?.[0];
const maxUploadMB = Number(cfg.maxUploadMB) || 20;
const maxBytes = maxUploadMB * 1024 * 1024;
const allowed = /\.(mp3|wav|ogg|m4a)$/i.test(file?.name || "");

if (!file || !allowed) {
  say("Formato no válido. Usa MP3, WAV, OGG o M4A.", true);
  return;
}

if (file.size > maxBytes) {
  say(`Archivo demasiado grande. Máximo ${maxUploadMB} MB.`, true);
  return;
}

const artist = document.getElementById("uploadArtist")?.value.trim();
const title = document.getElementById("uploadTitle")?.value.trim();
const genre = document.getElementById("uploadGenre")?.value;
const description = document.getElementById("uploadDescription")?.value.trim();

if (!artist || !title) {
  say("Introduce el artista y el título.", true);
  return;
}

const submit = form.querySelector('button[type="submit"]');
submit.disabled = true;

say("SUBIENDO AUDIO // ESPERA...");

let objectPath = null;

try {
  const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  objectPath = `${crypto.randomUUID()}-${cleanName}`;

  const { error: uploadError } = await client.storage
    .from("community-audio")
    .upload(objectPath, file, {
      contentType: file.type || "application/octet-stream",
      upsert: false
    });

  if (uploadError) throw uploadError;

  const { data: publicData } = client.storage
    .from("community-audio")
    .getPublicUrl(objectPath);

  // Upload optional cover art and store its public URL with the track.
  const coverFile = document.getElementById("trackCover")?.files?.[0];
  const coverUrl = coverFile ? await uploadTrackCover(coverFile) : null;

  const { error: insertError } = await client.from("tracks").insert({
    artist,
    title,
    genre,
    description,
    audio_path: objectPath,
    audio_url: publicData.publicUrl,
    cover_url: coverUrl,
    status: "pending"
  });

  if (insertError) throw insertError;

  form.reset();

  if (fileHint) {
    fileHint.textContent = `Tamaño máximo recomendado: ${maxUploadMB} MB`;
  }

  say("AUDIO RECIBIDO // PENDIENTE DE MODERACIÓN. Cuando se publique aparecerá en Últimas canciones.");

  await loadTracks();
} catch (error) {
  console.error("Neural Community: error al publicar", error);

  if (objectPath) {
    await client.storage.from("community-audio").remove([objectPath]).catch(() => {});
  }

  say(`ERROR DE PUBLICACIÓN: ${error.message || "revisa la configuración de Supabase"}`, true);
} finally {
  submit.disabled = false;
}

}

async function likeTrack() {
say("Los favoritos necesitan una política o función RPC configurada en Supabase.", true);
}

if (fileInput && fileHint) {
fileInput.addEventListener("change", () => {
const file = fileInput.files?.[0];
const maxUploadMB = Number(cfg.maxUploadMB) || 20;

  if (!file) {
    fileHint.textContent = `Tamaño máximo recomendado: ${maxUploadMB} MB`;
    return;
  }

  fileHint.textContent = `${file.name} · ${(file.size / 1024 / 1024).toFixed(2)} MB`;

  if (file.size > maxUploadMB * 1024 * 1024) {
    say(`El archivo supera el límite de ${maxUploadMB} MB.`, true);
  }
});

}

if (form) {
form.addEventListener("submit", uploadTrack);
}

if (refreshButton) {
refreshButton.addEventListener("click", loadTracks);
}

if (list) {
list.addEventListener("click", event => {
const button = event.target.closest(".like-button");
if (button) likeTrack(button.dataset.id, button);
});
// ========================================
// NEURA — SUBIDA DE PORTADAS
// Bucket de Supabase: imagenes
// ========================================

async function uploadTrackCover(file) {
  if (!client) {
    throw new Error("Supabase no está conectado.");
  }

  if (!file) {
    return null;
  }

  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp"
  ];

  if (!allowedTypes.includes(file.type)) {
    throw new Error("La portada debe ser JPG, PNG o WebP.");
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error("La portada no puede superar los 5 MB.");
  }

  const extension = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp"
  }[file.type];

  const filename =
    `covers/${crypto.randomUUID()}.${extension}`;

  const { data, error } = await client.storage
    .from("imagenes")
    .upload(filename, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: false
    });

  if (error) {
    console.error("Error subiendo portada:", error);
    throw new Error(`No se pudo guardar la portada: ${error.message}`);
  }

  const { data: urlData } = client.storage
    .from("imagenes")
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}

// Vista previa de la portada seleccionada
(() => {
  const input = document.getElementById("trackCover");
  const preview = document.getElementById("coverPreview");

  if (!input || !preview) return;

  input.addEventListener("change", () => {
    const file = input.files?.[0];

    if (!file) {
      preview.hidden = true;
      preview.removeAttribute("src");
      return;
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      alert("Selecciona una imagen JPG, PNG o WebP.");
      input.value = "";
      preview.hidden = true;
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("La imagen debe pesar menos de 5 MB.");
      input.value = "";
      preview.hidden = true;
      return;
    }

    preview.src = URL.createObjectURL(file);
    preview.hidden = false;
  });
})();  
}

if (ready) {
client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
say("SUPABASE CONFIGURADO // CARGANDO COMUNIDAD.");
loadTracks();
} else {
say("SIN CONEXIÓN SUPABASE // Revisa URL/clave pública y ejecuta supabase-schema.sql; configura permisos de Storage.");
setRecentStatus("MODO DEMO");
renderRecentTracks();
}
})();
// NEURAL COMMUNITY VIDEO UPLOAD: preview locally and publish to Supabase when configured.
(() => {
  const form = document.getElementById('videoUploadForm');
  if (!form) return;
  const input = document.getElementById('communityVideoFile');
  const preview = document.getElementById('communityVideoPreview');
  const info = document.getElementById('videoFileInfo');
  const status = document.getElementById('videoUploadStatus');
  const button = document.getElementById('publishVideoButton');
  const videos = document.getElementById('communityVideos');
  const cfg = window.NEURAL_COMMUNITY_CONFIG || {};
  let previewUrl = null;
  const MAX_VIDEO_MB = Number(cfg.maxVideoUploadMB) || 100;
  const setStatus = (message, bad = false) => {
    status.textContent = message;
    status.style.color = bad ? '#ff6570' : 'var(--green)';
  };
  const sizeLabel = bytes => `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  input.addEventListener('change', () => {
    const file = input.files && input.files[0];
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = null;
    preview.removeAttribute('src');
    preview.hidden = true;
    if (!file) {
      info.textContent = 'ESPERANDO ARCHIVO DE VIDEO...';
      return;
    }
    if (!file.type.startsWith('video/') && !/\.(mp4|webm|mov)$/i.test(file.name)) {
      input.value = '';
      info.textContent = 'FORMATO NO VÁLIDO';
      setStatus('Selecciona un video MP4, WebM o MOV.', true);
      return;
    }
    if (file.size > MAX_VIDEO_MB * 1024 * 1024) {
      input.value = '';
      info.textContent = 'VIDEO DEMASIADO GRANDE';
      setStatus(`El video supera el límite de ${MAX_VIDEO_MB} MB.`, true);
      return;
    }
    previewUrl = URL.createObjectURL(file);
    preview.src = previewUrl;
    preview.hidden = false;
    info.textContent = `${file.name} · ${sizeLabel(file.size)} · VIDEO LISTO`;
    setStatus('Vista previa lista. Completa alias y título para publicar.');
  });

  function addVideoCard(title, artist, url) {
    // Prevent duplicate cards when the feed is refreshed after an upload.
    if ([...videos.querySelectorAll('.community-video-card')].some(card => card.dataset.videoUrl === url)) return;
    const card = document.createElement('article');
    card.className = 'community-video-card';
    card.dataset.videoUrl = url;
    const player = document.createElement('video');
    player.src = url;
    player.controls = true;
    player.playsInline = true;
    player.preload = 'metadata';
    const heading = document.createElement('b');
    heading.textContent = title;
    const author = document.createElement('small');
    author.textContent = `VIDEO · ${artist}`;
    card.append(player, heading, author);
    videos.prepend(card);
  }

  async function loadPublishedVideos() {
    if (!window.supabase || !cfg.supabaseUrl || !cfg.supabaseAnonKey ||
        !cfg.supabaseUrl.startsWith('https://') || cfg.supabaseUrl.includes('PEGA_AQUI') ||
        cfg.supabaseAnonKey.includes('PEGA_AQUI')) {
      return;
    }
    try {
      const client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
      const { data, error } = await client.from('video_posts')
        .select('id, artist, title, video_url, created_at')
        .eq('status', 'published')
        .order('created_at', { ascending: false });
      if (error) throw error;
      videos.replaceChildren();
      (data || []).forEach(video => addVideoCard(video.title, video.artist, video.video_url));
      if (!data || data.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'muted';
        empty.textContent = 'AÚN NO HAY VIDEOS PUBLICADOS. Los videos nuevos aparecen aquí cuando se aprueban en Supabase.';
        videos.appendChild(empty);
      }
    } catch (error) {
      console.error('Neural Community: error cargando videos publicados:', error);
      setStatus(`No se pudieron cargar los videos publicados: ${error.message || 'revisa las políticas SELECT de video_posts'}`, true);
    }
  }

  loadPublishedVideos();

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const file = input.files && input.files[0];
    const artist = document.getElementById('videoArtist').value.trim();
    const title = document.getElementById('videoTitle').value.trim();
    if (!file || !artist || !title) {
      setStatus('Completa el alias, el título y selecciona un video.', true);
      return;
    }
    if (!document.getElementById('videoRightsConfirm').checked) {
      setStatus('Confirma que tienes derechos para compartir este video.', true);
      return;
    }
    const ready = Boolean(window.supabase && cfg.supabaseUrl && cfg.supabaseAnonKey &&
      cfg.supabaseUrl.startsWith('https://') && !cfg.supabaseUrl.includes('PEGA_AQUI') &&
      !cfg.supabaseAnonKey.includes('PEGA_AQUI'));
    if (!ready) {
      setStatus('Vista previa disponible. Para que otros usuarios vean el video, configura Supabase y crea el bucket community-videos y la tabla video_posts.', true);
      return;
    }
    button.disabled = true;
    setStatus('SUBIENDO VIDEO // NO CIERRES ESTA PÁGINA...');
    let path = null;
    try {
      const client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
      const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      path = `${crypto.randomUUID()}-${cleanName}`;
      const { error: uploadError } = await client.storage.from('community-videos').upload(path, file, {
        contentType: file.type || 'video/mp4', upsert: false
      });
      if (uploadError) throw uploadError;
      const { data: publicData } = client.storage.from('community-videos').getPublicUrl(path);
      const { error: insertError } = await client.from('video_posts').insert({
        artist, title, video_path: path, video_url: publicData.publicUrl, status: 'pending'
      });
      if (insertError) throw insertError;
      addVideoCard(title, artist, publicData.publicUrl);
      form.reset();
      preview.hidden = true;
      preview.removeAttribute('src');
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      previewUrl = null;
      info.textContent = 'VIDEO ENVIADO · PENDIENTE DE MODERACIÓN';
      setStatus('VIDEO RECIBIDO. Quedó pendiente de moderación antes de publicarse globalmente.');
    } catch (error) {
      console.error('Neural Community video upload:', error);
      if (path) {
        const client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
        await client.storage.from('community-videos').remove([path]).catch(() => {});
      }
      const rawMessage = String(error.message || error.error_description || 'revisa la configuración de Supabase');
      const normalized = rawMessage.toLowerCase();
      if (normalized.includes('bucket') && (normalized.includes('not found') || normalized.includes('does not exist') || normalized.includes('no existe'))) {
        setStatus('BUCKET NO ENCONTRADO: abre Supabase → SQL Editor y ejecuta FIX-BUCKET-VIDEOS.sql. Debe crearse exactamente como community-videos. Luego vuelve a intentar.', true);
      } else if (normalized.includes('row-level security') || normalized.includes('permission denied') || normalized.includes('not allowed')) {
        setStatus('SUPABASE BLOQUEÓ LA SUBIDA POR PERMISOS. Ejecuta FIX-BUCKET-VIDEOS.sql en SQL Editor y revisa las políticas de Storage.', true);
      } else {
        setStatus(`ERROR AL SUBIR VIDEO: ${rawMessage}`, true);
      }
    } finally {
      button.disabled = false;
    }
  });
})();

