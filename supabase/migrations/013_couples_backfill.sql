-- ============================================================
-- 013_couples_backfill.sql
-- 012 에서 추가한 couples / users / couple_id 에 기존 데이터를 이관한다.
--
-- app_config 는 읽기만 한다 — UPDATE/DELETE 하지 않는다. 이관 후에도
-- app_config 가 현행 인증 로직의 단일 출처로 그대로 남는다(이중 보관 상태).
--
-- 멱등하다: 이미 백필된 상태에서 재실행하면 couples/users 는 중복 생성되지 않고
-- couple_id 는 NULL 인 행만 채운다(부분 실패 후 재실행도 안전).
--
-- 012_couples_users_schema.sql 을 먼저 실행해야 한다.
-- Supabase SQL Editor에서 전체를 실행하세요.
-- ============================================================

-- ──────────────────────────────────────────────
-- 0. 선행 조건 확인
-- ──────────────────────────────────────────────
do $$
begin
  if not exists (select 1 from information_schema.columns
                 where table_schema = 'public' and table_name = 'activities'
                   and column_name = 'couple_id') then
    raise exception '012_couples_users_schema.sql 이 먼저 적용되어야 합니다.';
  end if;
end $$;

-- ──────────────────────────────────────────────
-- 1. updated_at 트리거 일시 비활성화
--
--    activities/places 의 couple_id 를 채우는 UPDATE 는 touch_updated_at 트리거를
--    발동시켜 전 행의 updated_at 을 now() 로 덮어쓴다. updated_at 은 목록 정렬
--    기준이므로(src/app/api/activities/route.ts, places/route.ts 의
--    .order('updated_at', { ascending: false })) 그대로 두면 사용자가 보는
--    목록 순서가 전부 뒤바뀐다. 백필은 소유권만 채우는 작업이므로
--    updated_at 은 보존해야 한다.
--
--    DDL 은 PostgreSQL 에서 트랜잭션 대상이므로, 아래 블록이 중간에 실패하면
--    DISABLE 도 함께 롤백되어 트리거가 꺼진 채 남지 않는다.
--    (recommendations_log 는 updated_at 컬럼·트리거가 없어 대상 아님)
-- ──────────────────────────────────────────────
alter table activities disable trigger activities_updated_at;
alter table places     disable trigger places_updated_at;

-- ──────────────────────────────────────────────
-- 2. 백필
-- ──────────────────────────────────────────────
do $$
declare
  v_couple_id  uuid;
  v_couple_cnt int;
  v_email      text;
  v_verified   boolean;
  v_a int; v_p int; v_r int;
begin
  select count(*) into v_couple_cnt from couples;

  -- 이 백필은 "단일 공유 워크스페이스 → 첫 커플" 전환 시점에만 유효하다.
  if v_couple_cnt > 1 then
    raise exception 'couples 에 이미 %건이 있습니다. 이 백필은 커플이 0~1건일 때만 유효합니다.', v_couple_cnt;
  end if;

  select recovery_email, email_verified into v_email, v_verified
  from app_config where id = 1;

  if v_email is null or length(trim(v_email)) = 0 then
    raise exception 'app_config.recovery_email 이 비어 있어 users 백필을 할 수 없습니다.';
  end if;

  -- 2-1. couples 1행 — app_config 의 인증 상태를 그대로 복제(created_at 포함)
  if v_couple_cnt = 0 then
    insert into couples (passcode_hash, failed_attempts, locked_until, session_version, created_at)
    select passcode_hash, failed_attempts, locked_until, session_version, created_at
    from app_config where id = 1
    returning id into v_couple_id;
    raise notice 'couples 1행 생성 (app_config 복제).';
  else
    select id into v_couple_id from couples;
    raise notice 'couples 기존 1행 재사용 — 중복 생성하지 않음.';
  end if;

  -- 2-2. users 1행 — 본인(recovery_email)
  insert into users (couple_id, email, email_verified)
  values (v_couple_id, v_email, coalesce(v_verified, false))
  on conflict (email) do nothing;

  -- 2-3. domain 테이블 소유권 채우기 (NULL 인 행만 — 재실행 안전)
  update activities         set couple_id = v_couple_id where couple_id is null;
  get diagnostics v_a = row_count;
  update places             set couple_id = v_couple_id where couple_id is null;
  get diagnostics v_p = row_count;
  update recommendations_log set couple_id = v_couple_id where couple_id is null;
  get diagnostics v_r = row_count;

  raise notice 'couple_id 백필 — activities %건, places %건, recommendations_log %건.', v_a, v_p, v_r;
