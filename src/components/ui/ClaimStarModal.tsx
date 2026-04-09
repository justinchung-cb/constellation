"use client";

import { useState, useCallback, useEffect } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from "wagmi";
import { motion, AnimatePresence } from "framer-motion";
import { STAR_REGISTRY_ADDRESS, STAR_REGISTRY_ABI } from "@/lib/contracts";
import { PLANET_PALETTES } from "@/types";
import { useGalaxyStore } from "@/hooks/useGalaxyStore";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

interface ClaimStarModalProps {
  open: boolean;
  onClose: () => void;
  isUpdate?: boolean;
  currentName?: string;
  currentColorIndex?: number;
}

export function ClaimStarModal({
  open,
  onClose,
  isUpdate = false,
  currentName = "",
  currentColorIndex = 0,
}: ClaimStarModalProps) {
  const { address: connectedAddress } = useAccount();
  const publicClient = usePublicClient();
  const { setWalletRegistration } = useGalaxyStore();
  const [name, setName] = useState(currentName);
  const [colorIndex, setColorIndex] = useState(currentColorIndex);

  const { writeContract, data: txHash, isPending, error: writeError, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  useEffect(() => {
    if (open) {
      setName(currentName);
      setColorIndex(currentColorIndex);
      reset();
    }
  }, [open, currentName, currentColorIndex, reset]);

  useEffect(() => {
    if (!isConfirmed || !connectedAddress || !publicClient) return;

    const lower = connectedAddress.toLowerCase();
    publicClient
      .readContract({
        address: STAR_REGISTRY_ADDRESS as `0x${string}`,
        abi: STAR_REGISTRY_ABI,
        functionName: "getStarInfo",
        args: [connectedAddress],
      })
      .then(([starName, starColor, registeredAt, exists]) => {
        if (exists) {
          setWalletRegistration(lower, {
            name: starName,
            colorIndex: starColor,
            registeredAt: Number(registeredAt),
            exists: true,
          });
        }
      })
      .catch(() => {
        setWalletRegistration(lower, {
          name,
          colorIndex,
          registeredAt: Math.floor(Date.now() / 1000),
          exists: true,
        });
      });

    setTimeout(onClose, 1500);
  }, [isConfirmed, connectedAddress, publicClient, setWalletRegistration, name, colorIndex, onClose]);

  const handleSubmit = useCallback(() => {
    if (!name.trim() || !connectedAddress) return;
    writeContract({
      address: STAR_REGISTRY_ADDRESS as `0x${string}`,
      abi: STAR_REGISTRY_ABI,
      functionName: isUpdate ? "updateStar" : "registerStar",
      args: [name.trim(), colorIndex],
    });
  }, [name, colorIndex, connectedAddress, writeContract, isUpdate]);

  const isContractDeployed = STAR_REGISTRY_ADDRESS !== ZERO_ADDRESS;
  const isWorking = isPending || isConfirming;
  const nameValid = name.trim().length > 0 && name.trim().length <= 32;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md mx-4 rounded-2xl p-6 space-y-5"
            style={{
              background: "rgba(10, 10, 30, 0.85)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              backdropFilter: "blur(24px)",
              boxShadow: "0 0 60px rgba(0, 82, 255, 0.15), 0 0 120px rgba(0, 255, 170, 0.05)",
            }}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-secondary hover:text-white transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>

            {/* Header */}
            <div>
              <h2 className="text-xl font-semibold" style={{ color: "#FFD700" }}>
                {isUpdate ? "Update Your Star" : "Claim Your Star"}
              </h2>
              <p className="text-sm text-secondary mt-1">
                {isUpdate
                  ? "Change your star's name and color on-chain."
                  : "Register your wallet as a named star in the galaxy."}
              </p>
            </div>

            {!isContractDeployed && (
              <div
                className="px-4 py-3 rounded-xl text-sm"
                style={{
                  background: "rgba(255, 170, 0, 0.1)",
                  border: "1px solid rgba(255, 170, 0, 0.25)",
                  color: "#FFAA44",
                }}
              >
                StarRegistry contract not yet deployed. Update the address in{" "}
                <code className="text-xs">src/lib/contracts.ts</code> after deploying.
              </div>
            )}

            {/* Name input */}
            <div>
              <label className="text-xs text-secondary uppercase tracking-wider">Star Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 32))}
                placeholder="e.g. Polaris, Vega, Sirius..."
                disabled={isWorking}
                className="mt-1.5 w-full px-4 py-2.5 rounded-xl text-sm bg-white/5 placeholder:text-secondary/40 outline-none transition-colors focus:ring-1"
                style={{
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  color: "#ffffff",
                }}
                onFocus={(e) => (e.target.style.borderColor = "rgba(255, 215, 0, 0.4)")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(255, 255, 255, 0.1)")}
              />
              <p className="text-xs text-secondary mt-1">{name.length}/32 characters</p>
            </div>

            {/* Color palette */}
            <div>
              <label className="text-xs text-secondary uppercase tracking-wider">Star Color</label>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {PLANET_PALETTES.map((palette, i) => (
                  <button
                    key={i}
                    onClick={() => setColorIndex(i)}
                    disabled={isWorking}
                    className="group relative flex flex-col items-center gap-1.5 py-2.5 rounded-xl transition-all"
                    style={{
                      background:
                        colorIndex === i ? "rgba(255, 215, 0, 0.1)" : "rgba(255, 255, 255, 0.03)",
                      border: `1px solid ${colorIndex === i ? "rgba(255, 215, 0, 0.4)" : "rgba(255, 255, 255, 0.06)"}`,
                    }}
                  >
                    {/* Color swatch — stacked gradient circles */}
                    <div className="relative w-8 h-8">
                      <div
                        className="absolute inset-0 rounded-full opacity-40 blur-sm"
                        style={{ background: palette.aura }}
                      />
                      <div
                        className="absolute inset-0.5 rounded-full"
                        style={{
                          background: `radial-gradient(circle at 35% 35%, ${palette.coreLight}, ${palette.coreMid} 50%, ${palette.coreDeep})`,
                        }}
                      />
                      {colorIndex === i && (
                        <div
                          className="absolute -inset-0.5 rounded-full"
                          style={{
                            border: "2px solid #FFD700",
                            boxShadow: "0 0 8px rgba(255, 215, 0, 0.4)",
                          }}
                        />
                      )}
                    </div>
                    <span className="text-[10px] text-secondary">
                      {["Rose", "Solar", "Blue", "Red", "Emerald", "Void", "Inferno", "Frost"][i]}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Error display */}
            {writeError && (
              <div
                className="px-4 py-3 rounded-xl text-sm"
                style={{
                  background: "rgba(255, 68, 68, 0.1)",
                  border: "1px solid rgba(255, 68, 68, 0.25)",
                  color: "#FF6666",
                }}
              >
                {writeError.message.includes("User rejected")
                  ? "Transaction rejected."
                  : writeError.message.includes("Star already registered")
                    ? "This wallet already has a registered star."
                    : "Transaction failed. Please try again."}
              </div>
            )}

            {/* Success */}
            {isConfirmed && (
              <div
                className="px-4 py-3 rounded-xl text-sm"
                style={{
                  background: "rgba(0, 255, 170, 0.1)",
                  border: "1px solid rgba(0, 255, 170, 0.25)",
                  color: "#00FFAA",
                }}
              >
                Star {isUpdate ? "updated" : "registered"} on-chain!
              </div>
            )}

            {/* Submit button */}
            <button
              onClick={handleSubmit}
              disabled={isWorking || !nameValid || !isContractDeployed || isConfirmed}
              className="w-full py-3 rounded-xl text-sm font-medium transition-all disabled:opacity-40"
              style={{
                background: isWorking
                  ? "rgba(255, 215, 0, 0.15)"
                  : "linear-gradient(135deg, rgba(255, 215, 0, 0.25), rgba(255, 170, 0, 0.2))",
                border: "1px solid rgba(255, 215, 0, 0.3)",
                color: "#FFD700",
              }}
            >
              {isConfirming
                ? "Confirming..."
                : isPending
                  ? "Waiting for wallet..."
                  : isUpdate
                    ? "Update Star"
                    : "Register Star"}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
