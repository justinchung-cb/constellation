"use client";

import { useState, useRef, useEffect, useCallback, type FormEvent } from "react";
import { useBlockchainData } from "@/hooks/useBlockchainData";
import { useGalaxyStore } from "@/hooks/useGalaxyStore";
import { truncateAddress } from "@/lib/utils";

const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;
const TX_HASH_RE = /^0x[a-fA-F0-9]{64}$/;

const STORAGE_KEY = "constellation:recent-searches";
const MAX_RECENT = 8;

type RecentEntry = { query: string; type: "address" | "tx" };

function loadRecent(): RecentEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRecent(entries: RecentEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {}
}

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [recent, setRecent] = useState<RecentEntry[]>([]);
  const [showRecent, setShowRecent] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { fetchWallet, fetchTransaction } = useBlockchainData();
  const { isLoading } = useGalaxyStore();

  useEffect(() => {
    setRecent(loadRecent());
  }, []);

  const addRecent = useCallback((entry: RecentEntry) => {
    setRecent((prev) => {
      const filtered = prev.filter((e) => e.query !== entry.query);
      const next = [entry, ...filtered].slice(0, MAX_RECENT);
      saveRecent(next);
      return next;
    });
  }, []);

  const clearRecent = useCallback(() => {
    setRecent([]);
    saveRecent([]);
  }, []);

  const submitQuery = useCallback(
    (value: string) => {
      const trimmed = value.trim();
      if (!trimmed) return;

      if (ADDRESS_RE.test(trimmed)) {
        addRecent({ query: trimmed, type: "address" });
        fetchWallet(trimmed);
      } else if (TX_HASH_RE.test(trimmed)) {
        addRecent({ query: trimmed, type: "tx" });
        fetchTransaction(trimmed);
      }
      setQuery("");
      setShowRecent(false);
    },
    [addRecent, fetchWallet, fetchTransaction],
  );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    submitQuery(query);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowRecent(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const visibleRecent = recent.filter((entry) => {
    if (!query.trim()) return true;
    return entry.query.toLowerCase().includes(query.trim().toLowerCase());
  });

  return (
    <div ref={containerRef} className="relative w-full max-w-lg">
      <form onSubmit={handleSubmit}>
        <div
          className="flex items-center gap-2 rounded-2xl px-4 py-3"
          style={{
            background: "rgba(10, 10, 30, 0.7)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            boxShadow:
              "0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="shrink-0 text-secondary"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>

          <input
            type="text"
            placeholder="Search address or tx hash (0x...)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowRecent(true)}
            className="flex-1 bg-transparent text-sm text-white placeholder:text-secondary outline-none font-mono"
            spellCheck={false}
          />

          {isLoading && (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          )}
        </div>
      </form>

      {showRecent && visibleRecent.length > 0 && (
        <div
          className="absolute top-full left-0 right-0 mt-1.5 rounded-2xl py-2 overflow-hidden"
          style={{
            background: "rgba(10, 10, 30, 0.9)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)",
            zIndex: 50,
          }}
        >
          <div className="flex items-center justify-between px-4 py-1.5">
            <span className="text-[11px] text-secondary uppercase tracking-wider">Recent</span>
            <button
              type="button"
              onClick={clearRecent}
              className="text-[11px] text-secondary hover:text-white transition-colors"
            >
              Clear
            </button>
          </div>
          {visibleRecent.map((entry) => (
            <button
              key={entry.query}
              type="button"
              onClick={() => submitQuery(entry.query)}
              className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-white/5 transition-colors"
            >
              <span className="text-secondary shrink-0">
                {entry.type === "address" ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M20 21a8 8 0 1 0-16 0" />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M7 7h10v10" />
                    <path d="M7 17 17 7" />
                  </svg>
                )}
              </span>
              <span className="text-sm font-mono text-white/80 truncate">
                {truncateAddress(entry.query)}
              </span>
              <span className="text-[11px] text-secondary ml-auto shrink-0">
                {entry.type === "address" ? "Wallet" : "Tx"}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
