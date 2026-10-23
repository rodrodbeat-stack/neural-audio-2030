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
const queueItems = [...document.querySelectorAll(".queue-item")];
let current = 0;
let shuffled = false;
const fmt = seconds => {
  if (!Number.isFinite(seconds)) return "00:00";
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};
function log(message) {
  const terminal = document.getElementById("terminalLogs");
  const p = document.createElement("p");
  p.textContent = `T-${fmt(audio.currentTime)}  ${message}`;
  terminal.prepend(p);
  while (terminal.children.length > 8) terminal.lastElementChild.remove();
}
function selectTrack(index, autoplay = true) {
  current = (index + tracks.length) % tracks.length;
  const track = tracks[current];
  nowTitle.textContent = track.title;
  nowArtist.textContent = track.artist;
  nowGenre.textContent = track.genre;
  audio.src = track.src;
  audio.load();
  seek.value = 0;
  elapsed.textContent = "00:00";
  durationLabel.textContent = "00:32";
  queueItems.forEach((item, i) => item.classList.toggle("active", i === current));
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
    log("AUDIO PLAYBACK ACTIVE");
  } catch (error) {
    log("PULSA PLAY PARA INICIAR AUDIO");
  }
}
function pausePlayback() {
  audio.pause();
  document.body.classList.remove("playing");
  playPause.textContent = "▶";
  playPause.setAttribute("aria-label", "Reproducir");
  log("PLAYBACK PAUSED");
}
function togglePlayback() {
  if (audio.paused) startPlayback(); else pausePlayback();
}
document.querySelectorAll("[data-track]").forEach(el => el.addEventListener("click", () => selectTrack(Number(el.dataset.track), true)));
playPause.addEventListener("click", togglePlayback);
document.getElementById("heroPlay").addEventListener("click", togglePlayback);
document.getElementById("previous").addEventListener("click", () => selectTrack(current - 1, true));
document.getElementById("next").addEventListener("click", () => selectTrack(shuffled ? Math.floor(Math.random()*tracks.length) : current + 1, true));
document.getElementById("shuffle").addEventListener("click", e => {
  shuffled = !shuffled;
  e.currentTarget.style.color = shuffled ? "var(--red)" : "";
  log(`SHUFFLE ${shuffled ? "ENABLED" : "DISABLED"}`);
});
document.getElementById("mute").addEventListener("click", e => {
  audio.muted = !audio.muted;
  e.currentTarget.style.color = audio.muted ? "var(--red)" : "";
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
seek.addEventListener("input", () => {
  if (Number.isFinite(audio.duration) && audio.duration > 0) audio.currentTime = Number(seek.value) / 100 * audio.duration;
});
audio.addEventListener("ended", () => selectTrack(shuffled ? Math.floor(Math.random()*tracks.length) : current + 1, true));
document.getElementById("generate").addEventListener("click", () => {
  const genre = document.getElementById("genre").value;
  const bpm = document.getElementById("bpm").value;
  const intensity = document.getElementById("intensity").value;
  const ambience = document.getElementById("ambience").value;
  const result = document.getElementById("generatorResult");
  result.textContent = `PLAYLIST CONFIGURADA // ${genre.toUpperCase()} · ${bpm} BPM · ${intensity.toUpperCase()} · ${ambience.toUpperCase()}`;
  log(`PLAYLIST GENERATED: ${genre.toUpperCase()}`);
  const genreMap = {"Cyberpunk":2,"Dark Synth":0,"Industrial":1,"Dark Ambient":4,"Dark Techno":3};
  selectTrack(genreMap[genre] ?? 0, true);
});
function updateClock() {
  const now = new Date();
  document.getElementById("clock").textContent = now.toLocaleTimeString("es-CL", {hour12:false});
}
updateClock();
setInterval(updateClock, 1000);
