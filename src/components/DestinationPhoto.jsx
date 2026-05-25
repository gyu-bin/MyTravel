import { getDestinationImage } from "../data/destinationImages";

export default function DestinationPhoto({
  name,
  src,
  className = "",
  alt,
}) {
  const imageSrc = src || getDestinationImage(name);

  return (
    <img
      className={className}
      src={imageSrc}
      alt={alt || (name ? `${name} 여행지` : "여행지 사진")}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={(e) => {
        const fallback = getDestinationImage("안동");
        if (e.currentTarget.src !== fallback) {
          e.currentTarget.src = fallback;
        }
      }}
    />
  );
}
