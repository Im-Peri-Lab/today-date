-- ============================================================
-- 011_activity_indoor_outdoor.sql
-- activities 전용 실내/실외 속성 추가. 2-value("무관" 없음), 필수(NOT NULL).
-- 기존 47건 전체를 title 기준으로 실측 재분류한 뒤에만 NOT NULL 제약을 건다.
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

-- 1단계: 우선 nullable로 추가 — 기존 row를 채운 뒤에만 NOT NULL로 승격한다.
-- ADD COLUMN은 IF NOT EXISTS를 네이티브 지원하므로 do $$ 없이 멱등하다.
alter table activities add column if not exists location_type location_type;

-- ──────────────────────────────────────────────
-- 2단계: 기존 activities 소급 재분류 (title 기준, 47건)
-- ──────────────────────────────────────────────

-- 실내 (22건)
update activities set location_type = 'indoor'
where title in (
  '가죽공방',
  '고급스럽게 만화를 봐보자',
  '너무 착한데?전 & 틀린 건 아닌데전',
  '다양한 엽서를 볼 수 있는 곳',
  '독서하러 가자',
  '롯데월드 아쿠아리움 방문',
  '미술관 관람',
  '별마당 도서관 가기',
  '아늑한 분위기에서 책과 음료를 즐겨보자',
  '아시아프 100 관람',
  '영화 전시 공연 등을 볼 수 있는 복합 문화공간',
  '원데이 클래스',
  '편한 공간에서 좋은 스피커로 음악감상하기',
  '프라이빗 영화관 방문',
  '호캉스 in 웨스틴 서울 파르나스',
  '호캉스 in 웨스틴 조선',
  '리모델링한 영화관에서 프라이빗한 보드카페',
  '미스테리한 이색 체험 공간',
  '방탈출 카페',
  '보드게임 카페',
  '프라이빗 룸에서 진행되는 암흑체험 프로그램',
  '서울 식물원'
);

-- 실외 (25건)
update activities set location_type = 'outdoor'
where title in (
  '교복입고 롯데월드 가기',
  '등산하기',
  '빠지 가기',
  '서울썸머비치 2026',
  '서울크루즈 탑승',
  '스키타러 가기',
  '아난티 중앙 2인 라운딩',
  '오사카 유니버셜 스튜디오',
  '워터파크 가기',
  '이랜드크루즈 탑승(여의도)',
  '포레스트힐 2인 라운딩',
  '한강에서 자전거 타기',
  '한복 입고 고궁 나들이',
  '고창 보리밭 방문',
  '비발디파크',
  '제주도 여행',
  '강릉 바다',
  '동해바다 당일치기',
  '벚꽃 야경 보러가기',
  '천문대 별보러 가기',
  '한강 피크닉',
  '한강 피크닉 가기',
  '바베큐페스티벌',
  '불꽃축제 관람',
  '한강 드론쇼 보기'
);

-- ──────────────────────────────────────────────
-- 3단계: 재분류 검증 — 전체 activities 건수 = 47, title 매칭 = 47이어야 한다.
-- 하나라도 title 오타/누락·row 수 불일치가 있으면 NOT NULL을 걸지 않고 중단한다.
-- ──────────────────────────────────────────────
do $$
declare
  expected_total int := 47;
  total_rows     int;
  matched_total  int;
  unset_count    int;
begin
  select count(*) into total_rows from activities;
  if total_rows <> expected_total then
    raise exception 'activities 전체 건수가 %건이 아니라 %건입니다. 재분류 대상 목록이 최신 상태와 다를 수 있어 중단합니다.',
      expected_total, total_rows;
  end if;

  select count(*) into matched_total
  from activities a
  where (a.title, a.location_type) in (
    ('가죽공방', 'indoor'),
    ('고급스럽게 만화를 봐보자', 'indoor'),
    ('너무 착한데?전 & 틀린 건 아닌데전', 'indoor'),
    ('다양한 엽서를 볼 수 있는 곳', 'indoor'),
    ('독서하러 가자', 'indoor'),
    ('롯데월드 아쿠아리움 방문', 'indoor'),
    ('미술관 관람', 'indoor'),
    ('별마당 도서관 가기', 'indoor'),
    ('아늑한 분위기에서 책과 음료를 즐겨보자', 'indoor'),
    ('아시아프 100 관람', 'indoor'),
    ('영화 전시 공연 등을 볼 수 있는 복합 문화공간', 'indoor'),
    ('원데이 클래스', 'indoor'),
    ('편한 공간에서 좋은 스피커로 음악감상하기', 'indoor'),
    ('프라이빗 영화관 방문', 'indoor'),
    ('호캉스 in 웨스틴 서울 파르나스', 'indoor'),
    ('호캉스 in 웨스틴 조선', 'indoor'),
    ('리모델링한 영화관에서 프라이빗한 보드카페', 'indoor'),
    ('미스테리한 이색 체험 공간', 'indoor'),
    ('방탈출 카페', 'indoor'),
    ('보드게임 카페', 'indoor'),
    ('프라이빗 룸에서 진행되는 암흑체험 프로그램', 'indoor'),
    ('서울 식물원', 'indoor'),
    ('교복입고 롯데월드 가기', 'outdoor'),
    ('등산하기', 'outdoor'),
    ('빠지 가기', 'outdoor'),
    ('서울썸머비치 2026', 'outdoor'),
    ('서울크루즈 탑승', 'outdoor'),
    ('스키타러 가기', 'outdoor'),
    ('아난티 중앙 2인 라운딩', 'outdoor'),
    ('오사카 유니버셜 스튜디오', 'outdoor'),
    ('워터파크 가기', 'outdoor'),
    ('이랜드크루즈 탑승(여의도)', 'outdoor'),
    ('포레스트힐 2인 라운딩', 'outdoor'),
    ('한강에서 자전거 타기', 'outdoor'),
    ('한복 입고 고궁 나들이', 'outdoor'),
    ('고창 보리밭 방문', 'outdoor'),
    ('비발디파크', 'outdoor'),
    ('제주도 여행', 'outdoor'),
    ('강릉 바다', 'outdoor'),
    ('동해바다 당일치기', 'outdoor'),
    ('벚꽃 야경 보러가기', 'outdoor'),
    ('천문대 별보러 가기', 'outdoor'),
    ('한강 피크닉', 'outdoor'),
    ('한강 피크닉 가기', 'outdoor'),
    ('바베큐페스티벌', 'outdoor'),
    ('불꽃축제 관람', 'outdoor'),
    ('한강 드론쇼 보기', 'outdoor')
  );

  if matched_total < expected_total then
    raise exception '재분류 검증 실패: 예상 %건 중 %건만 확인됨. title 오타/누락 여부를 확인하세요.',
      expected_total, matched_total;
  end if;

  -- 47건 매칭 + 전체 47건이 이미 확인됐으므로 이 시점에 NULL은 이론상 없어야 하지만,
  -- NOT NULL 승격 직전 마지막 방어선으로 한 번 더 명시적으로 확인한다.
  select count(*) into unset_count from activities where location_type is null;
  if unset_count > 0 then
    raise exception 'location_type이 비어있는 activities가 %건 남아있어 NOT NULL 제약을 중단합니다.',
      unset_count;
  end if;
end $$;

-- ──────────────────────────────────────────────
-- 4단계: 검증 통과 후에만 NOT NULL 승격
-- ──────────────────────────────────────────────
alter table activities alter column location_type set not null;

comment on column activities.location_type is
  '실내/실외(필수). 2-value, "무관" 값 없음. activities 전용, places는 대상 아님.';
