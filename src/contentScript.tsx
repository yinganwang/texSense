import { createRoot } from "react-dom/client";
import { FloatingPanel } from "./floatingPanel";
import { countBodyWords, type WordCountBreakdown } from "./parser";

const ROOT_ID = "olwc-root";
const INJECTED_SCRIPT_ID = "olwc-injected-bridge";
const INJECTED_SCRIPT_PATH = "injected.js";
const BRIDGE_SOURCE = "__OLWC_BRIDGE__";
const BRIDGE_EVENT_TYPE = "OVERLEAF_TEXT";
const DEBOUNCE_MS = 400;

declare const chrome: any;
interface BridgeEventPayload {
  type?: string;
  source?: string;
  text?: string;
}

function debounce(fn: () => void, wait: number): () => void {
  let timeoutId: number | undefined;
  return () => {
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(fn, wait);
  };
}

function scheduleIdle(work: () => void): void {
  const win = window as Window & {
    requestIdleCallback?: (
      cb: (deadline: {
        didTimeout: boolean;
        timeRemaining: () => number;
      }) => void,
      options?: { timeout: number },
    ) => number;
  };

  if (typeof win.requestIdleCallback === "function") {
    win.requestIdleCallback(() => work(), { timeout: 700 });
    return;
  }

  window.setTimeout(work, 0);
}

function mountRoot(): ReturnType<typeof createRoot> {
  let rootEl = document.getElementById(ROOT_ID);
  if (!rootEl) {
    rootEl = document.createElement("div");
    rootEl.id = ROOT_ID;
    document.body.appendChild(rootEl);
  }
  return createRoot(rootEl);
}

function injectPageScript(): void {
  if (document.getElementById(INJECTED_SCRIPT_ID)) {
    return;
  }

  const script = document.createElement("script");
  script.id = INJECTED_SCRIPT_ID;
  script.src = chrome.runtime.getURL(INJECTED_SCRIPT_PATH);
  script.async = false;
  script.onload = () => {
    script.remove();
  };

  (document.head || document.documentElement).appendChild(script);
}

class OverleafWordCountApp {
  private readonly reactRoot = mountRoot();

  private readonly debouncedProcess = debounce(
    () => this.processLatestText(),
    DEBOUNCE_MS,
  );

  private latestText = "";

  private lastProcessedText = "";

  private currentResult: WordCountBreakdown = {
    bodyWords: 0,
    plainText: "",
  };

  start(): void {
    this.render(false);
    this.attachBridgeListener();
    injectPageScript();
  }

  private attachBridgeListener(): void {
    window.addEventListener(
      "message",
      (event: MessageEvent<BridgeEventPayload>) => {
        if (event.source !== window) {
          return;
        }

        const payload = event.data;
        if (
          !payload ||
          payload.type !== BRIDGE_EVENT_TYPE ||
          payload.source !== BRIDGE_SOURCE
        ) {
          return;
        }

        this.latestText = payload.text ?? "";
        this.debouncedProcess();
      },
    );
  }

  private processLatestText(): void {
    const source = this.latestText;
    if (source === this.lastProcessedText) {
      return;
    }

    this.lastProcessedText = source;
    scheduleIdle(() => {
      this.currentResult = countBodyWords(source);
      this.render(source.trim().length > 0);
    });
  }

  private render(hasContent: boolean): void {
    this.reactRoot.render(
      <FloatingPanel
        bodyWords={this.currentResult.bodyWords}
        hasContent={hasContent}
      />,
    );
  }
}

if (window.location.hostname === "www.overleaf.com") {
  new OverleafWordCountApp().start();
}
