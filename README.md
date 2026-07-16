<p align="center">
  <img src="docs/assets/adr-gdr-dashboard-banner.png" alt="한국주와 ADR·GDR 가격 흐름을 연결해 보여주는 금융 데이터 대시보드 배너" width="100%" />
</p>

<h1 align="center">한국주 · ADR · GDR 괴리율 대시보드</h1>

<p align="center">
  <strong>같은 기업, 다른 시장. 가격 차이를 원화 하나로 읽습니다.</strong><br />
  한국 주식과 해외 예탁증서의 환산 가격을 비교하고, 괴리율 변화와 임계치 알림을 추적하는 오픈소스 금융 대시보드입니다.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-111111?logo=nextdotjs" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" alt="TypeScript 5" />
  <img src="https://img.shields.io/badge/Mock-API%20키%20없이%20실행-0F766E" alt="API 키 없이 Mock 실행 가능" />
  <img src="https://img.shields.io/badge/tests-42%20passed-15803D" alt="42개 테스트 통과" />
</p>

## 무엇을 해결하나요?

ADR·GDR 가격만 보고 한국 주식과 단순 비교하면 DR 비율, 거래 통화, 환율, 서로 다른 거래시간 때문에 큰 왜곡이 생길 수 있습니다. 이 프로젝트는 각 DR을 한국 보통주 1주 기준 원화 가격으로 환산한 뒤, 동일 기업의 한국주·ADR·GDR을 한 화면에서 비교합니다.

- 한국주 10종목과 DR 11개 비교를 기본 제공
- 동일 기업의 ADR과 GDR을 한 카드에서 동시에 비교
- 1일·5일·1개월 가격, 환산가, 괴리율, 환율 차트
- 3%·5%·10% 단계별 상태, 쿨다운, 방향 전환 알림
- 검색, 필터, 7가지 정렬, 카드/테이블 보기, 반응형 다크 모드
- 고정 seed 기반 Mock 시세로 API 키 없이 전체 흐름 재현
- 가격·환율·시장 캘린더·알림 Provider를 분리해 실제 API 교체 가능

## 빠른 시작

필요 환경은 Node.js 20 이상과 pnpm입니다.

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 엽니다. 기본값은 `NEXT_PUBLIC_DATA_MODE=mock`이므로 외부 API 키 없이 대시보드, 차트, 설정, 알림 이력을 확인할 수 있습니다.

## 주요 화면

| 경로 | 기능 |
| --- | --- |
| `/` | 시장 요약, 종목별 DR 비교, 검색, 정렬, 필터, 자동·수동 갱신 |
| `/stocks/[symbol]` | 1일·5일·1개월 차트, 기간 통계, 최근 알림 |
| `/settings` | 종목·DR 비율·알림·데이터·화면·채널 설정 |
| `/alerts` | 알림 이력 필터, CSV 내보내기, 삭제, 재전송 |

## 계산 방식

DR 비율은 **DR 1주가 한국 보통주 몇 주에 해당하는가**를 뜻합니다.

```text
DR 환산가(KRW) = DR 가격(거래 통화) × 거래 통화/KRW 환율 ÷ DR 비율
괴리율(%) = (DR 환산가 - 한국 주식 가격) ÷ 한국 주식 가격 × 100
```

예를 들어 DR 가격이 100 USD, USD/KRW가 1,400원, DR 비율이 2, 한국 주가가 65,000원이면 환산가는 70,000원이고 괴리율은 약 +7.69%입니다.

계산 로직은 [`src/lib/calculations/premium-discount.ts`](src/lib/calculations/premium-discount.ts)의 순수 함수로 분리했습니다.

- `calculateConvertedDepositaryReceiptPrice()`
- `calculateConvertedAdrPrice()`
- `calculatePremiumDiscountRate()`
- `getPremiumDiscountLevel()`
- `shouldTriggerAlert()`
- `isAlertCooldownActive()`

0 이하 가격·환율·비율, `null`, 오래된 데이터, 서로 다른 시점의 데이터에는 계산 중단 또는 경고를 적용합니다.

## 기본 종목과 DR 모델

기본 설정은 [`src/config/stocks.ts`](src/config/stocks.ts)에서 관리합니다.

