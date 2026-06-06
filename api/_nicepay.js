export const PLAN_PRICE = 990;

export function getNicepayClientId() {
  return (
    process.env.NICEPAY_CLIENT_ID?.trim() ||
    process.env.PORTONE_CLIENT_KEY?.trim() ||
    process.env.VITE_PORTONE_CLIENT_KEY?.trim() ||
    ""
  );
}

export function getNicepaySecretKey() {
  return (
    process.env.NICEPAY_SECRET_KEY?.trim() ||
    process.env.PORTONE_SECRET_KEY?.trim() ||
    ""
  );
}

export function isNicepaySandbox() {
  const flag = process.env.NICEPAY_SANDBOX?.trim();
  if (flag === "false") return false;
  if (flag === "true") return true;
  const clientId = getNicepayClientId();
  return clientId.startsWith("S2_") || !clientId.startsWith("R2_");
}

export function getNicepayApiBase() {
  return isNicepaySandbox()
    ? "https://sandbox-api.nicepay.co.kr"
    : "https://api.nicepay.co.kr";
}

export function getNicepayAuthHeader() {
  const clientId = getNicepayClientId();
  const secretKey = getNicepaySecretKey();
  if (!clientId || !secretKey) return null;
  return `Basic ${Buffer.from(`${clientId}:${secretKey}`).toString("base64")}`;
}

export async function approveNicepayPayment(tid, amount) {
  const auth = getNicepayAuthHeader();
  if (!auth) {
    throw new Error("나이스페이 시크릿 키가 설정되지 않았습니다.");
  }

  const res = await fetch(`${getNicepayApiBase()}/v1/payments/${tid}`, {
    method: "POST",
    headers: {
      Authorization: auth,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ amount: Number(amount) }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.resultMsg || data?.message || "결제 승인에 실패했습니다.";
    throw new Error(msg);
  }

  if (data.resultCode !== "0000" && data.status !== "paid") {
    throw new Error(data.resultMsg || "결제 승인에 실패했습니다.");
  }

  return data;
}

export function getSiteOrigin(req) {
  const host = req.headers?.["x-forwarded-host"] || req.headers?.host;
  if (host) {
    const proto =
      req.headers?.["x-forwarded-proto"] ||
      (host.startsWith("localhost") ? "http" : "https");
    return `${proto}://${host}`;
  }

  const configured = process.env.VITE_SITE_URL?.trim()?.replace(/\/$/, "");
  return configured || "http://localhost:5173";
}
