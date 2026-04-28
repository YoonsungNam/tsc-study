# TSC Study — 아키텍처 결정 문서

> **프로젝트**: 중국어 학습용 PWA
> **타깃 사용자**: 중국어 강사 (콘텐츠 제공) + 학습자 (소비)
> **콘셉트**: 강사가 음원을 올리면 자동 전사·병음 생성 → 학습자들이 아이폰 뮤직앱처럼 가사 보며 재생
> **마지막 업데이트**: 2026-04-26

---

## 1. 요구사항 (8가지 확정)

1. **자동 전사**: 강사가 음원 업로드 시 자동으로 한자 + 병음 + 타임스탬프 생성
2. **전사 편집**: 자동 전사 오류를 강사가 수정할 수 있는 UI
3. **접근 제어**: 허가된 인원만 사용 (강사가 학생 초대)
4. **플레이리스트**: 강사가 곡 묶음 큐레이션
5. **클라이언트 오프로딩**: 서버 부담 최소, 가능한 처리를 클라이언트에서
6. **모바일 호환**: iOS Safari + Android Chrome 둘 다 PWA로 작동
7. **학습 보조 + UI**: 구간반복(A-B), 속도 조절, 아이폰 뮤직앱 유사 UI
8. **백그라운드 재생**: 화면 꺼져도 재생 지속, 잠금화면 컨트롤

---

## 2. 사용자 모델

| 항목 | 결정 |
|---|---|
| 콘텐츠 공유 모델 | **강사 라이브러리 공유**: 강사가 클래스 만들고 학생 초대 → 학생들이 라이브러리 공유 열람 |
| 저작권 | 강사 본인 자작 자료만 (시판 음원 제외) |
| 계정 역할 | **MVP는 1인 1역할** (강사 OR 학생) |
| 인증 방식 | **매직링크 + 강사 발급 초대코드** 하이브리드 |

### 인증 흐름

```
강사: 매직링크 가입 → 역할 선택 → 클래스 생성 → 초대링크 발급
학생: 초대링크 클릭 → 이메일 입력 → 매직링크 클릭 → 가입 + 클래스 자동 멤버십
```

---

## 3. 기술 스택

| 영역 | 선택 | 이유 |
|---|---|---|
| 프론트엔드 | **SvelteKit** | 작은 번들, iOS Safari 친화적, PWA 우수 |
| DB + 인증 | **Supabase** (Postgres + Auth + RLS) | 매직링크 기본 지원, RLS 선언적 보안 |
| 음원 저장소 | **Cloudflare R2** | 송신(egress) 무료, 10GB 무료 |
| 전사 — 기본 | **transformers.js** (브라우저 Whisper) | 클라이언트 오프로딩, 외부 의존성 0 |
| 전사 — 폴백 | **Groq Whisper API** | 폰 업로드 시 사용, 무료 티어 |
| 병음 변환 | **pinyin-pro** (npm) | TypeScript, 정확도 우수 |
| 호스팅 | **Vercel** | SvelteKit 1급 지원, 무료 티어 |
| 오프라인 | **Service Worker + IndexedDB** | 음원/모델/메타데이터 영구 캐시 |
| 재생 엔진 | **`<audio>` + Media Session API** | 잠금화면 컨트롤, 백그라운드 재생 |

### 전사 분기 로직

```
강사 업로드
  ↓ (기기 감지 + 사용자 선택)
경로 A (기본): transformers.js로 브라우저 안에서 전사 → 음원 서버 미경유
경로 B (폴백): R2 업로드 → 서버가 Groq API 호출
```

#### transformers.js 모델 선택지

| 모델 | 크기 | 데스크탑 4분 곡 | 폰 처리 |
|---|---|---|---|
| whisper-base | 74MB | ~20초 | ~2-3분 |
| whisper-small | 244MB | ~50초 | 비현실적 |
| whisper-large-v3-turbo | ~800MB | ~2분 | 불가 |

기본값: **small** (데스크탑) / 폰은 **Groq 폴백**

---

## 4. 데이터 모델

### Supabase Postgres 테이블

```
profiles          id, email, display_name, role: 'instructor'|'student'
classes           id, instructor_id, name, description
memberships       class_id, student_id (UNIQUE)
invites           code, class_id, created_by, max_uses, expires_at, used_count
tracks            id, class_id, title, audio_url(R2), duration_sec,
                  transcript(jsonb), transcript_status, published(bool)
playlists         id, class_id, name, description
playlist_tracks   playlist_id, track_id, position
favorites         student_id, track_id
```

### Transcript JSON 구조

```json
{
  "language": "zh",
  "model": "whisper-small",
  "source": "browser",
  "segments": [
    { "id": 0, "start": 0.0, "end": 3.5,
      "hanzi": "你好世界", "pinyin": "nǐ hǎo shì jiè" }
  ]
}
```

### 보안 (RLS 요지)

