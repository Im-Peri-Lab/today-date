-- ============================================================
-- 009_activity_category_rework.sql
-- 활동 카테고리 개편: 체험 신규 추가, 액티비티→레저 rename,
-- "무엇을 하는가" 축과 섞여 있던 실내/계절(조건 축) 제거 + 기존 레코드 재분류.
-- Supabase SQL Editor에서 전체를 실행하세요.
-- ============================================================

-- ──────────────────────────────────────────────
-- 1. '체험' 카테고리 신규 추가
--    (보드게임/방탈출 등 참여형 콘텐츠 — 기존 어떤 카테고리와도 겹치지 않는 결)
-- ──────────────────────────────────────────────
insert into activity_categories (name, icon, color, sort_order, is_default)
values ('체험', '🧩', '#009688', 9, true)
on conflict do nothing;

-- ──────────────────────────────────────────────
-- 2. '액티비티' → '레저' rename
--    (icon/color/id는 유지 — 참조 중인 activities.category_id 영향 없음)
-- ──────────────────────────────────────────────
update activity_categories set name = '레저' where name = '액티비티';

do $$
begin
  if not exists (select 1 from activity_categories where name = '레저') then
    raise exception '레저 rename 실패: 액티비티 카테고리를 찾지 못했습니다.';
  end if;
end $$;

-- ──────────────────────────────────────────────
-- 3. 기존 activities 재분류 (title 기준, 15건)
-- ──────────────────────────────────────────────

-- 문화로 (7건)
update activities set category_id = (select id from activity_categories where name = '문화')
where title in (
  '다양한 엽서를 볼 수 있는 곳',
  '고급스럽게 만화를 봐보자',
  '롯데월드 아쿠아리움 방문',
  '프라이빗 영화관 방문',
  '영화 전시 공연 등을 볼 수 있는 복합 문화공간',
  '별마당 도서관 가기',
  '독서하러 가자'
);

-- 체험으로 (5건)
update activities set category_id = (select id from activity_categories where name = '체험')
where title in (
  '보드게임 카페',
  '리모델링한 영화관에서 프라이빗한 보드카페',
  '방탈출 카페',
  '미스테리한 이색 체험 공간',
  '프라이빗 룸에서 진행되는 암흑체험 프로그램'
);

-- 여행으로 (2건)
update activities set category_id = (select id from activity_categories where name = '여행')
where title in (
  '호캉스 in 웨스틴 조선',
  '호캉스 in 웨스틴 서울 파르나스'
);

-- 레저로 (1건)
update activities set category_id = (select id from activity_categories where name = '레저')
where title in (
  '스키타러 가기'
);

-- 재분류 결과 검증: 대상 15개 title이 모두 존재하고 의도한 카테고리를 정확히 가리키는지 확인.
-- 하나라도 title 오타/누락으로 매칭되지 않으면 마이그레이션을 중단한다.
do $$
declare
  expected_total int := 15;
  matched_total  int;
begin
  select count(*) into matched_total
  from activities a
  join activity_categories c on c.id = a.category_id
  where (a.title, c.name) in (
    ('다양한 엽서를 볼 수 있는 곳', '문화'),
    ('고급스럽게 만화를 봐보자', '문화'),
    ('롯데월드 아쿠아리움 방문', '문화'),
    ('프라이빗 영화관 방문', '문화'),
    ('영화 전시 공연 등을 볼 수 있는 복합 문화공간', '문화'),
    ('별마당 도서관 가기', '문화'),
    ('독서하러 가자', '문화'),
    ('보드게임 카페', '체험'),
    ('리모델링한 영화관에서 프라이빗한 보드카페', '체험'),
    ('방탈출 카페', '체험'),
    ('미스테리한 이색 체험 공간', '체험'),
    ('프라이빗 룸에서 진행되는 암흑체험 프로그램', '체험'),
    ('호캉스 in 웨스틴 조선', '여행'),
    ('호캉스 in 웨스틴 서울 파르나스', '여행'),
    ('스키타러 가기', '레저')
  );

  if matched_total < expected_total then
    raise exception '재분류 검증 실패: 예상 %건 중 %건만 확인됨. title 오타/누락 여부를 확인하세요.',
      expected_total, matched_total;
  end if;
end $$;

-- ──────────────────────────────────────────────
-- 4. '실내' / '계절' 카테고리 삭제
--    삭제 전 참조가 0건인지 재확인 — 남아있으면 재분류가 누락된 것이므로 중단.
-- ──────────────────────────────────────────────
do $$
declare orphan_count int;
begin
  select count(*) into orphan_count
  from activities a
  join activity_categories c on c.id = a.category_id
  where c.name in ('실내', '계절');

  if orphan_count > 0 then
    raise exception '실내/계절 카테고리를 참조하는 activities가 %건 남아있어 삭제를 중단합니다. 재분류를 먼저 완료하세요.',
      orphan_count;
  end if;
end $$;

delete from activity_categories where name in ('실내', '계절');

-- ──────────────────────────────────────────────
-- 5. 최종 정렬 순서: 레저 · 체험 · 문화 · 축제 · 자연 · 여행 · 미분류
-- ──────────────────────────────────────────────
update activity_categories set sort_order = 1 where name = '레저';
update activity_categories set sort_order = 2 where name = '체험';
update activity_categories set sort_order = 3 where name = '문화';
update activity_categories set sort_order = 4 where name = '축제';
update activity_categories set sort_order = 5 where name = '자연';
update activity_categories set sort_order = 6 where name = '여행';
update activity_categories set sort_order = 7 where name = '미분류';

-- 최종 상태 확인 (7종)
do $$
declare cnt int;
begin
  select count(*) into cnt from activity_categories;
  if cnt <> 7 then
    raise exception '최종 activity_categories 개수가 7이 아닙니다 (현재 %건). 상태를 확인하세요.', cnt;
  end if;
end $$;
