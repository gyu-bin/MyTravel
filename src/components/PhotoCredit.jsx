import { getImageCredit } from "../data/destinationImages";

export default function PhotoCredit({ name, className = "" }) {
  const credit = getImageCredit(name);
  if (!credit) return null;

  return (
    <p className={`photo-credit ${className}`.trim()}>
      사진:{" "}
      <a href={credit.href} target="_blank" rel="noopener noreferrer">
        {credit.label}
      </a>
    </p>
  );
}
