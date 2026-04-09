"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { useGalaxyStore } from "@/hooks/useGalaxyStore";
import { truncateAddress, formatEth, timeAgo } from "@/lib/utils";

const MAX_ENTRIES = 30;

export function ActivityLog() {
  const { transactions, liveQueue, selectTransaction } = useGalaxyStore();
  const [collapsed, setCollapsed] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(0);
  const [, setTick] = useState(0);

  const feed = useMemo(() => {
    const liveHashes = new Set(liveQueue.map((t) => t.hash));
    const combined = [
      ...liveQueue,
      ...transactions.filter((tx) => !liveHashes.has(tx.hash)),
    ];
    combined.sort((a, b) => b.timestamp - a.timestamp);
    return combined.slice(0, MAX_ENTRIES);
  }, [transactions, liveQueue]);

  useEffect(() => {
    if (feed.length > prevCountRef.current && listRef.current) {
      listRef.current.scrollTop = 0;
    }
    prevCountRef.current = feed.length;
  }, [feed.length]);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 5000);
    return () => clearInterval(id);
  }, []);

  if (feed.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 64,
        right: 16,
        width: 300,
        zIndex: 10,
        background: "rgba(10, 10, 30, 0.7)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: 16,
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
        overflow: "hidden",
        transition: "height 0.3s ease",
      }}
    >
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-xs uppercase tracking-wider"
        style={{ borderBottom: collapsed ? "none" : "1px solid rgba(255, 255, 255, 0.06)" }}
      >
        <span className="flex items-center gap-2 text-secondary">
          <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
          Live Activity
          <span className="text-white/40">({feed.length})</span>
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-secondary transition-transform"
          style={{ transform: collapsed ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          <path d="M18 15l-6-6-6 6" />
        </svg>
      </button>

      {!collapsed && (
        <div
          ref={listRef}
          className="activity-log-scroll"
          style={{
            maxHeight: "40vh",
            overflowY: "auto",
            maskImage: "linear-gradient(to bottom, black 85%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to bottom, black 85%, transparent 100%)",
          }}
        >
          {feed.map((tx, i) => {
            const isLive = i < liveQueue.length && liveQueue.some((l) => l.hash === tx.hash);
            return (
              <button
                key={tx.hash}
                onClick={() => selectTransaction(tx.hash)}
                className="w-full text-left px-4 py-2.5 hover:bg-white/5 transition-colors"
                style={{
                  borderBottom: "1px solid rgba(255, 255, 255, 0.03)",
                  animation: isLive ? "slideIn 0.3s ease-out" : undefined,
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="shrink-0 h-1.5 w-1.5 rounded-full"
                      style={{ background: tx.status === "failed" ? "#FF4466" : "#0052FF" }}
                    />
                    <span className="text-xs font-mono text-secondary truncate">
                      {truncateAddress(tx.from)}
                    </span>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-secondary/50 shrink-0">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                    <span className="text-xs font-mono text-secondary truncate">
                      {tx.to.startsWith("contract:") ? "Contract" : truncateAddress(tx.to)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-white/70">
                    {formatEth(tx.value)} ETH
                  </span>
                  <span className="text-[10px] text-secondary">
                    {timeAgo(tx.timestamp)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
