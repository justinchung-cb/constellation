"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePublicClient } from "wagmi";
import { STAR_REGISTRY_ADDRESS, STAR_REGISTRY_ABI } from "@/lib/contracts";
import { useGalaxyStore } from "./useGalaxyStore";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export function useStarRegistry() {
  const publicClient = usePublicClient();
  const { setWalletRegistration, ensureWallet } = useGalaxyStore();
  const loadedRef = useRef(false);

  const isContractDeployed = (STAR_REGISTRY_ADDRESS as string) !== ZERO_ADDRESS;

  const refreshStar = useCallback(
    async (address: string) => {
      if (!publicClient || !isContractDeployed) return;
      try {
        const result = await publicClient.readContract({
          address: STAR_REGISTRY_ADDRESS as `0x${string}`,
          abi: STAR_REGISTRY_ABI,
          functionName: "getStarInfo",
          args: [address as `0x${string}`],
        });
        const [name, colorIndex, registeredAt, exists] = result;
        if (exists) {
          setWalletRegistration(address, {
            name,
            colorIndex,
            registeredAt: Number(registeredAt),
            exists: true,
          });
        }
      } catch {
        // Contract read failed — likely not deployed or address not registered
      }
    },
    [publicClient, isContractDeployed, setWalletRegistration],
  );

  const loadAllStars = useCallback(async () => {
    if (!publicClient || !isContractDeployed || loadedRef.current) return;
    loadedRef.current = true;

    try {
      const addresses = await publicClient.readContract({
        address: STAR_REGISTRY_ADDRESS as `0x${string}`,
        abi: STAR_REGISTRY_ABI,
        functionName: "getAllRegisteredAddresses",
      });

      for (const addr of addresses) {
        const lower = addr.toLowerCase();
        ensureWallet(lower);

        const [name, colorIndex, registeredAt, exists] = await publicClient.readContract({
          address: STAR_REGISTRY_ADDRESS as `0x${string}`,
          abi: STAR_REGISTRY_ABI,
          functionName: "getStarInfo",
          args: [addr],
        });

        if (exists) {
          setWalletRegistration(lower, {
            name,
            colorIndex,
            registeredAt: Number(registeredAt),
            exists: true,
          });
        }
      }
    } catch {
      // Contract not deployed or read failed — silently skip
    }
  }, [publicClient, isContractDeployed, ensureWallet, setWalletRegistration]);

  useEffect(() => {
    loadAllStars();
  }, [loadAllStars]);

  return { refreshStar, isContractDeployed };
}
