"use client";

import { useMemo, useState } from "react";
import { useGalaxyStore } from "@/hooks/useGalaxyStore";
import { AddressChip } from "@/components/shared/AddressChip";
import { formatNumber, formatTokenBalance } from "@/lib/utils";

const VISIBLE_LIMIT = 5;

export function ContractDetail({ address }: { address: string }) {
  const { wallets, transactions, contractCreations, selectWallet, selectContract, removeWallet, clearSelection } = useGalaxyStore();
  const [showAllStars, setShowAllStars] = useState(false);
  const [showAllNebulae, setShowAllNebulae] = useState(false);
  const [showAllTokens, setShowAllTokens] = useState(false);

  const isCreation = address.startsWith("contract:");
  const displayAddr = isCreation ? address.slice(9) : address;
  const wallet = wallets.get(address);
  const creation = isCreation ? contractCreations.get(displayAddr) : undefined;

  const contractTxs = useMemo(
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

  const { connectedStars, connectedNebulae } = useMemo(() => {
    const stars: string[] = [];
    const nebulae: string[] = [];
    const seen = new Set<string>();
    for (const tx of contractTxs) {
      const counterparty = tx.from === address ? tx.to : tx.from;
      if (!counterparty || counterparty.startsWith("contract:") || seen.has(counterparty)) continue;
      seen.add(counterparty);
      const w = wallets.get(counterparty);
      if (!w) continue;
      if (w.isContract) nebulae.push(counterparty);
      else stars.push(counterparty);
    }
    return { connectedStars: stars, connectedNebulae: nebulae };
  }, [contractTxs, address, wallets]);

  const handleRemove = () => {
    if (!isCreation) removeWallet(address);
    clearSelection();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <label className="text-xs text-secondary uppercase tracking-wider">
            {isCreation ? "Transaction Hash" : "Address"}
          </label>
          <div className="mt-1">
            <AddressChip address={displayAddr} />
          </div>
        </div>
        <button
          onClick={handleRemove}
          className="text-xs text-secondary hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-white/5"
          title="Remove contract"
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

      <div>
        <label className="text-xs text-secondary uppercase tracking-wider">Type</label>
        <p className="mt-1 text-lg font-medium text-purple-400">
          {isCreation ? "Contract Creation" : "Smart Contract"}
        </p>
      </div>

      {creation && (
        <div>
          <label className="text-xs text-secondary uppercase tracking-wider">Deployer</label>
          <div className="mt-1">
            <AddressChip address={creation.creator} onClick={() => selectWallet(creation.creator)} />
          </div>
        </div>
      )}

      <div>
        <label className="text-xs text-secondary uppercase tracking-wider">Interactions</label>
        <p className="mt-1 text-lg font-medium">
          {formatNumber(Math.max(wallet?.transactionCount ?? 0, contractTxs.length))}
        </p>
      </div>

      {sortedTokens.length > 0 && (
        <div>
          <label className="text-xs text-secondary uppercase tracking-wider">
            Token Holdings
          </label>
          <div className="mt-2 space-y-1.5">
            {(showAllTokens ? sortedTokens : sortedTokens.slice(0, VISIBLE_LIMIT)).map((token) => (
              <div
                key={token.contractAddress}
                className="flex items-center justify-between px-3 py-2 rounded-xl"
                style={{ border: "1px solid rgba(255, 255, 255, 0.04)" }}
              >
                <div className="min-w-0">
                  <span className="text-sm font-medium">{token.symbol}</span>
                  <span className="text-xs text-secondary ml-1.5 truncate">{token.name}</span>
                </div>
                <span className="text-sm font-mono shrink-0 ml-2">
                  {formatTokenBalance(token.balance, token.decimals)}
                </span>
              </div>
            ))}
            {sortedTokens.length > VISIBLE_LIMIT && (
              <button
                onClick={() => setShowAllTokens((v) => !v)}
                className="w-full text-xs text-accent hover:text-accent-hover transition-colors py-2 mt-1"
              >
                {showAllTokens ? "Show Less" : `All Tokens (${sortedTokens.length})`}
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
            {(showAllStars ? connectedStars : connectedStars.slice(0, VISIBLE_LIMIT)).map((addr) => (
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
                onClick={() => setShowAllStars((v) => !v)}
                className="w-full text-xs text-accent hover:text-accent-hover transition-colors py-2 mt-1"
              >
                {showAllStars ? "Show Less" : `All Connected Stars (${connectedStars.length})`}
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

      {contractTxs.length === 0 && (
        <p className="text-xs text-secondary">
          No interactions found yet.
        </p>
      )}
    </div>
  );
}
