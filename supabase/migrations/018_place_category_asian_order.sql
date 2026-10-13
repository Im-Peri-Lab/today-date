-- ============================================================
-- 018_place_category_asian_order.sql
-- '아시안'을 음식 묶음(한식·고기·일식·중식·양식) 바로 뒤, 카페 앞으로 이동.
-- 최종: 한식1 · 고기2 · 일식3 · 중식4 · 양식5 · 아시안6 · 카페7 · 디저트8 · 바9 · 미분류10
-- sort_order 만 바꾸며 멱등(재실행 안전). 행 추가·삭제·재분류 없음.
-- Supabase SQL Editor에서 전체를 실행하세요.
-- ============================================================

update place_categories set sort_order = 6  where name = '아시안';
update place_categories set sort_order = 7  where name = '카페';
update place_categories set sort_order = 8  where name = '디저트';
update place_categories set sort_order = 9  where name = '바';
update place_categories set sort_order = 10 where name = '미분류';

do $$
declare cnt int;
begin
  select count(*) into cnt from place_categories
  where (name, sort_order) in (
    ('한식',1),('고기',2),('일식',3),('중식',4),('양식',5),
    ('아시안',6),('카페',7),('디저트',8),('바',9),('미분류',10)
  );
  if cnt <> 10 then
    raise exception '정렬 검증 실패: 10종 중 %건만 일치합니다.', cnt;
  end if;
end $$;
