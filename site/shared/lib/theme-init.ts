/**
 * Theme initialization script string.
 *
 * Inline this in a <script> tag before any visible content to prevent FOUC.
 * Read-only: reads the `theme` cookie (shared across barefootjs.dev
 * subdomains), falls back to a legacy localStorage value, then to system
 * preference. Cookie writes / legacy migration live in ThemeSwitcher,
 * which runs after hydration.
 */
export const themeInitScript = `(function () {
  var m = document.cookie.match(/(?:^|; )theme=(light|dark)/);
  var stored = m && m[1];
  if (!stored) {
    try {
      var legacy = localStorage.getItem('theme');
      if (legacy === 'light' || legacy === 'dark') stored = legacy;
    } catch (_) {}
  }
  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (stored === 'dark' || (!stored && prefersDark)) {
    document.documentElement.classList.add('dark');
  }
})();`
