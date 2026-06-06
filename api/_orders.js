import fs from "fs";
import path from "path";
import { getRedis, isRedisConfigured } from "./_redis.js";

const TTL_MS = 30 * 60 * 1000;
const TTL_SEC = 30 * 60;
const DATA_FILE = path.join(process.cwd(), ".mytravel-orders.json");

const pendingMem = new Map();
const completedMem = new Map();

function isExpired(createdAt) {
  return Date.now() - createdAt > TTL_MS;
}

function pendingKey(orderId) {
  return `mytravel:order:pending:${orderId}`;
}

function completedKey(orderId) {
  return `mytravel:order:completed:${orderId}`;
}

function useFileStore() {
  return !isRedisConfigured();
}

function readFileStore() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    }
  } catch {
    /* ignore */
  }
  return { pending: {}, completed: {} };
}

function writeFileStore(store) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2));
  } catch {
    /* ignore */
  }
}

function pruneFileStore(store) {
  const now = Date.now();
  for (const bucket of ["pending", "completed"]) {
    for (const [id, order] of Object.entries(store[bucket] ?? {})) {
      const ts = order.createdAt ?? order.completedAt ?? 0;
      if (now - ts > TTL_MS) delete store[bucket][id];
    }
  }
  return store;
}

async function getFilePending(orderId) {
  const store = pruneFileStore(readFileStore());
  return store.pending?.[orderId] ?? null;
}

async function setFilePending(orderId, payload) {
  const store = pruneFileStore(readFileStore());
  store.pending[orderId] = payload;
  writeFileStore(store);
}

async function deleteFilePending(orderId) {
  const store = pruneFileStore(readFileStore());
  delete store.pending[orderId];
  writeFileStore(store);
}

async function setFileCompleted(orderId, payload) {
  const store = pruneFileStore(readFileStore());
  store.completed[orderId] = payload;
  delete store.pending[orderId];
  writeFileStore(store);
}

async function getFileCompleted(orderId) {
  const store = pruneFileStore(readFileStore());
  return store.completed?.[orderId] ?? null;
}

export async function savePendingOrder(orderId, amount, session = {}) {
  const payload = {
    amount,
    createdAt: Date.now(),
    answers: session.answers,
    destinations: session.destinations,
  };

  const redis = getRedis();
  if (redis) {
    await redis.set(pendingKey(orderId), payload, { ex: TTL_SEC });
    return;
  }

  if (useFileStore()) {
    await setFilePending(orderId, payload);
    return;
  }

  pendingMem.set(orderId, payload);
}

export async function consumePendingOrder(orderId) {
  const redis = getRedis();
  if (redis) {
    const order = await redis.get(pendingKey(orderId));
    if (!order) return null;
    await redis.del(pendingKey(orderId));
    return order;
  }

  if (useFileStore()) {
    const order = await getFilePending(orderId);
    if (!order) return null;
    await deleteFilePending(orderId);
    if (isExpired(order.createdAt)) return null;
    return order;
  }

  const order = pendingMem.get(orderId);
  if (!order) return null;
  pendingMem.delete(orderId);
  if (isExpired(order.createdAt)) return null;
  return order;
}

export async function peekPendingOrder(orderId) {
  const redis = getRedis();
  if (redis) {
    return (await redis.get(pendingKey(orderId))) ?? null;
  }

  if (useFileStore()) {
    const order = await getFilePending(orderId);
    if (!order || isExpired(order.createdAt)) return null;
    return order;
  }

  const order = pendingMem.get(orderId);
  if (!order) return null;
  if (isExpired(order.createdAt)) {
    pendingMem.delete(orderId);
    return null;
  }
  return order;
}

export async function markCompletedOrder(orderId, { tid, amount, answers, destinations }) {
  const payload = {
    tid,
    amount,
    completedAt: Date.now(),
    answers,
    destinations,
  };

  const redis = getRedis();
  if (redis) {
    await redis.set(completedKey(orderId), payload, { ex: TTL_SEC });
    return;
  }

  if (useFileStore()) {
    await setFileCompleted(orderId, payload);
    return;
  }

  completedMem.set(orderId, payload);
}

export async function peekCompletedOrder(orderId) {
  const redis = getRedis();
  if (redis) {
    return (await redis.get(completedKey(orderId))) ?? null;
  }

  if (useFileStore()) {
    const order = await getFileCompleted(orderId);
    if (!order || isExpired(order.completedAt)) return null;
    return order;
  }

  const order = completedMem.get(orderId);
  if (!order) return null;
  if (isExpired(order.completedAt)) {
    completedMem.delete(orderId);
    return null;
  }
  return order;
}

export async function consumeCompletedOrder(orderId) {
  const order = await peekCompletedOrder(orderId);
  if (!order) return null;

  const redis = getRedis();
  if (redis) {
    await redis.del(completedKey(orderId));
    return order;
  }

  if (useFileStore()) {
    const store = pruneFileStore(readFileStore());
    delete store.completed[orderId];
    writeFileStore(store);
    return order;
  }

  completedMem.delete(orderId);
  return order;
}

export function ordersUseRedis() {
  return isRedisConfigured();
}
