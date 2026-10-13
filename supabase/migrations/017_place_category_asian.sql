-- ============================================================
-- 017_place_category_asian.sql
-- 장소 카테고리 '아시안' 신규 추가 (태국·베트남 등 동남아/아시아 음식점 수용).
-- additive: 기존 9종의 이름·순서·색은 건드리지 않고, 기존 places 재분류도 하지 않는다.
-- name 에 unique 제약이 없어 on conflict 가 무의미하므로 where not exists 로 멱등 보장.
-- Supabase SQL Editor에서 전체를 실행하세요.
-- ============================================================

insert into place_categories (name, icon, color, sort_order, is_default)
select '아시안', '🍜', '#F9A825', 10, true
where not exists (select 1 from place_categories where name = '아시안');

do $$
declare cnt int;
begin
  select count(*) into cnt from place_categories where name = '아시안';
  if cnt <> 1 then
    raise exception '아시안 카테고리가 정확히 1건이어야 합니다 (현재 %건).', cnt;
  end if;
end $$;
