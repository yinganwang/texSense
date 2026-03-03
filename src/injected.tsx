(() => {
  const BRIDGE_SOURCE = "__OLWC_BRIDGE__";
  const BRIDGE_EVENT_TYPE = "OVERLEAF_TEXT";
  const POLL_INTERVAL_MS = 1000;
  const DEBOUNCE_MS = 350;

  type DispatchLike = (...args: unknown[]) => unknown;

  interface EditorViewLike {
    dispatch?: DispatchLike;
    state?: {
      doc?: {
        toString?: () => string;
      };
    };
  }

  interface OverleafLike {
    unstable?: {
      store?: {
        items?: {
          get?: (key: string) => { value?: EditorViewLike } | undefined;
        };
      };
    };
  }

  const bridgeState = {
    hookedView: null as EditorViewLike | null,
    originalDispatch: null as DispatchLike | null,
    lastText: "",
    debounceTimer: 0 as number | undefined
  };

  function getOverleafSource(): string {
    try {
      const overleaf = (window as Window & { overleaf?: OverleafLike }).overleaf;
      const view = overleaf?.unstable?.store?.items?.get?.("editor.view")?.value;
      return view?.state?.doc?.toString?.() ?? "";
    } catch {
      return "";
    }
  }

  function postSource(text: string): void {
    if (text === bridgeState.lastText) {
      return;
    }

    bridgeState.lastText = text;
    window.postMessage(
      {
        type: BRIDGE_EVENT_TYPE,
        source: BRIDGE_SOURCE,
        text
      },
      "*"
    );
  }

  function emitNow(): void {
    postSource(getOverleafSource());
  }

  function emitDebounced(): void {
    window.clearTimeout(bridgeState.debounceTimer);
    bridgeState.debounceTimer = window.setTimeout(emitNow, DEBOUNCE_MS);
  }

  function getEditorView(): EditorViewLike | null {
    try {
      const overleaf = (window as Window & { overleaf?: OverleafLike }).overleaf;
      return overleaf?.unstable?.store?.items?.get?.("editor.view")?.value ?? null;
    } catch {
      return null;
    }
  }

  function hookDispatch(view: EditorViewLike): void {
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

    view.dispatch = (...args: unknown[]) => {
      const result = originalDispatch(...args);
      emitDebounced();
      return result;
    };

    emitNow();
  }

  function tick(): void {
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
