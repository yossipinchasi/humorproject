-- CapCity: AI-captioned photos that logged-in users can vote on.
-- Run this once in the Supabase SQL editor (or with `supabase db push`).
--
-- Security model ("strictest RLS that doesn't break the app"):
--   * images / captions are written only by the Next.js server using the secret
--     key (after it checks the user's session and calls Gemini), so clients get
--     read-only access and no write policies at all. That way nobody can insert
--     a fake "AI" caption or someone else's photo by calling the API directly.
--   * caption_votes are written by the logged-in user's own session, and every
--     policy is scoped to user_id = auth.uid(). Users can only see their own votes;
--     public totals live on captions and are kept in sync by a trigger.
--   * The storage bucket is public-read (so images render and can be shared) with
--     no client write policies; uploads also go through the server.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.images (
    id           uuid primary key default gen_random_uuid(),
    user_id      uuid not null references auth.users (id) on delete cascade,
    author_name  text,
    context      text check (char_length(context) <= 200),
    storage_path text not null unique,
    created_at   timestamptz not null default now()
);

create index images_created_at_idx on public.images (created_at desc);
create index images_user_id_created_at_idx on public.images (user_id, created_at desc);

create table public.captions (
    id         uuid primary key default gen_random_uuid(),
    image_id   uuid not null references public.images (id) on delete cascade,
    content    text not null check (char_length(content) between 1 and 300),
    style      text,
    -- The exact prompt and model that produced this caption.
    prompt     text not null,
    model      text not null,
    upvotes    integer not null default 0,
    downvotes  integer not null default 0,
    score      integer generated always as (upvotes - downvotes) stored,
    created_at timestamptz not null default now()
);

create index captions_image_id_idx on public.captions (image_id);
create index captions_created_at_score_idx on public.captions (created_at desc, score desc);

create table public.caption_votes (
    caption_id uuid not null references public.captions (id) on delete cascade,
    user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
    vote       smallint not null check (vote in (-1, 1)),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    primary key (caption_id, user_id)
);

create index caption_votes_user_id_idx on public.caption_votes (user_id);

-- ---------------------------------------------------------------------------
-- Keep captions.upvotes / downvotes in sync with caption_votes.
-- SECURITY DEFINER so it can update captions, which voters cannot write to.
-- ---------------------------------------------------------------------------

create function public.apply_caption_vote()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    if tg_op in ('UPDATE', 'DELETE') then
        update public.captions
        set upvotes   = upvotes   - (old.vote = 1)::int,
            downvotes = downvotes - (old.vote = -1)::int
        where id = old.caption_id;
    end if;

    if tg_op in ('INSERT', 'UPDATE') then
        update public.captions
        set upvotes   = upvotes   + (new.vote = 1)::int,
            downvotes = downvotes + (new.vote = -1)::int
        where id = new.caption_id;
    end if;

    return null;
end;
$$;

revoke all on function public.apply_caption_vote() from public, anon, authenticated;

create trigger caption_votes_apply
after insert or update or delete on public.caption_votes
for each row execute function public.apply_caption_vote();

create function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

create trigger caption_votes_touch
before update on public.caption_votes
for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.images enable row level security;
alter table public.captions enable row level security;
alter table public.caption_votes enable row level security;

-- Anyone can browse the feed; only the server (secret key, bypasses RLS) writes.
create policy "Images are viewable by everyone"
    on public.images for select
    to anon, authenticated
    using (true);

create policy "Captions are viewable by everyone"
    on public.captions for select
    to anon, authenticated
    using (true);

revoke insert, update, delete, truncate on public.images from anon, authenticated;
revoke insert, update, delete, truncate on public.captions from anon, authenticated;

-- Votes: logged-in users manage only their own rows. Logged-out users get nothing.
create policy "Users can see their own votes"
    on public.caption_votes for select
    to authenticated
    using ((select auth.uid()) = user_id);

create policy "Users can cast their own votes"
    on public.caption_votes for insert
    to authenticated
    with check ((select auth.uid()) = user_id);

create policy "Users can change their own votes"
    on public.caption_votes for update
    to authenticated
    using ((select auth.uid()) = user_id)
    with check ((select auth.uid()) = user_id);

create policy "Users can remove their own votes"
    on public.caption_votes for delete
    to authenticated
    using ((select auth.uid()) = user_id);

revoke all on public.caption_votes from anon;
revoke truncate on public.caption_votes from authenticated;

-- Turn RLS on for every other table in the public schema too (e.g. week2_items
-- from Assignment 2). With no policies, those tables are unreadable through the
-- API, which is the strictest setting; the app no longer reads them.
do $$
declare
    t record;
begin
    for t in select tablename from pg_tables where schemaname = 'public' loop
        execute format('alter table public.%I enable row level security', t.tablename);
    end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Storage: public-read bucket, server-only writes (no storage.objects policies).
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('images', 'images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
    set public = excluded.public,
        file_size_limit = excluded.file_size_limit,
        allowed_mime_types = excluded.allowed_mime_types;
