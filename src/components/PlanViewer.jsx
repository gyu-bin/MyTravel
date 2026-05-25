import { DESTINATIONS } from "../data/destinations";
import { getDestinationGallery } from "../data/destinationImages";
import DestinationPhoto from "./DestinationPhoto";
import PhotoCredit from "./PhotoCredit";

const RANK_LABELS = ["🥇 1위", "🥈 2위", "🥉 3위"];

export default function PlanViewer({
  destinations,
  plans,
  activeIndex,
  onSelectIndex,
  planLoading,
  planError,
  onRetry,
}) {
  const top3 = destinations.slice(0, 3);
  const activeDest = top3[activeIndex];
  const activePlan = activeDest ? plans[activeDest] : null;
  const planGallery = activeDest ? getDestinationGallery(activeDest) : [];
  const loadedCount = top3.filter((d) => plans[d]).length;

  return (
    <section id="result-plans" className="result-plans" aria-label="AI 여행 일정">
      <header className="result-plans-header">
        <p className="result-plans-eyebrow">Your AI Plan</p>
        <h3 className="result-plans-title">내 AI 맞춤 일정</h3>
        <p className="result-plans-desc">
          1·2·3위 카드를 눌러 각 여행지 일정을 확인하세요
        </p>
      </header>

      <div className="plan-tabs plan-tabs--result">
        {top3.map((dest, i) => {
          const info = DESTINATIONS[dest] || {};
          const isActive = i === activeIndex;
          const isLoaded = Boolean(plans[dest]);
          return (
            <button
              key={dest}
              type="button"
              className={`plan-tab${isActive ? " is-active" : ""}${isLoaded ? " is-loaded" : ""}`}
              onClick={() => onSelectIndex(i)}
              disabled={planLoading && !isLoaded}
            >
              <span className="plan-tab-rank">{RANK_LABELS[i]}</span>
              <span className="plan-tab-emoji">{info.emoji}</span>
              <span className="plan-tab-name">{dest}</span>
            </button>
          );
        })}
      </div>

      {activeDest && (
        <div className="plan-hero plan-hero--compact">
          <div className="plan-hero-overlay plan-hero-overlay--plain">
            <span className="plan-hero-emoji">
              {DESTINATIONS[activeDest]?.emoji || "🗺"}
            </span>
            <h2 className="plan-hero-title">{activeDest} 여행계획</h2>
            {planLoading && !activePlan && (
              <p className="plan-hero-reason">
                AI가 맞춤 여행계획을 작성 중이에요...
                {loadedCount > 0 && ` (${loadedCount}/${top3.length} 완료)`}
              </p>
            )}
            {activePlan && (
              <p className="plan-hero-reason">{activePlan.reason}</p>
            )}
          </div>
        </div>
      )}

      {planLoading && (
        <div className="loading loading--compact">
          <div className="loading-orbit" />
          <div className="loading-dots" aria-hidden>
            <span />
            <span />
            <span />
          </div>
          <p className="loading-sub">
            TOP 3 일정을 구성하고 있어요 ({loadedCount}/{top3.length})
          </p>
        </div>
      )}

      {planError && !planLoading && Object.keys(plans).length === 0 && (
        <div className="plan-error-wrap">
          <div className="plan-error">{planError}</div>
          <button type="button" className="btn-retry" onClick={onRetry}>
            다시 시도
          </button>
        </div>
      )}

      {planError && Object.keys(plans).length > 0 && (
        <div className="plan-error plan-error--inline">{planError}</div>
      )}

      {activePlan && !planLoading && activeDest && (
        <>
          <div className="plan-schedule-block">
            <header className="plan-section-head">
              <p className="plan-section-eyebrow">Day by Day</p>
              <h4 className="plan-section-title">추천 일정</h4>
            </header>
            <div className="plan-days">
              {activePlan.days?.map((day, dayIndex) => {
                const dayPhoto =
                  planGallery[dayIndex % planGallery.length] || planGallery[0];
                return (
                  <article className="day-card" key={day.day}>
                    <div className="day-card-photo-wrap">
                      <DestinationPhoto
                        src={dayPhoto}
                        name={activeDest}
                        className="day-card-photo"
                        alt={`${activeDest} ${day.day} 사진`}
                      />
                      <PhotoCredit name={activeDest} className="day-card-credit" />
                      <span className="day-card-badge">{day.day}</span>
                    </div>
                    <div className="day-card-body">
                      <div className="day-card-head">
                        <div className="day-title">{day.day}</div>
                        <div className="day-subtitle">{day.title}</div>
                      </div>
                      <div className="sch-list">
                        {day.schedule?.map((s, i) => (
                          <div className="sch-item" key={i}>
                            <div className="sch-time-col">
                              <span className="sch-time">{s.time}</span>
                              <span className="sch-dot" aria-hidden />
                            </div>
                            <div className="sch-content">
                              <div className="sch-place">{s.place}</div>
                              <div className="sch-desc">{s.desc}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          <div className="plan-extras">
            <div className="tips-card">
              <header className="plan-section-head plan-section-head--compact">
                <p className="plan-section-eyebrow">Local Tips</p>
                <h4 className="plan-section-title">현지 꿀팁</h4>
              </header>
              <div className="tip-list">
                {activePlan.tips?.map((tip, i) => (
                  <div className="tip-item" key={i}>
                    <span className="tip-bullet" aria-hidden>
                      ✦
                    </span>
                    <span>{tip}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="tips-card tips-card--food">
              <header className="plan-section-head plan-section-head--compact">
                <p className="plan-section-eyebrow">Must Eat</p>
                <h4 className="plan-section-title">꼭 먹어야 할 것</h4>
              </header>
              <div className="food-tags">
                {activePlan.food?.map((f) => (
                  <span key={f} className="food-tag">
                    {f}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
