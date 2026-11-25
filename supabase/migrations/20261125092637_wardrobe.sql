-- Phase 4: digital wardrobe, combinations, calendar, wardrobe-images bucket

alter table public.ai_jobs
  drop constraint ai_jobs_job_type_check;

alter table public.ai_jobs
  add constraint ai_jobs_job_type_check
  check (
    job_type in (
      'outfit_analysis',
      'outfit_follow_up',
      'outfit_compare',
      'wardrobe_categorize',
      'wardrobe_generate_combinations'
    )
  );

create table public.wardrobe_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text,
  category text,
  color text,
  brand text,
  image_path text not null,
  status text not null default 'draft',
  consent_storage boolean not null default true,
  consent_ai_processing text not null default 'not_requested',
  categorize_job_id uuid references public.ai_jobs (id) on delete set null,
  bytes integer,
  mime_type text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint wardrobe_items_status_check
    check (status in ('draft', 'ready', 'archived')),
  constraint wardrobe_items_consent_storage_check
    check (consent_storage = true),
  constraint wardrobe_items_consent_ai_check
    check (
      consent_ai_processing in ('not_requested', 'granted', 'denied')
    ),
  constraint wardrobe_items_category_check
    check (
      category is null
      or category in (
        'tops',
        'shirts',
        't_shirts',
        'trousers',
        'jeans',
        'dresses',
        'jackets',
        'shoes',
        'accessories',
        'other'
      )
    )
);

create index wardrobe_items_user_id_created_at_idx
  on public.wardrobe_items (user_id, created_at desc);

create index wardrobe_items_user_id_status_idx
  on public.wardrobe_items (user_id, status);

create trigger wardrobe_items_set_updated_at
before update on public.wardrobe_items
for each row
execute function public.set_updated_at();

