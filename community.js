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
cfg.supabaseUrl.startsWith("https://") &&
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
"&": "&",
"<": "<",
">": ">",
'"': """,
"'": "'"
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
  art.textContent = "888";

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
    .select("id,artist,title,genre,description,audio_url,created_at,likes_count")
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

  const { error: insertError } = await client.from("tracks").insert({
    artist,
    title,
    genre,
    description,
    audio_path: objectPath,
    audio_url: publicData.publicUrl,
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
}

if (ready) {
client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
say("SUPABASE CONFIGURADO // CARGANDO COMUNIDAD.");
loadTracks();
} else {
say("MODO DEMO // Falta configurar Supabase para publicaciones globales.");
setRecentStatus("MODO DEMO");
renderRecentTracks();
}
})();
