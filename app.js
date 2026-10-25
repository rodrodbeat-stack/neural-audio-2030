const tracks = [
  {title:"Cyber Heart", artist:"Neural Drift", genre:"DARK SYNTH", src:"music/neural-drift-demo.wav"},
  {title:"Digital Collapse", artist:"Void Structure", genre:"INDUSTRIAL", src:"music/neural-drift-demo.wav"},
  {title:"Last Transmission", artist:"Synthetic Souls", genre:"CYBERPUNK", src:"music/neural-drift-demo.wav"},
  {title:"Industrial Pulse", artist:"The Machine", genre:"DARK TECHNO", src:"music/neural-drift-demo.wav"},
  {title:"Human Error", artist:"Biomechanic", genre:"DARK AMBIENT", src:"music/neural-drift-demo.wav"}
];
const audio = document.getElementById("audio");
const playPause = document.getElementById("playPause");
const seek = document.getElementById("seek");
const elapsed = document.getElementById("elapsed");
const durationLabel = document.getElementById("duration");
const nowTitle = document.getElementById("nowTitle");
const nowArtist = document.getElementById("nowArtist");
const nowGenre = document.getElementById("nowGenre");
const queue = document.getElementById("queue");
let current = 0;
let shuffled = false;
const fmt = seconds => {
  if (!Number.isFinite(seconds)) return "00:00";
  return `${Math.floor(seconds / 60).toString().padStart(2,"0")}:${Math.floor(seconds % 60).toString().padStart(2,"0")}`;
};
function log(message) {
  const terminal = document.getElementById("terminalLogs");
  if (!terminal) return;
  const p = document.createElement("p");
  p.textContent = `T-${fmt(audio.currentTime)}  ${message}`;
  terminal.prepend(p);
  while (terminal.children.length > 8) terminal.lastElementChild.remove();
}
function renderQueue() {
  queue.innerHTML = "";
  tracks.forEach((track, i) => {
    const item = document.createElement("button");
    item.className = `queue-item${i === current ? " active" : ""}`;
    item.dataset.track = String(i);
    const cover = document.createElement("span");
    cover.className = "mini-cover";
    cover.textContent = track.community ? "♫" : ["◉","◈","◉","▥","◉"][i % 5];
    const meta = document.createElement("span");
    const title = document.createElement("b"); title.textContent = track.title;
    const artist = document.createElement("small"); artist.textContent = track.artist;
    meta.append(title, artist);
    const duration = document.createElement("time"); duration.textContent = track.duration || "—:—";
    const icon = document.createElement("i"); icon.textContent = i === current && !audio.paused ? "Ⅱ" : "⋮";
    item.append(cover, meta, duration, icon);
    item.addEventListener("click", () => selectTrack(i, true));
    queue.appendChild(item);
  });
}
function selectTrack(index, autoplay = true) {
  if (!tracks.length) return;
  current = (index + tracks.length) % tracks.length;
  const track = tracks[current];
  nowTitle.textContent = track.title;
  nowArtist.textContent = track.artist;
  nowGenre.textContent = (track.genre || "COMMUNITY").toUpperCase();
  audio.src = track.src;
  audio.load();
  seek.value = 0;
  elapsed.textContent = "00:00";
  durationLabel.textContent = track.duration || "00:00";
  renderQueue();
  document.querySelectorAll("[data-track]").forEach(el => {
    if (el.classList.contains("album-card")) el.classList.toggle("selected", Number(el.dataset.track) === current);
  });
  log(`TRACK SELECTED: ${track.title.toUpperCase()}`);
  if (autoplay) startPlayback();
}
async function startPlayback() {
  try {
    await audio.play();
    document.body.classList.add("playing");
    playPause.textContent = "Ⅱ";
    playPause.setAttribute("aria-label", "Pausar");
    renderQueue();
    log("AUDIO PLAYBACK ACTIVE");
  } catch (error) { log("PULSA PLAY PARA INICIAR AUDIO"); }
}
function pausePlayback() {
  audio.pause();
  document.body.classList.remove("playing");
  playPause.textContent = "▶";
  playPause.setAttribute("aria-label", "Reproducir");
  renderQueue();
  log("PLAYBACK PAUSED");
}
function togglePlayback() { if (audio.paused) startPlayback(); else pausePlayback(); }
document.querySelectorAll(".album-card[data-track], [data-track].album-card").forEach(el => el.addEventListener("click", () => selectTrack(Number(el.dataset.track), true)));
playPause.addEventListener("click", togglePlayback);
document.getElementById("heroPlay").addEventListener("click", togglePlayback);
document.getElementById("previous").addEventListener("click", () => selectTrack(current - 1, true));
document.getElementById("next").addEventListener("click", () => selectTrack(shuffled ? Math.floor(Math.random()*tracks.length) : current + 1, true));
document.getElementById("shuffle").addEventListener("click", e => {
  shuffled = !shuffled; e.currentTarget.style.color = shuffled ? "var(--red)" : "";
  log(`SHUFFLE ${shuffled ? "ENABLED" : "DISABLED"}`);
});
document.getElementById("mute").addEventListener("click", e => {
  audio.muted = !audio.muted; e.currentTarget.style.color = audio.muted ? "var(--red)" : "";
});
document.getElementById("volume").addEventListener("input", e => audio.volume = Number(e.target.value));
audio.volume = 0.72;
audio.addEventListener("timeupdate", () => {
  if (Number.isFinite(audio.duration) && audio.duration > 0) {
    seek.value = (audio.currentTime / audio.duration) * 100;
    elapsed.textContent = fmt(audio.currentTime);
    durationLabel.textContent = fmt(audio.duration);
  }
});
audio.addEventListener("loadedmetadata", () => durationLabel.textContent = fmt(audio.duration));
seek.addEventListener("input", () => { if (Number.isFinite(audio.duration) && audio.duration > 0) audio.currentTime = Number(seek.value) / 100 * audio.duration; });
audio.addEventListener("ended", () => selectTrack(shuffled ? Math.floor(Math.random()*tracks.length) : current + 1, true));
document.getElementById("generate").addEventListener("click", () => {
  const genre = document.getElementById("genre").value;
  const bpm = document.getElementById("bpm").value;
  const intensity = document.getElementById("intensity").value;
  const ambience = document.getElementById("ambience").value;
  document.getElementById("generatorResult").textContent = `PLAYLIST CONFIGURADA // ${genre.toUpperCase()} · ${bpm} BPM · ${intensity.toUpperCase()} · ${ambience.toUpperCase()}`;
  log(`PLAYLIST GENERATED: ${genre.toUpperCase()}`);
  const genreMap = {"Cyberpunk":2,"Dark Synth":0,"Industrial":1,"Dark Ambient":4,"Dark Techno":3};
  selectTrack(genreMap[genre] ?? 0, true);
});
/* Public hook: community tracks join the same continuous playlist and can be played from it. */
window.addCommunityTrack = function(track, options = {}) {
  if (!track || !track.src) return;
  const key = track.id || track.src;
  const existing = tracks.findIndex(t => (t.id || t.src) === key);
  if (existing >= 0) return existing;
  tracks.push({
    id: track.id || key, title: track.title || "Untitled",
    artist: track.artist || "Unknown artist", genre: track.genre || "COMMUNITY",
    src: track.src, duration: track.duration || "", community: true
  });
  renderQueue();
  log(`COMMUNITY TRACK ADDED TO PLAYLIST: ${(track.title || "UNTITLED").toUpperCase()}`);
  if (options.playNow) selectTrack(tracks.length - 1, true);
  return tracks.length - 1;
};
function updateClock() {
  const clock = document.getElementById("clock");
  if (clock) clock.textContent = new Date().toLocaleTimeString("es-CL", {hour12:false});
}
// ============================================
// 888 DIGITAL FACTORY - PUBLICACIÓN DE VÍDEOS
// Neural Audio 2030 + Supabase
// ============================================

