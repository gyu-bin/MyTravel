# ── 포트원 / 나이스페이 (Server 승인, 권장) ──
# 포트원 콘솔 → 개발정보 → KEY 정보 (Server승인 + Basic 인증)
# 브라우저 (공개)
VITE_PORTONE_CLIENT_KEY=S2_...
# 서버 전용 (VITE_ 붙이지 마세요)
PORTONE_SECRET_KEY=...
# 샌드박스: true (기본) | 운영: false
# NICEPAY_SANDBOX=true

# Vercel 배포 시 결제 복귀 URL용 (로컬은 origin 자동)
# VITE_SITE_URL=https://my-travel-flax.vercel.app

# Upstash Redis (Vercel serverless에서 주문 상태 공유 — 권장)
# KV_REST_API_URL=...
# KV_REST_API_TOKEN=...
