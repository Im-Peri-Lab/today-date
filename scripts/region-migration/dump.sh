#!/usr/bin/env bash
# 시드니(OLD) public 스키마·데이터를 dump 한다. 시드니에는 읽기만 한다(pg_dump 는 READ ONLY 트랜잭션).
#
# Supabase 공식 "Backup and Restore using CLI" 의 schema.sql / data.sql 분리 방식을 따르되,
# 이 앱은 Auth·Storage 를 쓰지 않으므로 public 스키마만 대상이다. supabase CLI(db dump)는
# Docker 가 필요해 같은 플래그의 pg_dump 를 직접 쓴다.
#   - roles.sql 은 만들지 않는다: 커스텀 역할 0개(사전 조사, 261122).
#   - --no-statistics: pg_dump 18+ 의 통계 덤프는 17 서버에 복원되지 않는다.
#
# 산출물: $OUT_DIR/schema.sql, $OUT_DIR/data.sql (+ 타임스탬프 사본)
source "$(dirname "$0")/lib.sh"
assert_targets

TS=$(date +%Y%m%d-%H%M%S)
OLD=$(db_url OLD)

if [ "${1:-}" != "--data-only" ]; then
  "$PG_DUMP" "$OLD" --schema-only --schema=public --quote-all-identifiers \
    --no-statistics --no-publications --no-subscriptions \
    -f "$OUT_DIR/schema-$TS.sql" 2> >(_mask >&2)
  cp "$OUT_DIR/schema-$TS.sql" "$OUT_DIR/schema.sql"
  echo "schema → $OUT_DIR/schema.sql ($(wc -l < "$OUT_DIR/schema.sql") 줄)"
fi

"$PG_DUMP" "$OLD" --data-only --schema=public --quote-all-identifiers \
  --no-statistics \
  -f "$OUT_DIR/data-$TS.sql" 2> >(_mask >&2)
cp "$OUT_DIR/data-$TS.sql" "$OUT_DIR/data.sql"
chmod 600 "$OUT_DIR"/*.sql
echo "data   → $OUT_DIR/data.sql ($(grep -c '^COPY ' "$OUT_DIR/data.sql") 테이블 COPY)"
