# Today Date

커플 두 사람이 함께 데이트 장소와 활동을 관리하고, 빠르게 추천받을 수 있는 PWA입니다. 위시리스트에 담아 두었다가 그날의 조건(시간·분위기·식사 여부)에 맞는 코스를 골라 주며, 방문 기록과 평점까지 함께 쌓아 갑니다.

---

## 시작 전 준비 체크리스트

### 1. Supabase 프로젝트 생성
- [supabase.com](https://supabase.com) → **New project** 생성
- **Settings → API** 에서 아래 두 값을 복사합니다:
  - `Project URL` → `SUPABASE_URL`
  - `service_role` secret → `SUPABASE_SERVICE_ROLE_KEY`

### 2. Supabase 스키마 적용
- Supabase 대시보드 **SQL Editor** 를 열고  
  `/supabase/migrations/001_init.sql` 파일 전체 내용을 붙여넣어 실행합니다.
- 테이블, 타입, 시드 데이터가 자동으로 생성됩니다.

### 3. Resend API Key 발급
- [resend.com](https://resend.com) → **API Keys → Create API Key**
- 발급된 키를 `RESEND_API_KEY` 에 입력합니다.
- 발신 도메인을 인증하거나, 테스트 시에는 Resend 기본 도메인(`onboarding@resend.dev`)을 사용하세요.
- `EMAIL_FROM` 예시: `Today Date <[MASKED_EMAIL]>`

### 4. SESSION_SECRET 생성
터미널에서 아래 명령어로 32바이트 랜덤 문자열을 생성합니다:

```bash
openssl rand -base64 32
```

출력된 값을 `SESSION_SECRET` 에 입력합니다.

### 5. 환경변수 파일 설정

```bash
cp .env.local.example .env.local
```

`.env.local` 을 열고 위 단계에서 얻은 값들을 채워 넣습니다:

```env
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
RESEND_API_KEY=re_...
[MASKED_EMAIL]
SESSION_SECRET=<openssl 출력값>
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 개발 서버 실행

```bash
npm install
npm run dev
```

[http://localhost:3000](http://localhost:3000) 을 브라우저에서 열면 앱이 실행됩니다.

---

## 기술 스택

| 영역 | 라이브러리 |
|------|-----------|
| 프레임워크 | Next.js 14 (App Router) |
| 스타일링 | Tailwind CSS + shadcn/ui |
| DB | Supabase (PostgreSQL) |
| 세션 | iron-session |
| 이메일 | Resend |
| 폼 | react-hook-form + zod |
| 서버 상태 | TanStack Query |
