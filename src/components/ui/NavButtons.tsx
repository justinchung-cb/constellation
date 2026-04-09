"use client";

import { useGalaxyStore } from "@/hooks/useGalaxyStore";

const BTN_BASE =
  "shrink-0 flex items-center justify-center w-10 h-10 rounded-2xl transition-colors";

const PANEL_STYLE = {
  background: "rgba(10, 10, 30, 0.7)",
  backdropFilter: "blur(20px)",
  border: "1px solid rgba(255, 255, 255, 0.08)",
  boxShadow:
    "0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
};

export function NavButtons() {
  const { canGoBack, canGoForward, goBack, goForward } = useGalaxyStore();

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={goBack}
        disabled={!canGoBack}
        className={`${BTN_BASE} ${canGoBack ? "text-secondary hover:text-white" : "text-white/15 cursor-default"}`}
        style={PANEL_STYLE}
        title="Go back"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      <button
        onClick={goForward}
        disabled={!canGoForward}
        className={`${BTN_BASE} ${canGoForward ? "text-secondary hover:text-white" : "text-white/15 cursor-default"}`}
        style={PANEL_STYLE}
        title="Go forward"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>
    </div>
  );
}
