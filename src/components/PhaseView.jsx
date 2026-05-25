/** 화면 전환 시 페이드·슬라이드 인 */
export default function PhaseView({ children, className = "" }) {
  return (
    <div className={`phase-view ${className}`.trim()}>{children}</div>
  );
}
