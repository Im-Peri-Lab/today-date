-- 리전 이전 검증 쿼리 — 시드니(OLD)·서울(NEW) 양쪽에 같은 쿼리를 돌려 출력 diff 로 비교한다.
-- 읽기 전용. 출력은 "구분<TAB>키<TAB>값" 한 줄씩, 정렬 고정.

-- 1) 테이블별 정확한 행 수
SELECT 'rows', c.relname,
       (xpath('/row/n/text()', query_to_xml(format('select count(*) as n from public.%I', c.relname), false, true, '')))[1]::text
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p')
ORDER BY 2;

-- 2) RLS 활성 여부
SELECT 'rls', c.relname, c.relrowsecurity::text || '/force=' || c.relforcerowsecurity::text
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p')
ORDER BY 2;

-- 3) 정책 수
SELECT 'policies', 'public', count(*)::text FROM pg_policies WHERE schemaname = 'public';

-- 4) 제약(종류별)·인덱스·트리거 개수
SELECT 'constraints', contype::text, count(*)::text
FROM pg_constraint WHERE connamespace = 'public'::regnamespace GROUP BY contype ORDER BY 2;
SELECT 'constraint_def', conrelid::regclass::text || '.' || conname, pg_get_constraintdef(oid)
FROM pg_constraint WHERE connamespace = 'public'::regnamespace ORDER BY 2;
SELECT 'indexes', 'public', count(*)::text FROM pg_indexes WHERE schemaname = 'public';
SELECT 'index_def', indexname, indexdef FROM pg_indexes WHERE schemaname = 'public' ORDER BY 2;
SELECT 'triggers', 'public', count(*)::text
FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid
WHERE c.relnamespace = 'public'::regnamespace AND NOT t.tgisinternal;
SELECT 'trigger_def', c.relname || '.' || t.tgname, pg_get_triggerdef(t.oid)
FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid
WHERE c.relnamespace = 'public'::regnamespace AND NOT t.tgisinternal ORDER BY 2;

-- 5) 함수 search_path (Supabase 가 새 프로젝트에 넣는 rls_auto_enable 은 별도 표기)
SELECT CASE WHEN p.proname = 'rls_auto_enable' THEN 'function_supabase_builtin' ELSE 'function' END,
       p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')',
       coalesce(array_to_string(p.proconfig, ';'), '<search_path 미고정>') || ' sec_definer=' || p.prosecdef::text
FROM pg_proc p WHERE p.pronamespace = 'public'::regnamespace ORDER BY 1, 2;

-- 6) 테이블·시퀀스·함수 권한(anon / authenticated / service_role / postgres)
SELECT 'grant_table', c.relname || ':' || r.rolname,
       coalesce(nullif(concat_ws(',',
         CASE WHEN has_table_privilege(r.oid, c.oid, 'SELECT') THEN 'SELECT' END,
         CASE WHEN has_table_privilege(r.oid, c.oid, 'INSERT') THEN 'INSERT' END,
         CASE WHEN has_table_privilege(r.oid, c.oid, 'UPDATE') THEN 'UPDATE' END,
         CASE WHEN has_table_privilege(r.oid, c.oid, 'DELETE') THEN 'DELETE' END,
         CASE WHEN has_table_privilege(r.oid, c.oid, 'TRUNCATE') THEN 'TRUNCATE' END,
         CASE WHEN has_table_privilege(r.oid, c.oid, 'REFERENCES') THEN 'REFERENCES' END,
         CASE WHEN has_table_privilege(r.oid, c.oid, 'TRIGGER') THEN 'TRIGGER' END,
         CASE WHEN has_table_privilege(r.oid, c.oid, 'MAINTAIN') THEN 'MAINTAIN' END), ''), '-')
FROM pg_class c
CROSS JOIN pg_roles r
WHERE c.relnamespace = 'public'::regnamespace AND c.relkind IN ('r', 'p', 'v', 'm')
  AND r.rolname IN ('anon', 'authenticated', 'service_role', 'postgres')
ORDER BY 2;
SELECT 'grant_sequence', c.relname || ':' || r.rolname,
       coalesce(nullif(concat_ws(',',
         CASE WHEN has_sequence_privilege(r.oid, c.oid, 'USAGE') THEN 'USAGE' END,
         CASE WHEN has_sequence_privilege(r.oid, c.oid, 'SELECT') THEN 'SELECT' END,
         CASE WHEN has_sequence_privilege(r.oid, c.oid, 'UPDATE') THEN 'UPDATE' END), ''), '-')
FROM pg_class c CROSS JOIN pg_roles r
WHERE c.relnamespace = 'public'::regnamespace AND c.relkind = 'S'
  AND r.rolname IN ('anon', 'authenticated', 'service_role', 'postgres')
ORDER BY 2;
SELECT 'grant_function', p.proname || ':' || r.rolname,
       CASE WHEN has_function_privilege(r.oid, p.oid, 'EXECUTE') THEN 'EXECUTE' ELSE '-' END
FROM pg_proc p CROSS JOIN pg_roles r
WHERE p.pronamespace = 'public'::regnamespace AND p.proname <> 'rls_auto_enable'
  AND r.rolname IN ('anon', 'authenticated', 'service_role', 'postgres')
ORDER BY 2;
SELECT 'owner', c.relkind::text || ':' || c.relname, pg_get_userbyid(c.relowner)
FROM pg_class c WHERE c.relnamespace = 'public'::regnamespace AND c.relkind IN ('r', 'p', 'v', 'm', 'S')
ORDER BY 2;

-- 7) 시퀀스 현재값(재적재 후 setval 이 맞는지)
SELECT 'sequence_value', sequencename, coalesce(last_value::text, '<null>')
FROM pg_sequences WHERE schemaname = 'public' ORDER BY 2;

-- 8) 타입(enum 등)
SELECT 'type', t.typname, t.typtype::text || coalesce(':' || (SELECT string_agg(enumlabel, ',' ORDER BY enumsortorder) FROM pg_enum e WHERE e.enumtypid = t.oid), '')
FROM pg_type t WHERE t.typnamespace = 'public'::regnamespace AND t.typtype IN ('e', 'd', 'c')
  AND NOT EXISTS (SELECT 1 FROM pg_class c WHERE c.reltype = t.oid)
ORDER BY 2;

-- 9) 테이블별 내용 해시 — id(couple_id 등)·session_version·타임스탬프까지 값이 그대로인지
SELECT 'checksum', c.relname,
       (xpath('/row/h/text()', query_to_xml(
         format('select md5(coalesce(string_agg(t::text, %L order by t::text), %L)) as h from public.%I t', '|', '', c.relname),
         false, true, '')))[1]::text
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p')
ORDER BY 2;
