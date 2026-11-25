-- Phase 3: outfit analyzer, AI jobs/usage, private outfit-images bucket

create table public.ai_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  job_type text not null,
  status text not null default 'queued',
  input_reference jsonb not null default '{}'::jsonb,
  result_reference jsonb,
  error text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint ai_jobs_job_type_check
    check (job_type in ('outfit_analysis', 'outfit_follow_up', 'outfit_compare')),
  constraint ai_jobs_status_check
    check (status in ('queued', 'running', 'succeeded', 'failed'))
);

create index ai_jobs_user_id_created_at_idx
  on public.ai_jobs (user_id, created_at desc);

create trigger ai_jobs_set_updated_at
before update on public.ai_jobs
for each row
execute function public.set_updated_at();

create table public.ai_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  job_id uuid references public.ai_jobs (id) on delete set null,
  provider text not null,
  model text not null,
  operation text not null,
  prompt_tokens integer,
  output_tokens integer,
  cost_usd numeric(8, 4),
  usage_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index ai_usage_user_id_created_at_idx
  on public.ai_usage (user_id, created_at desc);

create index ai_usage_job_id_idx on public.ai_usage (job_id);

create table public.outfits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text,
  image_path text not null,
  occasion text,
  notes text,
  source text not null default 'upload',
  status text not null default 'draft',
  consent_storage boolean not null default true,
  consent_ai_processing text not null default 'not_requested',
  bytes integer,
  mime_type text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint outfits_source_check
    check (source in ('upload')),
  constraint outfits_status_check
    check (status in ('draft', 'analyzed', 'archived')),
  constraint outfits_consent_storage_check
    check (consent_storage = true),
  constraint outfits_consent_ai_check
    check (
      consent_ai_processing in ('not_requested', 'granted', 'denied')
    ),
  constraint outfits_occasion_check
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

create index outfits_user_id_created_at_idx
  on public.outfits (user_id, created_at desc);

create trigger outfits_set_updated_at
before update on public.outfits
for each row
execute function public.set_updated_at();

create table public.outfit_analyses (
  id uuid primary key default gen_random_uuid(),
  outfit_id uuid not null references public.outfits (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  job_id uuid references public.ai_jobs (id) on delete set null,
  feedback_depth text not null,
  overall_score numeric(3, 1) not null,
  category_scores jsonb not null,
  summary text not null,
  strengths text[] not null default '{}',
  improvements text[] not null default '{}',
  confidence text not null,
  model_provider text not null,
  model_name text not null,
  model_version text,
  created_at timestamptz not null default timezone('utc', now()),
  constraint outfit_analyses_feedback_depth_check
    check (feedback_depth in ('casual', 'detailed', 'improvement')),
  constraint outfit_analyses_overall_score_check
    check (overall_score >= 0 and overall_score <= 10),
  constraint outfit_analyses_confidence_check
    check (confidence in ('low', 'medium', 'high'))
);

create index outfit_analyses_user_id_created_at_idx
  on public.outfit_analyses (user_id, created_at desc);

create index outfit_analyses_outfit_id_idx
  on public.outfit_analyses (outfit_id);

create table public.outfit_recommendations (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid not null references public.outfit_analyses (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  recommendation_type text not null,
  content text not null,
  rank integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  constraint outfit_recommendations_type_check
    check (recommendation_type in ('alternative', 'accessory', 'swap'))
);

create index outfit_recommendations_analysis_id_idx
  on public.outfit_recommendations (analysis_id);

create table public.saved_looks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  outfit_id uuid not null references public.outfits (id) on delete cascade,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  unique (user_id, outfit_id)
);

create index saved_looks_user_id_created_at_idx
  on public.saved_looks (user_id, created_at desc);

create table public.outfit_follow_ups (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid not null references public.outfit_analyses (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  question text not null,
  answer text,
  job_id uuid references public.ai_jobs (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);

create index outfit_follow_ups_analysis_id_idx
  on public.outfit_follow_ups (analysis_id);

create index outfit_follow_ups_user_id_idx
  on public.outfit_follow_ups (user_id);

-- Row level security
alter table public.ai_jobs enable row level security;
alter table public.ai_usage enable row level security;
alter table public.outfits enable row level security;
alter table public.outfit_analyses enable row level security;
alter table public.outfit_recommendations enable row level security;
alter table public.saved_looks enable row level security;
alter table public.outfit_follow_ups enable row level security;

create policy "ai_jobs_select_own"
on public.ai_jobs for select to authenticated
using (auth.uid() = user_id);

create policy "ai_jobs_insert_own"
on public.ai_jobs for insert to authenticated
with check (auth.uid() = user_id);

create policy "ai_jobs_update_own"
on public.ai_jobs for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "ai_jobs_delete_own"
on public.ai_jobs for delete to authenticated
using (auth.uid() = user_id);

create policy "ai_usage_select_own"
on public.ai_usage for select to authenticated
using (auth.uid() = user_id);

create policy "ai_usage_insert_own"
on public.ai_usage for insert to authenticated
with check (auth.uid() = user_id);

create policy "outfits_select_own"
on public.outfits for select to authenticated
using (auth.uid() = user_id);

create policy "outfits_insert_own"
on public.outfits for insert to authenticated
with check (auth.uid() = user_id);

create policy "outfits_update_own"
on public.outfits for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "outfits_delete_own"
on public.outfits for delete to authenticated
using (auth.uid() = user_id);

create policy "outfit_analyses_select_own"
on public.outfit_analyses for select to authenticated
using (auth.uid() = user_id);

create policy "outfit_analyses_insert_own"
on public.outfit_analyses for insert to authenticated
with check (auth.uid() = user_id);

create policy "outfit_analyses_update_own"
on public.outfit_analyses for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "outfit_analyses_delete_own"
on public.outfit_analyses for delete to authenticated
using (auth.uid() = user_id);

create policy "outfit_recommendations_select_own"
on public.outfit_recommendations for select to authenticated
using (auth.uid() = user_id);

create policy "outfit_recommendations_insert_own"
on public.outfit_recommendations for insert to authenticated
with check (auth.uid() = user_id);

create policy "outfit_recommendations_delete_own"
on public.outfit_recommendations for delete to authenticated
using (auth.uid() = user_id);

create policy "saved_looks_select_own"
on public.saved_looks for select to authenticated
using (auth.uid() = user_id);

create policy "saved_looks_insert_own"
on public.saved_looks for insert to authenticated
with check (auth.uid() = user_id);

create policy "saved_looks_update_own"
on public.saved_looks for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "saved_looks_delete_own"
on public.saved_looks for delete to authenticated
using (auth.uid() = user_id);

create policy "outfit_follow_ups_select_own"
on public.outfit_follow_ups for select to authenticated
using (auth.uid() = user_id);

create policy "outfit_follow_ups_insert_own"
on public.outfit_follow_ups for insert to authenticated
with check (auth.uid() = user_id);

create policy "outfit_follow_ups_update_own"
on public.outfit_follow_ups for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "outfit_follow_ups_delete_own"
on public.outfit_follow_ups for delete to authenticated
using (auth.uid() = user_id);

-- Private outfit image storage
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'outfit-images',
  'outfit-images',
  false,
  52428800,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "outfit_images_storage_select_own"
on storage.objects for select to authenticated
using (
  bucket_id = 'outfit-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "outfit_images_storage_insert_own"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'outfit-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "outfit_images_storage_update_own"
on storage.objects for update to authenticated
using (
  bucket_id = 'outfit-images'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'outfit-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "outfit_images_storage_delete_own"
on storage.objects for delete to authenticated
using (
  bucket_id = 'outfit-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);
