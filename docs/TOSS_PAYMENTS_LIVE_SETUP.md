# 토스페이먼츠 실제 가맹점(live) 연동 가이드

MyTravel 프로젝트에서 **테스트 키 → live 키**로 전환해 실제 결제를 받기 위한 절차입니다.

> 코드 수정은 거의 필요 없습니다. **전자결제 심사 통과 후 발급받은 live 키**를 `.env`와 Vercel에 넣고 mock을 끄면 됩니다.

---

## 1. 전체 흐름

```
토스페이먼츠 가입
    ↓
사업자 정보 · 정산 계좌 등록
    ↓
전자결제(결제위젯) 신청
    ↓
심사 (보통 수일~2주)
    ↓
개발자센터에서 live_gck / live_gsk 발급
    ↓
MyTravel .env + Vercel env 교체 → 재배포
    ↓
소액 실결제 테스트 → 서비스 오픈
```

### 테스트 키 vs live 키

| 구분 | 접두사 | 용도 |
|------|--------|------|
| 문서/테스트 키 | `test_gck_...` / `test_gsk_...` | 개발·심사 전 테스트 (실제 결제 없음) |
| live 키 | `live_gck_...` / `live_gsk_...` | **실제 결제** (심사·계약 후) |

코드에 **가맹점 번호(MID)를 직접 넣는 방식이 아닙니다.**  
연동에 필요한 것은 **결제위젯 연동 키(클라이언트 + 시크릿)** 두 개입니다.

---

## 2. 사전 준비 (신청 전)

| 항목 | 내용 |
|------|------|
| **사업자** | 개인사업자 또는 법인 |
| **정산 계좌** | 사업자 명의 통장 |
| **대표자 신분** | 본인확인·서류 제출 |
| **서비스 URL** | Vercel 배포 주소 (예: `https://my-travel-flax.vercel.app`) |
| **판매 상품 설명** | 「990원 AI 여행 일정 콘텐츠」 등 |
| **환불·약관** | 이용약관, 개인정보처리방침, 환불 정책 |

> **사업자등록이 없으면** live 키 발급이 어렵습니다. 그 경우 테스트 키 + `VITE_PAYMENT_MOCK`으로만 운영하거나, 사업자 등록 후 신청해야 합니다.

---

## 3. 토스페이먼츠 가맹점 신청

### 3-1. 가입

