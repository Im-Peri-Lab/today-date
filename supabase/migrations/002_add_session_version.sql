-- 002_add_session_version.sql
-- app_config에 session_version 컬럼 추가
-- 패스코드 리셋 시 기존 세션을 무효화하는 데 사용됩니다.

alter table app_config
  add column if not exists session_version integer not null default 1;
