# 결제 수요 검증 (페이크 결제)

실제 Paddle/토스 없이 **얼마나 결제를 시도하는지**만 측정합니다.

## 켜는 방법

`.env` / Vercel:

```bash
VITE_PAYMENT_DEMAND_TEST=true
VITE_ADMIN_KEY=your_secret_admin_key   # 통계 조회용
KV_REST_API_URL=...
KV_REST_API_TOKEN=...
```

- 사용자: 「AI 일정 무료로 보기」→ 실제 과금 없이 일정 열람
- 서버: Redis에 이벤트 저장

| 이벤트 | 의미 |
|--------|------|
| `intent` | 결제/열기 버튼 클릭 |
| `complete` | 무료 체험으로 일정 열람까지 완료 |

전환율 ≈ `complete / intent`

## 통계 보기

1. 홈 → **관리자** → 키 입력 (`VITE_ADMIN_KEY`)
2. **📊 결제 수요 통계** 클릭

또는:

```bash
curl -H "x-admin-key: YOUR_KEY" https://YOUR_DOMAIN/api/payment-demand-stats
```

## 실결제로 전환할 때

1. `VITE_PAYMENT_DEMAND_TEST` **삭제** 또는 `false`
2. Paddle env 설정 (`docs/PADDLE_SETUP.md`)
3. 재배포
