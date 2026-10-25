-- Ejecutar en Supabase > SQL Editor. Es idempotente: puede ejecutarse más de una vez.
-- Buckets públicos para que las URL de audio y portadas se puedan reproducir/ver.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('community-audio', 'community-audio', true, 20971520,
        array['audio/mpeg','audio/wav','audio/x-wav','audio/ogg','audio/mp4','audio/aac','application/octet-stream'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('imagenes', 'imagenes', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Eliminar políticas anteriores con estos nombres para evitar error de duplicados.
drop policy if exists "community audio upload" on storage.objects;
drop policy if exists "community audio public read" on storage.objects;
drop policy if exists "community cover upload" on storage.objects;
drop policy if exists "community cover public read" on storage.objects;

create policy "community audio upload" on storage.objects
for insert to anon, authenticated with check (bucket_id = 'community-audio');
create policy "community audio public read" on storage.objects
for select to anon, authenticated using (bucket_id = 'community-audio');
create policy "community cover upload" on storage.objects
for insert to anon, authenticated with check (bucket_id = 'imagenes');
create policy "community cover public read" on storage.objects
for select to anon, authenticated using (bucket_id = 'imagenes');

-- Permitir enviar metadatos de tracks a moderación, sin permitir publicación anónima.
drop policy if exists "anyone can submit track metadata to moderation" on public.tracks;
create policy "anyone can submit track metadata to moderation" on public.tracks
for insert to anon, authenticated with check (status = 'pending');
