# MyTravel — Paddle 결제 설정

토스페이먼츠 가입비·연회비 없이 **Paddle**으로 990원 일회 결제를 받습니다.  
(카드, 카카오페이, 네이버페이 등 — Paddle 대시보드·지역 설정에 따름)

## 1. Paddle 계정

1. [Paddle](https://www.paddle.com) 가입 (Vendor of Record)
2. **Sandbox**에서 먼저 연동 테스트
3. 한국 판매·KRW는 대시보드에서 결제 수단·통화 활성화 확인

## 2. 상품(Price) 만들기

1. **Catalog** → Product → Price
2. **990 KRW**, 일회(one-time) 가격 생성
3. **Price ID** (`pri_...`) 복사 → `VITE_PADDLE_PRICE_ID`

## 3. API 키

| 변수 | 용도 |
|------|------|
| `VITE_PADDLE_CLIENT_TOKEN` | 브라우저 Checkout (`test_` / `live_`) |
| `PADDLE_API_KEY` | 서버에서 거래 검증 (`/api/verify-paddle`) |
| `VITE_PADDLE_ENV` / `PADDLE_ENV` | `sandbox` 또는 `production` |

Developer tools → Authentication에서 Client-side token, API key 발급.

## 4. 로컬 실행

```bash
cp .env.example .env
# Paddle sandbox 키·Price ID 입력

# API 라우트 포함 (권장)
npm run dev:full

# 또는 Vite만 (verify-paddle은 dev-api-plugin으로 동작)
npm run dev
```

테스트만 할 때: `VITE_PAYMENT_MOCK=true`

## 5. Vercel 배포

Project → Settings → Environment Variables에 위 변수 추가 (Production / Preview).

- `PADDLE_API_KEY`, `PADDLE_ENV`는 **서버 전용** (VITE_ 없음)
- `VITE_PADDLE_*`는 빌드 시 클라이언트에 포함

## 6. 결제 흐름

1. 결과 화면 → 「990원으로 AI일정보기」
2. Paddle 오버레이 Checkout
3. 완료 시 `checkout.completed` → `/api/verify-paddle`로 거래 검증
4. 성공 시 `sessionStorage`에 접근 권한 저장 → AI 일정 3종 로드

리다이렉트 복귀 URL: `?paddle=success&transaction_id=...` (세션에 답안·TOP3 저장 필요)

## 7. 토스에서 전환 시

- `.env`에서 `VITE_TOSS_*`, `TOSS_SECRET_KEY` 제거 가능
- `api/confirm-payment.js`, `api/prepare-order.js`는 레거시로 남아 있음 (미사용)

## 참고

- Paddle 수수료: 플랜·지역별 상이 (대략 건당 ~5% 수준 — 대시보드 확인)
- 운영 전 Sandbox에서 실제 결제·환불·웹훅 정책을 한 번 검토하세요
