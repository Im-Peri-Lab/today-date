#!/usr/bin/env bash
# 컷오버용: 서울(NEW) public 의 데이터만 비우고 시드니 최신 데이터로 다시 채운다.
# 스키마는 건드리지 않는다(스키마가 바뀌었다면 이 스크립트가 아니라 마이그레이션을 서울에도 적용).
#
#   1) dump.sh --data-only   시드니 최신 data.sql (읽기 전용)
#   2) 한 트랜잭션 안에서     session_replication_role=replica → public 전 테이블 TRUNCATE → data.sql
#      - replica: FK 검사·트리거(touch_updated_at) 미발동 → updated_at 등 원본 값 그대로
#      - 실패하면 전체 롤백(서울은 직전 상태 유지)
#
# 사용: scripts/region-migration/reload-data.sh [--skip-dump]
source "$(dirname "$0")/lib.sh"
assert_targets

if [ "${1:-}" != "--skip-dump" ]; then
  bash "$(dirname "$0")/dump.sh" --data-only
fi
[ -f "$OUT_DIR/data.sql" ] || { echo "data.sql 없음" >&2; exit 1; }

psql_new --single-transaction -q \
  -c 'SET session_replication_role = replica' \
  -c "DO \$\$
      DECLARE t text;
      BEGIN
        SELECT string_agg(format('public.%I', tablename), ', ') INTO t
          FROM pg_tables WHERE schemaname = 'public';
        IF t IS NULL THEN RAISE EXCEPTION '서울 public 에 테이블이 없다 — 먼저 restore.sh'; END IF;
        EXECUTE 'TRUNCATE ' || t;
      END \$\$" \
  -f "$OUT_DIR/data.sql"
echo "재적재 완료 — verify.sh 로 시드니와 비교"
