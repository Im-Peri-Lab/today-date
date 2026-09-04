-- ============================================================
-- 012_couples_users_schema.sql
-- 커플 앱 전환을 위한 스키마 추가 — 순수 additive(추가 전용).
--
-- 이 마이그레이션은 기존 app_config 테이블과 그 컬럼/트리거/RLS를 일절
-- 수정·삭제하지 않는다. app_config 기반 인증 로직(middleware.ts, /api/auth/*)은
-- 그대로 동작하며, 아래 신규 테이블·컬럼은 아직 어떤 앱 코드도 참조하지 않는다.
-- (데이터 이관은 013_couples_backfill.sql 에서 별도로 수행한다.)
--
-- Supabase SQL Editor에서 전체를 실행하세요.
-- ============================================================

-- ──────────────────────────────────────────────
-- 1. couples — 커플(=워크스페이스) 단위 인증/잠금 상태
--    app_config 의 인증 관련 컬럼과 1:1 대응하는 다중-row 버전이다.
--    app_config 는 그대로 남아 현행 로직의 단일 출처로 계속 쓰인다.
-- ──────────────────────────────────────────────
create table if not exists couples (
  id               uuid primary key default gen_random_uuid(),
  passcode_hash    text,
  failed_attempts  integer not null default 0,
  locked_until     timestamptz,
  session_version  integer not null default 1,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

comment on table couples is
  '커플(워크스페이스) 단위 인증 상태. app_config 의 다중-row 대체 예정 테이블 — 012 시점에는 앱 코드가 참조하지 않는다.';
comment on column couples.passcode_hash is
  '6자리 패스코드의 bcrypt 해시. 미설정 커플은 NULL (app_config.passcode_hash 와 동일 의미).';
comment on column couples.session_version is
  '패스코드 리셋 시 +1 하여 기존 기기 세션을 일괄 무효화하는 데 사용 (app_config.session_version 과 동일 의미).';

-- app_config 와 동일하게 updated_at 자동 갱신.
-- touch_updated_at() 은 001 에서 이미 정의되어 있고 008 에서 search_path 가 고정되어 있다.
drop trigger if exists couples_updated_at on couples;
create trigger couples_updated_at
  before update on couples
  for each row execute function touch_updated_at();

-- ──────────────────────────────────────────────
-- 2. users — 커플에 속한 개별 사용자(파트너)
--    email 은 전역 unique — 한 이메일이 두 커플에 동시에 속할 수 없다.
--    couple_id 는 NOT NULL: 커플 없는 사용자는 이 모델에 존재하지 않는다.
--    on delete cascade — 커플이 사라지면 그 커플의 사용자 행도 의미가 없다.
-- ──────────────────────────────────────────────
create table if not exists users (
  id              uuid primary key default gen_random_uuid(),
  couple_id       uuid not null references couples (id) on delete cascade,
  email           text not null unique,
  email_verified  boolean not null default false,
  created_at      timestamptz not null default now()
);

create index if not exists users_couple_idx on users (couple_id);

comment on table users is
  '커플에 속한 개별 사용자(파트너). 012 시점에는 앱 코드가 참조하지 않는다.';
comment on column users.email is
  '로그인/초대 식별자. 전역 unique — 한 이메일은 한 커플에만 속한다.';

-- ──────────────────────────────────────────────
-- 3. email_token_purpose enum 에 invite_partner 추가
--    기존 값(verify_email / reset_passcode / change_email)은 건드리지 않는다.
--    ADD VALUE 는 PG12+ 에서 트랜잭션 내 실행이 허용되며, 새 값을 같은
--    트랜잭션에서 "사용"하지만 않으면 된다 — 이 파일은 사용하지 않는다.
--    (만약 SQL Editor 가 이 문장에서 오류를 내면 이 한 줄만 따로 실행하면 된다.)
-- ──────────────────────────────────────────────
alter type email_token_purpose add value if not exists 'invite_partner';

-- ──────────────────────────────────────────────
-- 4. domain 테이블에 couple_id 소유권 컬럼 추가 (nullable)
--
--    대상: activities / places / recommendations_log
--      → 사용자가 실제로 생성하는 행을 담는 테이블. 커플별로 분리되어야 한다.
--
--    제외: activity_categories / place_categories
--      → 현재 마이그레이션 시드로만 채워지는 전역 참조 데이터이며 API 는 GET 전용
--        (src/app/api/activity-categories/route.ts, place-categories/route.ts).
--        지금 couple_id 를 붙여 백필하면 기존 카테고리 16종이 1번 커플 소유가 되어
--        두 번째 커플이 카테고리 0개로 시작한다. 커플별 커스텀 카테고리 기능이
--        실제로 도입되는 시점에 "전역 기본(couple_id NULL) + 커플 커스텀" 구조로
--        별도 마이그레이션에서 다루는 것이 맞다.
--
--    제외: email_tokens
--      → 이메일 주소로만 대상을 식별하는 인증 보조 테이블이지 소유권 대상이 아니다.
--
--    on delete restrict — 커플 행 삭제가 실데이터 대량 삭제로 번지는 것을 막는다.
--    (커플 삭제 기능을 만들 때 명시적으로 데이터를 먼저 처리하도록 강제)
--    ADD COLUMN 은 IF NOT EXISTS 를 네이티브 지원하므로 do $$ 없이 멱등하다.
-- ──────────────────────────────────────────────
alter table activities
  add column if not exists couple_id uuid references couples (id) on delete restrict;
alter table places
  add column if not exists couple_id uuid references couples (id) on delete restrict;
alter table recommendations_log
  add column if not exists couple_id uuid references couples (id) on delete restrict;

create index if not exists activities_couple_idx          on activities (couple_id);
create index if not exists places_couple_idx              on places (couple_id);
create index if not exists recommendations_log_couple_idx on recommendations_log (couple_id);

comment on column activities.couple_id is
  '소유 커플. 013 백필 이후 전 행이 채워지지만, 앱 코드가 쓰기 경로에서 채우기 시작할 때까지 NOT NULL 승격은 보류한다.';
comment on column places.couple_id is
  '소유 커플. 013 백필 이후 전 행이 채워지지만, 앱 코드가 쓰기 경로에서 채우기 시작할 때까지 NOT NULL 승격은 보류한다.';
comment on column recommendations_log.couple_id is
  '추천 로그를 발생시킨 커플. 013 백필 이후 전 행이 채워진다.';

-- ──────────────────────────────────────────────
-- 5. 신규 public 테이블 RLS 활성화 (정책 없음)
--    007 과 동일한 Service-Role-only 아키텍처를 유지한다 —
--    anon/authenticated 는 전 행 접근 거부, service_role 은 RLS 우회.
-- ──────────────────────────────────────────────
alter table public.couples enable row level security;
alter table public.users   enable row level security;

-- ──────────────────────────────────────────────
-- 6. 스키마 적용 검증 — 하나라도 어긋나면 중단(롤백)한다.
--
--    검사는 전부 변수 없는 `if not exists (...) then raise exception` 형태로만
--    작성한다. 초기 버전은 `select string_agg(t, ', ') into missing
--    from (values (...)) as v(t) where not exists (...)` 로 누락 목록을 모아
--    한 번에 보고했는데, Supabase SQL Editor 에서 이 구문이
--    `ERROR: 42P01: relation "missing" does not exist` 로 실패했다.
--    (009~011 이 쓰는 `select count(*) into cnt from <테이블>` 패턴은 이 DB 에서
--     이미 정상 적용된 이력이 있으므로 INTO 자체가 아니라 VALUES 리스트 조합이 원인)
--    개별 검사는 어떤 객체가 빠졌는지도 더 정확히 알려준다.
-- ──────────────────────────────────────────────
do $$
begin
  -- 신규 테이블 2종
  if not exists (select 1 from information_schema.tables
                 where table_schema = 'public' and table_name = 'couples') then
    raise exception 'couples 테이블이 생성되지 않았습니다.';
  end if;
  if not exists (select 1 from information_schema.tables
                 where table_schema = 'public' and table_name = 'users') then
    raise exception 'users 테이블이 생성되지 않았습니다.';
  end if;

  -- enum 신규 값
  if not exists (
    select 1 from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    where t.typname = 'email_token_purpose' and e.enumlabel = 'invite_partner'
  ) then
    raise exception 'email_token_purpose enum 에 invite_partner 가 추가되지 않았습니다.';
  end if;

  -- domain couple_id 컬럼 3종
  if not exists (select 1 from information_schema.columns
                 where table_schema = 'public' and table_name = 'activities'
                   and column_name = 'couple_id') then
    raise exception 'activities.couple_id 컬럼이 생성되지 않았습니다.';
  end if;
  if not exists (select 1 from information_schema.columns
                 where table_schema = 'public' and table_name = 'places'
                   and column_name = 'couple_id') then
    raise exception 'places.couple_id 컬럼이 생성되지 않았습니다.';
  end if;
  if not exists (select 1 from information_schema.columns
                 where table_schema = 'public' and table_name = 'recommendations_log'
                   and column_name = 'couple_id') then
    raise exception 'recommendations_log.couple_id 컬럼이 생성되지 않았습니다.';
  end if;

  -- app_config 무손상 확인 — 이번 작업은 순수 additive 여야 한다.
  if not exists (select 1 from app_config where id = 1) then
    raise exception 'app_config 단일 row 가 사라졌습니다. 이 마이그레이션은 app_config 를 건드리지 않아야 합니다.';
  end if;

  if not exists (select 1 from information_schema.columns
                 where table_schema = 'public' and table_name = 'app_config'
                   and column_name = 'passcode_hash') then
    raise exception 'app_config.passcode_hash 컬럼이 사라졌습니다.';
  end if;
  if not exists (select 1 from information_schema.columns
                 where table_schema = 'public' and table_name = 'app_config'
                   and column_name = 'recovery_email') then
    raise exception 'app_config.recovery_email 컬럼이 사라졌습니다.';
  end if;
  if not exists (select 1 from information_schema.columns
                 where table_schema = 'public' and table_name = 'app_config'
                   and column_name = 'session_version') then
    raise exception 'app_config.session_version 컬럼이 사라졌습니다.';
  end if;

  raise notice '012 스키마 검증 통과: couples/users 생성, invite_partner 추가, couple_id 3개 테이블, app_config 무손상.';
end $$;
