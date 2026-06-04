import { getRedis, isRedisConfigured, todayKeySuffix } from "./_redis.js";

function getAdminKey() {
  return (
    process.env.ADMIN_KEY?.trim() ||
    process.env.VITE_ADMIN_KEY?.trim() ||
    ""
  );
}

async function readCount(redis, key) {
  const value = await redis.get(key);
  return typeof value === "number" ? value : Number(value) || 0;
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const adminKey = getAdminKey();
  const provided =
    req.headers?.["x-admin-key"] ||
    req.query?.key ||
    "";

  if (!adminKey || provided !== adminKey) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  if (!isRedisConfigured()) {
    return res.status(200).json({
      ok: true,
      live: false,
      intent: { total: 0, today: 0 },
      complete: { total: 0, today: 0 },
      conversionRate: null,
    });
  }

  const redis = getRedis();
  if (!redis) {
    return res.status(200).json({ ok: true, live: false });
  }

  const day = todayKeySuffix();

  try {
    const [intentTotal, intentToday, completeTotal, completeToday] =
      await Promise.all([
        readCount(redis, "mytravel:payment:intent"),
        readCount(redis, `mytravel:payment:intent:${day}`),
        readCount(redis, "mytravel:payment:complete"),
        readCount(redis, `mytravel:payment:complete:${day}`),
      ]);

    const conversionRate =
      intentTotal > 0
        ? Math.round((completeTotal / intentTotal) * 1000) / 10
        : null;

    return res.status(200).json({
      ok: true,
      live: true,
      date: day,
      intent: { total: intentTotal, today: intentToday },
      complete: { total: completeTotal, today: completeToday },
      conversionRate,
    });
  } catch {
    return res.status(500).json({ ok: false, error: "통계 조회 실패" });
  }
}
