# TSC Study

중국어 학습용 PWA — 강사가 음원을 올리면 자동 전사·병음 생성, 학생들이 가사 싱크 재생으로 학습.

## 시작하기

```bash
# 의존성 설치
npm install

# 환경변수 설정
cp .env.example .env
# .env 파일 편집 — Supabase / R2 / Groq 키 입력

# 개발 서버
npm run dev
# → http://localhost:5173
# 같은 네트워크의 폰에서도 접속 가능 (vite가 호스트 출력)
```

## 데이터베이스 셋업 (최초 1회)

1. Supabase 프로젝트의 **SQL Editor** 열기
2. `supabase/migrations/001_initial.sql` 내용 복사 → 실행
3. **Authentication → URL Configuration → Redirect URLs**에 `http://localhost:5173/**` 추가

## 스크립트

| 명령              | 동작                       |
| ----------------- | -------------------------- |
| `npm run dev`     | 개발 서버 (HMR, 포트 5173) |
| `npm run build`   | 프로덕션 빌드              |
| `npm run preview` | 빌드 결과 로컬 미리보기    |
| `npm run check`   | 타입 체크 (svelte-check)   |
| `npm run format`  | Prettier 포맷팅            |

## 문서

- [`docs/decisions.md`](./docs/decisions.md) — 아키텍처 결정 이력 (요구사항, 스택, MVP 범위, 단계별 계획)

## 기술 스택

SvelteKit · Supabase (DB+Auth) · Cloudflare R2 (음원) · transformers.js + Groq (전사) · pinyin-pro · Vercel