// IMPORTANTE:
// Debe existir una instancia de Supabase llamada "supabase".
// Ajusta VIDEO_BUCKET al nombre REAL de tu bucket.

const VIDEO_BUCKET = "videos";

// Publicar un vídeo
async function publishVideo({
    file,
    title,
    description = ""
}) {
    try {
        // 1. Validar archivo
        if (!file) {
            throw new Error("Selecciona un vídeo.");
        }

        if (!title || !title.trim()) {
            throw new Error("Introduce el título del vídeo.");
        }

        // 2. Comprobar autenticación
        const {
            data: { user },
            error: authError
        } = await supabase.auth.getUser();

        if (authError) {
            throw authError;
        }

        if (!user) {
            throw new Error(
                "Debes iniciar sesión para publicar vídeos."
            );
        }

        // 3. Crear una ruta única
        const extension =
            file.name.split(".").pop()?.toLowerCase() || "mp4";

        const filePath =
            `${user.id}/${crypto.randomUUID()}.${extension}`;

        // 4. Subir vídeo a Storage
        const {
            data: uploadedFile,
            error: uploadError
        } = await supabase.storage
            .from(VIDEO_BUCKET)
            .upload(filePath, file, {
                cacheControl: "3600",
                upsert: false,
                contentType: file.type || "video/mp4"
            });

        if (uploadError) {
            throw new Error(
                "No se pudo subir el vídeo: " +
                uploadError.message
            );
        }

        // 5. Registrar publicación en la base de datos
        const {
            data: video,
            error: insertError
        } = await supabase
            .from("video_posts")
            .insert({
                user_id: user.id,
                title: title.trim(),
                description: description.trim(),
                video_path: uploadedFile.path,
                status: "pending"
            })
            .select()
            .single();

        // 6. Si falla el registro, limpiar el archivo subido
        if (insertError) {
            const { error: cleanupError } =
                await supabase.storage
                    .from(VIDEO_BUCKET)
                    .remove([uploadedFile.path]);

            if (cleanupError) {
                console.error(
                    "No se pudo limpiar el archivo:",
                    cleanupError
                );
            }

            throw new Error(
                "No se pudo registrar la publicación: " +
                insertError.message
            );
        }

        console.log("Vídeo registrado:", video);

        alert(
            "Vídeo enviado correctamente. " +
            "Quedará pendiente de aprobación."
        );

        return video;

    } catch (error) {
        console.error("ERROR AL SUBIR VIDEO:", error);

        alert("ERROR AL SUBIR VIDEO: " + error.message);

        return null;
    }
}
renderQueue();
updateClock();
setInterval(updateClock, 1000);
