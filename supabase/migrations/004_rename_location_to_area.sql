-- 004_rename_location_to_area.sql
-- places 의 location 컬럼을 area 로 rename
--
-- location 은 "추천 범위용 지역 태그"(성수/홍대 등) 의미로 쓰여왔으나 컬럼명이
-- 좌표/주소를 연상시켜 혼동을 줬습니다. 의미를 명확히 하기 위해 area 로 바꿉니다.
-- 화면 라벨도 "위치" → "지역" 으로 함께 변경됩니다(앱 코드).
--
-- (참고) activities 에는 해당 컬럼이 없어 places 만 대상입니다.
-- RENAME COLUMN 은 컬럼 단위 IF EXISTS 를 지원하지 않으므로 DO 블록으로 멱등 처리.

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_name = 'places' and column_name = 'location'
  ) then
    alter table places rename column location to area;
  end if;
end $$;
