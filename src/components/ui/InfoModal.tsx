"use client";

import { useState } from "react";

const PANEL_STYLE = {
  background: "rgba(10, 10, 30, 0.85)",
  backdropFilter: "blur(24px)",
  border: "1px solid rgba(255, 255, 255, 0.08)",
  boxShadow:
    "0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
  borderRadius: "16px",
};

export function InfoModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="shrink-0 flex items-center justify-center w-10 h-10 rounded-2xl text-secondary hover:text-white transition-colors"
        style={{
          background: "rgba(10, 10, 30, 0.7)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          boxShadow:
            "0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
        }}
        title="What is Constellation?"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4" />
          <path d="M12 8h.01" />
        </svg>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div className="absolute inset-0 bg-black/60" />
          <div
            className="relative w-full max-w-md p-6 space-y-4"
            style={PANEL_STYLE}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-wide">
                What is Constellation?
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="text-secondary hover:text-white transition-colors p-1"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M18 6L6 18" />
                  <path d="M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-3 text-sm text-secondary leading-relaxed">
              <p>
                Constellation is a <span className="text-white">3D blockchain explorer</span> for
                the <span className="text-white">Base Sepolia</span> testnet. It visualizes
                on-chain activity as a living galaxy.
              </p>

              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <span className="text-white mt-0.5">&#9679;</span>
                  <p>
                    <span className="text-white">Stars</span> are wallets. Larger
                    stars have higher ETH balances.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-white mt-0.5">&#8212;</span>
                  <p>
                    <span className="text-white">Lines</span> between stars show
                    transaction connections between wallets.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-purple-400 mt-0.5">&#10043;</span>
                  <p>
                    <span className="text-purple-400">Nebulae</span> represent
                    contract deployments &mdash; new smart contracts born on-chain.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-accent mt-0.5">&#8594;</span>
                  <p>
                    <span className="text-white">Beams of light</span> are live
                    transactions streaming in real-time when Live Mode is on.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-cyan-400 mt-0.5">&#9711;</span>
                  <p>
                    <span className="text-white">Cosmic pulses</span> ripple out
                    from the center when new blocks are mined.
                  </p>
                </div>
              </div>

              <div
                className="rounded-xl p-3 mt-2"
                style={{ background: "rgba(255, 255, 255, 0.04)", border: "1px solid rgba(255, 255, 255, 0.06)" }}
              >
                <p className="text-xs text-secondary">
                  <span className="text-white font-medium">Getting started:</span>{" "}
                  Paste a wallet address or transaction hash in the search bar,
                  or connect your wallet. Toggle <span className="text-white">Live Mode</span> in the
                  bottom bar to watch the blockchain in real-time.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
