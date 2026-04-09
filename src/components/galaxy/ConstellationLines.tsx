"use client";

import { useMemo } from "react";
import { Line } from "@react-three/drei";
import { useGalaxyStore } from "@/hooks/useGalaxyStore";

export function ConstellationLines() {
  const { transactions, wallets, contractCreations, clusteredPositions, liveQueue, selectedEntity } = useGalaxyStore();

  const liveHashes = useMemo(() => new Set(liveQueue.map((t) => t.hash)), [liveQueue]);

  const selectedAddr =
    (selectedEntity?.type === "wallet" || selectedEntity?.type === "contract")
      ? selectedEntity.id
      : null;

  const lines = useMemo(() => {
    const seen = new Set<string>();
    return transactions
      .filter((tx) => {
        if (liveHashes.has(tx.hash)) return false;

        const fromExists = wallets.has(tx.from);
        const toExists = tx.to.startsWith("contract:")
          ? contractCreations.has(tx.to.slice(9))
          : wallets.has(tx.to);
        if (!fromExists || !toExists) return false;

        if (selectedAddr && tx.from !== selectedAddr && tx.to !== selectedAddr) return false;

        const key = [tx.from, tx.to].sort().join("-");
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map((tx) => {
        const fromPos = clusteredPositions.get(tx.from) ?? wallets.get(tx.from)?.position;
        const toPos = clusteredPositions.get(tx.to) ?? (
          tx.to.startsWith("contract:")
            ? contractCreations.get(tx.to.slice(9))?.position
            : wallets.get(tx.to)?.position
        );

        if (!fromPos || !toPos) return null;
        return { from: fromPos, to: toPos, key: `${tx.from}-${tx.to}` };
      })
      .filter((line): line is NonNullable<typeof line> => line !== null);
  }, [transactions, wallets, contractCreations, liveHashes, clusteredPositions, selectedAddr]);

  return (
    <>
      {lines.map((line) => (
        <Line
          key={line.key}
          points={[line.from, line.to]}
          color="#ffffff"
          lineWidth={0.5}
          transparent
          opacity={0.12}
        />
      ))}
    </>
  );
}
