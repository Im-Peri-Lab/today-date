-- ============================================================
-- 011_activity_indoor_outdoor.sql
-- activities 전용 실내/실외 속성 추가. 2-value("무관" 없음), nullable —
-- duration_bucket과 동일 계열(값이 있을 수도 없을 수도 있는 조건형 컬럼).
-- 기존 22건은 전부 NULL로 남고, 강제 재분류하지 않는다.
-- places 테이블은 대상 아님.
-- Supabase SQL Editor에서 전체를 실행하세요.
-- ============================================================

-- enum 타입은 네이티브 IF NOT EXISTS를 지원하지 않아 존재 확인 후 생성으로 멱등하게 만든다.
do $$
begin
  if not exists (select 1 from pg_type where typname = 'location_type') then
    create type location_type as enum ('indoor', 'outdoor');
  end if;
end $$;

-- ADD COLUMN은 IF NOT EXISTS를 네이티브 지원하므로 do $$ 없이 멱등하다.
alter table activities add column if not exists location_type location_type;

comment on column activities.location_type is
  '실내/실외. NULL이면 미입력(무관 아님 — 단순 미선택). activities 전용, places는 대상 아님.';
