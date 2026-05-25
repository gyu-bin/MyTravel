const TTL_MS = 30 * 60 * 1000;
const pending = new Map();

export function savePendingOrder(orderId, amount) {
  pending.set(orderId, { amount, createdAt: Date.now() });
}

export function consumePendingOrder(orderId) {
  const order = pending.get(orderId);
  if (!order) return null;

  pending.delete(orderId);

  if (Date.now() - order.createdAt > TTL_MS) {
    return null;
  }

  return order;
}

export function peekPendingOrder(orderId) {
  const order = pending.get(orderId);
  if (!order) return null;

  if (Date.now() - order.createdAt > TTL_MS) {
    pending.delete(orderId);
    return null;
  }

  return order;
}
