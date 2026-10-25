-- NEURAL AUDIO 2030: reparación del bucket de videos
-- Ejecutar en Supabase → SQL Editor → New query → Run.
-- El nombre debe ser EXACTAMENTE community-videos.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'community-videos',
  'community-videos',
  true,
  104857600,
  array['video/mp4', 'video/webm', 'video/quicktime']
)
on conflict (id) do update set
  name = excluded.name,
  public = true,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "community videos public read" on storage.objects;
create policy "community videos public read"
on storage.objects for select
using (bucket_id = 'community-videos');

drop policy if exists "community videos upload" on storage.objects;
create policy "community videos upload"
on storage.objects for insert to anon, authenticated
with check (bucket_id = 'community-videos');

drop policy if exists "community videos delete own upload" on storage.objects;
create policy "community videos delete own upload"
on storage.objects for delete to anon, authenticated
using (bucket_id = 'community-videos');

-- Verificación: esta consulta debe devolver una fila llamada community-videos.
select id, name, public, file_size_limit
from storage.buckets
where id = 'community-videos';
