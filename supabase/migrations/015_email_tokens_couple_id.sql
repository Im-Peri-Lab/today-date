-- ============================================================
-- 015_email_tokens_couple_id.sql
-- email_tokens 에 couple_id 를 추가한다 — 파트너 초대(invite_partner) 전용 스코프.
--
-- 왜 필요한가: 012 는 email_tokens 를 couple_id 대상에서 의도적으로 제외했다
-- ("이메일 주소로만 대상을 식별하는 인증 보조 테이블이지 소유권 대상이 아니다").
-- verify_email / reset_passcode / change_email 은 그 판단이 지금도 맞다 —
-- target_email → users → couple 로 커플이 유도되기 때문이다.
--
-- invite_partner 만 다르다. 초대 시점에 target_email 은 아직 users 에 없으므로
-- (없어야 정상이다 — 이미 있으면 초대 자체를 막는다) 토큰에서 커플을 유도할 방법이 없다.
-- 그래서 "누가 초대했는가"를 토큰이 직접 들고 있어야 한다:
--   1. 수락 시 어느 커플에 users 행을 붙일지 결정한다.
--   2. 재초대 시 그 커플의 기존 pending 초대만 골라 무효화한다
--      (초대 대상 이메일이 바뀌면 target_email 로는 찾을 수 없다).
--
-- 소유권 컬럼이 아니라 초대 스코프 컬럼이므로 nullable 로 둔다 —
-- invite_partner 이외의 목적 행은 NULL 이며 그것이 정상 상태다.
--
-- on delete cascade: 커플이 사라지면 그 커플이 보낸 초대도 의미가 없다.
-- (activities 등의 on delete restrict 와 다른 이유 — 초대 토큰은 실데이터가 아니다.)
--
-- 멱등하다: ADD COLUMN IF NOT EXISTS / CREATE INDEX IF NOT EXISTS.
-- 012 를 먼저 실행해야 한다.
-- Supabase SQL Editor에서 전체를 실행하세요.
-- ============================================================

-- ──────────────────────────────────────────────
-- 1. 선행 조건 확인 — 012 의 couples 테이블과 invite_partner enum 값이 있어야 한다.
-- ──────────────────────────────────────────────
do $$
begin
  if not exists (select 1 from information_schema.tables
                 where table_schema = 'public' and table_name = 'couples') then
    raise exception '012 미적용: couples 테이블이 없습니다.';
  end if;

  if not exists (select 1 from information_schema.tables
                 where table_schema = 'public' and table_name = 'email_tokens') then
    raise exception '001 미적용: email_tokens 테이블이 없습니다.';
  end if;

  if not exists (
    select 1 from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    where t.typname = 'email_token_purpose' and e.enumlabel = 'invite_partner'
  ) then
    raise exception '012 미적용: email_token_purpose enum 에 invite_partner 가 없습니다.';
  end if;

  raise notice '선행 조건 확인 통과: couples / email_tokens / invite_partner enum 존재.';
end $$;

-- ──────────────────────────────────────────────
-- 2. 컬럼 + 인덱스 추가
--
--    인덱스는 두 조회를 위한 것이다:
--      - 재초대 시 "이 커플의 pending 초대" 조회 → couple_id
--      - 자가가입 시 "이 이메일로 대기 중인 초대" 조회 → (purpose, target_email)
--    후자는 001 의 email_tokens 인덱스로 이미 커버되는지 확실하지 않으므로 함께 만든다
--    (IF NOT EXISTS 라 중복 생성되지 않는다).
-- ──────────────────────────────────────────────
alter table email_tokens
  add column if not exists couple_id uuid references couples (id) on delete cascade;

create index if not exists email_tokens_couple_idx
  on email_tokens (couple_id);

create index if not exists email_tokens_purpose_target_idx
  on email_tokens (purpose, target_email);

comment on column email_tokens.couple_id is
  '초대를 보낸 커플. invite_partner 목적 행에만 채워지고 그 외 목적은 NULL 이다 — 소유권이 아니라 초대 스코프 컬럼이다(015).';

-- ──────────────────────────────────────────────
-- 3. 결과 검증 — 어긋나면 전체 롤백.
--
--    개별 검사를 `if not exists (...) then raise exception` 형태로만 쓴다 —
--    012 에서 VALUES 리스트 조합 구문이 Supabase SQL Editor 에서 실패한 이력이 있어
--    그 패턴을 피한다.
-- ──────────────────────────────────────────────
do $$
begin
  if not exists (select 1 from information_schema.columns
                 where table_schema = 'public' and table_name = 'email_tokens'
                   and column_name = 'couple_id') then
    raise exception '검증 실패: email_tokens.couple_id 컬럼이 없습니다.';
  end if;

  -- nullable 이어야 한다 — invite_partner 이외 목적 행은 NULL 로 남는다.
  if not exists (select 1 from information_schema.columns
                 where table_schema = 'public' and table_name = 'email_tokens'
                   and column_name = 'couple_id' and is_nullable = 'YES') then
    raise exception '검증 실패: email_tokens.couple_id 가 NOT NULL 입니다 — invite_partner 이외 목적 행은 NULL 이어야 합니다.';
  end if;

  if not exists (
    select 1
    from information_schema.table_constraints tc
    join information_schema.key_column_usage kcu
      on kcu.constraint_name = tc.constraint_name
     and kcu.table_schema = tc.table_schema
    where tc.table_schema = 'public'
      and tc.table_name = 'email_tokens'
      and tc.constraint_type = 'FOREIGN KEY'
      and kcu.column_name = 'couple_id'
  ) then
    raise exception '검증 실패: email_tokens.couple_id 의 외래키가 없습니다.';
  end if;

  if not exists (select 1 from pg_indexes
                 where schemaname = 'public' and indexname = 'email_tokens_couple_idx') then
    raise exception '검증 실패: email_tokens_couple_idx 인덱스가 없습니다.';
  end if;

  raise notice '015 검증 통과: email_tokens.couple_id(nullable) + 외래키 + 인덱스.';
end $$;
