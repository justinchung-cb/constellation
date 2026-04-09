"use client";

import { useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { useGalaxyStore } from "@/hooks/useGalaxyStore";
import { useBlockchainData } from "@/hooks/useBlockchainData";
import { AddressChip } from "@/components/shared/AddressChip";
import { ClaimStarModal } from "./ClaimStarModal";
import { PLANET_PALETTES } from "@/types";
import { formatEth, formatNumber, formatTokenBalance, truncateAddress } from "@/lib/utils";

const VISIBLE_LIMIT = 5;

function InfoTip({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <svg
        width="13"
        height="13"
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
      {show && (
        <div
          className="absolute right-0 top-6 w-max max-w-48 px-2.5 py-1.5 rounded-lg text-[11px] text-white/80 leading-snug pointer-events-none z-50"
          style={{
            background: "rgba(10, 10, 30, 0.95)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.5)",
          }}
        >
          {text}
        </div>
      )}
    </div>
  );
}

export function WalletDetail({ address }: { address: string }) {
  const { wallets, transactions, selectWallet, selectContract, selectTransaction, removeWallet, clearSelection, isLoading } = useGalaxyStore();
  const { address: connectedAddress } = useAccount();
  const [showAllTxs, setShowAllTxs] = useState(false);
  const [showAllConnected, setShowAllConnected] = useState(false);
  const [showAllNebulae, setShowAllNebulae] = useState(false);
  const [showAllTokens, setShowAllTokens] = useState(false);
  const [tokenSearch, setTokenSearch] = useState("");
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const { fetchWallet } = useBlockchainData();
  const wallet = wallets.get(address);

  const isOwnWallet = connectedAddress?.toLowerCase() === address.toLowerCase();
  const registration = wallet?.registeredStar;

  const walletTxs = useMemo(
    () =>
      transactions
        .filter((tx) => tx.from === address || tx.to === address)
        .sort((a, b) => b.timestamp - a.timestamp),
    [transactions, address],
  );

  const sortedTokens = useMemo(
    () =>
      (wallet?.tokens ?? [])
        .slice()
        .sort((a, b) => (Number(b.balance) / 10 ** b.decimals) - (Number(a.balance) / 10 ** a.decimals)),
    [wallet?.tokens],
  );

  const filteredTokens = useMemo(() => {
    if (!tokenSearch.trim()) return sortedTokens;
    const q = tokenSearch.toLowerCase();
    return sortedTokens.filter(
      (t) => t.symbol.toLowerCase().includes(q) || t.name.toLowerCase().includes(q),
    );
  }, [sortedTokens, tokenSearch]);

  const { connectedStars, connectedNebulae } = useMemo(() => {
    const stars: string[] = [];
    const nebulae: string[] = [];
    const seen = new Set<string>();
    for (const tx of walletTxs) {
      const counterparty = tx.from === address ? tx.to : tx.from;
      if (!counterparty || counterparty.startsWith("contract:") || seen.has(counterparty)) continue;
      seen.add(counterparty);
      const w = wallets.get(counterparty);
      if (!w) continue;
      if (w.isContract) nebulae.push(counterparty);
      else stars.push(counterparty);
    }
    return { connectedStars: stars, connectedNebulae: nebulae };
  }, [walletTxs, address, wallets]);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <label className="text-xs text-secondary uppercase tracking-wider">Address</label>
          <div className="mt-1">
            <AddressChip address={address} />
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => fetchWallet(address)}
            disabled={isLoading}
            className="text-xs text-secondary hover:text-accent transition-colors p-1.5 rounded-lg hover:bg-white/5 disabled:opacity-50"
            title="Refresh wallet data"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={isLoading ? "animate-spin" : ""}
            >
              <path d="M21 2v6h-6" />
              <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
              <path d="M3 22v-6h6" />
              <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
            </svg>
          </button>
          <button
            onClick={() => { removeWallet(address); clearSelection(); }}
            className="text-xs text-secondary hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-white/5"
            title="Remove wallet"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M3 6h18" />
              <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6" />
              <path d="M14 11v6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Registered star info */}
      {registration?.exists && (
        <div
          className="px-4 py-3 rounded-xl space-y-2"
          style={{
            background: "rgba(0, 82, 255, 0.06)",
            border: "1px solid rgba(0, 82, 255, 0.15)",
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span style={{ color: "#FFFFFF", fontSize: "14px" }}>&#9733;</span>
              <span className="text-sm font-medium" style={{ color: "#FFFFFF" }}>
                {registration.name}
              </span>
            </div>
            <InfoTip text="Arrows show the flow of ETH between you and connected wallets. Thicker arrows mean larger amounts." />
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{
                background: PLANET_PALETTES[registration.colorIndex % PLANET_PALETTES.length].coreMid,
                boxShadow: `0 0 6px ${PLANET_PALETTES[registration.colorIndex % PLANET_PALETTES.length].aura}`,
              }}
            />
            <span className="text-xs text-secondary">
              {["Lightest", "Light", "Medium", "Darkest"][registration.colorIndex % 4]}
            </span>
          </div>
          {isOwnWallet && (
            <button
              onClick={() => setClaimModalOpen(true)}
              className="text-xs hover:text-white transition-colors"
              style={{ color: "#FFFFFF" }}
            >
              Edit registration
            </button>
          )}
        </div>
      )}

      {/* Claim button for unregistered own wallet */}
      {isOwnWallet && !registration?.exists && (
        <button
          onClick={() => setClaimModalOpen(true)}
          className="w-full py-3 rounded-xl text-sm font-medium transition-all hover:brightness-110"
          style={{
            background: "linear-gradient(135deg, rgba(0, 82, 255, 0.2), rgba(0, 60, 200, 0.15))",
            border: "1px solid rgba(0, 82, 255, 0.3)",
            color: "#FFFFFF",
          }}
        >
          &#9733; Claim Your Star
        </button>
      )}

      <ClaimStarModal
        open={claimModalOpen}
        onClose={() => setClaimModalOpen(false)}
        isUpdate={registration?.exists ?? false}
        currentName={registration?.name ?? ""}
        currentColorIndex={registration?.colorIndex ?? 0}
      />

      <div>
        <label className="text-xs text-secondary uppercase tracking-wider">Balance</label>
        <p className="mt-1 text-lg font-medium">
          {wallet ? `${formatEth(wallet.balance)} ETH` : "—"}
        </p>
      </div>

      {sortedTokens.length > 0 && (
        <div>
          <label className="text-xs text-secondary uppercase tracking-wider">
            Token Holdings
          </label>
          <div className="mt-2 space-y-1.5">
            {showAllTokens && sortedTokens.length > VISIBLE_LIMIT && (
              <input
                type="text"
                value={tokenSearch}
                onChange={(e) => setTokenSearch(e.target.value)}
                placeholder="Search tokens..."
                className="w-full px-3 py-2 rounded-xl text-sm bg-white/5 placeholder:text-secondary/40 outline-none"
                style={{
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  color: "#ffffff",
                }}
                onFocus={(e) => (e.target.style.borderColor = "rgba(0, 82, 255, 0.5)")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(255, 255, 255, 0.08)")}
              />
            )}
            {(showAllTokens ? filteredTokens : sortedTokens.slice(0, VISIBLE_LIMIT)).map((token) => (
              <div
                key={token.contractAddress}
                className="flex items-center justify-between px-3 py-2 rounded-xl"
                style={{ border: "1px solid rgba(255, 255, 255, 0.04)" }}
              >
                <div className="min-w-0 truncate">
                  <span className="text-sm font-medium">{token.symbol}</span>
                  <span className="text-xs text-secondary ml-1.5">{token.name}</span>
                </div>
                <span className="text-sm font-mono shrink-0 ml-2">
                  {formatTokenBalance(token.balance, token.decimals)}
                </span>
              </div>
            ))}
            {showAllTokens && filteredTokens.length === 0 && tokenSearch.trim() && (
              <p className="text-xs text-secondary py-2 text-center">No tokens match &ldquo;{tokenSearch}&rdquo;</p>
            )}
            {sortedTokens.length > VISIBLE_LIMIT && (
              <button
                onClick={() => {
                  setShowAllTokens((v) => !v);
                  setTokenSearch("");
                }}
                className="w-full text-xs text-accent hover:text-accent-hover transition-colors py-2 mt-1"
              >
                {showAllTokens ? "Show Less" : `All Tokens (${sortedTokens.length})`}
              </button>
            )}
          </div>
        </div>
      )}

      <div>
        <label className="text-xs text-secondary uppercase tracking-wider">Total Transactions</label>
        <p className="mt-1 text-lg font-medium">
          {wallet ? formatNumber(Math.max(wallet.transactionCount, walletTxs.length)) : "—"}
        </p>
      </div>

      {walletTxs.length > 0 && (
        <div>
          <label className="text-xs text-secondary uppercase tracking-wider">
            Recent Activity
          </label>
          <div className="mt-2 space-y-2">
            {(showAllTxs ? walletTxs : walletTxs.slice(0, VISIBLE_LIMIT)).map((tx) => {
              const isSent = tx.from === address;
              const counterparty = isSent ? tx.to : tx.from;
              return (
                <div
                  key={tx.hash}
                  className="p-3 rounded-xl hover:bg-white/5 transition-colors"
                  style={{ border: "1px solid rgba(255, 255, 255, 0.04)" }}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className={isSent ? "text-secondary" : "text-green-400"}>
                      {isSent ? "Sent" : "Received"}
                    </span>
                    <button
                      onClick={() => selectTransaction(tx.hash)}
                      className="font-mono text-secondary hover:text-white transition-colors"
                    >
                      {truncateAddress(tx.hash)}
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <AddressChip
                      address={counterparty}
                      onClick={() => selectWallet(counterparty)}
                    />
                    <span className="text-sm">{formatEth(tx.value)} ETH</span>
                  </div>
                </div>
              );
            })}
            {walletTxs.length > VISIBLE_LIMIT && (
              <button
                onClick={() => setShowAllTxs((v) => !v)}
                className="w-full text-xs text-accent hover:text-accent-hover transition-colors py-2 mt-1"
              >
                {showAllTxs ? "Show Less" : `All Transactions (${walletTxs.length})`}
              </button>
            )}
          </div>
        </div>
      )}

      {connectedStars.length > 0 && (
        <div>
          <label className="text-xs text-secondary uppercase tracking-wider">
            Connected Stars
          </label>
          <div className="mt-2 space-y-1.5">
            {(showAllConnected ? connectedStars : connectedStars.slice(0, VISIBLE_LIMIT)).map((addr) => (
              <div
                key={addr}
                className="px-3 py-2 rounded-xl hover:bg-white/5 transition-colors"
                style={{ border: "1px solid rgba(255, 255, 255, 0.04)" }}
              >
                <AddressChip address={addr} onClick={() => selectWallet(addr)} />
              </div>
            ))}
            {connectedStars.length > VISIBLE_LIMIT && (
              <button
                onClick={() => setShowAllConnected((v) => !v)}
                className="w-full text-xs text-accent hover:text-accent-hover transition-colors py-2 mt-1"
              >
                {showAllConnected ? "Show Less" : `All Connected Stars (${connectedStars.length})`}
              </button>
            )}
          </div>
        </div>
      )}

      {connectedNebulae.length > 0 && (
        <div>
          <label className="text-xs text-secondary uppercase tracking-wider">
            Connected Nebulae
          </label>
          <div className="mt-2 space-y-1.5">
            {(showAllNebulae ? connectedNebulae : connectedNebulae.slice(0, VISIBLE_LIMIT)).map((addr) => (
              <div
                key={addr}
                className="px-3 py-2 rounded-xl hover:bg-white/5 transition-colors"
                style={{ border: "1px solid rgba(255, 255, 255, 0.04)" }}
              >
                <AddressChip address={addr} onClick={() => selectContract(addr)} />
              </div>
            ))}
            {connectedNebulae.length > VISIBLE_LIMIT && (
              <button
                onClick={() => setShowAllNebulae((v) => !v)}
                className="w-full text-xs text-accent hover:text-accent-hover transition-colors py-2 mt-1"
              >
                {showAllNebulae ? "Show Less" : `All Connected Nebulae (${connectedNebulae.length})`}
              </button>
            )}
          </div>
        </div>
      )}

      {walletTxs.length === 0 && (
        <p className="text-xs text-secondary">
          No transactions found in the latest block. Hit refresh after your transaction confirms.
        </p>
      )}
    </div>
  );
}
