import { initializePaddle } from "@paddle/paddle-js";
import {
  getPaddleClientToken,
  getPaddleEnvironment,
} from "../lib/paddleConfig.js";

let paddlePromise = null;
let checkoutListenerAttached = false;
let onCheckoutCompleted = null;

export function setPaddleCheckoutCompletedHandler(handler) {
  onCheckoutCompleted = handler;
}

function attachCheckoutListener(paddle) {
  if (checkoutListenerAttached || !paddle?.Checkout) return;
  checkoutListenerAttached = true;

  paddle.Update({
    eventCallback: async (event) => {
      if (event.name !== "checkout.completed") return;
      const transactionId =
        event.data?.transaction_id ||
        event.data?.transactionId ||
        event.data?.id;
      if (transactionId && onCheckoutCompleted) {
        await onCheckoutCompleted(transactionId);
      }
    },
  });
}

export async function getPaddle() {
  if (paddlePromise) return paddlePromise;

  const token = getPaddleClientToken();
  if (!token) {
    throw new Error("Paddle 클라이언트 토큰이 설정되지 않았습니다.");
  }

  paddlePromise = initializePaddle({
    environment: getPaddleEnvironment(),
    token,
    checkout: {
      settings: {
        displayMode: "overlay",
        theme: "light",
        locale: "ko",
      },
    },
  }).then((instance) => {
    if (!instance) {
      throw new Error("Paddle 초기화에 실패했습니다.");
    }
    attachCheckoutListener(instance);
    return instance;
  });

  return paddlePromise;
}
