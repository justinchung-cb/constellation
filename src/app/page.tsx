"use client";

import { useState, useEffect } from "react";
import { CosmicSpinner } from "@/components/ui/CosmicSpinner";

export default function Home() {
  const [GalaxyCanvas, setGalaxyCanvas] = useState<React.ComponentType | null>(null);

  useEffect(() => {
    import("@/components/galaxy/GalaxyCanvas").then((mod) => {
      setGalaxyCanvas(() => mod.GalaxyCanvas);
    });
  }, []);

  if (!GalaxyCanvas) {
    return <CosmicSpinner />;
  }

  return <GalaxyCanvas />;
}
