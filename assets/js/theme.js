const STORAGE_KEY = "theme";
const THEME_ATTR  = "data-theme";
const QUERY_KEY   = "(prefers-color-scheme: dark)";

const themes = {
  LIGHT: "light",
  DARK: "dark",
};

// Run immediately to set theme before first paint (prevents FOUC)
initTheme();

function initTheme() {
  const savedTheme = localStorage.getItem(STORAGE_KEY);

  if (savedTheme) {
    setTheme(savedTheme);
  } else if (window.matchMedia && window.matchMedia(QUERY_KEY).matches) {
    setTheme(themes.DARK);
  } else {
    // Default to DARK — the site's primary aesthetic
    setTheme(themes.DARK);
  }

  // Watch for system theme changes only when the user hasn't chosen explicitly
  window.matchMedia(QUERY_KEY).addEventListener("change", (e) => {
    if (localStorage.getItem(STORAGE_KEY)) return;
    setTheme(e.matches ? themes.DARK : themes.LIGHT);
  });
}

function toggleTheme() {
  const theme = getTheme();
  const newTheme = theme === themes.DARK ? themes.LIGHT : themes.DARK;
  setTheme(newTheme);
  localStorage.setItem(STORAGE_KEY, newTheme);
}

function getTheme() {
  return document.documentElement.getAttribute(THEME_ATTR);
}

function setTheme(value) {
  document.documentElement.setAttribute(THEME_ATTR, value);
}
