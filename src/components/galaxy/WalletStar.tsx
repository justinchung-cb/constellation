"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Billboard, Text } from "@react-three/drei";
import * as THREE from "three";
import { PLANET_PALETTES } from "@/types";

const vertexShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewDir;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vViewDir = normalize(cameraPosition - worldPos.xyz);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform float uTime;
  uniform float uBrightness;

  varying vec3 vNormal;
  varying vec3 vViewDir;

  void main() {
    vec3 N = normalize(vNormal);
    vec3 V = normalize(vViewDir);

    float angle = uTime * 0.3;
    vec3 gradDir = normalize(vec3(cos(angle), sin(angle), 0.4));
    float grad = dot(N, gradDir) * 0.5 + 0.5;
    grad = clamp(grad + sin(uTime * 0.8) * 0.15, 0.0, 1.0);

    vec3 base = mix(uColorA, uColorB, grad);

    vec3 L = normalize(vec3(0.8, 1.0, 0.6));
    float diff = max(dot(N, L), 0.0) * 0.55 + 0.45;

    vec3 H = normalize(L + V);
    float spec = pow(max(dot(N, H), 0.0), 48.0);

    float fresnel = pow(1.0 - max(dot(N, V), 0.0), 3.0);

    vec3 color = base * diff * uBrightness;
    color += spec * 0.6 * uBrightness;
    color += fresnel * base * 0.7;

    gl_FragColor = vec4(color, 1.0);
  }
`;

interface WalletStarProps {
  position: [number, number, number];
  size?: number;
  colorIndex?: number;
  brightness?: number;
  label?: string;
  onClick?: () => void;
}

export function WalletStar({
  position,
  size = 0.3,
  colorIndex = 0,
  brightness = 1,
  label,
  onClick,
}: WalletStarProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  const palette = PLANET_PALETTES[colorIndex % PLANET_PALETTES.length];

  const uniforms = useMemo(
    () => ({
      uColorA: { value: new THREE.Color(palette.coreLight) },
      uColorB: { value: new THREE.Color(palette.coreMid) },
      uTime: { value: 0 },
      uBrightness: { value: brightness },
    }),
    [palette.coreLight, palette.coreMid, brightness],
  );

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() + position[0] * 3.7;
    uniforms.uTime.value = t;

    if (meshRef.current) {
      const pulse = 1 + Math.sin(t * 2) * 0.12;
      meshRef.current.scale.setScalar(pulse);
    }
    if (glowRef.current) {
      const glowPulse = 1 + Math.sin(t * 1.5 + 1) * 0.1;
      glowRef.current.scale.setScalar(glowPulse);
    }
  });

  return (
    <group position={position} onClick={onClick}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[size, 32, 32]} />
        <shaderMaterial
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          toneMapped={false}
        />
      </mesh>

      <mesh ref={glowRef}>
        <sphereGeometry args={[size * 2.5, 16, 16]} />
        <meshBasicMaterial
          color={palette.aura}
          transparent
          opacity={0.08 * brightness}
          depthWrite={false}
        />
      </mesh>

      {label && (
        <Billboard position={[0, size + 0.5, 0]}>
          <Text fontSize={0.25} color="#ffffff" anchorX="center" anchorY="bottom">
            {label}
          </Text>
        </Billboard>
      )}
    </group>
  );
}
