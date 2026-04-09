"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAccount } from "wagmi";
import { useGalaxyStore } from "@/hooks/useGalaxyStore";
import { WalletDetail } from "./WalletDetail";
import { ContractDetail } from "./ContractDetail";
import { TransactionDetail } from "./TransactionDetail";
import { BlockDetail } from "./BlockDetail";

const TYPE_LABELS = {
  wallet: "Wallet",
  transaction: "Transaction",
  block: "Block",
  contract: "Contract",
} as const;

export function DetailPanel() {
  const { selectedEntity, clearSelection } = useGalaxyStore();
  const { address: connectedAddress } = useAccount();
  const [showFocusTip, setShowFocusTip] = useState(false);
  const isOwnWallet = selectedEntity?.type === "wallet" &&
    connectedAddress?.toLowerCase() === selectedEntity.id.toLowerCase();

  return (
    <AnimatePresence>
      {selectedEntity && (
        <motion.div
          key={selectedEntity.type + selectedEntity.id}
          initial={{ x: "100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed right-0 top-0 bottom-0 z-20 w-[380px] max-w-[90vw] overflow-y-auto"
          style={{
            background: "rgba(10, 10, 30, 0.85)",
            backdropFilter: "blur(20px)",
            borderLeft: "1px solid rgba(255, 255, 255, 0.08)",
            boxShadow: "-8px 0 32px rgba(0, 0, 0, 0.5)",
          }}
        >
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-sm font-medium text-secondary uppercase tracking-wider">
              {isOwnWallet ? "Your Wallet" : TYPE_LABELS[selectedEntity.type]}
            </h2>
            <div className="flex items-center gap-2">
              {selectedEntity.type === "wallet" && (
                <div className="relative flex items-center gap-1.5">
                  <span className="text-[11px] text-secondary uppercase tracking-wider">
                    Focus Mode
                  </span>
                  <div
                    className="relative"
                    onMouseEnter={() => setShowFocusTip(true)}
                    onMouseLeave={() => setShowFocusTip(false)}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-secondary cursor-help"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="16" x2="12" y2="12" />
                      <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                    {showFocusTip && (
                      <div
                        className="absolute right-0 top-6 w-52 px-3 py-2 rounded-lg text-[11px] text-white/80 leading-relaxed pointer-events-none z-50"
                        style={{
                          background: "rgba(10, 10, 30, 0.95)",
                          border: "1px solid rgba(255, 255, 255, 0.1)",
                          boxShadow: "0 4px 16px rgba(0, 0, 0, 0.5)",
                        }}
                      >
                        Only this wallet and wallets it has transacted with are shown. Click away to exit.
                      </div>
                    )}
                  </div>
                </div>
              )}
              <button
                onClick={clearSelection}
                className="text-secondary hover:text-white transition-colors p-1"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          <div className="p-4">
            {selectedEntity.type === "wallet" && (
              <WalletDetail address={selectedEntity.id} />
            )}
            {selectedEntity.type === "transaction" && (
              <TransactionDetail hash={selectedEntity.id} />
            )}
            {selectedEntity.type === "contract" && (
              <ContractDetail address={selectedEntity.id} />
            )}
            {selectedEntity.type === "block" && (
              <BlockDetail blockNumber={selectedEntity.id} />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