- 삼성전자는 한국주와 런던 GDR 비교 예시를 제공합니다.
- SK하이닉스는 한국주를 기준으로 ADR과 GDR을 한 카드에서 동시에 비교합니다.
- 포스코홀딩스, LG디스플레이, KT, SK텔레콤, 한국전력, KB금융, 신한금융, 우리금융을 포함합니다.
- DR 유형은 `ADR`, `GDR`, `CUSTOM`을 지원합니다.
- 종목별 코드, 티커, 비율, 상태, 거래소, 통화, Provider 심볼, 사용자 정렬 순서를 독립적으로 저장합니다.
- USD, EUR, GBP 거래 통화와 각 통화/KRW Mock 환율을 지원합니다.

DR 발행 조건과 비율은 변경되거나 거래가 중단될 수 있습니다. 기본값은 앱 구조와 Mock 동작을 보여주기 위한 설정이며, 실제 투자 데이터로 사용할 때는 예탁은행·거래소 공시를 기준으로 반드시 재검증해야 합니다. 설정 화면에서 종목과 DR을 추가·수정·비활성화할 수 있습니다.

핵심 데이터 구조는 다음과 같습니다.

- `StockConfig`: 한국 종목과 하나 이상의 `depositaryReceipts` 설정
- `DepositaryReceiptConfig`: DR 유형, 티커, 비율, 거래소, 통화, 상태
- `MarketComparison`: 한국 가격, DR 가격, 환율, 환산가, 괴리율을 합친 API 응답
- `MarketComparisonGroup`: 같은 한국 종목의 ADR·GDR 비교를 UI에서 묶은 파생 구조

## 실제 API 연결

UI는 외부 API 응답에 직접 의존하지 않고 Provider 인터페이스와 정규화 타입만 사용합니다.

1. [`src/features/market-data/providers/real-providers.ts`](src/features/market-data/providers/real-providers.ts)에 실제 가격·환율 응답 매핑을 구현합니다.
2. [`src/lib/providers/provider-factory.ts`](src/lib/providers/provider-factory.ts)에서 Provider 선택 조건을 연결합니다.
3. [`src/config/env.ts`](src/config/env.ts)에 운영 모드 필수 키 검증을 추가합니다.
4. [`src/config/stocks.ts`](src/config/stocks.ts)의 Provider별 심볼과 검증한 DR 비율을 수정합니다.
5. 시장 휴장일 API를 사용할 경우 [`src/features/market-calendar/providers/mock-market-calendar-provider.ts`](src/features/market-calendar/providers/mock-market-calendar-provider.ts)와 같은 인터페이스 구현체를 추가합니다.

실제 API 호출은 브라우저가 아닌 Next.js Route Handler에서 수행합니다.

| API | 역할 |
| --- | --- |
| `/api/market-data` | 전체 한국주·DR·환율 통합 비교 |
| `/api/market-data/[symbol]` | 종목별 비교 |
| `/api/market-data/[symbol]/history` | 기간별 가격·괴리율 이력 |
| `/api/exchange-rate` | 현재 환율 |
| `/api/notifications/test` | 채널별 테스트 알림 |
| `/api/notifications/send` | 서버 측 알림 전송 |
| `/api/health` | 데이터 모드와 API 상태 확인 |

## 환경변수

`.env.example`을 `.env.local`로 복사한 뒤 필요한 값만 입력합니다.

```dotenv
NEXT_PUBLIC_DATA_MODE=mock
MARKET_DATA_API_KEY=
EXCHANGE_RATE_API_KEY=
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
DISCORD_WEBHOOK_URL=
SLACK_WEBHOOK_URL=
```

- `NEXT_PUBLIC_DATA_MODE`: `mock` 또는 `real`
- `MARKET_DATA_API_KEY`: 실제 한국주·DR 가격 Provider 키
- `EXCHANGE_RATE_API_KEY`: 실제 환율 Provider 키
- `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`: 텔레그램 서버 알림
- `DISCORD_WEBHOOK_URL`, `SLACK_WEBHOOK_URL`: 서버 측 웹훅 알림

