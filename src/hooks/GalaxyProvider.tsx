"use client";

import { useState, useCallback, useMemo, useEffect, useRef, type ReactNode } from "react";
import { GalaxyContext, type GalaxyStore, type StarDeathEntry } from "./useGalaxyStore";
import type { WalletNode, TransactionEdge, SelectedEntity, ContractCreation, StarRegistration } from "@/types";
import { starSize } from "@/lib/galaxy-math";
import { walletToPosition, clusterPositions } from "@/lib/galaxy-math";

const STORAGE_KEY = "constellation_state";
const SEED_ADDRESSES = [
  "0x000000000000000000000000000000000000dead",
  "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
  "0xbe0eb53f46cd790cd13851d5eff43d12404d33e8",
  "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
  "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
  "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984",
  "0x7a250d5630b4cf539739df2c5dacb4c659f2488d",
  "0x6b175474e89094c44da98b954eedeac495271d0f",
  "0xdac17f958d2ee523a2206206994597c13d831ec7",
  "0x1111111254eeb25477b68fb85ed929f73a960582",
  "0x514910771af9ca656af840dff83e8264ecf986ca",
  "0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce",
  "0xdef1c0ded9bec7f1a1670819833240f027b25eff",
  "0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad",
  "0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0",
];

const SEED_POSITIONS: { key: string; pos: [number, number, number] }[] =
  SEED_ADDRESSES.map((addr) => ({ key: addr, pos: walletToPosition(addr) }));

const MAX_TOTAL_STARS = 50;
const MAX_WALLETS = MAX_TOTAL_STARS - SEED_ADDRESSES.length;
const MAX_LIVE_QUEUE = 30;

function bigintReplacer(_key: string, value: unknown) {
  if (typeof value === "bigint") return { __bigint: value.toString() };
  return value;
}

function bigintReviver(_key: string, value: unknown) {
  if (value && typeof value === "object" && "__bigint" in value) {
    return BigInt((value as { __bigint: string }).__bigint);
  }
  return value;
}

function loadPersistedState(): {
  wallets: Map<string, WalletNode>;
  transactions: TransactionEdge[];
  contractCreations: Map<string, ContractCreation>;
  latestBlock: number | null;
} | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw, bigintReviver);
    return {
      wallets: new Map(data.wallets || []),
      transactions: data.transactions || [],
      contractCreations: new Map(data.contractCreations || []),
      latestBlock: data.latestBlock ?? null,
    };
  } catch {
    return null;
  }
}

function persistState(
  wallets: Map<string, WalletNode>,
  transactions: TransactionEdge[],
  contractCreations: Map<string, ContractCreation>,
  latestBlock: number | null,
) {
  try {
    const data = {
      wallets: Array.from(wallets.entries()),
      transactions,
      contractCreations: Array.from(contractCreations.entries()),
      latestBlock,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data, bigintReplacer));
  } catch { /* quota exceeded — silently ignore */ }
}

