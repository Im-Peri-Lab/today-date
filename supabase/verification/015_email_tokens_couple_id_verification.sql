-- ============================================================
-- 015_email_tokens_couple_id_verification.sql
-- 015 적용 결과 검증 — 읽기 전용(SELECT only). 언제든 재실행해도 안전하다.
--
-- 012/013/014 검증 파일과 같은 형태다: Supabase SQL Editor 는 여러 문장을 실행하면
-- 마지막 결과만 보여주므로 모든 검사를 UNION ALL 하나로 묶었다.
-- pass 컬럼이 전부 true 여야 한다.
--
-- 민감 값(이메일·토큰 해시)은 출력하지 않는다 — 스키마 메타데이터와 행 개수만 본다.
-- ============================================================

select * from (
  -- [1] couple_id 컬럼 존재
  select 1 as seq,
         'email_tokens.couple_id 존재' as check_name,
         (select count(*)::text from information_schema.columns
           where table_schema = 'public' and table_name = 'email_tokens'
             and column_name = 'couple_id') as actual,
         '1' as expected,
         (select count(*) from information_schema.columns
           where table_schema = 'public' and table_name = 'email_tokens'
             and column_name = 'couple_id') = 1 as pass

  union all
  -- [2] nullable 이어야 한다 — invite_partner 이외 목적 행은 NULL 로 남는다.
  select 2,
         'email_tokens.couple_id is_nullable',
         (select is_nullable from information_schema.columns
           where table_schema = 'public' and table_name = 'email_tokens'
             and column_name = 'couple_id'),
         'YES',
         (select is_nullable from information_schema.columns
           where table_schema = 'public' and table_name = 'email_tokens'
             and column_name = 'couple_id') = 'YES'

  union all
  -- [3] 외래키(→ couples)
  select 3,
         'email_tokens.couple_id 외래키',
         (select count(*)::text
            from information_schema.table_constraints tc
            join information_schema.key_column_usage kcu
              on kcu.constraint_name = tc.constraint_name
             and kcu.table_schema = tc.table_schema
           where tc.table_schema = 'public'
             and tc.table_name = 'email_tokens'
             and tc.constraint_type = 'FOREIGN KEY'
             and kcu.column_name = 'couple_id'),
         '1',
         (select count(*)
            from information_schema.table_constraints tc
            join information_schema.key_column_usage kcu
              on kcu.constraint_name = tc.constraint_name
             and kcu.table_schema = tc.table_schema
           where tc.table_schema = 'public'
             and tc.table_name = 'email_tokens'
             and tc.constraint_type = 'FOREIGN KEY'
             and kcu.column_name = 'couple_id') = 1

  union all
  -- [4] 인덱스 2종
  select 4,
         'email_tokens_couple_idx 인덱스',
         (select count(*)::text from pg_indexes
           where schemaname = 'public' and indexname = 'email_tokens_couple_idx'),
         '1',
         (select count(*) from pg_indexes
           where schemaname = 'public' and indexname = 'email_tokens_couple_idx') = 1

  union all
  select 5,
         'email_tokens_purpose_target_idx 인덱스',
         (select count(*)::text from pg_indexes
           where schemaname = 'public' and indexname = 'email_tokens_purpose_target_idx'),
         '1',
         (select count(*) from pg_indexes
           where schemaname = 'public' and indexname = 'email_tokens_purpose_target_idx') = 1

  union all
  -- [6] invite_partner enum 값 (015 가 의존하는 012 산출물)
  select 6,
         'invite_partner enum 값',
         (select count(*)::text from pg_enum e
            join pg_type t on t.oid = e.enumtypid
           where t.typname = 'email_token_purpose' and e.enumlabel = 'invite_partner'),
         '1',
         (select count(*) from pg_enum e
            join pg_type t on t.oid = e.enumtypid
           where t.typname = 'email_token_purpose' and e.enumlabel = 'invite_partner') = 1

  union all
  -- [7] invite_partner 이외 목적 행에 couple_id 가 새어 들어가지 않았는지
  --     (앱이 invite_partner 에만 채우는지를 데이터로 확인)
  select 7,
         'invite_partner 아닌 행의 couple_id NOT NULL 개수',
         (select count(*)::text from email_tokens
           where purpose <> 'invite_partner' and couple_id is not null),
         '0',
         (select count(*) from email_tokens
           where purpose <> 'invite_partner' and couple_id is not null) = 0

  union all
  -- [8] invite_partner 행은 반드시 couple_id 를 갖는지
  select 8,
         'invite_partner 행의 couple_id NULL 개수',
         (select count(*)::text from email_tokens
           where purpose = 'invite_partner' and couple_id is null),
         '0',
         (select count(*) from email_tokens
           where purpose = 'invite_partner' and couple_id is null) = 0
) checks
order by seq;
