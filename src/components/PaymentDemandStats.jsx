import { useState } from "react";
import { getAdminKey } from "../utils/admin";
import { fetchPaymentDemandStats } from "../utils/trackPaymentDemand";

export default function PaymentDemandStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPaymentDemandStats(getAdminKey());
      setStats(data);
    } catch (err) {
      setError(err.message);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="intro-admin-demand">
      <button
        type="button"
        className="intro-admin-skip"
        onClick={load}
        disabled={loading}
      >
        {loading ? "불러오는 중…" : "📊 결제 수요 통계"}
      </button>
      {error && <p className="intro-admin-demand-error">{error}</p>}
      {stats && (
        <dl className="intro-admin-demand-stats">
          {!stats.live && (
            <p className="intro-admin-demand-warn">
              Redis 미연결 — Vercel에 KV/Upstash 환경 변수를 넣어 주세요.
            </p>
          )}
          <div>
            <dt>결제 시도 (누적)</dt>
            <dd>{stats.intent?.total ?? 0}</dd>
          </div>
          <div>
            <dt>결제 시도 (오늘)</dt>
            <dd>{stats.intent?.today ?? 0}</dd>
          </div>
          <div>
            <dt>일정 열람 완료 (누적)</dt>
            <dd>{stats.complete?.total ?? 0}</dd>
          </div>
          <div>
            <dt>일정 열람 완료 (오늘)</dt>
            <dd>{stats.complete?.today ?? 0}</dd>
          </div>
          {stats.conversionRate != null && (
            <div>
              <dt>시도 → 완료 전환율</dt>
              <dd>{stats.conversionRate}%</dd>
            </div>
          )}
        </dl>
      )}
    </div>
  );
}
