"use client";

import { useState } from "react";
import { truncateAddress } from "@/lib/utils";

interface AddressChipProps {
  address: string;
  onClick?: () => void;
  full?: boolean;
}

export function AddressChip({ address, onClick, full }: AddressChipProps) {
  const [copied, setCopied] = useState(false);

  const copy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const display = full ? address : truncateAddress(address);

  return (
    <span className="inline-flex items-center gap-1.5">
      {onClick ? (
        <button
          onClick={onClick}
          className="font-mono text-accent hover:text-accent-hover transition-colors text-sm"
        >
          {display}
        </button>
      ) : (
        <span className="font-mono text-accent text-sm">{display}</span>
      )}
      <button
        onClick={copy}
        className="text-secondary hover:text-white transition-colors shrink-0"
        title="Copy address"
      >
        {copied ? (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="9" width="13" height="13" rx="2" />
            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
          </svg>
        )}
      </button>
    </span>
  );
}
