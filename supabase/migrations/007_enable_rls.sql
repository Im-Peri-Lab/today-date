-- 007_enable_rls.sql
-- Service-Role-only 아키텍처에서 public 테이블의 Data API 직접 접근을 차단한다.
-- 정책을 만들지 않으므로 anon/authenticated 역할은 모든 행 접근이 거부되며,
-- service_role을 사용하는 서버 런타임은 RLS를 우회해 기존처럼 접근한다.

alter table public.email_tokens enable row level security;
alter table public.activities enable row level security;
alter table public.places enable row level security;
alter table public.activity_categories enable row level security;
alter table public.place_categories enable row level security;
alter table public.recommendations_log enable row level security;
alter table public.app_config enable row level security;
