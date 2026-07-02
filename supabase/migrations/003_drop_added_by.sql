-- 003_drop_added_by.sql
-- activities / places 의 added_by 컬럼 제거
--
-- added_by 는 "누가 등록했나" 기능용으로 스키마에만 준비됐으나 폼 UI·기본값·
-- CHECK 제약이 끝내 연결되지 않은 미구현 필드였습니다. 앱을 통하면 항상 null 이며,
-- 상세 화면에 노출되던 'partner_b'/'both' 같은 값은 수동/잔여 데이터였습니다.
-- 컬럼을 제거하면 해당 잔여 데이터도 함께 정리됩니다.
--
-- (참고) app_config.partner_a_name / partner_b_name 은 커플 이름 표시용으로
-- 별개 관심사이므로 그대로 둡니다.

alter table activities
  drop column if exists added_by;

alter table places
  drop column if exists added_by;
