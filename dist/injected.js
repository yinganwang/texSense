(() => {
    const BRIDGE_SOURCE = "__OLWC_BRIDGE__";
    const BRIDGE_EVENT_TYPE = "OVERLEAF_TEXT";
    const POLL_INTERVAL_MS = 1000;
    const DEBOUNCE_MS = 350;
    const bridgeState = {
        hookedView: null,
        originalDispatch: null,
        lastText: "",
        debounceTimer: 0
    };
    function getOverleafSource() {
        try {
            const overleaf = window.overleaf;
            const view = overleaf?.unstable?.store?.items?.get?.("editor.view")?.value;
            return view?.state?.doc?.toString?.() ?? "";
        }
        catch {
            return "";
        }
    }
    function postSource(text) {
        if (text === bridgeState.lastText) {
            return;
        }
        bridgeState.lastText = text;
        window.postMessage({
            type: BRIDGE_EVENT_TYPE,
            source: BRIDGE_SOURCE,
            text
        }, "*");
    }
    function emitNow() {
        postSource(getOverleafSource());
    }
    function emitDebounced() {
        window.clearTimeout(bridgeState.debounceTimer);
        bridgeState.debounceTimer = window.setTimeout(emitNow, DEBOUNCE_MS);
    }
    function getEditorView() {
        try {
            const overleaf = window.overleaf;
            return overleaf?.unstable?.store?.items?.get?.("editor.view")?.value ?? null;
        }
        catch {
            return null;
        }
    }
    function hookDispatch(view) {
        if (!view || typeof view.dispatch !== "function") {
            return;
        }
        if (bridgeState.hookedView === view) {
            return;
        }
        if (bridgeState.hookedView && bridgeState.originalDispatch && bridgeState.hookedView.dispatch) {
            bridgeState.hookedView.dispatch = bridgeState.originalDispatch;
        }
        const originalDispatch = view.dispatch.bind(view);
        bridgeState.hookedView = view;
        bridgeState.originalDispatch = originalDispatch;
        view.dispatch = (...args) => {
            const result = originalDispatch(...args);
            emitDebounced();
            return result;
        };
        emitNow();
    }
    function tick() {
        const view = getEditorView();
        if (view) {
            hookDispatch(view);
        }
        emitDebounced();
    }
    tick();
    window.setInterval(tick, POLL_INTERVAL_MS);
    document.addEventListener("visibilitychange", () => {
        if (!document.hidden) {
            emitDebounced();
        }
    });
})();