create table public.wardrobe_item_attributes (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.wardrobe_items (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  attribute_key text not null,
  attribute_value text not null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (item_id, attribute_key),
  constraint wardrobe_item_attributes_key_check
    check (char_length(trim(attribute_key)) between 1 and 64),
  constraint wardrobe_item_attributes_value_check
    check (char_length(trim(attribute_value)) between 1 and 240)
);

create index wardrobe_item_attributes_item_id_idx
  on public.wardrobe_item_attributes (item_id);

create table public.outfit_combinations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  occasion text,
  notes text,
  is_favorite boolean not null default false,
  source text not null default 'manual',
  job_id uuid references public.ai_jobs (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint outfit_combinations_source_check
    check (source in ('manual', 'ai')),
  constraint outfit_combinations_occasion_check
    check (
      occasion is null
      or occasion in (
        'casual',
        'smart_casual',
        'business',
        'formal',
        'date',
        'party',
        'athletic',
        'travel',
        'other'
      )
    )
);

create index outfit_combinations_user_id_created_at_idx
  on public.outfit_combinations (user_id, created_at desc);

create index outfit_combinations_user_id_favorite_idx
  on public.outfit_combinations (user_id, is_favorite);

create trigger outfit_combinations_set_updated_at
before update on public.outfit_combinations
for each row
execute function public.set_updated_at();

create table public.outfit_combination_items (
  id uuid primary key default gen_random_uuid(),
  combination_id uuid not null references public.outfit_combinations (id) on delete cascade,
  wardrobe_item_id uuid not null references public.wardrobe_items (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  unique (combination_id, wardrobe_item_id)
);

create index outfit_combination_items_combination_id_idx
  on public.outfit_combination_items (combination_id);

create index outfit_combination_items_wardrobe_item_id_idx
  on public.outfit_combination_items (wardrobe_item_id);

-- Same-owner: combination items must belong to the combination owner and item owner.
create or replace function public.enforce_outfit_combination_item_ownership()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  combo_owner uuid;
  item_owner uuid;
begin
  select user_id into combo_owner
  from public.outfit_combinations
  where id = new.combination_id;

  select user_id into item_owner
  from public.wardrobe_items
  where id = new.wardrobe_item_id;

  if combo_owner is null or item_owner is null then
    raise exception 'combination or wardrobe item not found';
  end if;

  if combo_owner <> item_owner or new.user_id <> combo_owner then
    raise exception 'outfit combination items must reference the same owner';
  end if;

  return new;
end;
$$;

create trigger outfit_combination_items_ownership
before insert or update on public.outfit_combination_items
for each row
execute function public.enforce_outfit_combination_item_ownership();

create table public.outfit_calendar (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  combination_id uuid not null references public.outfit_combinations (id) on delete cascade,
  scheduled_date date not null,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, scheduled_date, combination_id)
);

create index outfit_calendar_user_id_date_idx
  on public.outfit_calendar (user_id, scheduled_date);

create trigger outfit_calendar_set_updated_at
before update on public.outfit_calendar
for each row
execute function public.set_updated_at();

-- Row level security
alter table public.wardrobe_items enable row level security;
alter table public.wardrobe_item_attributes enable row level security;
alter table public.outfit_combinations enable row level security;
alter table public.outfit_combination_items enable row level security;
alter table public.outfit_calendar enable row level security;

create policy "wardrobe_items_select_own"
on public.wardrobe_items for select to authenticated
using (auth.uid() = user_id);

create policy "wardrobe_items_insert_own"
on public.wardrobe_items for insert to authenticated
with check (auth.uid() = user_id);

create policy "wardrobe_items_update_own"
on public.wardrobe_items for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "wardrobe_items_delete_own"
on public.wardrobe_items for delete to authenticated
using (auth.uid() = user_id);

create policy "wardrobe_item_attributes_select_own"
on public.wardrobe_item_attributes for select to authenticated
using (auth.uid() = user_id);

create policy "wardrobe_item_attributes_insert_own"
on public.wardrobe_item_attributes for insert to authenticated
with check (auth.uid() = user_id);

create policy "wardrobe_item_attributes_update_own"
on public.wardrobe_item_attributes for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "wardrobe_item_attributes_delete_own"
on public.wardrobe_item_attributes for delete to authenticated
using (auth.uid() = user_id);

create policy "outfit_combinations_select_own"
on public.outfit_combinations for select to authenticated
using (auth.uid() = user_id);

create policy "outfit_combinations_insert_own"
on public.outfit_combinations for insert to authenticated
with check (auth.uid() = user_id);

create policy "outfit_combinations_update_own"
on public.outfit_combinations for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "outfit_combinations_delete_own"
on public.outfit_combinations for delete to authenticated
using (auth.uid() = user_id);

create policy "outfit_combination_items_select_own"
on public.outfit_combination_items for select to authenticated
using (auth.uid() = user_id);

create policy "outfit_combination_items_insert_own"
on public.outfit_combination_items for insert to authenticated
with check (auth.uid() = user_id);

create policy "outfit_combination_items_update_own"
on public.outfit_combination_items for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "outfit_combination_items_delete_own"
on public.outfit_combination_items for delete to authenticated
using (auth.uid() = user_id);

create policy "outfit_calendar_select_own"
on public.outfit_calendar for select to authenticated
using (auth.uid() = user_id);

create policy "outfit_calendar_insert_own"
on public.outfit_calendar for insert to authenticated
with check (auth.uid() = user_id);

create policy "outfit_calendar_update_own"
on public.outfit_calendar for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "outfit_calendar_delete_own"
on public.outfit_calendar for delete to authenticated
using (auth.uid() = user_id);

-- Private wardrobe image storage
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'wardrobe-images',
  'wardrobe-images',
  false,
  52428800,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "wardrobe_images_storage_select_own"
on storage.objects for select to authenticated
using (
  bucket_id = 'wardrobe-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "wardrobe_images_storage_insert_own"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'wardrobe-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "wardrobe_images_storage_update_own"
on storage.objects for update to authenticated
using (
  bucket_id = 'wardrobe-images'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'wardrobe-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "wardrobe_images_storage_delete_own"
on storage.objects for delete to authenticated
using (
  bucket_id = 'wardrobe-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);
