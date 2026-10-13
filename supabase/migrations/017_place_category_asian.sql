-- ============================================================
-- 017_place_category_asian.sql
-- 장소 카테고리 '아시안' 신규 추가 (태국·베트남 등 동남아/아시아 음식점 수용).
-- 기존 1~8번 순서·이름·색은 그대로 두고, '아시안'을 9번에 끼워 넣으면서
-- '미분류'만 10번으로 한 칸 양보해 목록 맨 뒤를 유지한다. 기존 places 재분류는 하지 않는다.
-- name 에 unique 제약이 없어 on conflict 가 무의미하므로 where not exists 로 멱등 보장.
-- Supabase SQL Editor에서 전체를 실행하세요.
-- ============================================================

-- 미분류를 먼저 10으로 (이미 10이면 no-op → 재실행 안전)
update place_categories set sort_order = 10 where name = '미분류';

insert into place_categories (name, icon, color, sort_order, is_default)
select '아시안', '🍜', '#F9A825', 9, true
where not exists (select 1 from place_categories where name = '아시안');

do $$
declare cnt int;
begin
  select count(*) into cnt from place_categories where name = '아시안';
  if cnt <> 1 then
    raise exception '아시안 카테고리가 정확히 1건이어야 합니다 (현재 %건).', cnt;
  end if;
end $$;
