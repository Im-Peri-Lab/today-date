-- ============================================================
-- 014_couple_id_not_null_verification.sql
-- 014 적용 결과 검증 — 읽기 전용(SELECT only). 언제든 재실행해도 안전하다.
--
-- 012/013 검증 파일과 같은 형태다: Supabase SQL Editor 는 여러 문장을 실행하면
-- 마지막 결과만 보여주므로 모든 검사를 UNION ALL 하나로 묶었다.
-- pass 컬럼이 전부 true 여야 한다.
--
-- 민감 값(이메일·해시)은 출력하지 않는다 — 이 파일은 스키마 메타데이터와
-- 행 개수만 본다.
-- ============================================================

select * from (
  -- [1~3] 세 테이블의 couple_id 가 NOT NULL 인지
  select 1 as seq,
         'activities.couple_id is_nullable' as check_name,
         (select is_nullable from information_schema.columns
           where table_schema = 'public' and table_name = 'activities'
             and column_name = 'couple_id') as actual,
         'NO' as expected,
         (select is_nullable from information_schema.columns
           where table_schema = 'public' and table_name = 'activities'
             and column_name = 'couple_id') = 'NO' as pass

  union all
  select 2,
         'places.couple_id is_nullable',
         (select is_nullable from information_schema.columns
           where table_schema = 'public' and table_name = 'places'
             and column_name = 'couple_id'),
         'NO',
         (select is_nullable from information_schema.columns
           where table_schema = 'public' and table_name = 'places'
             and column_name = 'couple_id') = 'NO'

  union all
  select 3,
         'recommendations_log.couple_id is_nullable',
         (select is_nullable from information_schema.columns
           where table_schema = 'public' and table_name = 'recommendations_log'
             and column_name = 'couple_id'),
         'NO',
         (select is_nullable from information_schema.columns
           where table_schema = 'public' and table_name = 'recommendations_log'
             and column_name = 'couple_id') = 'NO'

  -- [4~6] NULL 행이 실제로 0건인지 (NOT NULL 이면 당연하지만, 승격이
  --        건너뛰어졌는지 여부와 무관하게 데이터 상태를 직접 확인한다)
  union all
  select 4,
         'activities couple_id NULL 행 수',
         (select count(*)::text from activities where couple_id is null),
         '0',
         (select count(*) from activities where couple_id is null) = 0

  union all
  select 5,
         'places couple_id NULL 행 수',
         (select count(*)::text from places where couple_id is null),
         '0',
         (select count(*) from places where couple_id is null) = 0

  union all
  select 6,
         'recommendations_log couple_id NULL 행 수',
         (select count(*)::text from recommendations_log where couple_id is null),
         '0',
         (select count(*) from recommendations_log where couple_id is null) = 0

  -- [7~9] 012 의 외래키가 유지됐는지 (승격이 제약을 갈아치우지 않았는지)
  union all
  select 7,
         'activities.couple_id 외래키 수',
         (select count(*)::text from information_schema.table_constraints tc
           join information_schema.key_column_usage kcu
             on kcu.constraint_name = tc.constraint_name
            and kcu.table_schema = tc.table_schema
          where tc.table_schema = 'public' and tc.table_name = 'activities'
            and tc.constraint_type = 'FOREIGN KEY' and kcu.column_name = 'couple_id'),
         '1',
         (select count(*) from information_schema.table_constraints tc
           join information_schema.key_column_usage kcu
             on kcu.constraint_name = tc.constraint_name
            and kcu.table_schema = tc.table_schema
          where tc.table_schema = 'public' and tc.table_name = 'activities'
            and tc.constraint_type = 'FOREIGN KEY' and kcu.column_name = 'couple_id') = 1

  union all
  select 8,
         'places.couple_id 외래키 수',
         (select count(*)::text from information_schema.table_constraints tc
           join information_schema.key_column_usage kcu
             on kcu.constraint_name = tc.constraint_name
            and kcu.table_schema = tc.table_schema
          where tc.table_schema = 'public' and tc.table_name = 'places'
            and tc.constraint_type = 'FOREIGN KEY' and kcu.column_name = 'couple_id'),
         '1',
         (select count(*) from information_schema.table_constraints tc
           join information_schema.key_column_usage kcu
             on kcu.constraint_name = tc.constraint_name
            and kcu.table_schema = tc.table_schema
          where tc.table_schema = 'public' and tc.table_name = 'places'
            and tc.constraint_type = 'FOREIGN KEY' and kcu.column_name = 'couple_id') = 1

  union all
  select 9,
         'recommendations_log.couple_id 외래키 수',
         (select count(*)::text from information_schema.table_constraints tc
           join information_schema.key_column_usage kcu
             on kcu.constraint_name = tc.constraint_name
            and kcu.table_schema = tc.table_schema
          where tc.table_schema = 'public' and tc.table_name = 'recommendations_log'
            and tc.constraint_type = 'FOREIGN KEY' and kcu.column_name = 'couple_id'),
         '1',
         (select count(*) from information_schema.table_constraints tc
           join information_schema.key_column_usage kcu
             on kcu.constraint_name = tc.constraint_name
            and kcu.table_schema = tc.table_schema
          where tc.table_schema = 'public' and tc.table_name = 'recommendations_log'
            and tc.constraint_type = 'FOREIGN KEY' and kcu.column_name = 'couple_id') = 1
) checks
order by seq;
