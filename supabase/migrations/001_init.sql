-- ============================================================
-- 001_init.sql — Today Date PWA 초기 스키마
-- Supabase SQL Editor에서 전체를 실행하세요.
-- ============================================================

-- ──────────────────────────────────────────────
-- 확장
-- ──────────────────────────────────────────────
create extension if not exists "pgcrypto";

-- ──────────────────────────────────────────────
-- app_config (싱글-row 앱 설정)
-- ──────────────────────────────────────────────
create table if not exists app_config (
  id                 integer primary key default 1 check (id = 1),
  passcode_hash      text,
  recovery_email     text,
  email_verified     boolean not null default false,
  partner_a_name     text,
  partner_b_name     text,
  anniversary_date   date,
  failed_attempts    integer not null default 0,
  locked_until       timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- 단일 row 보장
insert into app_config (id) values (1) on conflict (id) do nothing;

-- ──────────────────────────────────────────────
-- email_tokens
-- ──────────────────────────────────────────────
create type email_token_purpose as enum (
  'verify_email',
  'reset_passcode',
  'change_email'
);

create table if not exists email_tokens (
  id          uuid primary key default gen_random_uuid(),
  token_hash  text not null unique,
  purpose     email_token_purpose not null,
  target_email text not null,
  expires_at  timestamptz not null,
  used_at     timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists email_tokens_hash_idx on email_tokens (token_hash);

-- ──────────────────────────────────────────────
-- activity_categories
-- ──────────────────────────────────────────────
create table if not exists activity_categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  icon        text,
  color       text,
  sort_order  integer not null default 0,
  is_default  boolean not null default false,
  is_hidden   boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ──────────────────────────────────────────────
-- place_categories
-- ──────────────────────────────────────────────
create table if not exists place_categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  icon        text,
  color       text,
  sort_order  integer not null default 0,
  is_default  boolean not null default false,
  is_hidden   boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ──────────────────────────────────────────────
-- activities (Track 1)
-- ──────────────────────────────────────────────
create type duration_bucket as enum ('half', 'full', 'overnight');
create type time_of_day      as enum ('day', 'night', 'any');
create type item_status      as enum ('wishlist', 'visited', 'archived');

create table if not exists activities (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  category_id     uuid references activity_categories (id) on delete set null,
  duration_bucket duration_bucket,
  time_of_day     time_of_day not null default 'any',
  memo            text,
  reference_url   text,
  image_urls      text[] not null default '{}',
  added_by        text,
  status          item_status not null default 'wishlist',
  visited_at      date,
  rating          smallint check (rating between 1 and 5),
  review_note     text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists activities_status_idx      on activities (status);
create index if not exists activities_category_idx    on activities (category_id);
create index if not exists activities_duration_idx    on activities (duration_bucket);
create index if not exists activities_time_of_day_idx on activities (time_of_day);

-- ──────────────────────────────────────────────
-- places (Track 2)
-- ──────────────────────────────────────────────
create type meal_time as enum ('lunch', 'dinner');

create table if not exists places (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  category_id     uuid references place_categories (id) on delete set null,
  location        text not null,
  meal_times      text[] not null default '{}',
  memo            text,
  reference_url   text,
  image_urls      text[] not null default '{}',
  added_by        text,
  status          item_status not null default 'wishlist',
  visited_at      date,
  rating          smallint check (rating between 1 and 5),
  review_note     text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists places_status_idx   on places (status);
create index if not exists places_category_idx on places (category_id);

-- ──────────────────────────────────────────────
-- recommendations_log
-- ──────────────────────────────────────────────
create type rec_track        as enum ('activity', 'place', 'combined');
create type rec_recommend_type as enum ('quick', 'detail', 'ai');

create table if not exists recommendations_log (
  id               uuid primary key default gen_random_uuid(),
  track            rec_track not null,
  recommend_type   rec_recommend_type not null,
  input_filters    jsonb,
  recommended_ids  uuid[] not null default '{}',
  selected_id      uuid,
  created_at       timestamptz not null default now()
);

-- ──────────────────────────────────────────────
-- updated_at 자동 갱신 트리거
-- ──────────────────────────────────────────────
create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger activities_updated_at
  before update on activities
  for each row execute function touch_updated_at();

create trigger places_updated_at
  before update on places
  for each row execute function touch_updated_at();

create trigger app_config_updated_at
  before update on app_config
  for each row execute function touch_updated_at();

-- ──────────────────────────────────────────────
-- 시드 데이터 — activity_categories (8종)
-- ──────────────────────────────────────────────
insert into activity_categories (name, icon, color, sort_order, is_default) values
  ('액티비티', '🏄',  '#FF6B6B', 1, true),
  ('자연',     '🌿',  '#4CAF50', 2, true),
  ('문화',     '🎭',  '#9C27B0', 3, true),
  ('축제',     '🎉',  '#FF9800', 4, true),
  ('실내',     '🏠',  '#2196F3', 5, true),
  ('계절',     '🍂',  '#795548', 6, true),
  ('여행',     '✈️',  '#00BCD4', 7, true),
  ('미분류',   '📌',  '#9E9E9E', 8, true)
on conflict do nothing;

-- ──────────────────────────────────────────────
-- 시드 데이터 — place_categories (8종)
-- ──────────────────────────────────────────────
insert into place_categories (name, icon, color, sort_order, is_default) values
  ('양식',     '🍝',  '#FF6B6B', 1, true),
  ('일식',     '🍣',  '#E91E63', 2, true),
  ('한식',     '🍲',  '#4CAF50', 3, true),
  ('중식',     '🥟',  '#FF9800', 4, true),
  ('카페',     '☕',  '#795548', 5, true),
  ('바',       '🍸',  '#3F51B5', 6, true),
  ('디저트',   '🍰',  '#F06292', 7, true),
  ('미분류',   '📌',  '#9E9E9E', 8, true)
on conflict do nothing;
