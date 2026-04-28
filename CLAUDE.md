# CLAUDE.md

> 이 프로젝트에서 Claude Code 작업 시 우선 참조하는 가이드.
> 결정 이력은 `docs/decisions.md`, 영속 메모(git identity 등)는 `~/.claude/projects/-Users-minishiba-github-tsc-study/memory/MEMORY.md`.

## 프로젝트 개요

**TSC Study** — 중국어 학습용 PWA. 강사가 음원을 업로드하면 자동으로 한자 + 병음 + 타임스탬프가 생성되고, 학생들이 아이폰 뮤직앱처럼 가사 보며 재생한다.

**대상 사용자**: 중국어 강사(콘텐츠 제공) + 학생(소비). 본 사용자(개발자) 본인용 아님.

## 기술 스택

| 영역        | 선택                               | 버전               |
| ----------- | ---------------------------------- | ------------------ |
| 프론트엔드  | SvelteKit + Svelte 5 (runes 모드)  | 2.58 / 5.55        |
| 빌드        | Vite                               | 8                  |
| 언어        | TypeScript (strict)                | 6                  |
| DB + 인증   | Supabase (Postgres + Auth + RLS)   | @supabase/ssr 0.10 |
| 음원 저장   | Cloudflare R2 (S3 호환)            | —                  |
| 전사 (기본) | transformers.js (브라우저 Whisper) | —                  |
| 전사 (폴백) | Groq Whisper API                   | —                  |
| 병음        | pinyin-pro                         | —                  |
| 호스팅      | Vercel                             | adapter-vercel 6   |

## 자주 쓰는 명령

```bash
npm run dev          # 개발 서버 — localhost:5173 + LAN 호스트(폰 접속 가능)
npm run build        # 프로덕션 빌드
npm run preview      # 빌드 결과 미리보기
npm run check        # svelte-check (TypeScript 타입 체크)
npm run check:watch  # 변경 감지 타입 체크
npm run format       # Prettier 포맷팅
npm run lint         # Prettier 검증만
```

## 코드 컨벤션

- **TypeScript strict**. `any` 지양, 명시적 타입 선언
- **Svelte 5 runes**: `$state`, `$props`, `$derived`, `$effect` 사용 (legacy `export let` 금지)
- **Prettier**: 탭 들여쓰기, single quote, no trailing comma, printWidth 100, `.svelte`는 svelte 파서
- **CSS**: `src/app.css`의 다크 테마 변수 사용 (`--bg`, `--accent`, `--text`, `--text-secondary`, `--text-tertiary`, `--separator`, `--bg-elevated`, `--bg-card`)
- **Safe-area**: 폰 PWA — `var(--safe-top)`, `var(--safe-bottom)`, `var(--safe-left/right)`
- **한자 텍스트**: `.hanzi` 클래스로 PingFang/YaHei 폰트 적용
- **Import alias**: `$lib/` 사용 (`svelte.config.js`에 정의)

## 디렉토리 구조

```
src/
├── routes/                 # 페이지 + API 엔드포인트 (+page.svelte, +server.ts, +layout.svelte)
├── lib/
│   ├── server/             # 서버 전용 (R2/Supabase admin, Whisper proxy)
│   ├── components/         # 재사용 Svelte 컴포넌트
│   └── stores/             # 재생 상태, 인증 상태 등
├── app.html                # iOS PWA 메타 태그 (apple-touch-icon, status-bar)
├── app.css                 # 다크 테마 CSS 변수
└── app.d.ts                # App.Locals 등 앰비언트 타입

supabase/migrations/        # SQL 마이그레이션 — 수동 실행 (Supabase SQL Editor)
docs/                       # decisions.md 등 결정 이력
static/                     # PWA manifest, favicon
```

## 환경변수

`.env.example`의 키 9개. 실제 값은 `.env`(gitignore됨).

- `PUBLIC_SUPABASE_*` — **클라 노출 OK**
- `SUPABASE_SERVICE_ROLE_KEY`, `R2_*`, `GROQ_API_KEY` — **서버 전용, 클라 노출 절대 금지**

SvelteKit import 방식:

```ts
import { PUBLIC_SUPABASE_URL } from '$env/static/public'; // 클라 OK
import { GROQ_API_KEY } from '$env/static/private'; // 서버 전용
```

## DB 마이그레이션

- 새 마이그레이션은 `supabase/migrations/00X_name.sql`
- Supabase CLI 도입 전까지는 SQL Editor 수동 실행
- 새 테이블에는 항상 RLS 정책을 함께 작성
- 멤버십 INSERT 등 보안 작업은 `security definer` 함수로 (예: `redeem_invite`)

