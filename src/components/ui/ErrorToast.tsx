"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useGalaxyStore } from "@/hooks/useGalaxyStore";

export function ErrorToast() {
  const { lastError, clearError } = useGalaxyStore();

  return (
    <AnimatePresence>
      {lastError && (
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: "spring", damping: 25, stiffness: 350 }}
          className="fixed bottom-14 left-1/2 z-40 flex max-w-md items-center gap-3 rounded-2xl px-5 py-3"
          style={{
            transform: "translateX(-50%)",
            background: "rgba(30, 10, 15, 0.85)",
            border: "1px solid rgba(255, 80, 80, 0.25)",
            backdropFilter: "blur(20px)",
            boxShadow: "0 8px 32px rgba(255, 50, 50, 0.15), 0 0 0 1px rgba(255, 80, 80, 0.08)",
          }}
        >
          {/* Warning icon */}
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#FF6666"
            strokeWidth="2"
            className="shrink-0"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>

          <span className="text-sm" style={{ color: "#FFB3B3" }}>
            {lastError}
          </span>

          <button
            onClick={clearError}
            className="ml-2 shrink-0 text-secondary hover:text-white transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>

          {/* Auto-dismiss progress bar */}
          <motion.div
            initial={{ scaleX: 1 }}
            animate={{ scaleX: 0 }}
            transition={{ duration: 6, ease: "linear" }}
            className="absolute bottom-0 left-0 right-0 h-0.5 origin-left rounded-b-2xl"
            style={{ background: "rgba(255, 80, 80, 0.4)" }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
