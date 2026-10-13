-- ============================================================
-- 018_place_category_rework_v2.sql
-- 장소 카테고리 2차 개편: '디저트' 제거(사용 0건, 카페로 흡수), '뷔페'·'브런치' 신규 추가,
-- 음식 묶음 뒤에 카페·바·미분류가 오도록 정렬 재정리. 기존 places 재분류 없음.
-- 최종: 한식1 · 고기2 · 일식3 · 중식4 · 양식5 · 아시안6 · 뷔페7 · 브런치8 · 카페9 · 바10 · 미분류11
-- 멱등(재실행 안전). name 에 unique 제약이 없어 where not exists 사용.
-- Supabase SQL Editor에서 전체를 실행하세요.
-- ============================================================

-- 1. 디저트 삭제 — 참조하는 places 가 있으면 중단(데이터 유실 방지)
do $$
declare used int;
begin
  select count(*) into used from places
  where category_id in (select id from place_categories where name = '디저트');
  if used > 0 then
    raise exception '디저트를 쓰는 places 가 %건 있습니다. 재분류 후 다시 실행하세요.', used;
  end if;
end $$;

delete from place_categories where name = '디저트';

-- 2. 뷔페·브런치 신규 추가
insert into place_categories (name, icon, color, sort_order, is_default)
select '뷔페', '🍽️', '#009688', 7, true
where not exists (select 1 from place_categories where name = '뷔페');

insert into place_categories (name, icon, color, sort_order, is_default)
select '브런치', '🍳', '#FFB74D', 8, true
where not exists (select 1 from place_categories where name = '브런치');

-- 3. 정렬 재정리
update place_categories set sort_order = 6  where name = '아시안';
update place_categories set sort_order = 7  where name = '뷔페';
update place_categories set sort_order = 8  where name = '브런치';
update place_categories set sort_order = 9  where name = '카페';
update place_categories set sort_order = 10 where name = '바';
update place_categories set sort_order = 11 where name = '미분류';

-- 4. 최종 검증: 정확히 11종, 이름·순서 일치
do $$
declare total int; matched int;
begin
  select count(*) into total from place_categories;
  select count(*) into matched from place_categories
  where (name, sort_order) in (
    ('한식',1),('고기',2),('일식',3),('중식',4),('양식',5),('아시안',6),
    ('뷔페',7),('브런치',8),('카페',9),('바',10),('미분류',11)
  );
  if total <> 11 or matched <> 11 then
    raise exception '검증 실패: 전체 %건, 일치 %건 (각 11이어야 함).', total, matched;
  end if;
end $$;
