-- ============================================================
-- 019_activity_category_workout_shopping.sql
-- 활동 카테고리 '운동'·'쇼핑' 신규 추가 + 전체 순서 재배치.
-- 최종 순서: 레저 → 운동 → 쇼핑 → 체험 → 문화 → 축제 → 자연 → 여행 → 미분류
-- 기존 activities.category_id 는 건드리지 않는다(재분류·데이터 마이그레이션 없음).
-- name 에 unique 제약이 없어 where not exists 로 멱등 보장. 재실행 안전.
-- Supabase SQL Editor에서 전체를 실행하세요.
-- ============================================================

insert into activity_categories (name, icon, color, sort_order, is_default)
select '운동', '🏋️', '#3F51B5', 2, true
where not exists (select 1 from activity_categories where name = '운동');

insert into activity_categories (name, icon, color, sort_order, is_default)
select '쇼핑', '🛍️', '#E91E63', 3, true
where not exists (select 1 from activity_categories where name = '쇼핑');

update activity_categories set sort_order = 1 where name = '레저';
update activity_categories set sort_order = 2 where name = '운동';
update activity_categories set sort_order = 3 where name = '쇼핑';
update activity_categories set sort_order = 4 where name = '체험';
update activity_categories set sort_order = 5 where name = '문화';
update activity_categories set sort_order = 6 where name = '축제';
update activity_categories set sort_order = 7 where name = '자연';
update activity_categories set sort_order = 8 where name = '여행';
update activity_categories set sort_order = 9 where name = '미분류';

do $$
declare cnt int;
begin
  select count(*) into cnt from activity_categories where name in ('운동', '쇼핑');
  if cnt <> 2 then
    raise exception '운동/쇼핑 카테고리가 각각 1건씩 총 2건이어야 합니다 (현재 %건).', cnt;
  end if;
  select count(*) into cnt from activity_categories;
  if cnt <> 9 then
    raise exception '최종 activity_categories 개수가 9가 아닙니다 (현재 %건). 상태를 확인하세요.', cnt;
  end if;
end $$;