- `tracks`/`playlists`/`classes`: 강사 본인 또는 같은 클래스 멤버만 조회
- 쓰기는 강사만
- `invites.code` 검증 후에만 멤버십 자동 생성

---

## 5. MVP 범위

### ✅ 1차 출시 포함

**강사**: 매직링크 가입, 클래스 생성, 음원 업로드(2경로), 자동 전사+병음, 전사 편집(줄 단위), 검수 후 공개, 플레이리스트, 학생 초대 링크/QR

**학생**: 초대링크 가입, 라이브러리 / 플레이리스트 / 트랙 화면, 재생 화면(한자+병음 싱크), A-B 구간반복, 속도 0.5~1.5x, 즐겨찾기, 다운로드/오프라인 재생, 백그라운드 + 잠금화면 컨트롤, 자동 생성 앨범아트

### ⏸️ v2로 보류

- 앨범아트 업로드
- 글자별 병음 편집 (다음자 多音字)
- 학생 본인 플레이리스트
- 한 계정 다역할
- 단어 클릭 사전 (CC-CEDICT)
- 사용량 한도 / 요금제
- 강사용 분석 (학생 진도)
- 한국어 번역 필드

---

## 6. 라우트 구조

```
공통
  /login                              매직링크 입력
  /invite/:code                       초대 수락

강사
  /instructor                         클래스 목록
  /instructor/class/:id               클래스 상세
  /instructor/class/:id/upload        업로드
  /instructor/track/:trackId/edit     전사 편집기

학생
  /                                   내 클래스
  /class/:id                          라이브러리
  /class/:id/track/:trackId           재생 화면
  /downloads                          오프라인 곡 관리
```

---

## 7. 구현 단계 (Phase)

| Phase | 내용 | 예상 |
|---|---|---|
| 0 | 셋업 (SvelteKit / Supabase / R2 프로젝트, DB 스키마, 라우팅) | ~1일 |
| 1 | 인증 + 강사 업로드 + 자동 전사(2경로) + 병음 생성 | ~3-4일 |
| 2 | 전사 편집기 (줄 단위 한자/병음/시간, 분할/병합) | ~3일 |
| 3 | 학생 흐름 + 재생 화면 (가사 싱크, A-B, 속도) | ~4일 |
| 4 | PWA + 백그라운드 (Service Worker, IndexedDB, Media Session) | ~3일 |
| 5 | 플레이리스트 + 즐겨찾기 | ~2일 |
| 6 | 모바일 폴리시 + Vercel 배포 | ~2일 |
| **합계** | | **~18-20일** |

---

## 8. 비용 추산

| 항목 | 무료 한도 | 비고 |
|---|---|---|
| Vercel | 100GB 대역폭/월 | 충분 |
| Supabase | 500MB DB, 50K MAU | 충분 |
| Cloudflare R2 | 10GB 저장, 송신 무료 | 충분 |
| Groq Whisper API | 일 4시간 분량 무료 | 강사 5~10명 규모 충분 |

**평상시 운영비: $0/월** · Groq 한도 초과 시 $0.04/시간

---

## 9. 핵심 UX 결정

| 항목 | 결정 |
|---|---|
| 검수 흐름 | 자동 전사 → 강사가 "검수 완료" 토글한 후에만 학생 공개 |
| 앨범아트 | 자동 생성(제목+클래스 색상), 업로드는 v2 |
| 병음 편집 단위 | 줄 단위 (다음자는 강사가 수동 수정), 글자별은 v2 |
| 학생 권한 | 재생 + 즐겨찾기 + 다운로드 (개인 플레이리스트는 v2) |

---

## 10. 결정 이력 (Why 기록)

검토했지만 채택하지 않은 옵션과 이유.

### LRC + 기존 음악앱 → 채택 안 함
**이유**: 학습 특화 기능(구간반복, 속도, 강사 큐레이션)을 기존 음악앱 위에 얹을 수 없음. 다인 사용 목적이라 PWA가 더 적합.

### OpenAI Whisper API → Groq + transformers.js로 대체
**이유**: OpenAI는 무료 티어 없음. Groq은 동일 모델(whisper-large-v3)을 무료 티어로 제공하며 더 빠름. transformers.js는 클라이언트 오프로딩 요구사항(요구 5)을 가장 충실히 지킴.

### Supabase Storage → Cloudflare R2 (음원만)
**이유**: 학생들 반복 재생으로 송신(egress) 비용이 누적 위험. R2는 송신 무료라 비용이 0으로 수렴. 메타데이터·DB는 Supabase 그대로.

### Next.js → SvelteKit
**이유**: 폰 PWA가 핵심이라 번들 크기와 iOS Safari 친화성이 중요. SvelteKit이 더 작고 가벼움.

### 이메일+비밀번호 → 매직링크 + 초대코드
**이유**: 강사가 학생을 직접 초대하는 모델이라 비밀번호 관리 부담을 없애고 마찰 최소화. 폰 가입이 핵심.
