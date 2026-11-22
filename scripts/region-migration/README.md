# Supabase 리전 이전 (ap-southeast-2 시드니 → ap-northeast-2 서울)

운영 DB 의 `public` 스키마를 서울 프로젝트로 **dump → restore** 한다(Supabase 공식 "Backup and
Restore using CLI" 방식 기준). 001~021 마이그레이션은 다시 돌리지 않는다. 시드니는 읽기만 한다.

- 대상: `public` 만 (Supabase Auth·Storage 미사용). 커스텀 역할 0개 → `roles.sql` 단계 생략.
- id(`couple_id` 등)·`session_version`·타임스탬프는 값 그대로 → 기존 세션 쿠키 유지.
- 함수 리전도 함께 옮겨야 효과가 있다(`vercel.json` `regions`). DB 만 옮기면 오히려 느려진다.

## 준비

| 항목 | 내용 |
|---|---|
| 클라이언트 | `pg_dump`/`psql` ≥ 17 (서버 버전 이상). `brew install libpq` — 스크립트가 자동으로 찾는다. 2026-11-22 리허설은 19.0 |
| 접속 정보 | 리포 루트 `.env.migration` (git 무시): `OLD_DB_URL`(시드니)·`NEW_DB_URL`(서울), 둘 다 **session pooler(5432)** |
| 비밀번호 | 원문 그대로 둬도 된다 — 스크립트가 퍼센트 인코딩한다. 대시보드 템플릿의 `[ ]` 가 남아 있으면 경고 후 벗긴다 |
| worktree | worktree 에는 `.env.migration` 이 없다 → `export ENV_FILE=<원래 작업 폴더>/.env.migration` |
| 산출물 | `.migration/` (git 무시, 700) — dump 파일은 커밋하지 않는다 |

안전장치: 모든 스크립트가 `OLD`=ap-southeast-2 / `NEW`=ap-northeast-2 호스트인지 먼저 확인한다.
시드니 세션은 `SET default_transaction_read_only = on` 으로 연다(pooler 경유라 `PGOPTIONS` 는 무시됨).

## 스크립트

| 스크립트 | 하는 일 | 쓰기 대상 |
|---|---|---|
| `dump.sh [--data-only]` | 시드니 `public` → `.migration/schema.sql`, `data.sql` | 없음 (로컬 파일) |
| `restore.sh` | **최초 1회**. 서울 public 이 비어 있을 때만 schema+data 를 한 트랜잭션으로 복원, `rls_auto_enable` 실행 권한 회수 | 서울 |
| `reload-data.sh [--skip-dump]` | **컷오버용**. 시드니 최신 data dump → 서울 public 전 테이블 TRUNCATE → 재적재 (한 트랜잭션, 실패 시 롤백) | 서울 (데이터만) |
| `verify.sh` / `verify.sql` | 양쪽에 같은 쿼리 → diff. 행 수·내용 md5·RLS·정책·제약·인덱스·트리거·함수 search_path·GRANT·owner·enum | 없음 |

## 최초 복제 (리허설 2026-11-22 완료)

```bash
export ENV_FILE=/path/to/today-date/.env.migration
scripts/region-migration/dump.sh
scripts/region-migration/restore.sh
scripts/region-migration/verify.sh      # "차이 없음" 이어야 한다
```

`restore.sh` 가 schema.sql 에서 빼는 줄(새 프로젝트에 같은 값이 이미 있어 실패하거나 실행 권한이 없는 것):
`CREATE SCHEMA "public"`, `ALTER SCHEMA "public" OWNER`, `COMMENT ON SCHEMA "public"`,
`ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" …`. `FOR ROLE "postgres"` 기본 권한은 원본 그대로 적용된다.

새 프로젝트 차이(2026-11 생성 프로젝트): Supabase 가 `public.rls_auto_enable()`(SECURITY DEFINER) +
이벤트 트리거 `ensure_rls` 를 기본으로 넣는다. ACL 이 비어 있어 Security Advisor WARN 2건이 생기므로
`restore.sh` 가 `REVOKE EXECUTE … FROM PUBLIC, anon, authenticated` 한다(함수·트리거는 유지).
`verify.sh` 는 이 함수를 `function_supabase_builtin` 으로 분리해 diff 에서 뺀다.

## 컷오버 (데이터만 다시 덮어쓰기)

```bash
# 0) 시드니 쪽 쓰기를 멈춘다(사용자 공지 / 유지보수 시간) — 이후 시드니에 들어온 쓰기는 서울에 없다
scripts/region-migration/reload-data.sh  # 시드니 최신 data dump → 서울 TRUNCATE → 재적재
scripts/region-migration/verify.sh       # 행 수·md5 전부 일치 확인
# 1) Vercel Production 환경변수 SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 를 서울 값으로 교체
# 2) vercel.json regions = ["icn1"] 가 들어간 커밋을 프로덕션 배포
# 3) 프로덕션 X-Vercel-Id 가 icn1::icn1::… 인지, 로그인·홈·/list·상세 확인
```

스키마가 리허설 이후 바뀌었다면(새 마이그레이션) `reload-data.sh` 전에 그 마이그레이션을 서울에도 적용한다 —
`reload-data.sh` 는 스키마를 건드리지 않으며, 컬럼이 다르면 COPY 단계에서 실패하고 전체 롤백된다.
