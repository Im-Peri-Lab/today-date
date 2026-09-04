-- ============================================================
-- 012_013_couples_verification.sql
-- 012/013 적용 결과 검증 — 읽기 전용(SELECT only). 언제든 재실행해도 안전하다.
--
-- 주의: 이 파일은 의도적으로 이메일·패스코드 해시 등 민감 값을 조회하지 않는다.
--       존재 여부(boolean)와 건수만 확인한다.
-- ============================================================

-- ① couples row 수 = 1 이어야 한다
select 'couples row 수' as check_name,
       count(*)         as actual,
       1                as expected,
       (count(*) = 1)   as pass
from couples;

-- ② users row 수 = 1 이어야 한다
select 'users row 수' as check_name,
       count(*)       as actual,
       1              as expected,
       (count(*) = 1) as pass
from users;

-- ③ couple_id 가 NULL 인 domain row = 0 건이어야 한다 (테이블별)
select 'activities.couple_id IS NULL'          as check_name,
       count(*) as actual, 0 as expected, (count(*) = 0) as pass
from activities where couple_id is null
union all
select 'places.couple_id IS NULL',
       count(*), 0, (count(*) = 0)
from places where couple_id is null
union all
select 'recommendations_log.couple_id IS NULL',
       count(*), 0, (count(*) = 0)
from recommendations_log where couple_id is null;

-- ③-b 전체 domain 합산 NULL 건수 = 0
select 'domain couple_id IS NULL 합계' as check_name,
       count(*) as actual, 0 as expected, (count(*) = 0) as pass
from (
  select couple_id from activities
  union all select couple_id from places
  union all select couple_id from recommendations_log
) d
where d.couple_id is null;

-- ④ 모든 domain row 가 실제 존재하는 couples 를 가리키는지 (고아 FK = 0)
select '고아 couple_id (couples 에 없는 값)' as check_name,
       count(*) as actual, 0 as expected, (count(*) = 0) as pass
from (
  select couple_id from activities
  union all select couple_id from places
  union all select couple_id from recommendations_log
) d
where d.couple_id is not null
  and d.couple_id not in (select id from couples);

-- ⑤ users → couples 연결 및 값 이관 확인 (PII 미출력)
select 'users ↔ couples 연결' as check_name,
       count(*) as actual, 1 as expected, (count(*) = 1) as pass
from users u
join couples c on c.id = u.couple_id;

-- ⑥ app_config → couples 인증 상태가 동일하게 복제됐는지 (해시 값 자체는 출력하지 않음)
select 'app_config → couples 인증 상태 일치' as check_name,
       (a.passcode_hash   = c.passcode_hash
    and a.failed_attempts = c.failed_attempts
    and a.session_version = c.session_version
    and a.locked_until is not distinct from c.locked_until) as pass
from app_config a cross join couples c
where a.id = 1;

-- ⑦ app_config 무손상 확인 — 이번 작업은 순수 additive 여야 한다
select 'app_config 단일 row 유지' as check_name,
       count(*) as actual, 1 as expected, (count(*) = 1) as pass
from app_config;

select 'app_config 값 보존 (존재 여부만)' as check_name,
       (passcode_hash is not null) as has_passcode,
       (recovery_email is not null) as has_recovery_email,
       email_verified,
       session_version
from app_config where id = 1;

-- ⑧ email_token_purpose enum 값 목록 (invite_partner 포함 확인)
select 'email_token_purpose enum 값' as check_name,
       string_agg(e.enumlabel::text, ', ' order by e.enumsortorder) as actual
from pg_enum e
join pg_type t on t.oid = e.enumtypid
where t.typname = 'email_token_purpose';

-- ⑨ updated_at 트리거가 활성 상태로 원복됐는지 ('O' = 활성, 'D' = 비활성)
select 'updated_at 트리거 상태' as check_name,
       tgname,
       tgenabled,
       (tgenabled <> 'D') as pass
from pg_trigger
where tgname in ('activities_updated_at', 'places_updated_at', 'couples_updated_at')
order by tgname;

-- ⑩ 신규 테이블 RLS 활성 확인 (정책 0개 = Service-Role-only 유지)
select 'RLS 활성 + 정책 0개' as check_name,
       c.relname,
       c.relrowsecurity as rls_enabled,
       (select count(*) from pg_policies p
         where p.schemaname = 'public' and p.tablename = c.relname) as policy_count
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname in ('couples', 'users')
order by c.relname;
