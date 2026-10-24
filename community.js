(() => {
  const cfg = window.NEURAL_COMMUNITY_CONFIG || {};
  const status = document.getElementById("uploadStatus");
  const form = document.getElementById("uploadForm");
  const fileInput = document.getElementById("uploadFile");
  const fileHint = document.getElementById("fileHint");
  const list = document.getElementById("communityTracks");
  const empty = document.getElementById("communityEmpty");
  const ready = window.supabase && cfg.supabaseUrl && cfg.supabaseAnonKey &&
    cfg.supabaseUrl.startsWith("https://") &&
    !cfg.supabaseUrl.includes("PEGA_AQUI") &&
    !cfg.supabaseAnonKey.includes("PEGA_AQUI");
  let client = null;

  const say = (message, error = false) => {
    status.textContent = message;
    status.style.color = error ? "#ff6570" : "var(--green)";
  };
  const safe = value => String(value ?? "").replace(/[&<>"']/g, ch => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[ch]));
  const formatDate = value => value ? new Date(value).toLocaleDateString("es-CL") : "NUEVO";

  if (ready) {
    client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
    say("SUPABASE CONFIGURADO // CARGANDO COMUNIDAD.");
    loadTracks();
  } else {
    say("MODO DEMO // Falta configurar Supabase para habilitar publicaciones globales.");
  }

  fileInput.addEventListener("change", () => {
    const file = fileInput.files?.[0];
    if (!file) { fileHint.textContent = "Tamaño máximo recomendado: 20 MB"; return; }
    fileHint.textContent = `${file.name} · ${(file.size / 1024 / 1024).toFixed(2)} MB`;
    if (file.size > (Number(cfg.maxUploadMB) || 20) * 1024 * 1024) {
      say(`El archivo supera el límite de ${Number(cfg.maxUploadMB) || 20} MB.`, true);
    }
  });

  form.addEventListener("submit", async event => {
    event.preventDefault();
    if (!client) {
      say("Para publicar a todos, primero configura Supabase siguiendo SETUP-SUPABASE.md.", true);
      return;
    }
    const file = fileInput.files?.[0];
    const maxBytes = (Number(cfg.maxUploadMB) || 20) * 1024 * 1024;
    const allowed = /\.(mp3|wav|ogg|m4a)$/i.test(file?.name || "");
    if (!file || !allowed) return say("Formato no válido. Usa MP3, WAV, OGG o M4A.", true);
    if (file.size > maxBytes) return say(`Archivo demasiado grande. Máximo ${Number(cfg.maxUploadMB) || 20} MB.`, true);

    const artist = document.getElementById("uploadArtist").value.trim();
    const title = document.getElementById("uploadTitle").value.trim();
    const genre = document.getElementById("uploadGenre").value;
    const description = document.getElementById("uploadDescription").value.trim();
    const submit = form.querySelector('button[type="submit"]');
    submit.disabled = true;
    say("SUBIENDO AUDIO // ESPERA...");
    try {
      // Demo community upload is anonymous and queued for moderation. RLS + bucket policies apply.
      const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const objectPath = `${crypto.randomUUID()}-${cleanName}`;
      const { error: uploadError } = await client.storage.from("community-audio")
        .upload(objectPath, file, { contentType: file.type || "application/octet-stream", upsert: false });
      if (uploadError) throw uploadError;

      const { data: publicData } = client.storage.from("community-audio").getPublicUrl(objectPath);
      const { error: insertError } = await client.from("tracks").insert({
        artist, title, genre, description,
        audio_path: objectPath,
        audio_url: publicData.publicUrl,
        status: "pending"
      });
      if (insertError) {
        await client.storage.from("community-audio").remove([objectPath]);
        throw insertError;
      }
      // Add the uploaded track to this visitor's playback queue immediately.
      // It remains private/pending in the public catalog until moderation approves it.
      if (window.addCommunityTrack) {
        window.addCommunityTrack({ id: objectPath, title, artist, genre, src: publicData.publicUrl }, { playNow: false });
      }
      form.reset();
      fileHint.textContent = "Tamaño máximo recomendado: 20 MB";
      say("AUDIO RECIBIDO // AÑADIDO A TU PLAYLIST. La publicación pública queda pendiente de revisión.");
      await loadTracks();
    } catch (err) {
      say(`ERROR DE PUBLICACIÓN: ${err.message || "revisa configuración y políticas de Supabase"}`, true);
    } finally {
      submit.disabled = false;
    }
  });

  async function loadTracks() {
    if (!client) return;
    try {
      const { data, error } = await client.from("tracks")
        .select("id,artist,title,genre,description,audio_url,created_at,likes_count")
        .eq("status", "published").order("created_at", { ascending: false }).limit(30);
      if (error) throw error;
      list.querySelectorAll(".remote-track").forEach(el => el.remove());
      if (empty) empty.hidden = data.length > 0;
      data.forEach(track => {
        const card = document.createElement("article");
        card.className = "community-track remote-track";
        card.innerHTML = `
          <div class="track-art">888</div>
          <div class="community-track-info">
            <b>${safe(track.title)}</b><span>${safe(track.artist)} · ${safe(formatDate(track.created_at))}</span>
            <small>${safe(track.genre)}${track.description ? " · " + safe(track.description) : ""}</small>
          </div>
          <audio controls preload="none" src="${safe(track.audio_url)}"></audio>
          <div class="community-actions"><button type="button" class="like-button" data-id="${safe(track.id)}">♡ ${Number(track.likes_count) || 0} ME GUSTA</button><span>PUBLICADO</span></div>`;
        list.appendChild(card);
        if (window.addCommunityTrack) {
          window.addCommunityTrack({ id: track.id, title: track.title, artist: track.artist, genre: track.genre, src: track.audio_url });
        }
      });
      list.querySelectorAll(".like-button").forEach(button => button.addEventListener("click", () => likeTrack(button.dataset.id, button)));
    } catch (err) {
      say(`No se pudo cargar la comunidad: ${err.message || "revisa tablas y políticas"}`, true);
    }
  }

  async function likeTrack(id, button) {
    if (!client) return;
    // Basic public counter RPC is intentionally not enabled by default; configure likes policy/RPC before launch.
    say("Para habilitar favoritos hay que crear la política/RPC de likes en Supabase.", true);
  }
  document.getElementById("refreshCommunity").addEventListener("click", loadTracks);
})();
