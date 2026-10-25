-- 888DIGITALFACTORY / Neural Audio 2030
-- Reparar tabla video_posts existente sin borrar publicaciones ni archivos.
-- Ejecutar en Supabase > SQL Editor > Run.

create table if not exists public.video_posts (
  id uuid primary key default gen_random_uuid(),
  artist text,
  title text,
  video_path text,
  video_url text,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

-- Añade las columnas que falten en tablas creadas con un esquema anterior.
alter table public.video_posts add column if not exists artist text;
alter table public.video_posts add column if not exists title text;
alter table public.video_posts add column if not exists video_path text;
alter table public.video_posts add column if not exists video_url text;
alter table public.video_posts add column if not exists status text default 'pending';
alter table public.video_posts add column if not exists created_at timestamptz default now();

-- Valores por defecto para registros antiguos; no se eliminan filas.
update public.video_posts set status = 'pending' where status is null;
update public.video_posts set created_at = now() where created_at is null;
alter table public.video_posts alter column status set default 'pending';
alter table public.video_posts alter column created_at set default now();

alter table public.video_posts enable row level security;
drop policy if exists "published videos are public" on public.video_posts;
create policy "published videos are public"
  on public.video_posts for select
  using (status = 'published');
drop policy if exists "anyone can submit videos to moderation" on public.video_posts;
create policy "anyone can submit videos to moderation"
  on public.video_posts for insert to anon, authenticated
  with check (status = 'pending');

-- Recarga la caché del esquema usada por la API REST.
notify pgrst, 'reload schema';

-- Verificación: deben aparecer artist, title, video_path, video_url, status y created_at.
select column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name = 'video_posts'
order by ordinal_position;
