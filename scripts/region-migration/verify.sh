#!/usr/bin/env bash
# verify.sql 을 시드니(읽기 전용)·서울 양쪽에 돌려 diff 한다. 차이가 없으면 exit 0.
# 서울에만 있는 Supabase 기본 함수(rls_auto_enable)는 function_supabase_builtin 줄로 따로 보인다.
source "$(dirname "$0")/lib.sh"
assert_targets
SQL="$(dirname "$0")/verify.sql"
psql_old -AtqF $'\t' -f "$SQL" > "$OUT_DIR/verify-old.tsv"
psql_new -AtqF $'\t' -f "$SQL" > "$OUT_DIR/verify-new.tsv"
echo "== 행 수 (시드니 / 서울)"
join -t $'\t' <(grep '^rows' "$OUT_DIR/verify-old.tsv" | cut -f2,3) <(grep '^rows' "$OUT_DIR/verify-new.tsv" | cut -f2,3) \
  | awk -F'\t' '{printf "  %-22s %6s %6s %s\n", $1, $2, $3, ($2==$3?"OK":"DIFF")}'
echo "== 전체 diff (< 시드니, > 서울)"
if diff <(grep -v '^function_supabase_builtin' "$OUT_DIR/verify-old.tsv") \
        <(grep -v '^function_supabase_builtin' "$OUT_DIR/verify-new.tsv"); then
  echo "  차이 없음 ($(wc -l < "$OUT_DIR/verify-old.tsv") 항목)"
else
  exit 1
fi
