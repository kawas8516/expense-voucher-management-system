import { useState } from "react";
import { getTheme, setTheme } from "../utils/theme";
import Icon from "./Icon";

// light / dark switch shown in the navbar
function ThemeToggle() {
  const [theme, setThemeState] = useState(getTheme);
  const dark = theme === "dark";
  const label = dark ? "Switch to light mode" : "Switch to dark mode";

  function toggle() {
    const next = dark ? "light" : "dark";
    setTheme(next);
    setThemeState(next);
  }

  return (
    <button type="button" className="icon-btn" onClick={toggle} aria-label={label} aria-pressed={dark} title={label}>
      <Icon name={dark ? "sun" : "moon"} />
    </button>
  );
}

export default ThemeToggle;