## Git Workflow

> **모든 git artifact는 영어**: 브랜치명, 커밋 메시지, PR 제목/본문/코멘트.
> 사용자와의 대화는 한국어, 코드 주석은 한국어 OK. 단 git 출력물만은 영어 통일.

### Branching — GitHub Flow

`main`은 항상 배포 가능. 작업은 짧은 피처 브랜치에서.

브랜치 명명 (Conventional, kebab-case, ≤30자, 단일 의도):

| Prefix      | 용도               | 예시                        |
| ----------- | ------------------ | --------------------------- |
| `feat/`     | 새 기능            | `feat/magic-link-auth`      |
| `fix/`      | 버그 수정          | `fix/invite-expiry-check`   |
| `chore/`    | 도구·의존성·빌드   | `chore/upgrade-vite`        |
| `refactor/` | 리팩터 (동작 동일) | `refactor/extract-supabase` |
| `docs/`     | 문서만             | `docs/update-readme`        |

### Commit messages — Conventional Commits

```
<type>(<scope>): <subject>

<body — why this change, in English>

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```

Types: `feat`, `fix`, `docs`, `chore`, `refactor`, `style`, `test`.

### Identity (per-command override)

```bash
git -c user.name="YoonsungNam" -c user.email="sammynam29@gmail.com" commit -m "..."
```

글로벌 `git config`(`ysnam@dcslab.snu.ac.kr`)는 다른 프로젝트용 — 건드리지 말 것.

### Pull requests

워크플로우:

1. `main`에서 피처 브랜치 분기
2. 작업 + 커밋
3. Push + `gh pr create` (`.github/pull_request_template.md` 자동 사용)
4. CI 통과 (lint + typecheck + build)
5. 사용자(YoonsungNam) 리뷰 + 승인
6. **Squash merge** — PR 1개 = main commit 1개

CI 실패 시 복구: 로컬에서 수정 → 같은 브랜치에 commit·push → CI 자동 재실행.

### Reviewing pull requests

PR 리뷰는 채팅에만 남기지 말고 **항상 PR 자체에 코멘트로 게시**. 절차:

1. **기존 코멘트·리뷰 먼저 확인** — 다른 리뷰어 의견·작성자 응답을 읽고, 중복 회피 또는 상충점 명시:
   ```bash
   gh pr view <num> --comments
   gh api repos/<owner>/<repo>/pulls/<num>/reviews
   gh api repos/<owner>/<repo>/pulls/<num>/comments   # inline review comments
   ```
2. **메타정보 + diff** — `gh pr view <num>` (본문·상태·CI), `gh pr diff <num>` (코드 변경)
3. **리뷰 작성** — Overview · Strengths · Issues (Must-fix / Should-fix / Nice-to-have / Nit) · Security · Test coverage · Verdict
4. **PR에 게시**:
   ```bash
   gh pr review <num> --comment --body "$(cat <<'EOF'
   ## Review
   ...
   EOF
   )"
   ```
   본인 PR은 `--comment`만 가능 (GitHub이 self-approval 차단). 타인 PR은 `--approve` / `--request-changes` 가능.

### Branch protection on `main`

직접 push 금지, force push 금지, PR + CI 통과 필수, merge 전략은 squash만 허용.

> **주의**: workflow의 `jobs.<id>.name` 값이 GitHub status context 이름이 됨.
> workflow를 변경할 때 branch protection의 `required_status_checks.contexts`도 동기화:
>
> ```bash
> gh api -X PUT repos/<owner>/<repo>/branches/main/protection --input -
> ```

## 작업 흐름 메모

- **현재 단계**: Phase 0 완료, Phase 1 진입 직전
- 큰 결정은 `docs/decisions.md`에 추가 (특히 §10 "결정 이력")
- Phase 단위로 진행 — 전체 계획은 decisions.md §7
- 빌드/타입 체크 깨지면 그 자리에서 고치기 — 무시하고 넘어가지 말 것
- 보안 위험(서비스 키 클라 노출, RLS 우회)이 있으면 즉시 멈추고 알림

## 문서 분담

| 문서                    | 용도                                  |
| ----------------------- | ------------------------------------- |
| **CLAUDE.md** (이 파일) | 작업 시 즉시 필요한 가이드            |
| **docs/decisions.md**   | 결정 이력의 아카이브 (왜)             |
| **MEMORY.md** (메모리)  | 영속 메모 (git identity, 사용자 선호) |
| **README.md**           | 외부 사용자 시작 가이드               |
