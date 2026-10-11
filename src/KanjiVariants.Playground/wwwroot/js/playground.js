window.playground = {
    markReady() { document.getElementById("app").dataset.startupMilliseconds = performance.now().toFixed(1); },
    setTheme(theme) { document.documentElement.dataset.theme = theme; },
    async copy(text) { await navigator.clipboard.writeText(text); }
};
