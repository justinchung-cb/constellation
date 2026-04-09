"use client";

import { useCallback, useRef } from "react";
import { usePublicClient } from "wagmi";
import { useWatchBlocks } from "wagmi";
import type { TransactionEdge, ContractCreation } from "@/types";
import { walletToPosition } from "@/lib/galaxy-math";
import { useGalaxyStore } from "./useGalaxyStore";

export function useLiveBlocks() {
  const publicClient = usePublicClient();
  const {
    wallets, isLiveMode, ensureWallet, markAsContract,
    addLiveTransaction, addTransactions,
    addContractCreation,
    setLatestBlock, triggerBlockPulse,
  } = useGalaxyStore();

  const walletsRef = useRef(wallets);
  walletsRef.current = wallets;

  const hasWallets = wallets.size > 0;

  const processBlock = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (block: any) => {
      setLatestBlock(Number(block.number));
      triggerBlockPulse();

      const knownAddresses = walletsRef.current;
      if (knownAddresses.size === 0) return;

      const txs = block.transactions;
      if (!txs || txs.length === 0) return;

      const matchedEdges: TransactionEdge[] = [];

      for (const tx of txs) {
        if (typeof tx === "string") continue;

        const from = (tx.from as string)?.toLowerCase() ?? "";
        const to = (tx.to as string)?.toLowerCase() ?? "";
        const hash = (tx.hash as string).toLowerCase();

        const isContractCreation = !to;
        const fromKnown = from && knownAddresses.has(from);
        const toKnown = to && knownAddresses.has(to);

        if (!fromKnown && !toKnown) continue;

        const edge: TransactionEdge = {
          hash,
          from,
          to: isContractCreation ? `contract:${hash}` : to,
          value: tx.value as bigint,
          gasUsed: (tx.gas as bigint) ?? BigInt(0),
          gasPrice: (tx.gasPrice as bigint) ?? BigInt(0),
          blockNumber: Number(block.number),
          timestamp: Number(block.timestamp),
          status: "success",
        };

        if (from) ensureWallet(from);

        if (isContractCreation) {
          const cc: ContractCreation = {
            txHash: hash,
            creator: from,
            position: walletToPosition(hash),
            blockNumber: Number(block.number),
            timestamp: Number(block.timestamp),
          };
          addContractCreation(cc);
        } else if (to) {
          ensureWallet(to);
          publicClient?.getCode({ address: to as `0x${string}` }).then((code) => {
            if (code && code !== "0x") markAsContract(to);
          }).catch(() => {});
        }

        matchedEdges.push(edge);
        addLiveTransaction(edge);
      }

      if (matchedEdges.length > 0) {
        addTransactions(matchedEdges);

        if (publicClient) {
          for (const edge of matchedEdges) {
            publicClient
              .getTransactionReceipt({ hash: edge.hash as `0x${string}` })
              .then((receipt) => {
                if (receipt) {
                  addTransactions([{
                    ...edge,
                    status: receipt.status === "success" ? "success" : "failed",
                    gasUsed: receipt.gasUsed,
                  }]);
                }
              })
              .catch(() => { /* receipt not ready yet */ });
          }
        }
      }
    },
    [publicClient, ensureWallet, markAsContract, addContractCreation, addLiveTransaction, addTransactions, setLatestBlock, triggerBlockPulse],
  );

  const errorCount = useRef(0);

  useWatchBlocks({
    enabled: hasWallets && isLiveMode,
    includeTransactions: true,
    emitMissed: true,
    emitOnBegin: true,
    pollingInterval: 4_000,
    onBlock: (block) => {
      errorCount.current = 0;
      processBlock(block);
    },
    onError: () => {
      errorCount.current += 1;
      if (errorCount.current <= 3) {
        console.warn(`Block watcher: RPC request failed (attempt ${errorCount.current})`);
      }
    },
  });
}
