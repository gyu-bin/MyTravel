import { useCallback, useRef, useState } from "react";
import { getDestinationGallery } from "../data/destinationImages";
import DestinationPhoto from "./DestinationPhoto";
import PhotoCredit from "./PhotoCredit";

function stopCardClick(e) {
  e.stopPropagation();
}

export default function DestCardGallery({ name }) {
  const photos = getDestinationGallery(name, 4);
  const [index, setIndex] = useState(0);
  const viewportRef = useRef(null);

  const scrollTo = useCallback(
    (nextIndex) => {
      const el = viewportRef.current;
      if (!el) return;
      const i = Math.max(0, Math.min(nextIndex, photos.length - 1));
      setIndex(i);
      el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
    },
    [photos.length]
  );

  const onScroll = useCallback(() => {
    const el = viewportRef.current;
    if (!el || el.clientWidth === 0) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== index) setIndex(i);
  }, [index]);

  const hasMultiple = photos.length > 1;

  return (
    <div
      className="dest-card-carousel"
      onClick={stopCardClick}
      onKeyDown={stopCardClick}
    >
      <div className="dest-card-carousel-frame">
        {hasMultiple && (
          <button
            type="button"
            className="dest-carousel-btn dest-carousel-btn--prev"
            onClick={(e) => {
              stopCardClick(e);
              scrollTo(index - 1);
            }}
            disabled={index === 0}
            aria-label="이전 사진"
          >
            ‹
          </button>
        )}

        <div
          ref={viewportRef}
          className="dest-card-carousel-viewport"
          onScroll={onScroll}
        >
          <div className="dest-card-carousel-track">
            {photos.map((src, i) => (
              <div key={`${name}-${i}`} className="dest-card-carousel-slide">
                <DestinationPhoto
                  src={src}
                  name={name}
                  className="dest-card-carousel-photo"
                  alt={`${name} 사진 ${i + 1}`}
                />
              </div>
            ))}
          </div>
        </div>

        {hasMultiple && (
          <button
            type="button"
            className="dest-carousel-btn dest-carousel-btn--next"
            onClick={(e) => {
              stopCardClick(e);
              scrollTo(index + 1);
            }}
            disabled={index >= photos.length - 1}
            aria-label="다음 사진"
          >
            ›
          </button>
        )}

        {hasMultiple && (
          <span className="dest-carousel-counter" aria-live="polite">
            {index + 1} / {photos.length}
          </span>
        )}
      </div>

      {hasMultiple && (
        <div className="dest-card-carousel-dots" role="tablist" aria-label="사진 선택">
          {photos.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`${i + 1}번째 사진`}
              className={`dest-carousel-dot${i === index ? " is-active" : ""}`}
              onClick={(e) => {
                stopCardClick(e);
                scrollTo(i);
              }}
            />
          ))}
        </div>
      )}

      <PhotoCredit name={name} className="dest-card-gallery-credit" />
    </div>
  );
}
