import { getDestinationGallery } from "../data/destinationImages";
import DestinationPhoto from "./DestinationPhoto";
import PhotoCredit from "./PhotoCredit";

export default function DestCardGallery({ name, variant = "secondary" }) {
  const count = variant === "featured" ? 4 : 3;
  const photos = getDestinationGallery(name, count);

  return (
    <div className={`dest-card-gallery dest-card-gallery--${variant}`}>
      <div className="dest-card-gallery-main">
        <DestinationPhoto
          src={photos[0]}
          name={name}
          className="dest-card-gallery-photo dest-card-gallery-photo--main"
          alt={`${name} 대표 사진`}
        />
      </div>
      <div className="dest-card-gallery-thumbs">
        {photos.slice(1).map((src, i) => (
          <DestinationPhoto
            key={`${name}-thumb-${i}`}
            src={src}
            name={name}
            className="dest-card-gallery-photo dest-card-gallery-photo--thumb"
            alt={`${name} 사진 ${i + 2}`}
          />
        ))}
      </div>
      <PhotoCredit name={name} className="dest-card-gallery-credit" />
    </div>
  );
}
