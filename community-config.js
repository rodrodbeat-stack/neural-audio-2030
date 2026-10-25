/*
 * CONFIGURACIÓN DE NEURAL COMMUNITY
 * 1) Crea un proyecto en Supabase.
 * 2) Copia Project URL y la publishable/anon key desde Project Settings > API.
 * 3) Pega los valores aquí. La clave pública (anon/publishable) puede estar en el frontend
 *    SOLO si las políticas RLS están activadas. Nunca pongas una service_role key 
 * NEURAL AUDIO 2050 — SUPABASE CONFIG
 */

window.NEURAL_COMMUNITY_CONFIG = {
  supabaseUrl: "https://sxykgsebgqlhhcxhpmsi.supabase.co",
  supabaseAnonKey: "sb_publishable_g7x4nZh9U9iKyB7JL1Uo0g_Q9seB5jP",
  maxUploadMB: 20,
  maxVideoUploadMB: 100
};
