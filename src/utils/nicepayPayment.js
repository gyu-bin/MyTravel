import {
  hasPlanAccess,
  peekNicepayReturnFlag,
  saveNicepayLaunchConfig,
} from "./payment.js";

const POPUP_NAME = "mytravel-nicepay";

/** 나이스페이 결제창 공식 크기 660×825px (+ 브라우저 타이틀바 여유) */
const NICEPAY_WIDTH = 660;
const NICEPAY_HEIGHT = 860;

/** 모바일·터치: sized popup 대신 새 탭 */
export function isMobileCheckout() {
  if (typeof window === "undefined") return false;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const narrow = window.innerWidth < 768;
  return coarse || narrow;
}

function getPopupFeatures() {
  const width = Math.min(NICEPAY_WIDTH, window.screen.availWidth - 24);
  const height = Math.min(NICEPAY_HEIGHT, window.screen.availHeight - 24);
  const left = Math.max(0, Math.round((window.screen.availWidth - width) / 2));
  const top = Math.max(0, Math.round((window.screen.availHeight - height) / 2));
  return [
    "popup=yes",
    `width=${width}`,
    `height=${height}`,
    `left=${left}`,
    `top=${top}`,
    "scrollbars=yes",
    "resizable=yes",
  ].join(",");
}

function buildLaunchConfig({
  clientId,
  orderId,
  amount,
  goodsName,
  returnUrl,
}) {
  const origin = window.location.origin;
  return {
    clientId,
    orderId,
    amount,
    goodsName,
    returnUrl: returnUrl || `${origin}/api/nicepay-return`,
  };
}

function waitForPaymentResult(paymentWindow, origin) {
  return new Promise((resolve) => {
    let settled = false;

    function finish(result) {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(result);
    }

    function cleanup() {
      window.removeEventListener("message", onMessage);
      clearInterval(closedPoll);
      clearInterval(flagPoll);
    }

    function onMessage(e) {
      if (e.origin !== origin) return;
      const data = e.data;
      if (data?.type !== "mytravel-nicepay") return;

      if (data.status === "success" && data.orderId) {
        finish({ paid: true, orderId: data.orderId, amount: data.amount });
        return;
      }

      if (data.status === "fail") {
        finish({
          paid: false,
          closed: true,
          error: data.message || "결제에 실패했습니다.",
        });
      }
    }

    window.addEventListener("message", onMessage);

    const closedPoll = setInterval(() => {
      if (!paymentWindow?.closed) return;

      if (peekNicepayReturnFlag() || hasPlanAccess()) {
        finish({ paid: true, closed: true });
        return;
      }

      finish({ paid: false, closed: true });
    }, 400);

    /* 모바일 새 탭: 탭이 안 닫혀도 localStorage 플래그 감지 */
    const flagPoll = setInterval(() => {
      const returned = peekNicepayReturnFlag();
      if (!returned?.orderId) return;
      finish({
        paid: true,
        orderId: returned.orderId,
        amount: returned.amount,
      });
    }, 500);
  });
}

function openPaymentWindow(config, { mobile }) {
  const origin = window.location.origin;
  saveNicepayLaunchConfig(config);

  const url = `${origin}/payment-popup.html`;
  const paymentWindow = mobile
    ? window.open(url, "_blank")
    : window.open(url, POPUP_NAME, getPopupFeatures());

  if (!paymentWindow) {
    const hint = mobile
      ? "새 탭이 차단되었습니다. 브라우저에서 팝업·새 탭을 허용한 뒤 다시 시도해 주세요."
      : "팝업이 차단되었습니다. 브라우저에서 팝업을 허용한 뒤 다시 시도해 주세요.";
    return Promise.reject(new Error(hint));
  }

  try {
    paymentWindow.focus();
  } catch {
    /* ignore */
  }

  return waitForPaymentResult(paymentWindow, origin);
}

/** PC: 팝업 / 모바일: 새 탭 — 원래 화면 유지 후 AI 일정 열림 */
export function openNicepayCheckout({
  clientId,
  orderId,
  amount,
  goodsName,
  returnUrl,
}) {
  if (!clientId) {
    return Promise.reject(
      new Error("나이스페이 클라이언트 키가 설정되지 않았습니다."),
    );
  }

  const config = buildLaunchConfig({
    clientId,
    orderId,
    amount,
    goodsName,
    returnUrl,
  });

  return openPaymentWindow(config, { mobile: isMobileCheckout() });
}

/** @deprecated openNicepayCheckout 사용 */
export function openNicepayCheckoutInPopup(options) {
  return openNicepayCheckout(options);
}
