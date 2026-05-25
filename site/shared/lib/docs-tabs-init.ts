/**
 * Client-side tab switching for docs pages.
 *
 * Handles click events on `[data-docs-tab-trigger]` buttons inside
 * `[data-docs-tabs]` containers. Toggles active states and panel
 * visibility. No framework dependencies — plain DOM.
 */
export const docsTabsInitScript = `(function () {
  document.addEventListener('click', function (e) {
    var trigger = e.target.closest('[data-docs-tab-trigger]');
    if (!trigger) return;
    var tabs = trigger.closest('[data-docs-tabs]');
    if (!tabs) return;
    var label = trigger.getAttribute('data-docs-tab-trigger');
    tabs.querySelectorAll('[data-docs-tab-trigger]').forEach(function (t) {
      var isActive = t.getAttribute('data-docs-tab-trigger') === label;
      t.setAttribute('data-state', isActive ? 'active' : 'inactive');
      t.setAttribute('aria-selected', isActive ? 'true' : 'false');
      t.tabIndex = isActive ? 0 : -1;
      var base = 'inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]';
      if (isActive) {
        t.className = base + ' bg-background text-foreground shadow-sm dark:border-input dark:bg-input/30';
      } else {
        t.className = base + ' text-foreground dark:text-muted-foreground';
      }
    });
    tabs.querySelectorAll('[data-docs-tab-panel]').forEach(function (p) {
      var show = p.getAttribute('data-docs-tab-panel') === label;
      p.classList.toggle('hidden', !show);
    });
  });
})();`