export function GalaxyProvider({ children }: { children: ReactNode }) {
  const [initial] = useState(() => loadPersistedState());

  const [wallets, setWallets] = useState<Map<string, WalletNode>>(
    () => initial?.wallets ?? new Map(),
  );
  const [transactions, setTransactions] = useState<TransactionEdge[]>(
    () => initial?.transactions ?? [],
  );
  const [contractCreations, setContractCreations] = useState<Map<string, ContractCreation>>(
    () => initial?.contractCreations ?? new Map(),
  );
  const [liveQueue, setLiveQueue] = useState<TransactionEdge[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<SelectedEntity | null>(null);
  const [cameraTarget, setCameraTarget] = useState<GalaxyStore["cameraTarget"]>(null);
  const [isLiveMode, setIsLiveMode] = useState(true);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const latestBlockRef = useRef<number | null>(initial?.latestBlock ?? null);

  const persistRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (persistRef.current) clearTimeout(persistRef.current);
    persistRef.current = setTimeout(() => {
      persistState(wallets, transactions, contractCreations, latestBlockRef.current);
    }, 500);
    return () => { if (persistRef.current) clearTimeout(persistRef.current); };
  }, [wallets, transactions, contractCreations]);

  const clustered = useMemo(() => {
    const extras = [...SEED_POSITIONS];
    for (const [addr, w] of wallets) {
      if (w.isContract) extras.push({ key: addr, pos: w.position });
    }
    for (const [hash, cc] of contractCreations) {
      extras.push({ key: `contract:${hash}`, pos: cc.position });
    }
    return clusterPositions(wallets, transactions, 0.45, extras);
  }, [wallets, transactions, contractCreations]);

  const navHistoryRef = useRef<string[]>([]);
  const navIndexRef = useRef(-1);
  const [navVersion, setNavVersion] = useState(0);

  const moveCameraTo = useCallback(
    (address: string, entityType: "wallet" | "contract" = "wallet") => {
      const lower = address.toLowerCase();
      setSelectedEntity({ type: entityType, id: lower });
      let pos: [number, number, number] | undefined =
        clustered.get(lower) ?? wallets.get(lower)?.position;
      if (!pos && lower.startsWith("contract:")) {
        pos = contractCreations.get(lower.slice(9))?.position;
      }
      pos ??= walletToPosition(lower);
      setCameraTarget({
        position: [pos[0] + 5, pos[1] + 3, pos[2] + 8],
        lookAt: pos,
      });
    },
    [wallets, clustered, contractCreations],
  );

  const selectWallet = useCallback(
    (address: string) => {
      const lower = address.toLowerCase();
      const isContract = wallets.get(lower)?.isContract === true;
      const h = navHistoryRef.current;
      const idx = navIndexRef.current;
      navHistoryRef.current = [...h.slice(0, idx + 1), lower];
      navIndexRef.current = navHistoryRef.current.length - 1;
      setNavVersion((v) => v + 1);
      moveCameraTo(lower, isContract ? "contract" : "wallet");
    },
    [moveCameraTo, wallets],
  );

  const selectContract = useCallback(
    (address: string) => {
      const lower = address.toLowerCase();
      const h = navHistoryRef.current;
      const idx = navIndexRef.current;
      navHistoryRef.current = [...h.slice(0, idx + 1), lower];
      navIndexRef.current = navHistoryRef.current.length - 1;
      setNavVersion((v) => v + 1);
      moveCameraTo(lower, "contract");
    },
    [moveCameraTo],
  );

  const canGoBack = navIndexRef.current > 0;
  const canGoForward = navIndexRef.current < navHistoryRef.current.length - 1;

  const goBack = useCallback(() => {
    if (navIndexRef.current <= 0) return;
    navIndexRef.current -= 1;
    setNavVersion((v) => v + 1);
    const addr = navHistoryRef.current[navIndexRef.current];
    const type = addr.startsWith("contract:") || wallets.get(addr)?.isContract ? "contract" : "wallet";
    moveCameraTo(addr, type);
  }, [moveCameraTo, wallets]);

  const goForward = useCallback(() => {
    if (navIndexRef.current >= navHistoryRef.current.length - 1) return;
    navIndexRef.current += 1;
    setNavVersion((v) => v + 1);
    const addr = navHistoryRef.current[navIndexRef.current];
    const type = addr.startsWith("contract:") || wallets.get(addr)?.isContract ? "contract" : "wallet";
    moveCameraTo(addr, type);
  }, [moveCameraTo, wallets]);

  const selectTransaction = useCallback((hash: string) => {
    setSelectedEntity({ type: "transaction", id: hash.toLowerCase() });
  }, []);

  const selectBlock = useCallback((blockNumber: number) => {
    setSelectedEntity({ type: "block", id: String(blockNumber) });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedEntity(null);
    setCameraTarget(null);
  }, []);

  const addWallet = useCallback((wallet: WalletNode) => {
    setWallets((prev) => {
      const key = wallet.address.toLowerCase();
      const existing = prev.get(key);
      if (!existing && prev.size >= MAX_WALLETS) {
        const oldest = prev.keys().next().value;
        if (oldest) prev.delete(oldest);
      }
      const merged: WalletNode = existing
        ? {
            ...existing,
            balance: wallet.balance > BigInt(0) ? wallet.balance : existing.balance,
            transactionCount:
              wallet.transactionCount > 0 ? wallet.transactionCount : existing.transactionCount,
            ensName: wallet.ensName || existing.ensName,
            tokens: wallet.tokens || existing.tokens,
            registeredStar: wallet.registeredStar || existing.registeredStar,
            position: existing.position,
          }
        : wallet;
      const next = new Map(prev);
      next.set(key, merged);
      return next;
    });
  }, []);

  const removeWallet = useCallback((address: string) => {
    const lower = address.toLowerCase();
    const wallet = wallets.get(lower);
    if (wallet) {
      const pos = clustered.get(lower) ?? wallet.position;
      const colorIndex = Math.abs(parseInt(lower.slice(2, 4), 16)) % 4;
      deathQueueRef.current.push({
        position: pos,
        colorIndex,
        size: starSize(wallet.balance),
        startTime: performance.now() * 0.001,
      });
    }
    setWallets((prev) => {
      if (!prev.has(lower)) return prev;
      const next = new Map(prev);
      next.delete(lower);
      return next;
    });
    setTransactions((prev) => prev.filter((tx) => tx.from !== lower && tx.to !== lower));
    setLiveQueue((prev) => prev.filter((tx) => tx.from !== lower && tx.to !== lower));
    setSelectedEntity((prev) => (prev?.id === lower ? null : prev));
    setCameraTarget((prev) => {
      if (selectedEntity?.id === lower) return null;
      return prev;
    });
  }, [selectedEntity, wallets, clustered]);

  const ensureWallet = useCallback((address: string) => {
    const lower = address.toLowerCase();
    setWallets((prev) => {
      if (prev.has(lower)) return prev;
      if (prev.size >= MAX_WALLETS) return prev;
      const next = new Map(prev);
      next.set(lower, {
        address: lower,
        balance: BigInt(0),
        transactionCount: 0,
        position: walletToPosition(lower),
      });
      return next;
    });
  }, []);

  const setWalletRegistration = useCallback((address: string, registration: StarRegistration) => {
    const lower = address.toLowerCase();
    setWallets((prev) => {
      const w = prev.get(lower);
      if (!w) return prev;
      const next = new Map(prev);
      next.set(lower, { ...w, registeredStar: registration });
      return next;
    });
  }, []);

  const markAsContract = useCallback((address: string) => {
    const lower = address.toLowerCase();
    setWallets((prev) => {
      const w = prev.get(lower);
      if (!w || w.isContract) return prev;
      const next = new Map(prev);
      next.set(lower, { ...w, isContract: true });
      return next;
    });
  }, []);

  const addContractCreation = useCallback((cc: ContractCreation) => {
    setContractCreations((prev) => {
      if (prev.has(cc.txHash)) return prev;
      const next = new Map(prev);
      next.set(cc.txHash, cc);
      return next;
    });
  }, []);

  const addTransactions = useCallback((txs: TransactionEdge[]) => {
    setTransactions((prev) => {
      const incoming = new Map(txs.map((t) => [t.hash, t]));
      let changed = false;

      const merged = prev.map((t) => {
        const update = incoming.get(t.hash);
        if (update) {
          incoming.delete(t.hash);
          changed = true;
          return update;
        }
        return t;
      });

      if (incoming.size > 0) {
        changed = true;
        for (const tx of incoming.values()) merged.push(tx);
      }

      return changed ? merged : prev;
    });
  }, []);

  const addLiveTransaction = useCallback((tx: TransactionEdge) => {
    setLiveQueue((prev) => {
      if (prev.some((t) => t.hash === tx.hash)) return prev;
      const next = [...prev, tx];
      return next.length > MAX_LIVE_QUEUE ? next.slice(-MAX_LIVE_QUEUE) : next;
    });
  }, []);

  const promoteLiveTransaction = useCallback((hash: string) => {
    setLiveQueue((prev) => prev.filter((t) => t.hash !== hash));
  }, []);

  const blockPulseRef = useRef<number[]>([]);
  const deathQueueRef = useRef<StarDeathEntry[]>([]);
  const triggerBlockPulse = useCallback(() => {
    blockPulseRef.current.push(performance.now() * 0.001);
    if (blockPulseRef.current.length > 3) {
      blockPulseRef.current = blockPulseRef.current.slice(-3);
    }
  }, []);

  const setLoading = useCallback((loading: boolean) => setIsLoading(loading), []);
  const setLiveMode = useCallback((live: boolean) => setIsLiveMode(live), []);
  const setSoundEnabled = useCallback((enabled: boolean) => setIsSoundEnabled(enabled), []);
  const setLatestBlock = useCallback((block: number) => {
    latestBlockRef.current = block;
  }, []);

  const resetAllData = useCallback(() => {
    setWallets(new Map());
    setTransactions([]);
    setContractCreations(new Map());
    setLiveQueue([]);
    setSelectedEntity(null);
    setCameraTarget(null);
    latestBlockRef.current = null;
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  }, []);

  const value = useMemo<GalaxyStore>(
    () => ({
      wallets,
      transactions,
      liveQueue,
      contractCreations,
      clusteredPositions: clustered,
      selectedEntity,
      cameraTarget,
      isLiveMode,
      isSoundEnabled,
      isLoading,
      latestBlock: latestBlockRef.current,
      selectWallet,
      selectContract,
      selectTransaction,
      selectBlock,
      clearSelection,
      addWallet,
      removeWallet,
      ensureWallet,
      setWalletRegistration,
      markAsContract,
      addContractCreation,
      addTransactions,
      addLiveTransaction,
      promoteLiveTransaction,
      setLoading,
      setLiveMode,
      setSoundEnabled,
      setLatestBlock,
      resetAllData,
      triggerBlockPulse,
      blockPulseRef,
      deathQueueRef,
      canGoBack,
      canGoForward,
      goBack,
      goForward,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      wallets, transactions, liveQueue, contractCreations, clustered, selectedEntity, cameraTarget,
      isLiveMode, isSoundEnabled, isLoading, selectWallet, selectContract, selectTransaction,
      selectBlock, clearSelection, addWallet, removeWallet, ensureWallet, setWalletRegistration, markAsContract, addContractCreation, addTransactions,
      addLiveTransaction, promoteLiveTransaction, setLoading, setLiveMode, setSoundEnabled, setLatestBlock,
      resetAllData, triggerBlockPulse, goBack, goForward, navVersion,
    ],
  );

  return <GalaxyContext.Provider value={value}>{children}</GalaxyContext.Provider>;
}
