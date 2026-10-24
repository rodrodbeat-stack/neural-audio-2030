const tracks = [
  {title:"Cyber Heart", artist:"Neural Drift", genre:"DARK SYNTH", src:"music/music/neural-drift-demo.wav"},
  {title:"Digital Collapse", artist:"Void Structure", genre:"INDUSTRIAL", src:"music/music/neural-drift-demo.wav"},
  {title:"Last Transmission", artist:"Synthetic Souls", genre:"CYBERPUNK", src:"music/music/neural-drift-demo.wav"},
  {title:"Industrial Pulse", artist:"The Machine", genre:"DARK TECHNO", src:"music/music/neural-drift-demo.wav"},
  {title:"Human Error", artist:"Biomechanic", genre:"DARK AMBIENT", src:"music/music/neural-drift-demo.wav"}
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
renderQueue();
updateClock();
setInterval(updateClock, 1000);
