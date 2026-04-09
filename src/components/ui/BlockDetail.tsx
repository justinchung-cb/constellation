"use client";

import { useGalaxyStore } from "@/hooks/useGalaxyStore";
import { AddressChip } from "@/components/shared/AddressChip";
import { formatEth, formatTimestamp, formatNumber, truncateAddress } from "@/lib/utils";

export function BlockDetail({ blockNumber }: { blockNumber: string }) {
  const { transactions, selectTransaction, selectWallet } = useGalaxyStore();

  const blockTxs = transactions.filter(
    (tx) => tx.blockNumber === Number(blockNumber),
  );

  const blockInfo = blockTxs.length > 0 ? blockTxs[0] : null;

  return (
    <div className="space-y-5">
      <div>
        <label className="text-xs text-secondary uppercase tracking-wider">Block Number</label>
        <p className="mt-1 text-lg font-medium font-mono">
          #{formatNumber(Number(blockNumber))}
        </p>
      </div>

      {blockInfo && (
        <div>
          <label className="text-xs text-secondary uppercase tracking-wider">Timestamp</label>
          <p className="mt-1 text-sm">{formatTimestamp(blockInfo.timestamp)}</p>
        </div>
      )}

      <div>
        <label className="text-xs text-secondary uppercase tracking-wider">
          Transactions in Block (local)
        </label>
        <p className="mt-1 text-lg font-medium">{blockTxs.length}</p>
      </div>

      {blockTxs.length > 0 && (
        <div>
          <label className="text-xs text-secondary uppercase tracking-wider">
            Transaction List
          </label>
          <div className="mt-2 space-y-2">
            {blockTxs.map((tx) => (
              <button
                key={tx.hash}
                onClick={() => selectTransaction(tx.hash)}
                className="w-full text-left p-3 rounded-xl transition-colors hover:bg-white/5"
                style={{ border: "1px solid rgba(255, 255, 255, 0.04)" }}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-secondary">
                    {truncateAddress(tx.hash)}
                  </span>
                  <span className="text-sm">{formatEth(tx.value)} ETH</span>
                </div>
                <div className="flex items-center gap-1 mt-1 text-xs text-secondary">
                  <AddressChip address={tx.from} onClick={() => selectWallet(tx.from)} />
                  <span className="text-secondary mx-1">→</span>
                  <AddressChip address={tx.to} onClick={() => selectWallet(tx.to)} />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