end $$;

-- ──────────────────────────────────────────────
-- 3. 트리거 원복
-- ──────────────────────────────────────────────
alter table activities enable trigger activities_updated_at;
alter table places     enable trigger places_updated_at;

-- ──────────────────────────────────────────────
-- 4. 백필 검증 — 하나라도 어긋나면 전체 롤백
-- ──────────────────────────────────────────────
do $$
declare
  v_couples int; v_users int;
  v_a_null int; v_p_null int; v_r_null int;
  v_orphan int;
  v_trig_disabled int;
begin
  select count(*) into v_couples from couples;
  if v_couples <> 1 then
    raise exception '검증 실패: couples row 수가 1이 아니라 %건입니다.', v_couples;
  end if;

  select count(*) into v_users from users;
  if v_users <> 1 then
    raise exception '검증 실패: users row 수가 1이 아니라 %건입니다.', v_users;
  end if;

  select count(*) into v_a_null from activities          where couple_id is null;
  select count(*) into v_p_null from places              where couple_id is null;
  select count(*) into v_r_null from recommendations_log where couple_id is null;
  if v_a_null + v_p_null + v_r_null > 0 then
    raise exception '검증 실패: couple_id 가 NULL 인 행이 남아있습니다 — activities %, places %, recommendations_log %.',
      v_a_null, v_p_null, v_r_null;
  end if;

  -- 모든 domain 행이 실제 존재하는 couples 를 가리키는지 (엉뚱한 uuid 가 섞이지 않았는지).
  -- 테이블별 개별 검사로 작성한다 — 012 에서 VALUES/서브쿼리 조합 구문이
  -- Supabase SQL Editor 에서 실패한 이력이 있어 위험 패턴을 쓰지 않는다.
  select count(*) into v_orphan from activities a
  where a.couple_id is not null
    and not exists (select 1 from couples c where c.id = a.couple_id);
  if v_orphan > 0 then
    raise exception '검증 실패: activities 에 couples 에 없는 couple_id 가 %건입니다.', v_orphan;
  end if;

  select count(*) into v_orphan from places p
  where p.couple_id is not null
    and not exists (select 1 from couples c where c.id = p.couple_id);
  if v_orphan > 0 then
    raise exception '검증 실패: places 에 couples 에 없는 couple_id 가 %건입니다.', v_orphan;
  end if;

  select count(*) into v_orphan from recommendations_log r
  where r.couple_id is not null
    and not exists (select 1 from couples c where c.id = r.couple_id);
  if v_orphan > 0 then
    raise exception '검증 실패: recommendations_log 에 couples 에 없는 couple_id 가 %건입니다.', v_orphan;
  end if;

  -- users 가 그 커플에 연결됐는지
  if not exists (select 1 from users u join couples c on c.id = u.couple_id) then
    raise exception '검증 실패: users 행이 couples 를 참조하지 않습니다.';
  end if;

  -- 트리거가 다시 켜졌는지 (tgenabled = 'D' 면 비활성)
  select count(*) into v_trig_disabled
  from pg_trigger tg
  join pg_class c on c.oid = tg.tgrelid
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and tg.tgname in ('activities_updated_at', 'places_updated_at')
    and tg.tgenabled = 'D';
  if v_trig_disabled > 0 then
    raise exception '검증 실패: updated_at 트리거 %개가 비활성 상태로 남아있습니다.', v_trig_disabled;
  end if;

  -- app_config 무손상 재확인
  if not exists (select 1 from app_config where id = 1 and passcode_hash is not null) then
    raise exception '검증 실패: app_config 단일 row 또는 passcode_hash 가 사라졌습니다.';
  end if;

  raise notice '013 백필 검증 통과: couples 1행, users 1행, couple_id NULL 0건, 트리거 원복, app_config 무손상.';
end $$;
