import React, { useMemo, useRef, useState } from "react";

export interface PanelProps {
  bodyWords: number;
  rawWords: number;
  removedWords: number;
  hasContent: boolean;
}

type Position = {
  left: number;
  top: number;
};

const DEFAULT_POSITION: Position = {
  left: Math.max(16, window.innerWidth - 280),
  top: Math.max(16, window.innerHeight - 220)
};

export function FloatingPanel(props: PanelProps): React.JSX.Element {
  const { bodyWords, rawWords, removedWords, hasContent } = props;
  const [collapsed, setCollapsed] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [position, setPosition] = useState<Position>(DEFAULT_POSITION);
  const dragState = useRef<{ offsetX: number; offsetY: number } | null>(null);

  const countLabel = useMemo(() => bodyWords.toLocaleString(), [bodyWords]);

  const beginDrag = (event: React.PointerEvent<HTMLDivElement>): void => {
    dragState.current = {
      offsetX: event.clientX - position.left,
      offsetY: event.clientY - position.top
    };
    (event.currentTarget as HTMLDivElement).setPointerCapture(event.pointerId);
  };

  const moveDrag = (event: React.PointerEvent<HTMLDivElement>): void => {
    if (!dragState.current) {
      return;
    }
    const nextLeft = Math.min(Math.max(0, event.clientX - dragState.current.offsetX), window.innerWidth - 120);
    const nextTop = Math.min(Math.max(0, event.clientY - dragState.current.offsetY), window.innerHeight - 40);
    setPosition({ left: nextLeft, top: nextTop });
  };

  const endDrag = (): void => {
    dragState.current = null;
  };

  return (
    <div style={{ left: `${position.left}px`, top: `${position.top}px` }} className="olwc-panel">
      <div
        className="olwc-header"
        onPointerDown={beginDrag}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <span className="olwc-title">Overleaf Latex Word Count</span>
        <div className="olwc-actions">
          <button className="olwc-btn" type="button" onClick={() => setShowBreakdown((prev) => !prev)}>
            {showBreakdown ? "Hide" : "Info"}
          </button>
          <button className="olwc-btn" type="button" onClick={() => setCollapsed((prev) => !prev)}>
            {collapsed ? "Open" : "-"}
          </button>
        </div>
      </div>

      {collapsed ? (
        <div className="olwc-collapsed">
          <span>Body Words</span>
          <strong>{countLabel}</strong>
        </div>
      ) : (
        <div className="olwc-body">
          <div className="olwc-label">Body Words</div>
          <div className="olwc-count">{countLabel}</div>

          {!hasContent && <div className="olwc-empty">Waiting for editor content...</div>}

          {showBreakdown && (
            <div className="olwc-breakdown">
              <div className="olwc-row">
                <span>Raw words</span>
                <span>{rawWords.toLocaleString()}</span>
              </div>
              <div className="olwc-row">
                <span>Removed</span>
                <span>{removedWords.toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
