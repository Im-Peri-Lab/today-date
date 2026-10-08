-- ============================================================
-- 016_users_nickname_verification.sql
-- 016 적용 결과 검증 — 읽기 전용(SELECT only). 언제든 재실행해도 안전하다.
--
-- 012~015 검증 파일과 같은 형태다: Supabase SQL Editor 는 여러 문장을 실행하면
-- 마지막 결과만 보여주므로 모든 검사를 UNION ALL 하나로 묶었다.
-- pass 컬럼이 전부 true 여야 한다.
--
-- 민감 값(이메일·닉네임)은 출력하지 않는다 — 스키마 메타데이터와 행 개수만 본다.
-- ============================================================

select * from (
  -- [1] nickname 컬럼 존재
  select 1 as seq,
         'users.nickname 존재' as check_name,
         (select count(*)::text from information_schema.columns
           where table_schema = 'public' and table_name = 'users'
             and column_name = 'nickname') as actual,
         '1' as expected,
         (select count(*) from information_schema.columns
           where table_schema = 'public' and table_name = 'users'
             and column_name = 'nickname') = 1 as pass

  union all
  -- [2] nullable 이어야 한다 — 닉네임 미설정 사용자가 정상 상태다.
  select 2,
         'users.nickname is_nullable',
         (select is_nullable from information_schema.columns
           where table_schema = 'public' and table_name = 'users'
             and column_name = 'nickname'),
         'YES',
         (select is_nullable from information_schema.columns
           where table_schema = 'public' and table_name = 'users'
             and column_name = 'nickname') = 'YES'

  union all
  -- [3] 타입은 text
  select 3,
         'users.nickname data_type',
         (select data_type from information_schema.columns
           where table_schema = 'public' and table_name = 'users'
             and column_name = 'nickname'),
         'text',
         (select data_type from information_schema.columns
           where table_schema = 'public' and table_name = 'users'
             and column_name = 'nickname') = 'text'

  union all
  -- [4] users 테이블 RLS 가 여전히 활성화되어 있는지(012 산출물 무손상)
  select 4,
         'users RLS 활성화',
         (select relrowsecurity::text from pg_class
           where relname = 'users' and relnamespace = 'public'::regnamespace::oid),
         'true',
         (select relrowsecurity from pg_class
           where relname = 'users' and relnamespace = 'public'::regnamespace::oid) = true

  union all
  -- [5] users 테이블에 정책이 여전히 0개인지(service-role-only 구조 무손상)
  select 5,
         'users 정책 개수',
         (select count(*)::text from pg_policies
           where schemaname = 'public' and tablename = 'users'),
         '0',
         (select count(*) from pg_policies
           where schemaname = 'public' and tablename = 'users') = 0
) checks
order by seq;
