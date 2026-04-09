"use client";

import { useStarRegistry } from "@/hooks/useStarRegistry";

export function StarRegistryLoader() {
  useStarRegistry();
  return null;
}