1. [토스페이먼츠 개발자센터](https://developers.tosspayments.com/) 접속
2. 회원가입 / 로그인
3. **내 가맹점** 또는 **상점** 메뉴에서 새 상점 등록

### 3-2. 사업자·정산 정보

- 상호명, 사업자등록번호
- 업종·업태
- 대표자 정보
- **정산받을 계좌**
- 연락처, 이메일

### 3-3. 전자결제 신청

1. 개발자센터 → **결제 서비스** / **전자결제 신청**
2. **결제위젯** 선택 (MyTravel이 사용하는 방식)
3. 신청서 작성:
   - **서비스 URL**: Vercel 배포 URL
   - **판매 품목**: 디지털 콘텐츠 / AI 일정
   - **결제 금액**: 990원 (고정)
4. 필요 서류 업로드 (사업자등록증 등)
5. 심사 대기

심사 중에는 **테스트 키**로만 결제 테스트 가능하며, **실제 돈은 빠지지 않습니다.**

### 3-4. 심사 통과 후

- 가맹점 상태 **운영(활성)**
- **API 키** 메뉴에서 **live** 키 사용 가능
- 정산은 계약에 따른 주기(D+N 등)로 등록 계좌에 입금

---

## 4. API 키 발급·확인

### 4-1. 키 위치

1. [developers.tosspayments.com](https://developers.tosspayments.com/) 로그인
2. **API 키** (또는 **연동 키**)
3. **결제위젯 연동 키** 선택
4. 아래 두 개 복사:

| 키 | 접두사 | MyTravel 변수명 | 노출 |
|----|--------|-----------------|------|
| **클라이언트 키** | `live_gck_...` | `VITE_TOSS_CLIENT_KEY` | 브라우저 (공개 가능) |
| **시크릿 키** | `live_gsk_...` | `TOSS_SECRET_KEY` | **서버만** (절대 공개 금지) |

### 4-2. 키 쌍 규칙

```
✅ live_gck + live_gsk
✅ test_gck + test_gsk
❌ live_gck + test_gsk  (혼용 금지)
```

### 4-3. 가맹점 번호(MID)

- 토스 내부 가맹점 ID입니다.
- **MyTravel 코드에는 MID를 넣을 자리가 없습니다.**
- 연동에 필요한 것은 **`live_gck` + `live_gsk`** 뿐입니다.

---

## 5. MyTravel 환경 변수 설정

### 5-1. 로컬 `.env`

`.env.example` 참고:

```env
# live 키로 교체
VITE_TOSS_CLIENT_KEY=live_gck_여기에_클라이언트키
TOSS_SECRET_KEY=live_gsk_여기에_시크릿키

# mock 반드시 끄기 (있으면 삭제)
# VITE_PAYMENT_MOCK=true
```

주의:

- `TOSS_SECRET_KEY` 앞에 **`VITE_`를 붙이지 마세요.** (빌드에 포함되어 유출됩니다)
- `.env`는 Git에 커밋하지 마세요.

### 5-2. Vercel 환경 변수

1. [vercel.com](https://vercel.com) → MyTravel 프로젝트
2. **Settings → Environment Variables**
3. 추가/수정:

| Name | Value | Environment |
|------|-------|-------------|
| `VITE_TOSS_CLIENT_KEY` | `live_gck_...` | Production (+ Preview 선택) |
| `TOSS_SECRET_KEY` | `live_gsk_...` | **Production only** 권장 |

4. **`VITE_PAYMENT_MOCK`** 이 Production에 있으면 **삭제**
5. **Deployments → Redeploy** (env 변경 후 재배포 필수)

권장: **Preview = test 키**, **Production = live 키** 분리

### 5-3. 서버 API (이미 구현됨)

| API | 역할 |
|-----|------|
| `POST /api/prepare-order` | 결제 전 orderId·금액(990원) 사전 등록 |
| `POST /api/confirm-payment` | 토스 `/v1/payments/confirm` 승인 |

`TOSS_SECRET_KEY`가 Vercel Production에 없으면 결제창은 떠도 **승인 실패**합니다.

---

## 6. live 전환 후 테스트 체크리스트

### 배포 전

- [ ] `VITE_PAYMENT_MOCK` 없음 (또는 `false`)
- [ ] `VITE_TOSS_CLIENT_KEY` = `live_gck_...`
- [ ] `TOSS_SECRET_KEY` = `live_gsk_...` (Vercel Production)
- [ ] test / live 키 혼용 없음
- [ ] Vercel 재배포 완료
- [ ] `VITE_OPENAI_API_KEY` Production 설정 (일정 생성용)

### 실결제 테스트

1. **Production URL**에서 퀴즈 → 결과
2. **990원으로 AI일정보기** 클릭
3. 모달에서 결제 수단 선택 → **990원 결제하기**
4. 실제 카드/계좌로 결제 (「테스트 환경」 배너 **없어야** 정상)
5. 결제 후 AI 일정 3개 표시 확인
6. 개발자센터 **결제 내역**에서 `DONE` 확인

### 자주 나오는 문제

| 증상 | 원인 |
|------|------|
| 「테스트 환경」 배너 그대로 | 아직 test 키 사용 중 |
| 결제창 O, 승인 X | `TOSS_SECRET_KEY` 미설정 / test·live 불일치 |
| mock으로만 동작 | `VITE_PAYMENT_MOCK=true` |
| localhost에서만 이상 | live는 **배포 URL**에서 테스트 권장 |

---

## 7. 결제 UX (MyTravel)

1. 결과 화면 **990원으로 AI일정보기** 버튼
2. **결제 모달**에서 수단 선택 (토스페이 QR 등)
3. 약관 동의 → **990원 결제하기**
4. success URL 복귀 → 일정 자동 로딩

결제 리다이렉트 URL은 **`window.location.origin` 기준** (`/?payment=success`).

---

## 8. 수수료·정산 (참고)

- **PG 수수료**: 결제 수단·계약에 따라 상이 (계약서 확인)
- **990원** 결제 시 수수료 제외 금액이 정산됩니다.
- **정산 주기**: 계약에 따름
- **환불**: 개발자센터 또는 API (약관에 환불 정책 명시 권장)

---

## 9. 운영 권장 사항

1. Preview = test, Production = live 키 분리
2. 시크릿 키는 Vercel Production + 로컬 `.env`만
3. 이용약관·개인정보처리방침·환불 안내
4. 결제 문의 채널 (이메일 등)
5. OpenAI 키도 Production에 설정

---

## 10. 관련 파일

| 파일 | 설명 |
|------|------|
| `.env.example` | 환경 변수 템플릿 |
| `src/utils/payment.js` | 클라이언트 결제 로직 |
| `src/components/PaymentPanel.jsx` | 결제 UI·모달 |
| `api/prepare-order.js` | 주문 사전 등록 |
| `api/confirm-payment.js` | 결제 승인 |

---

## 11. 한 줄 요약

> **전자결제 심사 통과 → `live_gck` / `live_gsk` 복사 → `.env` + Vercel에 설정 → mock 제거 → 재배포 → Production에서 990원 실결제 1회 테스트**

---

## 참고 링크

- [토스페이먼츠 개발자센터](https://developers.tosspayments.com/)
- [결제위젯 v2 연동 가이드](https://docs.tosspayments.com/guides/v2/payment-widget/integration)
- [API 키 안내](https://docs.tosspayments.com/reference/using-api/api-keys)
