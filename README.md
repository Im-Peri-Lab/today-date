# Today Date 💜

커플 두 사람이 함께 데이트 장소와 활동을 관리하고, 빠르게 추천받을 수 있는 PWA입니다. 위시리스트에 담아 두었다가 그날의 조건(시간·분위기·식사 여부)에 맞는 코스를 골라 주며, 방문 기록과 평점까지 함께 쌓아 갑니다.

## 주요 기능

- **🔐 패스코드 잠금** — 이메일 인증 + 4~6자리 패스코드로 두 사람만 접근
- **✍️ 활동/장소 등록** — 카테고리·소요시간·시간대·식사시간·위치·메모와 함께 위시리스트 관리
- **📋 통합 목록** — 활동/장소 탭, 위시리스트/다녀온 곳 토글, 카테고리·검색 필터, 수정/삭제/방문 토글
- **🎯 오늘 뭐할까?** — 가용 시간·시간대·카테고리 조건으로 활동 추천 (가중치 점수 + 다양성)
- **📍 어디 갈까?** — 식사시간·위치·카테고리 조건으로 장소 추천
- **📊 대시보드** — 총 활동/장소, 다녀온 곳, 이번 달 방문 통계

---

## 환경변수

`.env.local.example` 을 복사해 `.env.local` 을 만들고 아래 키를 채웁니다. (`.env.local` 은 절대 커밋되지 않습니다)

| 키 | 설명 |
|----|------|
| `SUPABASE_URL` | Supabase 프로젝트 URL (Settings → API → Project URL) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role 시크릿 키 (서버 전용) |
| `RESEND_API_KEY` | Resend API 키 (이메일 인증 발송용) |
| `EMAIL_FROM` | 발신자 표기. 예: `Today Date <onboarding@resend.dev>` |
| `SESSION_SECRET` | iron-session 암호화 키. `openssl rand -base64 32` 로 생성 |
| `NEXT_PUBLIC_APP_URL` | 앱 base URL. 로컬은 `http://localhost:3000`, 운영은 배포 도메인 |

> ⚠️ `NODE_TLS_REJECT_UNAUTHORIZED=0` 같은 TLS 검증 비활성화 변수는 **운영 환경에 절대 설정하지 마세요.**

---

## 시작 전 준비

### 1. Supabase 프로젝트 생성
- [supabase.com](https://supabase.com) → **New project** 생성
- **Settings → API** 에서 `Project URL`, `service_role` 시크릿을 복사

### 2. 스키마 적용
- Supabase 대시보드 **SQL Editor** 에서 `supabase/migrations/` 폴더의 SQL 파일을
  파일명 순서대로(`001_init.sql` → `002_...`) 붙여넣어 실행합니다.
- 테이블, 타입, 시드 데이터(카테고리)가 생성됩니다.

### 3. Resend API Key 발급
- [resend.com](https://resend.com) → **API Keys → Create API Key**
- 테스트 시에는 Resend 기본 도메인(`onboarding@resend.dev`)을 `EMAIL_FROM` 에 사용할 수 있습니다.

### 4. SESSION_SECRET 생성

```bash
openssl rand -base64 32
```

### 5. 환경변수 파일 설정

```bash
cp .env.local.example .env.local
# .env.local 을 열어 위 표의 값들을 채웁니다
```

---

## 로컬 실행

```bash
npm install
npm run dev
```

[http://localhost:3000](http://localhost:3000) 을 브라우저에서 엽니다. 최초 접속 시 `/setup` 에서 이메일 인증과 패스코드 설정을 진행합니다.

프로덕션 빌드 검증:

```bash
npm run build
npm run start
```

---

## 배포 (Vercel)

1. GitHub 저장소를 [Vercel](https://vercel.com) 에 import
2. **Settings → Environment Variables** 에 위 환경변수 표의 키를 모두 등록
   - `NEXT_PUBLIC_APP_URL` 은 배포 도메인으로 설정
   - TLS 검증 비활성화 변수(`NODE_TLS_REJECT_UNAUTHORIZED`) 는 등록하지 않음
3. Framework Preset: **Next.js** (빌드/출력 설정 자동)
4. Deploy

**배포 URL:** _(배포 후 추가 예정)_

---

## 기술 스택

| 영역 | 라이브러리 |
|------|-----------|
| 프레임워크 | Next.js 14 (App Router) |
| 스타일링 | Tailwind CSS + shadcn/ui (base-ui) |
| DB | Supabase (PostgreSQL) |
| 세션 | iron-session |
| 이메일 | Resend |
| 폼 | react-hook-form + zod |
| 서버 상태 | TanStack Query |
