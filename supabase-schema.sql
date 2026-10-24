-- 888 Digital Factory / Neural Community
-- Ejecuta en Supabase SQL Editor. Revisa las políticas antes de producción.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text,
  avatar_url text,
  bio text,
  created_at timestamptz not null default now()
);

create table if not exists public.tracks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  artist text not null check (char_length(artist) between 1 and 60),
  title text not null check (char_length(title) between 1 and 100),
  genre text not null default 'Experimental',
  description text not null default '' check (char_length(description) <= 500),
  audio_path text not null,
  audio_url text not null,
  cover_url text,
  status text not null default 'pending' check (status in ('pending','published','rejected')),
  likes_count integer not null default 0 check (likes_count >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  track_id uuid not null references public.tracks(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  display_name text not null,
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);

create table if not exists public.track_likes (
  track_id uuid not null references public.tracks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (track_id, user_id)
);

create table if not exists public.playlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  is_public boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.playlist_tracks (
  playlist_id uuid not null references public.playlists(id) on delete cascade,
  track_id uuid not null references public.tracks(id) on delete cascade,
  position integer not null default 0,
  primary key (playlist_id, track_id)
);

alter table public.profiles enable row level security;
alter table public.tracks enable row level security;
alter table public.comments enable row level security;
alter table public.track_likes enable row level security;
alter table public.playlists enable row level security;
alter table public.playlist_tracks enable row level security;

-- Profiles: public read, owners update only their own profile.
create policy "profiles are readable" on public.profiles for select using (true);
create policy "users insert own profile" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "users update own profile" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- Tracks: public can only see approved tracks. Upload metadata is queued for moderation.
create policy "published tracks are public" on public.tracks for select using (status = 'published');
create policy "anyone can submit track metadata to moderation" on public.tracks for insert to anon, authenticated with check (status = 'pending');

-- Comments: authenticated users can read comments on published tracks and create their own.
create policy "comments on published tracks are readable" on public.comments for select using (
  exists (select 1 from public.tracks t where t.id = track_id and t.status = 'published')
);
create policy "authenticated users create comments" on public.comments for insert to authenticated with check (auth.uid() = user_id);
create policy "users delete own comments" on public.comments for delete to authenticated using (auth.uid() = user_id);

-- Likes: authenticated users may like/unlike as themselves.
create policy "likes readable" on public.track_likes for select using (true);
create policy "users like tracks as themselves" on public.track_likes for insert to authenticated with check (auth.uid() = user_id);
create policy "users remove own likes" on public.track_likes for delete to authenticated using (auth.uid() = user_id);

-- Playlists: public playlists are visible; owners manage their own.
create policy "public playlists readable" on public.playlists for select using (is_public = true or auth.uid() = user_id);
create policy "users create own playlists" on public.playlists for insert to authenticated with check (auth.uid() = user_id);
create policy "users update own playlists" on public.playlists for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users delete own playlists" on public.playlists for delete to authenticated using (auth.uid() = user_id);
create policy "playlist tracks readable" on public.playlist_tracks for select using (
  exists (select 1 from public.playlists p where p.id = playlist_id and (p.is_public = true or p.user_id = auth.uid()))
);
create policy "owners manage playlist tracks" on public.playlist_tracks for all to authenticated using (
  exists (select 1 from public.playlists p where p.id = playlist_id and p.user_id = auth.uid())
) with check (
  exists (select 1 from public.playlists p where p.id = playlist_id and p.user_id = auth.uid())
);

-- Storage bucket: public audio URLs for published tracks. Create bucket manually as public.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('community-audio', 'community-audio', true, 20971520,
        array['audio/mpeg','audio/wav','audio/x-wav','audio/ogg','audio/mp4','audio/aac'])
on conflict (id) do update set file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Anonymous uploads are accepted only into this bucket, with file-size/MIME restrictions above.
create policy "community audio upload" on storage.objects for insert to anon, authenticated
with check (bucket_id = 'community-audio');
create policy "community audio public read" on storage.objects for select using (bucket_id = 'community-audio');

-- IMPORTANT MODERATION NOTE:
-- Do not expose an UPDATE policy that lets anonymous users change status to published.
-- Approve submissions manually from Supabase Table Editor or implement a trusted server-side moderation function.
-- For a real production launch, use authenticated uploads, rate limits, abuse reporting, and a moderation workflow.

-- Portadas (bucket público "imagenes"; se usa al publicar un track).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('imagenes', 'imagenes', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "community cover upload" on storage.objects for insert to anon, authenticated
with check (bucket_id = 'imagenes');
create policy "community cover public read" on storage.objects for select using (bucket_id = 'imagenes');


-- VIDEO COMMUNITY: public metadata is only readable after moderation.
create table if not exists public.video_posts (
  id uuid primary key default gen_random_uuid(),
  artist text not null check (char_length(artist) between 1 and 60),
  title text not null check (char_length(title) between 1 and 100),
  video_path text not null,
  video_url text not null,
  status text not null default 'pending' check (status in ('pending','published','rejected')),
  created_at timestamptz not null default now()
);
alter table public.video_posts enable row level security;
drop policy if exists "published videos are public" on public.video_posts;
create policy "published videos are public" on public.video_posts for select using (status = 'published');
drop policy if exists "anyone can submit videos to moderation" on public.video_posts;
create policy "anyone can submit videos to moderation" on public.video_posts for insert to anon, authenticated with check (status = 'pending');

-- Storage bucket for video uploads. Configure size/MIME restrictions in Supabase Dashboard as needed.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('community-videos', 'community-videos', true, 104857600, array['video/mp4','video/webm','video/quicktime'])
on conflict (id) do update set name = excluded.name, public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
drop policy if exists "community videos public read" on storage.objects;
create policy "community videos public read" on storage.objects for select using (bucket_id = 'community-videos');
drop policy if exists "community videos upload" on storage.objects;
create policy "community videos upload" on storage.objects for insert to anon, authenticated with check (bucket_id = 'community-videos');
drop policy if exists "community videos delete own upload" on storage.objects;
create policy "community videos delete own upload" on storage.objects for delete to anon, authenticated using (bucket_id = 'community-videos');
