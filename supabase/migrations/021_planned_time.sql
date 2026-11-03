-- ============================================================
-- 021_planned_time.sql
-- activities / places 에 "방문 예정 시작 시간"(planned_time)을 추가한다.
--
-- 방문 예정일(planned_at, 020)에 붙는 선택적 시작 시간. 다이닝 예약처럼 시간이 정해진
-- 미래 일정을 캘린더에 "시간 지정 일정"으로 내보내기 위해 쓴다. 다녀온 곳(visited_at)에는
-- 시간을 두지 않는다. 처음부터 선택 필드라 nullable 이고 백필·NOT NULL 승격이 없다.
-- 생명주기는 planned_at 과 같다 — 상태 전환으로 지우지 않고, 날짜를 지우면 시간도 함께 지운다.
-- 날짜 없이 시간만 있는 행은 CHECK 로 막는다(API 의 같은 규칙에 대한 마지막 방어선).
--
-- 멱등하다: ADD COLUMN IF NOT EXISTS + 제약은 없을 때만 추가. 정책/RLS 는 건드리지 않는다.
-- Supabase SQL Editor에서 전체를 실행하세요.
-- ============================================================

alter table activities add column if not exists planned_time time;
alter table places add column if not exists planned_time time;

do $$
begin
  if not exists (select 1 from pg_constraint
                 where conname = 'activities_planned_time_requires_date') then
    alter table activities add constraint activities_planned_time_requires_date
      check (planned_time is null or planned_at is not null);
  end if;

  if not exists (select 1 from pg_constraint
                 where conname = 'places_planned_time_requires_date') then
    alter table places add constraint places_planned_time_requires_date
      check (planned_time is null or planned_at is not null);
  end if;
end $$;

comment on column activities.planned_time is
  '방문 예정 시작 시간(Asia/Seoul 벽시계). nullable — 종일이면 NULL. planned_at 없이 둘 수 없다(021).';
comment on column places.planned_time is
  '방문 예정 시작 시간(Asia/Seoul 벽시계). nullable — 종일이면 NULL. planned_at 없이 둘 수 없다(021).';

-- 결과 검증 — 어긋나면 전체 롤백.
do $$
begin
  if not exists (select 1 from information_schema.columns
                 where table_schema = 'public' and table_name = 'activities'
                   and column_name = 'planned_time'
                   and data_type = 'time without time zone'
                   and is_nullable = 'YES') then
    raise exception '검증 실패: activities.planned_time(nullable time)이 없습니다.';
  end if;

  if not exists (select 1 from information_schema.columns
                 where table_schema = 'public' and table_name = 'places'
                   and column_name = 'planned_time'
                   and data_type = 'time without time zone'
                   and is_nullable = 'YES') then
    raise exception '검증 실패: places.planned_time(nullable time)이 없습니다.';
  end if;

  if not exists (select 1 from pg_constraint where conname = 'activities_planned_time_requires_date')
     or not exists (select 1 from pg_constraint where conname = 'places_planned_time_requires_date') then
    raise exception '검증 실패: planned_time CHECK 제약이 없습니다.';
  end if;

  if exists (select 1 from activities where planned_time is not null and planned_at is null)
     or exists (select 1 from places where planned_time is not null and planned_at is null) then
    raise exception '검증 실패: 날짜 없이 시간만 있는 행이 있습니다.';
  end if;

  raise notice '021 검증 통과: activities/places.planned_time(nullable time) + CHECK 추가.';
end $$;
