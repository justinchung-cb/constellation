"use client";

import { useState, type FormEvent } from "react";
import { useBlockchainData } from "@/hooks/useBlockchainData";
import { useGalaxyStore } from "@/hooks/useGalaxyStore";

const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;
const TX_HASH_RE = /^0x[a-fA-F0-9]{64}$/;

export function SearchBar() {
  const [query, setQuery] = useState("");
  const { fetchWallet, fetchTransaction } = useBlockchainData();
  const { isLoading } = useGalaxyStore();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    if (ADDRESS_RE.test(trimmed)) {
      fetchWallet(trimmed);
    } else if (TX_HASH_RE.test(trimmed)) {
      fetchTransaction(trimmed);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-lg">
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
          className="flex-1 bg-transparent text-sm text-white placeholder:text-secondary outline-none font-mono"
          spellCheck={false}
        />

        {isLoading && (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        )}
      </div>
    </form>
  );
}
