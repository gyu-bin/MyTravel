import { getRedis, isRedisConfigured, todayKeySuffix } from "./_redis.js";

const EVENTS = new Set(["intent", "complete"]);

function keysFor(event) {
  const day = todayKeySuffix();
  return {
    total: `mytravel:payment:${event}`,
    daily: `mytravel:payment:${event}:${day}`,
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const event = req.body?.event;
  if (!EVENTS.has(event)) {
    return res.status(400).json({
      ok: false,
      error: "event는 intent 또는 complete 여야 합니다.",
    });
  }

  if (!isRedisConfigured()) {
    return res.status(200).json({ ok: true, tracked: false });
  }

  const redis = getRedis();
  if (!redis) {
    return res.status(200).json({ ok: true, tracked: false });
  }

  const { total, daily } = keysFor(event);

  try {
    const [totalCount, dailyCount] = await Promise.all([
      redis.incr(total),
      redis.incr(daily),
    ]);
    return res.status(200).json({
      ok: true,
      tracked: true,
      event,
      total: totalCount,
      daily: dailyCount,
    });
  } catch {
    return res.status(500).json({ ok: false, error: "집계 저장 실패" });
  }
}
