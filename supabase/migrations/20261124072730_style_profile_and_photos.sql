-- Phase 2: style profiles, appearance, preferences, photos, private storage

create table public.style_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  fashion_categories text[] not null default '{}',
  preferred_styles text[] not null default '{}',
  budget_band text,
  climate text,
  lifestyle text,
  favorite_colors text[] not null default '{}',
  disliked_colors text[] not null default '{}',
  fit_preferences text[] not null default '{}',
  goals text,
  palette_notes text,
  fit_notes text,
  grooming_notes text,
  shopping_notes text,
  summary text,
  onboarding_completed_at timestamptz,
  onboarding_skipped_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint style_profiles_budget_band_check
    check (
      budget_band is null
      or budget_band in ('value', 'mid', 'premium', 'luxury', 'flexible')
    )
);

create index style_profiles_user_id_idx on public.style_profiles (user_id);

create trigger style_profiles_set_updated_at
before update on public.style_profiles
for each row
execute function public.set_updated_at();

create table public.appearance_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  age_range text,
  gender_presentation text,
  height_cm integer,
  proportion_notes text,
  hair_type text,
  preferred_hairstyles text[] not null default '{}',
  grooming_preferences text[] not null default '{}',
  skin_undertone_preference text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint appearance_profiles_height_cm_check
    check (height_cm is null or (height_cm >= 100 and height_cm <= 250)),
  constraint appearance_profiles_undertone_check
    check (
      skin_undertone_preference is null
      or skin_undertone_preference in ('cool', 'warm', 'neutral', 'unsure')
    )
);

create index appearance_profiles_user_id_idx on public.appearance_profiles (user_id);

create trigger appearance_profiles_set_updated_at
before update on public.appearance_profiles
for each row
execute function public.set_updated_at();

create table public.user_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  preference_key text not null,
  preference_value jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, preference_key)
);

create index user_preferences_user_id_idx on public.user_preferences (user_id);

create trigger user_preferences_set_updated_at
before update on public.user_preferences
for each row
execute function public.set_updated_at();

create table public.user_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  storage_path text not null,
  photo_type text not null,
  consent_storage boolean not null,
  consent_ai_processing text not null default 'not_requested',
  consent_recorded_at timestamptz not null default timezone('utc', now()),
  bytes integer,
  mime_type text,
  width integer,
  height integer,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint user_photos_photo_type_check
    check (photo_type in ('face', 'full_body', 'other')),
  constraint user_photos_consent_storage_check
    check (consent_storage = true),
  constraint user_photos_consent_ai_check
    check (
      consent_ai_processing in ('not_requested', 'granted', 'denied')
    )
);

create index user_photos_user_id_idx on public.user_photos (user_id);

create trigger user_photos_set_updated_at
before update on public.user_photos
for each row
execute function public.set_updated_at();

-- Seed style + appearance rows for every new auth user (and backfill existing)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id);
  insert into public.style_profiles (user_id) values (new.id);
  insert into public.appearance_profiles (user_id) values (new.id);
  return new;
end;
$$;

insert into public.style_profiles (user_id)
select p.id
from public.profiles p
where not exists (
  select 1 from public.style_profiles s where s.user_id = p.id
);

insert into public.appearance_profiles (user_id)
select p.id
from public.profiles p
where not exists (
  select 1 from public.appearance_profiles a where a.user_id = p.id
);

alter table public.style_profiles enable row level security;
alter table public.appearance_profiles enable row level security;
alter table public.user_preferences enable row level security;
alter table public.user_photos enable row level security;

create policy "style_profiles_select_own"
on public.style_profiles for select to authenticated
using (auth.uid() = user_id);

create policy "style_profiles_insert_own"
on public.style_profiles for insert to authenticated
with check (auth.uid() = user_id);

create policy "style_profiles_update_own"
on public.style_profiles for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "style_profiles_delete_own"
on public.style_profiles for delete to authenticated
using (auth.uid() = user_id);

create policy "appearance_profiles_select_own"
on public.appearance_profiles for select to authenticated
using (auth.uid() = user_id);

create policy "appearance_profiles_insert_own"
on public.appearance_profiles for insert to authenticated
with check (auth.uid() = user_id);

create policy "appearance_profiles_update_own"
on public.appearance_profiles for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "appearance_profiles_delete_own"
on public.appearance_profiles for delete to authenticated
using (auth.uid() = user_id);

create policy "user_preferences_select_own"
on public.user_preferences for select to authenticated
using (auth.uid() = user_id);

create policy "user_preferences_insert_own"
on public.user_preferences for insert to authenticated
with check (auth.uid() = user_id);

create policy "user_preferences_update_own"
on public.user_preferences for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "user_preferences_delete_own"
on public.user_preferences for delete to authenticated
using (auth.uid() = user_id);

create policy "user_photos_select_own"
on public.user_photos for select to authenticated
using (auth.uid() = user_id);

create policy "user_photos_insert_own"
on public.user_photos for insert to authenticated
with check (auth.uid() = user_id);

create policy "user_photos_update_own"
on public.user_photos for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "user_photos_delete_own"
on public.user_photos for delete to authenticated
using (auth.uid() = user_id);

-- Private photo storage
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'user-photos',
  'user-photos',
  false,
  52428800,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "user_photos_storage_select_own"
on storage.objects for select to authenticated
using (
  bucket_id = 'user-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "user_photos_storage_insert_own"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'user-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "user_photos_storage_update_own"
on storage.objects for update to authenticated
using (
  bucket_id = 'user-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'user-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "user_photos_storage_delete_own"
on storage.objects for delete to authenticated
using (
  bucket_id = 'user-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);
