"use client";

import { Stars } from "@react-three/drei";

export function StarField() {
  return (
    <>
      <Stars
        radius={100}
        depth={60}
        count={5000}
        factor={7}
        saturation={0}
        fade
        speed={0.8}
      />
      <Stars
        radius={50}
        depth={40}
        count={2500}
        factor={5}
        saturation={0.1}
        fade
        speed={0.4}
      />
    </>
  );
}
