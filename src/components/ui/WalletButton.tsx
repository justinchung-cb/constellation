"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, usePublicClient } from "wagmi";
import { useEffect, useRef } from "react";
import { useBlockchainData } from "@/hooks/useBlockchainData";
import { truncateAddress } from "@/lib/utils";

export function WalletButton() {
  const { address, isConnected } = useAccount();
  const { fetchWallet } = useBlockchainData();
  const publicClient = usePublicClient();
  const fetchedRef = useRef<string | null>(null);

  useEffect(() => {
    if (isConnected && address && publicClient && fetchedRef.current !== address) {
      fetchedRef.current = address;
      fetchWallet(address);
    }
  }, [isConnected, address, publicClient, fetchWallet]);

  return (
    <ConnectButton.Custom>
      {({ account, chain, openConnectModal, openAccountModal, openChainModal, mounted }) => {
        const connected = mounted && account && chain;

        return (
          <div
            {...(!mounted && {
              "aria-hidden": true,
              style: { opacity: 0, pointerEvents: "none" as const, userSelect: "none" as const },
            })}
          >
            {!connected ? (
              <button
                onClick={openConnectModal}
                className="flex items-center justify-center rounded-xl transition-all hover:brightness-110"
                style={{
                  width: 44,
                  height: 44,
                  background: "rgba(0, 82, 255, 0.25)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(0, 82, 255, 0.4)",
                  boxShadow:
                    "0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.08)",
                  color: "#5B9DFF",
                }}
                title="Connect Wallet"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="6" width="20" height="14" rx="2" />
                  <path d="M2 10h20" />
                  <path d="M16 14h2" />
                </svg>
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                {chain.unsupported ? (
                  <button
                    onClick={openChainModal}
                    className="flex items-center justify-center rounded-xl text-xs font-medium"
                    style={{
                      height: 44,
                      padding: "0 12px",
                      background: "rgba(255, 60, 60, 0.15)",
                      border: "1px solid rgba(255, 60, 60, 0.3)",
                      color: "#ff6b6b",
                    }}
                  >
                    Wrong network
                  </button>
                ) : (
                  <button
                    onClick={openAccountModal}
                    className="flex items-center gap-2 rounded-xl transition-all hover:bg-white/5"
                    style={{
                      height: 44,
                      padding: "0 14px",
                      background: "rgba(10, 10, 30, 0.7)",
                      backdropFilter: "blur(20px)",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      boxShadow:
                        "0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
                    }}
                  >
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: "#00FFAA", boxShadow: "0 0 6px rgba(0, 255, 170, 0.5)" }}
                    />
                    <span className="text-sm font-mono text-white/80">
                      {truncateAddress(account.address)}
                    </span>
                  </button>
                )}
              </div>
            )}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
