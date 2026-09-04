-- ============================================================
-- 012_013_couples_verification.sql
-- 012/013 적용 결과 검증 — 읽기 전용(SELECT only). 언제든 재실행해도 안전하다.
--
-- Supabase SQL Editor 는 여러 문장을 실행하면 마지막 결과만 보여주므로,
-- 모든 검사를 하나의 UNION ALL 쿼리로 묶어 한 화면에 나오게 했다.
-- pass 컬럼이 전부 true 여야 한다.
--
-- 주의: 이 파일은 이메일·패스코드 해시 등 민감 값을 절대 출력하지 않는다.
--       민감 값이 걸린 검사(⑩ ⑫ ⑬)는 DB 안에서 비교만 수행하고 그 결과
--       boolean 만 actual 컬럼에 내보낸다 — 원문은 결과 집합에 등장하지 않는다.
--       actual 이 null 이면 검사가 실제로 돌았는지 눈으로 확인할 수 없으므로,
--       모든 항목이 계산된 값을 actual 에 채운다.
-- ============================================================

select * from (
  -- ① couples row 수 = 1
  select 1 as seq,
         'couples row 수' as check_name,
         (select count(*) from couples)::text as actual,
         '1' as expected,
         (select count(*) from couples) = 1 as pass

  -- ② users row 수 = 1
  union all
  select 2,
         'users row 수',
         (select count(*) from users)::text,
         '1',
         (select count(*) from users) = 1

  -- ③ couple_id 가 NULL 인 domain row = 0 건 (테이블별)
  union all
  select 3,
         'activities.couple_id IS NULL',
         (select count(*) from activities where couple_id is null)::text,
         '0',
         (select count(*) from activities where couple_id is null) = 0
  union all
  select 4,
         'places.couple_id IS NULL',
         (select count(*) from places where couple_id is null)::text,
         '0',
         (select count(*) from places where couple_id is null) = 0
  union all
  select 5,
         'recommendations_log.couple_id IS NULL',
         (select count(*) from recommendations_log where couple_id is null)::text,
         '0',
         (select count(*) from recommendations_log where couple_id is null) = 0

  -- ④ 고아 couple_id (couples 에 없는 값) = 0 건
  union all
  select 6,
         '고아 couple_id — activities',
         (select count(*) from activities a where a.couple_id is not null
            and not exists (select 1 from couples c where c.id = a.couple_id))::text,
         '0',
         (select count(*) from activities a where a.couple_id is not null
            and not exists (select 1 from couples c where c.id = a.couple_id)) = 0
  union all
  select 7,
         '고아 couple_id — places',
         (select count(*) from places p where p.couple_id is not null
            and not exists (select 1 from couples c where c.id = p.couple_id))::text,
         '0',
         (select count(*) from places p where p.couple_id is not null
            and not exists (select 1 from couples c where c.id = p.couple_id)) = 0
  union all
  select 8,
         '고아 couple_id — recommendations_log',
         (select count(*) from recommendations_log r where r.couple_id is not null
            and not exists (select 1 from couples c where c.id = r.couple_id))::text,
         '0',
         (select count(*) from recommendations_log r where r.couple_id is not null
            and not exists (select 1 from couples c where c.id = r.couple_id)) = 0

  -- ⑤ users → couples 연결
  union all
  select 9,
         'users ↔ couples 연결',
         (select count(*) from users u join couples c on c.id = u.couple_id)::text,
         '1',
         (select count(*) from users u join couples c on c.id = u.couple_id) = 1

  -- ⑥ app_config → couples 인증 상태 복제 일치 (해시 값 자체는 출력하지 않음)
  union all
  select 10,
         'passcode_hash 일치 — app_config ↔ couples',
         -- 해시 원문은 절대 출력하지 않는다. 비교 결과 boolean 만 text 로 내보낸다.
         -- is not distinct from: 양쪽이 모두 NULL 인 경우도 "일치"로 본다.
         (select (a.passcode_hash is not distinct from c.passcode_hash)::text
            from app_config a cross join couples c where a.id = 1),
         'true',
         (select a.passcode_hash is not distinct from c.passcode_hash
            from app_config a cross join couples c where a.id = 1)

  -- ⑦ app_config 무손상 (순수 additive 확인)
  union all
  select 11,
         'app_config 단일 row 유지',
         (select count(*) from app_config)::text,
         '1',
         (select count(*) from app_config) = 1
  union all
  select 12,
         'recovery_email 일치 — app_config ↔ users.email',
         -- 이메일 원문은 절대 출력하지 않는다. 비교 결과 boolean 만 text 로 내보낸다.
         (select (a.recovery_email is not distinct from u.email)::text
            from app_config a cross join users u where a.id = 1),
         'true',
         (select a.recovery_email is not distinct from u.email
            from app_config a cross join users u where a.id = 1)
  union all
  select 13,
         'app_config 민감값 보존 — passcode_hash·recovery_email NOT NULL',
         -- 값이 아니라 "비어있지 않다"는 사실만 boolean 으로 출력한다.
         (select (passcode_hash is not null and recovery_email is not null)::text
            from app_config where id = 1),
         'true',
         (select passcode_hash is not null and recovery_email is not null
            from app_config where id = 1)

  -- ⑧ email_token_purpose enum 에 invite_partner 존재
  union all
  select 14,
         'enum invite_partner 존재',
         (select string_agg(e.enumlabel::text, ', ' order by e.enumsortorder)
            from pg_enum e join pg_type t on t.oid = e.enumtypid
           where t.typname = 'email_token_purpose'),
         'invite_partner 포함',
         exists (select 1 from pg_enum e join pg_type t on t.oid = e.enumtypid
                  where t.typname = 'email_token_purpose'
                    and e.enumlabel = 'invite_partner')

  -- ⑨ updated_at 트리거가 활성 상태로 원복됐는지 ('D' = 비활성)
  union all
  select 15,
         'updated_at 트리거 활성 (activities/places/couples)',
         (select count(*) from pg_trigger tg
            join pg_class rc on rc.oid = tg.tgrelid
            join pg_namespace n on n.oid = rc.relnamespace
           where n.nspname = 'public'
             and tg.tgname in ('activities_updated_at', 'places_updated_at', 'couples_updated_at')
             and tg.tgenabled = 'D')::text,
         '0',
         (select count(*) from pg_trigger tg
            join pg_class rc on rc.oid = tg.tgrelid
            join pg_namespace n on n.oid = rc.relnamespace
           where n.nspname = 'public'
             and tg.tgname in ('activities_updated_at', 'places_updated_at', 'couples_updated_at')
             and tg.tgenabled = 'D') = 0

  -- ⑩ 신규 테이블 RLS 활성 + 정책 0개 (007 의 Service-Role-only 유지)
  union all
  select 16,
         'couples/users RLS 활성 2개',
         (select count(*) from pg_class rc
            join pg_namespace n on n.oid = rc.relnamespace
           where n.nspname = 'public' and rc.relname in ('couples', 'users')
             and rc.relrowsecurity)::text,
         '2',
         (select count(*) from pg_class rc
            join pg_namespace n on n.oid = rc.relnamespace
           where n.nspname = 'public' and rc.relname in ('couples', 'users')
             and rc.relrowsecurity) = 2
  union all
  select 17,
         'couples/users 정책 0개',
         (select count(*) from pg_policies
           where schemaname = 'public' and tablename in ('couples', 'users'))::text,
         '0',
         (select count(*) from pg_policies
           where schemaname = 'public' and tablename in ('couples', 'users')) = 0

  -- ⑪ 비민감 인증 필드 복제 일치 — 이 값들은 민감하지 않으므로 실측값을 그대로 보여준다.
  --    (원래 ⑩ 에 묶여 있던 검사를 분리했다. ⑩ 은 해시 일치 전용)
  union all
  select 18,
         'failed_attempts 일치 — app_config ↔ couples',
         (select a.failed_attempts || ' == ' || c.failed_attempts
            from app_config a cross join couples c where a.id = 1),
         '일치',
         (select a.failed_attempts = c.failed_attempts
            from app_config a cross join couples c where a.id = 1)
  union all
  select 19,
         'session_version 일치 — app_config ↔ couples',
         (select a.session_version || ' == ' || c.session_version
            from app_config a cross join couples c where a.id = 1),
         '일치',
         (select a.session_version = c.session_version
            from app_config a cross join couples c where a.id = 1)
  union all
  select 20,
         'locked_until 일치 — app_config ↔ couples',
         (select coalesce(a.locked_until::text, 'NULL') || ' == '
              || coalesce(c.locked_until::text, 'NULL')
            from app_config a cross join couples c where a.id = 1),
         '일치',
         (select a.locked_until is not distinct from c.locked_until
            from app_config a cross join couples c where a.id = 1)
  union all
  select 21,
         'created_at 승계 — app_config → couples',
         (select (a.created_at = c.created_at)::text
            from app_config a cross join couples c where a.id = 1),
         'true',
         (select a.created_at = c.created_at
            from app_config a cross join couples c where a.id = 1)
  union all
  select 22,
         'email_verified 승계 — app_config → users',
         (select a.email_verified || ' == ' || u.email_verified
            from app_config a cross join users u where a.id = 1),
         '일치',
         (select a.email_verified = u.email_verified
            from app_config a cross join users u where a.id = 1)
) checks
order by seq;
