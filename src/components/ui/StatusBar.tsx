"use client";

import { useEffect, useMemo } from "react";
import { useBlockNumber } from "wagmi";
import { useGalaxyStore } from "@/hooks/useGalaxyStore";
import { formatNumber } from "@/lib/utils";

const SEED_COUNT = 15;

export function StatusBar() {
  const { latestBlock, setLatestBlock, wallets, transactions, contractCreations, isLiveMode, setLiveMode, resetAllData } =
    useGalaxyStore();
  const { data: blockNumber } = useBlockNumber({ watch: true });

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
        <span className="text-secondary">
          Network: <span className="text-white">Base Sepolia</span>
        </span>
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
