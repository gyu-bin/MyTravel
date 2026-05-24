import { useState, useEffect, useRef } from "react";
import { CARDS } from "../data/destinations";

const POPULAR = [
  { name: "안동 🏯", pct: 78 },
  { name: "군산 🚂", pct: 71 },
  { name: "영덕 🦀", pct: 63 },
  { name: "보성 🍵", pct: 55 },
  { name: "울릉도 🌋", pct: 48 },
];

const TRAVEL_TAGS = [
  { label: "🏖 바다 여행", bg: "#EBF6FF", color: "#0077B6" },
  { label: "🌿 힐링 여행", bg: "#EEF8F4", color: "#1B7A56" },
  { label: "🍽 맛집 투어", bg: "#FFF3E0", color: "#D4550A" },
  { label: "📸 감성 여행", bg: "#FFF0F5", color: "#C02060" },
  { label: "⛺ 캠핑 여행", bg: "#F3F0FF", color: "#5B3FCC" },
  { label: "🏛 역사 탐방", bg: "#FBF4EE", color: "#7A5230" },
  { label: "🎿 액티비티", bg: "#F0F8FF", color: "#1565C0" },
  { label: "🎲 그때그때", bg: "#FFF0F5", color: "#C02060" },
];

export default function Intro({ onStart }) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [activeCard, setActiveCard] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e) => {
      const rect = el.getBoundingClientRect();
      setMousePos({
        x: ((e.clientX - rect.left) / rect.width - 0.5) * 2,
        y: ((e.clientY - rect.top) / rect.height - 0.5) * 2,
      });
    };
    el.addEventListener("mousemove", handler);
    return () => el.removeEventListener("mousemove", handler);
  }, []);

  return (
    <div ref={containerRef} className="intro">
      <div className="intro-hero">
        <div
          className="intro-hero-orb intro-hero-orb--green"
          style={{
            top: -60 + mousePos.y * 12,
            left: -80 + mousePos.x * 12,
          }}
        />
        <div
          className="intro-hero-orb intro-hero-orb--warm"
          style={{
            bottom: 20 + mousePos.y * -8,
            right: -60 + mousePos.x * -8,
          }}
        />

        {[...Array(18)].map((_, i) => (
          <div
            key={i}
            className="intro-star"
            style={{
              width: i % 3 === 0 ? 3 : 2,
              height: i % 3 === 0 ? 3 : 2,
              background:
                i % 4 === 0 ? "rgba(255,200,80,0.7)" : "rgba(255,255,255,0.4)",
              top: `${8 + i * 5}%`,
              left: `${5 + i * 5.3}%`,
              animation: `twinkle ${2 + (i % 3)}s ease-in-out infinite`,
              animationDelay: `${i * 0.3}s`,
            }}
          />
        ))}

        <div className="intro-hero-content">
          <div className="intro-badge">🗺 &nbsp;숨은 국내 여행지 추천</div>
          <h1 className="intro-title">
            나에게 딱 맞는
            <br />
            여행지가 어딜까?
          </h1>
          <p className="intro-subtitle">
            12가지 질문으로 여행 스타일을 분석하고
            <br />
            AI 맞춤 여행계획을 받아보세요
          </p>
        </div>
      </div>

      <div className="intro-body">
        <div className="intro-section">
          <div className="intro-section-label">숨은 여행지 미리보기</div>
          <div className="intro-cards">
            {CARDS.map((c, i) => (
              <div
                key={c.name}
                className="intro-card"
                onMouseEnter={() => setActiveCard(i)}
                onMouseLeave={() => setActiveCard(null)}
                style={{
                  border:
                    activeCard === i
                      ? `2px solid ${c.color}`
                      : "1.5px solid #EAE6E0",
                  boxShadow:
                    activeCard === i
                      ? `0 8px 24px ${c.color}22`
                      : "0 2px 8px rgba(0,0,0,0.05)",
                  transform: activeCard === i ? "translateY(-4px)" : "none",
                  animation: `fadeUp .5s ${i * 0.06}s both`,
                }}
              >
                <div className="intro-card-emoji">{c.emoji}</div>
                <div className="intro-card-name">{c.name}</div>
                <span
                  className="intro-card-tag"
                  style={{ background: c.bg, color: c.color }}
                >
                  {c.tag}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="intro-section intro-grid-2">
          <div className="intro-panel">
            <div className="intro-section-label">이번 달 인기 여행지</div>
            {POPULAR.map((item, i) => (
              <div key={item.name} className="intro-stat-row">
                <div className="intro-stat-header">
                  <span className="intro-stat-name">{item.name}</span>
                  <span className="intro-stat-pct">{item.pct}%</span>
                </div>
                <div className="intro-stat-bar">
                  <div
                    className="intro-stat-fill"
                    style={{
                      width: `${item.pct}%`,
                      background:
                        i === 0
                          ? "linear-gradient(90deg,#1B7A56,#34D378)"
                          : "linear-gradient(90deg,#C8C0B6,#AAA09A)",
                      animation: `barGrow .8s ${i * 0.15 + 0.2}s both`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="intro-panel">
            <div className="intro-section-label">어떤 여행을 찾고 있어?</div>
            <div className="intro-tags">
              {TRAVEL_TAGS.map((t) => (
                <span
                  key={t.label}
                  className="intro-tag"
                  style={{ background: t.bg, color: t.color }}
                >
                  {t.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="intro-cta-wrap">
          <button type="button" onClick={onStart} className="intro-cta">
            내 여행지 찾기 →
          </button>
          <p className="intro-cta-hint">약 2분 소요 · 총 12문항 · 무료</p>
        </div>
      </div>
    </div>
  );
}
