import { useEffect, useState } from "react";
import { getPreferredTheme, setTheme } from "../utils/theme";

export default function ThemeToggle() {
  const [theme, setThemeState] = useState(() => getPreferredTheme());

  useEffect(() => {
    setTheme(theme);
  }, [theme]);

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={() => setThemeState((t) => (t === "dark" ? "light" : "dark"))}
      aria-label={theme === "dark" ? "라이트 모드로 전환" : "다크 모드로 전환"}
      title={theme === "dark" ? "라이트 모드" : "다크 모드"}
    >
      <span className="theme-toggle-icon" aria-hidden>
        {theme === "dark" ? "☀️" : "🌙"}
      </span>
    </button>
  );
}
