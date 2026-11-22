#!/usr/bin/env bash
# 최초 1회: dump.sh 산출물(schema.sql + data.sql)을 서울(NEW)에 복원한다.
# 서울 public 에 테이블이 하나라도 있으면 중단한다(재실행은 reload-data.sh).
#
# 공식 가이드의 복원 명령과 같은 구조:
#   psql --single-transaction -v ON_ERROR_STOP=1 -f schema -c 'SET session_replication_role = replica' -f data
# 차이(schema.sql 전처리, 공식 CLI 의 sed 후처리와 같은 목적):
#   - CREATE SCHEMA / ALTER SCHEMA OWNER / COMMENT ON SCHEMA "public" 제거 — 새 프로젝트에 이미
#     같은 owner(pg_database_owner)·ACL 로 존재한다.
#   - ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" 제거 — postgres 로는 실행 불가이고 새
#     프로젝트에 같은 값이 이미 있다. FOR ROLE "postgres" 는 원본 그대로 적용한다.
source "$(dirname "$0")/lib.sh"
assert_targets

[ -f "$OUT_DIR/schema.sql" ] && [ -f "$OUT_DIR/data.sql" ] || { echo "먼저 dump.sh 실행" >&2; exit 1; }

n=$(psql_new -Atqc "select count(*) from pg_tables where schemaname='public'")
if [ "$n" != "0" ]; then
  echo "서울 public 에 테이블 ${n}개가 이미 있다 — 데이터만 다시 덮어쓰려면 reload-data.sh" >&2
  exit 1
fi

sed -E \
  -e '/^CREATE SCHEMA "public";$/d' \
  -e '/^ALTER SCHEMA "public" OWNER TO /d' \
  -e '/^COMMENT ON SCHEMA "public" IS /d' \
  -e '/^ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" /d' \
  "$OUT_DIR/schema.sql" > "$OUT_DIR/schema.restore.sql"
chmod 600 "$OUT_DIR/schema.restore.sql"

psql_new --single-transaction -q \
  -f "$OUT_DIR/schema.restore.sql" \
  -c 'SET session_replication_role = replica' \
  -f "$OUT_DIR/data.sql"

# 새 프로젝트(2026-11 이후 생성)에 Supabase 가 기본으로 넣는 public.rls_auto_enable()
# (SECURITY DEFINER, 이벤트 트리거 ensure_rls 용)은 ACL 이 비어 PUBLIC 이 실행할 수 있다 →
# Security Advisor WARN 2건(anon/authenticated_security_definer_function_executable)이 시드니에
# 없던 차이로 생긴다. 함수·이벤트 트리거는 그대로 두고 실행 권한만 회수한다.
psql_new -q -c "DO \$\$
  BEGIN
    IF to_regprocedure('public.rls_auto_enable()') IS NOT NULL THEN
      REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
    END IF;
  END \$\$"
echo "복원 완료 — verify.sh 로 시드니와 비교"
