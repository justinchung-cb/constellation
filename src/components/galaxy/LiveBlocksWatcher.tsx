"use client";

import { useLiveBlocks } from "@/hooks/useLiveBlocks";

export function LiveBlocksWatcher() {
  useLiveBlocks();
  return null;
}
