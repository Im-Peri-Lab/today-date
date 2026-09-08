-- ============================================================
-- 014_couple_id_not_null.sql
-- activities / places / recommendations_log 의 couple_id 를 NOT NULL 로 승격한다.
--
-- 012 에서 컬럼을 nullable 로 추가하고 013 에서 백필한 뒤, 승격은
-- "앱의 모든 쓰기 경로가 couple_id 를 채운다"가 확인될 때까지 보류돼 있었다.
-- 그 조건은 PR #120(커플 데이터 격리)에서 충족됐다 — INSERT 를 하는 세 지점이
-- 모두 세션의 couple_id 를 명시적으로 넣는다:
--   src/app/api/activities/route.ts        (POST)
--   src/app/api/places/route.ts            (POST)
--   src/app/api/recommend/{activity,place}/route.ts (추천 로그 INSERT)
--
-- 승격의 의미: 이후 couple_id 없는 INSERT 는 DB 가 거부한다. 즉 격리를 우회하는
-- 새 쓰기 경로가 실수로 추가되는 것을 애플리케이션 밖에서 한 겹 더 막는다.
--
-- 멱등하다: 이미 NOT NULL 인 컬럼은 건너뛴다.
-- 012, 013 을 먼저 실행해야 한다.
-- Supabase SQL Editor에서 전체를 실행하세요.
-- ============================================================

-- ──────────────────────────────────────────────
-- 1. 승격 전 검증 — NULL 이 1건이라도 있으면 중단한다.
--
--    SET NOT NULL 자체도 NULL 이 있으면 실패하지만, 그때 나오는 메시지는
--    "column contains null values" 뿐이어서 어느 테이블에 몇 건인지 알 수 없다.
--    승격을 시도하기 전에 세 테이블을 각각 세어 사람이 읽을 수 있는 형태로 보고한다.
--
--    이 블록이 예외를 던지면 아래 ALTER 는 실행되지 않고 전체가 롤백된다 —
--    부분 승격(예: activities 만 NOT NULL)으로 끝나는 상태는 만들어지지 않는다.
-- ──────────────────────────────────────────────
do $$
declare
  v_a_null int; v_p_null int; v_r_null int;
begin
  -- 선행 조건: 012 의 컬럼이 세 테이블 모두에 있어야 한다.
  -- 세 개를 각각 확인한다 — 아래 2번 블록은 is_nullable = 'YES' 인 컬럼만
  -- 승격하므로, 컬럼이 아예 없는 경우를 여기서 걸러내지 않으면 "이미 NOT NULL"
  -- 이라는 잘못된 notice 를 남기고 지나간다.
  if not exists (select 1 from information_schema.columns
                 where table_schema = 'public' and table_name = 'activities'
                   and column_name = 'couple_id') then
    raise exception '012 미적용: activities.couple_id 컬럼이 없습니다.';
  end if;
  if not exists (select 1 from information_schema.columns
                 where table_schema = 'public' and table_name = 'places'
                   and column_name = 'couple_id') then
    raise exception '012 미적용: places.couple_id 컬럼이 없습니다.';
  end if;
  if not exists (select 1 from information_schema.columns
                 where table_schema = 'public' and table_name = 'recommendations_log'
                   and column_name = 'couple_id') then
    raise exception '012 미적용: recommendations_log.couple_id 컬럼이 없습니다.';
  end if;

  select count(*) into v_a_null from activities          where couple_id is null;
  select count(*) into v_p_null from places              where couple_id is null;
  select count(*) into v_r_null from recommendations_log where couple_id is null;

  if v_a_null + v_p_null + v_r_null > 0 then
    raise exception
      'NOT NULL 승격 중단: couple_id 가 NULL 인 행이 있습니다 — activities %건, places %건, recommendations_log %건. 013 백필을 먼저 완료하세요.',
      v_a_null, v_p_null, v_r_null;
  end if;

  raise notice '승격 전 검증 통과: 세 테이블 모두 couple_id NULL 0건.';
end $$;

