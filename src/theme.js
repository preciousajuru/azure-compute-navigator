(() => {
  const storageKey = "azure-compute-navigator-theme";
  let theme = "light";

  try {
    if (localStorage.getItem(storageKey) === "dark") theme = "dark";
  } catch (error) {
    console.warn("Theme preference is unavailable; using the light theme.", error);
  }

  function applyTheme(value) {
    theme = value;
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]').content = theme === "dark" ? "#181a1d" : "#f5f6f8";
    const toggle = document.getElementById("theme-toggle");
    if (!toggle) return;
    toggle.setAttribute("aria-pressed", String(theme === "dark"));
    toggle.setAttribute("aria-label", `Switch to ${theme === "dark" ? "light" : "dark"} theme`);
    document.getElementById("theme-label").textContent = theme === "dark" ? "Light" : "Dark";
  }

  applyTheme(theme);
  document.addEventListener("DOMContentLoaded", () => {
    applyTheme(theme);
    document.getElementById("theme-toggle").addEventListener("click", () => {
      applyTheme(theme === "dark" ? "light" : "dark");
      const status = document.getElementById("theme-status");
      status.textContent = `${theme === "dark" ? "Dark" : "Light"} theme enabled.`;
      try {
        localStorage.setItem(storageKey, theme);
      } catch (error) {
        status.textContent += " Your browser could not save this preference.";
        console.warn("Unable to save the theme preference.", error);
      }
    });
  });

  window.addEventListener("storage", (event) => {
    if (event.key === storageKey || event.key === null) {
      applyTheme(event.newValue === "dark" ? "dark" : "light");
    }
  });
})();
