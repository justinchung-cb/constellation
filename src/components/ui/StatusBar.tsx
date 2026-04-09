"use client";

import { useEffect, useMemo, useState } from "react";
import { useBlockNumber, useChainId, useSwitchChain } from "wagmi";
import { useGalaxyStore } from "@/hooks/useGalaxyStore";
import { formatNumber } from "@/lib/utils";
import { SUPPORTED_CHAINS } from "@/lib/chains";

const SEED_COUNT = 15;

export function StatusBar() {
  const { latestBlock, setLatestBlock, wallets, transactions, contractCreations, isLiveMode, setLiveMode, isSoundEnabled, setSoundEnabled, rpcHealthy, resetAllData } =
    useGalaxyStore();
  const chainId = useChainId();
  const { data: blockNumber } = useBlockNumber({ watch: true, chainId });
  const { switchChain } = useSwitchChain();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const activeChain = SUPPORTED_CHAINS.find((c) => c.id === chainId) ?? SUPPORTED_CHAINS[0];

  const contractWalletCount = useMemo(
    () => Array.from(wallets.values()).filter((w) => w.isContract).length,
    [wallets],
  );
  const nebulaCount = contractCreations.size + contractWalletCount;
  const starCount = wallets.size - contractWalletCount + SEED_COUNT;

  useEffect(() => {
    if (blockNumber) {
      setLatestBlock(Number(blockNumber));
    }
  }, [blockNumber, setLatestBlock]);

  return (
    <div
      className="flex items-center justify-between px-4 py-2 text-xs"
      style={{
        background: "rgba(10, 10, 30, 0.7)",
        backdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(255, 255, 255, 0.08)",
      }}
    >
      <div className="flex items-center gap-4">
        <span className="text-secondary">
          Latest Block:{" "}
          <span className="text-white font-mono">
            {latestBlock ? `#${formatNumber(latestBlock)}` : "—"}
          </span>
        </span>
        <div className="relative flex items-center gap-1.5">
          <span
            className="inline-block h-1.5 w-1.5 rounded-full"
            style={{
              background: rpcHealthy ? "#00FFAA" : "#FF6666",
              boxShadow: rpcHealthy ? "0 0 4px #00FFAA" : "0 0 4px #FF6666",
            }}
          />
          <button
            onClick={() => setDropdownOpen((v) => !v)}
            className="text-secondary flex items-center gap-1 hover:text-white transition-colors"
          >
            Network:{" "}
            <span className="text-white">{activeChain.name}</span>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          {!rpcHealthy && (
            <span style={{ color: "#FF6666", fontSize: "10px" }}>
              (reconnecting)
            </span>
          )}
          {dropdownOpen && (
            <div
              className="absolute bottom-8 left-0 rounded-lg py-1 z-50"
              style={{
                background: "rgba(10, 10, 30, 0.95)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                boxShadow: "0 4px 16px rgba(0, 0, 0, 0.5)",
              }}
            >
              {SUPPORTED_CHAINS.map((chain) => (
                <button
                  key={chain.id}
                  onClick={() => {
                    if (chain.id !== chainId) {
                      switchChain({ chainId: chain.id });
                      resetAllData();
                    }
                    setDropdownOpen(false);
                  }}
                  className="w-full px-4 py-1.5 text-left text-xs hover:bg-white/5 transition-colors whitespace-nowrap flex items-center gap-2"
                  style={{ color: chain.id === chainId ? "#ffffff" : "#888899" }}
                >
                  {chain.id === chainId && (
                    <span className="h-1.5 w-1.5 rounded-full bg-white inline-block" />
                  )}
                  {chain.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-secondary">
          Stars:{" "}
          <span className="text-white">{starCount}</span>
        </span>
        <span className="text-secondary">
          Nebulae:{" "}
          <span className="text-white">{nebulaCount}</span>
        </span>
        <span className="text-secondary">
          Txns:{" "}
          <span className="text-white">{transactions.length}</span>
        </span>

        <button
          onClick={resetAllData}
          className="text-secondary hover:text-red-400 transition-colors px-2 py-0.5 rounded-md hover:bg-white/5"
          style={{ border: "1px solid rgba(255, 255, 255, 0.08)" }}
          title="Clear all cached wallet and transaction data"
        >
          Reset Data
        </button>

        <button
          onClick={() => setSoundEnabled(!isSoundEnabled)}
          className="p-1.5 rounded-md transition-colors hover:bg-white/5"
          style={{ color: isSoundEnabled ? "#0052FF" : "#555" }}
          title={isSoundEnabled ? "Mute transaction sounds" : "Unmute transaction sounds"}
        >
          {isSoundEnabled ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <line x1="23" y1="9" x2="17" y2="15" />
              <line x1="17" y1="9" x2="23" y2="15" />
            </svg>
          )}
        </button>

        <button
          onClick={() => setLiveMode(!isLiveMode)}
          className="flex items-center gap-1.5 transition-opacity"
          style={{ opacity: isLiveMode ? 1 : 0.5 }}
        >
          <span
            className="relative flex h-5 w-9 items-center rounded-full p-0.5 transition-colors"
            style={{
              background: isLiveMode ? "rgba(0, 255, 170, 0.3)" : "rgba(255, 255, 255, 0.1)",
              border: `1px solid ${isLiveMode ? "rgba(0, 255, 170, 0.5)" : "rgba(255, 255, 255, 0.15)"}`,
            }}
          >
            <span
              className="h-3.5 w-3.5 rounded-full transition-all duration-200"
              style={{
                background: isLiveMode ? "#00FFAA" : "#555",
                transform: isLiveMode ? "translateX(14px)" : "translateX(0)",
                boxShadow: isLiveMode ? "0 0 6px #00FFAA" : "none",
              }}
            />
          </span>
          <span className="flex items-center gap-1">
            {isLiveMode && (
              <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
            )}
            <span style={{ color: isLiveMode ? "#00FFAA" : "#888899" }}>
              Live{isLiveMode ? "" : ": OFF"}
            </span>
          </span>
        </button>
      </div>
    </div>
  );
}
