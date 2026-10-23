/*
 * CONFIGURACIÓN DE NEURAL COMMUNITY
 * 1) Crea un proyecto en Supabase.
 * 2) Copia Project URL y la publishable/anon key desde Project Settings > API.
 * 3) Pega los valores aquí. La clave pública (anon/publishable) puede estar en el frontend
 *    SOLO si las políticas RLS están activadas. Nunca pongas una service_role key aquí.
 */
window.NEURAL_COMMUNITY_CONFIG = {
  supabaseUrl: "PEGA_AQUI_TU_SUPABASE_PROJECT_URL",
  supabaseAnonKey: "PEGA_AQUI_TU_SUPABASE_PUBLISHABLE_O_ANON_KEY",
  maxUploadMB: 20
};
