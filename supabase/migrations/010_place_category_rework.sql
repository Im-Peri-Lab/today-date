-- ============================================================
-- 010_place_category_rework.sql
-- 장소 카테고리 개편: '고기' 신규 추가(한식에 섞여 있던 고기 전문점 분리),
-- '전축'을 바로 재분류, 카테고리 정렬 순서 재정리.
-- Supabase SQL Editor에서 전체를 실행하세요.
-- ============================================================

-- ──────────────────────────────────────────────
-- 1. '고기' 카테고리 신규 추가
-- ──────────────────────────────────────────────
insert into place_categories (name, icon, color, sort_order, is_default)
values ('고기', '🥩', '#BF360C', 9, true)
on conflict do nothing;

do $$
begin
  if not exists (select 1 from place_categories where name = '고기') then
    raise exception '고기 카테고리 추가 실패.';
  end if;
end $$;

-- ──────────────────────────────────────────────
-- 2. 기존 places 재분류 (title 기준, 6건)
-- ──────────────────────────────────────────────

-- 고기로 (5건)
update places set category_id = (select id from place_categories where name = '고기')
where title in (
  '금남멧돼지',
  '달맞이광장바베큐',
  '솔밭삼겹살',
  '숙성육관by해봉',
  '여의도미나리삼겹 본점'
);

-- 바로 (1건)
update places set category_id = (select id from place_categories where name = '바')
where title in (
  '전축'
);

-- 재분류 결과 검증: 대상 6개 title이 모두 존재하고 의도한 카테고리를 정확히 가리키는지 확인.
-- 하나라도 title 오타/누락으로 매칭되지 않으면 마이그레이션을 중단한다.
do $$
declare
  expected_total int := 6;
  matched_total  int;
begin
  select count(*) into matched_total
  from places p
  join place_categories c on c.id = p.category_id
  where (p.title, c.name) in (
    ('금남멧돼지', '고기'),
    ('달맞이광장바베큐', '고기'),
    ('솔밭삼겹살', '고기'),
    ('숙성육관by해봉', '고기'),
    ('여의도미나리삼겹 본점', '고기'),
    ('전축', '바')
  );

  if matched_total < expected_total then
    raise exception '재분류 검증 실패: 예상 %건 중 %건만 확인됨. title 오타/누락 여부를 확인하세요.',
      expected_total, matched_total;
  end if;
end $$;

-- ──────────────────────────────────────────────
-- 3. 최종 정렬 순서: 한식 · 고기 · 일식 · 중식 · 양식 · 카페 · 디저트 · 바 · 미분류
-- ──────────────────────────────────────────────
update place_categories set sort_order = 1 where name = '한식';
update place_categories set sort_order = 2 where name = '고기';
update place_categories set sort_order = 3 where name = '일식';
update place_categories set sort_order = 4 where name = '중식';
update place_categories set sort_order = 5 where name = '양식';
update place_categories set sort_order = 6 where name = '카페';
update place_categories set sort_order = 7 where name = '디저트';
update place_categories set sort_order = 8 where name = '바';
update place_categories set sort_order = 9 where name = '미분류';

-- 최종 상태 확인 (9종)
do $$
declare cnt int;
begin
  select count(*) into cnt from place_categories;
  if cnt <> 9 then
    raise exception '최종 place_categories 개수가 9가 아닙니다 (현재 %건). 상태를 확인하세요.', cnt;
  end if;
end $$;
