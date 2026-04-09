"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { useEffect, useRef } from "react";
import { useBlockchainData } from "@/hooks/useBlockchainData";

export function WalletButton() {
  const { address, isConnected } = useAccount();
  const { fetchWallet } = useBlockchainData();
  const fetchedRef = useRef<string | null>(null);

  useEffect(() => {
    if (isConnected && address && fetchedRef.current !== address) {
      fetchedRef.current = address;
      fetchWallet(address);
    }
  }, [isConnected, address]);

  return (
    <div className="[&_button]:!rounded-xl [&_button]:!font-sans">
      <ConnectButton
        showBalance={false}
        chainStatus="icon"
        accountStatus="address"
      />
    </div>
  );
}
