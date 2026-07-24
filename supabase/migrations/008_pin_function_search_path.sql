-- 008_pin_function_search_path.sql
-- touch_updated_at 트리거 함수의 객체 탐색 경로를 고정한다.
-- 함수 본문과 기존 트리거 동작은 변경하지 않는다.

alter function public.touch_updated_at()
  set search_path = public, pg_temp;
