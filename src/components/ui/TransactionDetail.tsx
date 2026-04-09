"use client";

import { useGalaxyStore } from "@/hooks/useGalaxyStore";
import { AddressChip } from "@/components/shared/AddressChip";
import { formatEth, formatGwei, formatTimestamp, formatNumber } from "@/lib/utils";

export function TransactionDetail({ hash }: { hash: string }) {
  const { transactions, selectWallet, selectBlock } = useGalaxyStore();
  const tx = transactions.find((t) => t.hash === hash);

  if (!tx) {
    return <p className="text-secondary text-sm">Transaction not found in local data.</p>;
  }

  const rows: { label: string; value: React.ReactNode }[] = [
    {
      label: "Tx Hash",
      value: <span className="font-mono text-xs break-all">{tx.hash}</span>,
    },
    {
      label: "Status",
      value: (
        <span className={tx.status === "success" ? "text-green-400" : "text-red-400"}>
          {tx.status === "success" ? "Success" : "Failed"}
        </span>
      ),
    },
    {
      label: "From",
      value: <AddressChip address={tx.from} onClick={() => selectWallet(tx.from)} />,
    },
    {
      label: "To",
      value: <AddressChip address={tx.to} onClick={() => selectWallet(tx.to)} />,
    },
    {
      label: "Value",
      value: `${formatEth(tx.value)} ETH`,
    },
    {
      label: "Gas Used",
      value: formatNumber(Number(tx.gasUsed)),
    },
    {
      label: "Gas Price",
      value: `${formatGwei(tx.gasPrice)} Gwei`,
    },
    {
      label: "Block",
      value: (
        <button
          onClick={() => selectBlock(tx.blockNumber)}
          className="text-accent hover:text-accent-hover transition-colors font-mono"
        >
          #{formatNumber(tx.blockNumber)}
        </button>
      ),
    },
    {
      label: "Timestamp",
      value: formatTimestamp(tx.timestamp),
    },
  ];

  return (
    <div className="space-y-4">
      {rows.map((row) => (
        <div key={row.label}>
          <label className="text-xs text-secondary uppercase tracking-wider">
            {row.label}
          </label>
          <div className="mt-1 text-sm">{row.value}</div>
        </div>
      ))}
    </div>
  );
}
