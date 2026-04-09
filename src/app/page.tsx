"use client";

import { useState, useEffect } from "react";

export default function Home() {
  const [GalaxyCanvas, setGalaxyCanvas] = useState<React.ComponentType | null>(null);

  useEffect(() => {
    import("@/components/galaxy/GalaxyCanvas").then((mod) => {
      setGalaxyCanvas(() => mod.GalaxyCanvas);
    });
  }, []);

  if (!GalaxyCanvas) {
    return (
      <div style={{ width: "100vw", height: "100vh", background: "#0a0a1a" }} />
    );
  }

  return <GalaxyCanvas />;
}
