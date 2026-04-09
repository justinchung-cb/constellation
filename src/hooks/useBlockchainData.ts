"use client";

import { useCallback, useRef } from "react";
import { usePublicClient } from "wagmi";
import type { TransactionEdge, WalletNode, ContractCreation, TokenBalance } from "@/types";
import { walletToPosition } from "@/lib/galaxy-math";
import { useGalaxyStore } from "./useGalaxyStore";

const ETHERSCAN_V2_API = "https://api.etherscan.io/v2/api";
const BASE_SEPOLIA_CHAIN_ID = 84532;
const ETHERSCAN_API_KEY = process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY || "";

const ERC20_BALANCE_ABI = [
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export function useBlockchainData() {
  const publicClient = usePublicClient();
  const {
    addWallet,
    ensureWallet,
    markAsContract,
    addTransactions,
    addContractCreation,
    selectWallet,
    selectContract,
    selectTransaction,
    setLoading,
  } = useGalaxyStore();
  const fetchingRef = useRef(new Set<string>());
  const fetchTxHistoryRef = useRef<(address: string) => Promise<void>>(async () => {});

  const fetchLatestBlockTxs = useCallback(
    async (address: string) => {
      if (!publicClient) return;
      const lower = address.toLowerCase() as `0x${string}`;

      try {
        const blockNumber = await publicClient.getBlockNumber();
        const block = await publicClient.getBlock({
          blockNumber,
          includeTransactions: true,
        });

        const edges: TransactionEdge[] = block.transactions
          .filter(
            (tx) =>
              typeof tx === "object" &&
              tx.to &&
              (tx.from?.toLowerCase() === lower || tx.to?.toLowerCase() === lower),
          )
          .map((tx) => {
            const t = tx as {
              hash: string;
              from: string;
              to: string;
              value: bigint;
              gas: bigint;
              gasPrice?: bigint;
              blockNumber: bigint;
            };
            return {
              hash: t.hash,
              from: t.from.toLowerCase(),
              to: t.to.toLowerCase(),
              value: t.value,
              gasUsed: t.gas,
              gasPrice: t.gasPrice ?? BigInt(0),
              blockNumber: Number(t.blockNumber),
              timestamp: Number(block.timestamp),
              status: "success" as const,
            };
          });

        if (edges.length > 0) {
          addTransactions(edges);

          for (const edge of edges) {
            const counterparty = edge.from === lower ? edge.to : edge.from;
            if (counterparty && !counterparty.startsWith("contract:")) {
              ensureWallet(counterparty);
              publicClient.getCode({ address: counterparty as `0x${string}` }).then((code) => {
                if (code && code !== "0x") markAsContract(counterparty);
              }).catch(() => {});
            }
          }
        }
      } catch (err) {
        console.error("Block scan failed:", err);
      }
    },
    [publicClient, addTransactions, ensureWallet, markAsContract],
  );

  const fetchTxHistory = useCallback(
    async (address: string) => {
      const lower = address.toLowerCase();

      try {
        const url = `${ETHERSCAN_V2_API}?chainid=${BASE_SEPOLIA_CHAIN_ID}&module=account&action=txlist&address=${lower}&startblock=0&endblock=99999999&page=1&offset=50&sort=desc&apikey=${ETHERSCAN_API_KEY}`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.status !== "1" || !Array.isArray(data.result)) {
          await fetchLatestBlockTxs(lower);
          return;
        }

        const edges: TransactionEdge[] = [];
        const contractTxHashes: { hash: string; from: string; blockNumber: number; timestamp: number }[] = [];

        for (const tx of data.result as {
          hash: string;
          from: string;
          to: string;
          value: string;
          gasUsed: string;
          gasPrice: string;
          blockNumber: string;
          timeStamp: string;
          isError: string;
        }[]) {
          const hash = tx.hash.toLowerCase();
          const from = tx.from.toLowerCase();
          const to = (tx.to || "").toLowerCase();
          const isContractCreation = !to;

          edges.push({
            hash,
            from,
            to: isContractCreation ? `contract:${hash}` : to,
            value: BigInt(tx.value),
            gasUsed: BigInt(tx.gasUsed),
            gasPrice: BigInt(tx.gasPrice),
            blockNumber: Number(tx.blockNumber),
            timestamp: Number(tx.timeStamp),
            status: tx.isError === "0" ? ("success" as const) : ("failed" as const),
          });

          if (isContractCreation) {
            contractTxHashes.push({ hash, from, blockNumber: Number(tx.blockNumber), timestamp: Number(tx.timeStamp) });
          }
        }

        addTransactions(edges);

        for (const cc of contractTxHashes) {
          addContractCreation({
            txHash: cc.hash,
            creator: cc.from,
            position: walletToPosition(cc.hash),
            blockNumber: cc.blockNumber,
            timestamp: cc.timestamp,
          });
        }

        const counterparties = new Set<string>();
        for (const tx of edges) {
          if (tx.from !== lower && tx.from) counterparties.add(tx.from);
          if (tx.to !== lower && tx.to && !tx.to.startsWith("contract:")) counterparties.add(tx.to);
        }

        for (const addr of counterparties) {
          ensureWallet(addr);
          publicClient?.getCode({ address: addr as `0x${string}` }).then((code) => {
            if (code && code !== "0x") markAsContract(addr);
          }).catch(() => {});
        }
      } catch (err) {
        console.error("Etherscan API failed, falling back to block scan:", err);
        await fetchLatestBlockTxs(lower);
      }
    },
    [publicClient, ensureWallet, markAsContract, addContractCreation, addTransactions, fetchLatestBlockTxs],
  );
  fetchTxHistoryRef.current = fetchTxHistory;

  const fetchTokenBalances = useCallback(
    async (address: string): Promise<TokenBalance[]> => {
      const lower = address.toLowerCase();
      try {
        const url = `${ETHERSCAN_V2_API}?chainid=${BASE_SEPOLIA_CHAIN_ID}&module=account&action=tokentx&address=${lower}&page=1&offset=100&sort=desc&apikey=${ETHERSCAN_API_KEY}`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.message === "NOTOK") {
          console.warn("Basescan token API rate limited or unavailable:", data.result);
          return [];
        }

        if (data.status !== "1" || !Array.isArray(data.result) || data.result.length === 0) return [];

        const tokenMap = new Map<string, { symbol: string; name: string; decimals: number; contractAddress: string }>();
        for (const tx of data.result as { contractAddress: string; tokenSymbol: string; tokenName: string; tokenDecimal: string }[]) {
          const ca = tx.contractAddress.toLowerCase();
          if (!tokenMap.has(ca) && tx.tokenSymbol) {
            tokenMap.set(ca, {
              symbol: tx.tokenSymbol,
              name: tx.tokenName || tx.tokenSymbol,
              decimals: Number(tx.tokenDecimal) || 18,
              contractAddress: ca,
            });
          }
        }

        if (tokenMap.size === 0 || !publicClient) return [];

        const tokens: TokenBalance[] = [];
        const entries = Array.from(tokenMap.values()).slice(0, 20);
        const results = await Promise.allSettled(
          entries.map((t) =>
            publicClient.readContract({
              address: t.contractAddress as `0x${string}`,
              abi: ERC20_BALANCE_ABI,
              functionName: "balanceOf",
              args: [lower as `0x${string}`],
            }),
          ),
        );

        for (let i = 0; i < entries.length; i++) {
          const result = results[i];
          const balance = result.status === "fulfilled" ? (result.value as bigint) : BigInt(0);
          if (balance > BigInt(0)) {
            tokens.push({ ...entries[i], balance });
          }
        }

        return tokens;
      } catch (err) {
        console.warn("Token balance fetch failed:", err);
        return [];
      }
    },
    [publicClient],
  );

  const fetchWallet = useCallback(
    async (address: string) => {
      if (!publicClient) return;
      const lower = address.toLowerCase() as `0x${string}`;

      if (fetchingRef.current.has(lower)) return;
      fetchingRef.current.add(lower);
      setLoading(true);

      try {
        const [balance, txCount, tokens, code] = await Promise.all([
          publicClient.getBalance({ address: lower }),
          publicClient.getTransactionCount({ address: lower }),
          fetchTokenBalances(lower),
          publicClient.getCode({ address: lower }).catch(() => "0x" as const),
        ]);

        const isContract = !!code && code !== "0x";

        const wallet: WalletNode = {
          address: lower,
          balance,
          transactionCount: txCount,
          position: walletToPosition(lower),
          tokens: tokens.length > 0 ? tokens : undefined,
          isContract: isContract || undefined,
        };

        addWallet(wallet);
        if (isContract) {
          markAsContract(lower);
          selectContract(lower);
        } else {
          selectWallet(lower);
        }

        await fetchTxHistoryRef.current(lower);
      } catch (err) {
        console.error("Failed to fetch wallet:", err);
        addWallet({
          address: lower,
          balance: BigInt(0),
          transactionCount: 0,
          position: walletToPosition(lower),
        });
        selectWallet(lower);
      } finally {
        setLoading(false);
        fetchingRef.current.delete(lower);
      }
    },
    [publicClient, addWallet, selectWallet, selectContract, markAsContract, setLoading, fetchTokenBalances],
  );

  const fetchTransaction = useCallback(
    async (hash: string) => {
      if (!publicClient) return;
      const lower = hash.toLowerCase() as `0x${string}`;
      setLoading(true);

      try {
        const tx = await publicClient.getTransaction({ hash: lower });
        if (!tx) return;

        const receipt = await publicClient.getTransactionReceipt({ hash: lower }).catch(() => null);

        const block = tx.blockNumber
          ? await publicClient.getBlock({ blockNumber: tx.blockNumber }).catch(() => null)
          : null;

        const from = tx.from.toLowerCase();
        const rawTo = (tx.to || "").toLowerCase();
        const isContractCreation = !rawTo;
        const hash = tx.hash.toLowerCase();

        const edge: TransactionEdge = {
          hash,
          from,
          to: isContractCreation ? `contract:${hash}` : rawTo,
          value: tx.value,
          gasUsed: receipt?.gasUsed ?? tx.gas,
          gasPrice: tx.gasPrice ?? BigInt(0),
          blockNumber: Number(tx.blockNumber ?? 0),
          timestamp: block ? Number(block.timestamp) : Math.floor(Date.now() / 1000),
          status: receipt ? (receipt.status === "success" ? "success" : "failed") : "success",
        };

        addTransactions([edge]);

        if (isContractCreation) {
          addContractCreation({
            txHash: hash,
            creator: from,
            position: walletToPosition(hash),
            blockNumber: edge.blockNumber,
            timestamp: edge.timestamp,
          });
        }

        for (const addr of [edge.from, edge.to].filter((a) => a && !a.startsWith("contract:"))) {
          ensureWallet(addr);
          publicClient?.getCode({ address: addr as `0x${string}` }).then((code) => {
            if (code && code !== "0x") markAsContract(addr);
          }).catch(() => {});
        }

        selectTransaction(edge.hash);
      } catch (err) {
        console.error("Failed to fetch transaction:", err);
      } finally {
        setLoading(false);
      }
    },
    [publicClient, ensureWallet, markAsContract, addContractCreation, addTransactions, selectTransaction, setLoading],
  );

  return { fetchWallet, fetchTransaction };
}