-- ──────────────────────────────────────────────
-- 2. NOT NULL 승격
--
--    이미 NOT NULL 인 컬럼에 SET NOT NULL 을 다시 걸어도 Postgres 는 오류를 내지
--    않지만, ACCESS EXCLUSIVE 락을 다시 잡는다. 재실행이 무의미한 락으로 이어지지
--    않도록 is_nullable 을 보고 필요한 것만 건드린다.
-- ──────────────────────────────────────────────
do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'activities'
               and column_name = 'couple_id' and is_nullable = 'YES') then
    alter table activities alter column couple_id set not null;
    raise notice 'activities.couple_id → NOT NULL';
  else
    raise notice 'activities.couple_id 는 이미 NOT NULL — 건너뜀';
  end if;

  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'places'
               and column_name = 'couple_id' and is_nullable = 'YES') then
    alter table places alter column couple_id set not null;
    raise notice 'places.couple_id → NOT NULL';
  else
    raise notice 'places.couple_id 는 이미 NOT NULL — 건너뜀';
  end if;

  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'recommendations_log'
               and column_name = 'couple_id' and is_nullable = 'YES') then
    alter table recommendations_log alter column couple_id set not null;
    raise notice 'recommendations_log.couple_id → NOT NULL';
  else
    raise notice 'recommendations_log.couple_id 는 이미 NOT NULL — 건너뜀';
  end if;
end $$;

-- ──────────────────────────────────────────────
-- 3. 컬럼 주석 갱신 — 012 의 "NOT NULL 승격은 보류한다" 문구를 현재 상태로 바꾼다.
-- ──────────────────────────────────────────────
comment on column activities.couple_id is
  '소유 커플(NOT NULL). 014 에서 승격 — 앱의 모든 INSERT 경로가 세션의 couple_id 를 채운다.';
comment on column places.couple_id is
  '소유 커플(NOT NULL). 014 에서 승격 — 앱의 모든 INSERT 경로가 세션의 couple_id 를 채운다.';
comment on column recommendations_log.couple_id is
  '추천 로그를 발생시킨 커플(NOT NULL). 014 에서 승격.';

-- ──────────────────────────────────────────────
-- 4. 승격 결과 검증 — 하나라도 어긋나면 전체 롤백.
--
--    개별 검사를 `if not exists (...) then raise exception` 형태로만 쓴다 —
--    012 에서 VALUES 리스트 조합 구문이 Supabase SQL Editor 에서 실패한 이력이 있어
--    그 패턴을 피한다.
-- ──────────────────────────────────────────────
do $$
begin
  if not exists (select 1 from information_schema.columns
                 where table_schema = 'public' and table_name = 'activities'
                   and column_name = 'couple_id' and is_nullable = 'NO') then
    raise exception '검증 실패: activities.couple_id 가 NOT NULL 이 아닙니다.';
  end if;
  if not exists (select 1 from information_schema.columns
                 where table_schema = 'public' and table_name = 'places'
                   and column_name = 'couple_id' and is_nullable = 'NO') then
    raise exception '검증 실패: places.couple_id 가 NOT NULL 이 아닙니다.';
  end if;
  if not exists (select 1 from information_schema.columns
                 where table_schema = 'public' and table_name = 'recommendations_log'
                   and column_name = 'couple_id' and is_nullable = 'NO') then
    raise exception '검증 실패: recommendations_log.couple_id 가 NOT NULL 이 아닙니다.';
  end if;

  -- 012 의 외래키(on delete restrict)가 승격 과정에서 사라지지 않았는지 확인한다.
  if not exists (
    select 1
    from information_schema.table_constraints tc
    join information_schema.key_column_usage kcu
      on kcu.constraint_name = tc.constraint_name
     and kcu.table_schema = tc.table_schema
    where tc.table_schema = 'public'
      and tc.table_name = 'activities'
      and tc.constraint_type = 'FOREIGN KEY'
      and kcu.column_name = 'couple_id'
  ) then
    raise exception '검증 실패: activities.couple_id 의 외래키가 없습니다.';
  end if;

  raise notice '014 검증 통과: 세 테이블 couple_id NOT NULL, 외래키 유지.';
end $$;
