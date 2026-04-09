"use client";

import { useLoader } from "@react-three/fiber";
import * as THREE from "three";

export function StarField() {
  const starfieldTex = useLoader(THREE.TextureLoader, "/textures/starfield.jpg");
  const starsLayerTex = useLoader(THREE.TextureLoader, "/textures/stars-layer.jpg");

  return (
    <>
      {/* Outer shell — 8K starfield from the reference repo */}
      <mesh>
        <sphereGeometry args={[120, 32, 32]} />
        <meshBasicMaterial
          map={starfieldTex}
          side={THREE.BackSide}
          toneMapped={false}
          color={[1.2, 1.2, 1.2]}
        />
      </mesh>

      {/* Inner shell — softer stars layer at reduced opacity for depth */}
      <mesh>
        <sphereGeometry args={[110, 32, 32]} />
        <meshBasicMaterial
          map={starsLayerTex}
          side={THREE.BackSide}
          toneMapped={false}
          transparent
          opacity={0.3}
          color={[0.8, 0.9, 1.0]}
        />
      </mesh>
    </>
  );
}
