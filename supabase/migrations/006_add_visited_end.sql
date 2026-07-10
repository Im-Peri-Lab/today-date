-- 006_add_visited_end.sql
-- activities 에 방문 종료일(visited_end_at) 컬럼 신규 추가 — 단일 날짜 → 기간(시작~종료) 확장.
--
-- 의미: visited_at 을 "방문 시작일"로 재해석하고, visited_end_at 이 있으면 기간 방문,
-- NULL 이면 기존과 동일한 단일 날짜 방문이다. 기존 visited 레코드는 모두 end=NULL 이라
-- 표시·동작이 100% 그대로 유지된다(데이터 마이그레이션 불필요).
--
-- 범위: activities 만. places·추천·통계는 visited_at 을 필터/정렬/집계에 쓰지 않아 무관.
-- ADD COLUMN 은 IF NOT EXISTS 를 네이티브 지원하므로 do $$ 없이 멱등하다.

alter table activities add column if not exists visited_end_at date;

-- 종료일은 시작일 이상이어야 한다(둘 중 하나가 NULL 이면 통과 — 단일 날짜 허용).
-- 제약을 멱등하게 재적용하기 위해 먼저 drop.
alter table activities drop constraint if exists activities_visited_range_chk;
alter table activities add constraint activities_visited_range_chk
  check (visited_end_at is null or visited_at is null or visited_end_at >= visited_at);

comment on column activities.visited_at is
  '방문 시작일. visited_end_at 이 NULL 이면 단일 날짜 방문.';
comment on column activities.visited_end_at is
  '방문 종료일(기간 방문). NULL 이면 단일 날짜 방문. 값이 있으면 visited_at ~ visited_end_at 기간.';
