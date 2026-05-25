import { useRef } from "react";

export default function MagneticButton({
  children,
  className = "",
  onClick,
  disabled,
  type = "button",
}) {
  const ref = useRef(null);

  function handleMove(e) {
    const el = ref.current;
    if (!el || disabled) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) * 0.12;
    const y = (e.clientY - rect.top - rect.height / 2) * 0.18;
    el.style.transform = `translate(${x}px, ${y}px)`;
  }

  function handleLeave() {
    const el = ref.current;
    if (el) el.style.transform = "";
  }

  return (
    <button
      ref={ref}
      type={type}
      className={className}
      onClick={onClick}
      disabled={disabled}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      <span className="btn-shine" aria-hidden />
      <span className="btn-label">{children}</span>
    </button>
  );
}
