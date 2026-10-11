-- ============================================================
-- 016_users_nickname.sql
-- users 에 표시용 닉네임을 추가한다 — 화면에서 이메일 대신(또는 함께) 보여줄 이름.
--
-- 이메일은 계속 전역 unique 인증 식별자로 남는다(로그인/초대/세션 모두 email·user_id
-- 기준, 이 마이그레이션은 그 경로를 전혀 건드리지 않는다). nickname 은 순수 표시용
-- 부가 속성이라 nullable 로 둔다 — 설정하지 않은 사용자도 정상 상태다(미설정 시
-- 화면은 이메일로 폴백한다, § app 코드).
--
-- 길이 제한(20자 내외)은 API 레이어(zod)에서만 강제한다 — title/memo 등 기존 텍스트
-- 필드도 DB 에 길이 CHECK 를 두지 않고 app 레이어에서만 검증하는 이 저장소의 기존
-- 관례(§ activities.title)를 그대로 따른다.
--
-- 멱등하다: ADD COLUMN IF NOT EXISTS. RLS 는 012 에서 이미 users 에 활성화되어 있고
-- 이 마이그레이션은 정책을 추가하지 않는다(007/012 와 동일한 service-role-only 구조 유지).
-- Supabase SQL Editor에서 전체를 실행하세요.
-- ============================================================

-- ──────────────────────────────────────────────
-- 1. 선행 조건 확인 — 012 의 users 테이블이 있어야 한다.
-- ──────────────────────────────────────────────
do $$
begin
  if not exists (select 1 from information_schema.tables
                 where table_schema = 'public' and table_name = 'users') then
    raise exception '012 미적용: users 테이블이 없습니다.';
  end if;

  raise notice '선행 조건 확인 통과: users 테이블 존재.';
end $$;

-- ──────────────────────────────────────────────
-- 2. 컬럼 추가
-- ──────────────────────────────────────────────
alter table users
  add column if not exists nickname text;

comment on column users.nickname is
  '화면 표시용 닉네임. nullable — 미설정이면 화면이 email 로 폴백한다(016). 인증 식별자가 아니다(email 이 그 역할을 계속 한다).';

-- ──────────────────────────────────────────────
-- 3. 결과 검증 — 어긋나면 전체 롤백.
--    개별 검사를 `if not exists (...) then raise exception` 형태로만 쓴다
--    (§ 012 의 VALUES 리스트 조합 구문 실패 이력, 그 패턴을 피한다).
-- ──────────────────────────────────────────────
do $$
begin
  if not exists (select 1 from information_schema.columns
                 where table_schema = 'public' and table_name = 'users'
                   and column_name = 'nickname') then
    raise exception '검증 실패: users.nickname 컬럼이 없습니다.';
  end if;

  -- nullable 이어야 한다 — 닉네임 미설정 사용자가 정상 상태다.
  if not exists (select 1 from information_schema.columns
                 where table_schema = 'public' and table_name = 'users'
                   and column_name = 'nickname' and is_nullable = 'YES') then
    raise exception '검증 실패: users.nickname 이 NOT NULL 입니다 — 미설정 사용자는 NULL 이어야 합니다.';
  end if;

  if not exists (select 1 from information_schema.columns
                 where table_schema = 'public' and table_name = 'users'
                   and column_name = 'nickname' and data_type = 'text') then
    raise exception '검증 실패: users.nickname 의 타입이 text 가 아닙니다.';
  end if;

  -- 기존 행은 전부 미설정(NULL)이어야 한다 — 이 마이그레이션은 데이터를 채우지 않는다.
  if exists (select 1 from users where nickname is not null) then
    raise exception '검증 실패: 이 마이그레이션 적용 직후에는 nickname 이 전부 NULL 이어야 합니다.';
  end if;

  raise notice '016 검증 통과: users.nickname(nullable text) 추가, 기존 행 전부 NULL.';
end $$;
