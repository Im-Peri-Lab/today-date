-- ============================================================
-- 020_planned_at.sql
-- activities / places 에 "방문 예정일"(planned_at)을 추가한다.
--
-- 위시리스트 항목에 "이날 가기로 확정했다"는 선택적 날짜. 다녀온 곳의 visited_at 과
-- 대칭되는 개념이다. 처음부터 선택 필드라 nullable 이고 백필·NOT NULL 승격이 없다.
-- 상태 전환(wishlist↔visited)으로 값을 지우지 않는다 — 노출 여부는 화면이 status 로 정한다.
--
-- 멱등하다: ADD COLUMN IF NOT EXISTS. 정책/RLS 는 건드리지 않는다.
-- Supabase SQL Editor에서 전체를 실행하세요.
-- ============================================================

alter table activities add column if not exists planned_at date;
alter table places add column if not exists planned_at date;

comment on column activities.planned_at is
  '방문 예정일(위시리스트용). nullable — 미정이면 NULL. 상태가 바뀌어도 보존한다(020).';
comment on column places.planned_at is
  '방문 예정일(위시리스트용). nullable — 미정이면 NULL. 상태가 바뀌어도 보존한다(020).';

-- 결과 검증 — 어긋나면 전체 롤백.
do $$
begin
  if not exists (select 1 from information_schema.columns
                 where table_schema = 'public' and table_name = 'activities'
                   and column_name = 'planned_at' and data_type = 'date'
                   and is_nullable = 'YES') then
    raise exception '검증 실패: activities.planned_at(nullable date)이 없습니다.';
  end if;

  if not exists (select 1 from information_schema.columns
                 where table_schema = 'public' and table_name = 'places'
                   and column_name = 'planned_at' and data_type = 'date'
                   and is_nullable = 'YES') then
    raise exception '검증 실패: places.planned_at(nullable date)이 없습니다.';
  end if;

  if exists (select 1 from activities where planned_at is not null)
     or exists (select 1 from places where planned_at is not null) then
    raise exception '검증 실패: 적용 직후 planned_at 은 전부 NULL 이어야 합니다.';
  end if;

  raise notice '020 검증 통과: activities/places.planned_at(nullable date) 추가.';
end $$;
