"use client";

import React, { createContext, useContext } from "react";
import type { WalletNode, TransactionEdge, SelectedEntity, ContractCreation } from "@/types";

export interface StarDeathEntry {
  position: [number, number, number];
  colorIndex: number;
  size: number;
  startTime: number;
}

export interface GalaxyStore {
  wallets: Map<string, WalletNode>;
  transactions: TransactionEdge[];
  liveQueue: TransactionEdge[];
  contractCreations: Map<string, ContractCreation>;
  clusteredPositions: Map<string, [number, number, number]>;
  selectedEntity: SelectedEntity | null;
  cameraTarget: {
    position: [number, number, number];
    lookAt: [number, number, number];
  } | null;
  isLiveMode: boolean;
  isLoading: boolean;
  latestBlock: number | null;

  selectWallet: (address: string) => void;
  selectContract: (address: string) => void;
  selectTransaction: (hash: string) => void;
  selectBlock: (blockNumber: number) => void;
  clearSelection: () => void;
  addWallet: (wallet: WalletNode) => void;
  removeWallet: (address: string) => void;
  ensureWallet: (address: string) => void;
  markAsContract: (address: string) => void;
  addContractCreation: (cc: ContractCreation) => void;
  addTransactions: (txs: TransactionEdge[]) => void;
  addLiveTransaction: (tx: TransactionEdge) => void;
  promoteLiveTransaction: (hash: string) => void;
  setLoading: (loading: boolean) => void;
  setLiveMode: (live: boolean) => void;
  setLatestBlock: (block: number) => void;
  resetAllData: () => void;
  triggerBlockPulse: () => void;
  blockPulseRef: React.RefObject<number[]>;
  deathQueueRef: React.RefObject<StarDeathEntry[]>;
  canGoBack: boolean;
  canGoForward: boolean;
  goBack: () => void;
  goForward: () => void;
}

export const GalaxyContext = createContext<GalaxyStore | null>(null);

export function useGalaxyStore(): GalaxyStore {
  const ctx = useContext(GalaxyContext);
  if (!ctx) throw new Error("useGalaxyStore must be used within GalaxyProvider");
  return ctx;
}
