-- 005_add_location.sql
-- activities·places 에 location(지도 검색용 실제 위치) 컬럼 신규 추가.
--
-- 의미: 지도에서 검색할 실제 위치(상호명·관광지명·장소명·주소 모두 허용), optional.
-- 004 에서 places.location → area 로 rename 했던 "추천 범위용 지역 태그"(area)와는
-- 별개 컬럼이다. area·추천 로직은 무변경이며, 이 location 은 표시·지도 검색 전용.
--
-- ADD COLUMN 은 IF NOT EXISTS 를 네이티브로 지원하므로 do $$ 없이도 멱등하다.
-- (004 의 RENAME COLUMN 은 컬럼 단위 IF EXISTS 미지원이라 do $$ 가 필요했던 것.)

alter table activities add column if not exists location text;
alter table places add column if not exists location text;
