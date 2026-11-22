#!/usr/bin/env bash
# 리전 이전 스크립트 공통부. 직접 실행하지 않고 다른 스크립트가 source 한다.
#
# 접속 정보: 리포 루트 .env.migration (git 무시) 의 OLD_DB_URL(시드니) / NEW_DB_URL(서울).
#   - session pooler(5432) 문자열을 그대로 붙여 넣는다. 비밀번호에 특수문자가 있어도
#     여기서 퍼센트 인코딩하므로 원문 그대로 둬도 된다.
#   - 대시보드 템플릿의 [YOUR-PASSWORD] 대괄호가 남아 있으면(=[비밀번호]) 경고 후 벗겨 쓴다.
# 접속 문자열·비밀번호는 어떤 출력에도 찍지 않는다(psql 오류 메시지의 URL 도 가린다).
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ENV_FILE="${ENV_FILE:-$REPO_ROOT/.env.migration}"
OUT_DIR="${OUT_DIR:-$REPO_ROOT/.migration}"   # dump 산출물 — .gitignore 대상, 커밋 금지

PG_BIN="${PG_BIN:-}"
if [ -z "$PG_BIN" ]; then
  if command -v brew >/dev/null 2>&1 && [ -x "$(brew --prefix libpq 2>/dev/null)/bin/pg_dump" ]; then
    PG_BIN="$(brew --prefix libpq)/bin"
  else
    PG_BIN="$(dirname "$(command -v pg_dump)")"
  fi
fi
PG_DUMP="$PG_BIN/pg_dump"
PSQL="$PG_BIN/psql"

# pg_dump 는 서버(Postgres 17) 이상이어야 한다.
_pgv=$("$PG_DUMP" --version | sed -E 's/.* ([0-9]+)(\.[0-9]+)?.*/\1/')
if [ "$_pgv" -lt 17 ]; then
  echo "pg_dump $_pgv < 17 — 서버(17) 이상 버전이 필요하다 (brew install libpq)" >&2
  exit 1
fi

[ -f "$ENV_FILE" ] || { echo "$ENV_FILE 없음" >&2; exit 1; }

# db_url OLD|NEW → 퍼센트 인코딩된 URL (변수 캡처 전용, 화면에 출력하지 말 것)
db_url() {
  python3 -I - "$ENV_FILE" "$1" <<'PY'
import re, sys
from urllib.parse import quote, unquote
env = {}
for line in open(sys.argv[1]):
    line = line.strip()
    if '=' in line and not line.startswith('#'):
        k, v = line.split('=', 1)
        env[k.strip()] = v.strip().strip('"').strip("'")
key = sys.argv[2] + '_DB_URL'
m = re.match(r'^(postgres(?:ql)?)://([^:]+):(.*)@([^@/]+)/([^?\s]+)', env.get(key, ''))
if not m:
    sys.exit(f'{key}: postgresql://user:password@host:port/db 형식이 아니다')
_, user, pw, hostport, db = m.groups()
if pw.startswith('[') and pw.endswith(']'):
    print(f'경고: {key} 비밀번호가 [ ] 로 감싸져 있어 벗겨서 쓴다(대시보드 템플릿 표기)', file=sys.stderr)
    pw = pw[1:-1]
pw = unquote(pw)  # 이미 인코딩돼 있어도 한 번 풀고 다시 인코딩 → 이중 인코딩 방지
print(f"postgresql://{user}:{quote(pw, safe='')}@{hostport}/{db}?sslmode=require")
PY
}

_mask() { sed -E 's#postgres(ql)?://[^ ]*#<url>#g'; }

# 시드니는 읽기 전용으로만 연다 — pooler 경유라 PGOPTIONS 가 먹지 않아 세션 첫 명령으로 건다.
psql_old() { "$PSQL" "$(db_url OLD)" -X -v ON_ERROR_STOP=1 -c 'SET default_transaction_read_only = on' "$@" 2> >(_mask >&2); }
psql_new() { "$PSQL" "$(db_url NEW)" -X -v ON_ERROR_STOP=1 "$@" 2> >(_mask >&2); }

# 서울 프로젝트 ref 확인용(쓰기 대상이 시드니가 아님을 매번 보장)
NEW_HOST_EXPECT="${NEW_HOST_EXPECT:-ap-northeast-2}"
OLD_HOST_EXPECT="${OLD_HOST_EXPECT:-ap-southeast-2}"
assert_targets() {
  local old new
  old=$(db_url OLD); new=$(db_url NEW)
  [[ "$new" == *"$NEW_HOST_EXPECT"* ]] || { echo "NEW_DB_URL 이 $NEW_HOST_EXPECT 가 아니다 — 중단" >&2; exit 1; }
  [[ "$old" == *"$OLD_HOST_EXPECT"* ]] || { echo "OLD_DB_URL 이 $OLD_HOST_EXPECT 가 아니다 — 중단" >&2; exit 1; }
  [ "$old" != "$new" ] || { echo "OLD 와 NEW 가 같다 — 중단" >&2; exit 1; }
}

mkdir -p "$OUT_DIR"
chmod 700 "$OUT_DIR"
