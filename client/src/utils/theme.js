// light / dark theme. index.html sets it before the first paint, these change it later
export function getTheme() {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

export function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem("theme", theme);
  } catch {
    // private mode etc. - theme just won't be remembered
  }
}