민감한 값에는 `NEXT_PUBLIC_` 접두어를 붙이지 마세요. `.env.local`은 Git에서 제외되며, 운영 비밀값은 배포 플랫폼의 Secret Store에 저장해야 합니다.

## 알림

기본 임계값과 쿨다운은 다음과 같습니다.

| 단계 | 절대 괴리율 | 기본 쿨다운 |
| --- | ---: | ---: |
| 주의 | 3% 초과 | 30분 |
| 경고 | 5% 초과 | 15분 |
| 위험 | 10% 초과 | 5분 |

단계 상승, 프리미엄·디스카운트 방향 전환, 기준선 아래 복귀 후 재진입에는 새 알림을 허용합니다. 브라우저 알림 권한은 사용자가 버튼을 눌렀을 때만 요청합니다. 텔레그램·디스코드·슬랙 비밀값은 클라이언트 번들이나 localStorage에 저장하지 않습니다.

## 프로젝트 구조

```text
src/app/                         페이지와 Route Handler
src/components/                  공통 UI와 레이아웃
src/features/market-data/        시세 타입, Provider, Query, 화면
src/features/premium-discount/   괴리율 도메인
src/features/market-calendar/    시간대와 거래 상태
src/features/alerts/             알림 판정, 전송, 이력 저장소
src/features/settings/           설정 폼, 검증, 저장소
src/lib/                         계산, 날짜, 포맷, API 공통 코드
src/config/                      종목, 환경변수, 기본값
docs/assets/                     README 이미지
```

서버 데이터는 TanStack Query, 사용자 설정과 알림 이력은 교체 가능한 Repository를 통해 브라우저 localStorage에 저장합니다. 계산 가능한 값은 상태로 중복 저장하지 않습니다.

## 품질 검사

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Vitest와 React Testing Library로 계산 경계값, 알림 쿨다운·단계 전환, Mock Provider, 시장 캘린더, 대시보드, 종목 카드, 설정, 알림 이력, 로딩·오류 상태를 검증합니다.

## 배포와 보안

Next.js를 지원하는 플랫폼에 배포할 수 있습니다. 운영 전 다음 항목을 적용하세요.

- 설정 페이지와 알림 API에 인증·권한 제어 추가
- 메모리 기반 호출 제한을 Redis 같은 공유 저장소 기반 제한으로 교체
- 외부 API 응답을 현재 Zod 정규화 계층에서 검증
- 환경변수와 웹훅을 플랫폼 Secret Store에 저장
- 로그와 오류 응답에 토큰·웹훅 URL을 포함하지 않도록 유지

인증 없이 설정 페이지를 인터넷에 공개하면 알림 테스트와 내부 데이터 설정이 악용될 수 있습니다. 현재 구현은 개인 로컬 사용과 Mock 검증을 우선한 MVP입니다.

## 데이터 정확성 안내

이 대시보드의 정보는 참고용이며 투자 권유가 아닙니다. 표시된 괴리율은 데이터 시점, 시장 거래시간, 환율, 세금, 수수료 및 실제 거래 가능성에 따라 달라질 수 있습니다.

한국장과 해외 거래소의 거래시간·휴장일 차이, 프리마켓·애프터마켓 가격, 데이터 지연, DR 전환 수수료와 제한, 세금, 거래 수수료, 유동성, 매수·매도 호가 차이, 결제 시차, 환전 비용을 함께 고려해야 합니다. 화면의 괴리율은 실제 무위험 차익거래 가능 수익률을 뜻하지 않습니다.

## 알려진 제한사항

- 실제 한국주·ADR·GDR 가격 Provider는 사용하는 API의 심볼·거래소·통화 규칙에 맞춰 구현해야 합니다.
- 휴장일은 현재 주말과 기본 거래시간을 기준으로 계산합니다.
- 여러 DR 동시 비교는 지원하지만, 각 DR의 공시 비율과 유효 거래 상태는 운영자가 검증해야 합니다.
- 설정과 알림 이력은 브라우저 단위로 저장되며 기기 간 동기화되지 않습니다.
- 분산 배포 환경에서는 알림 중복 방지와 호출 제한을 공유 저장소로 옮겨야 합니다.

## 라이선스

[MIT License](LICENSE)
