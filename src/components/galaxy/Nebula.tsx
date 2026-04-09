"use client";

import React, { memo, useCallback, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const PARTICLE_COUNT = 60;

const NEBULA_VERTEX = /* glsl */ `
  uniform float uTime;
  uniform float uScale;
  attribute float aSize;
  attribute float aPhase;
  varying float vAlpha;

  void main() {
    vec3 pos = position;

    float angle = uTime * 0.3 + aPhase;
    float c = cos(angle);
    float s = sin(angle);
    pos = vec3(
      pos.x * c - pos.z * s,
      pos.y,
      pos.x * s + pos.z * c
    );

    vec4 mvPos = modelViewMatrix * vec4(pos * uScale, 1.0);
    gl_Position = projectionMatrix * mvPos;

    float pulse = 0.8 + 0.2 * sin(uTime * 2.0 + aPhase * 6.28);
    gl_PointSize = aSize * pulse * (150.0 / -mvPos.z);

    float dist = length(position);
    vAlpha = smoothstep(1.4, 0.0, dist);
  }
`;

const NEBULA_FRAGMENT = /* glsl */ `
  uniform vec3 uColorCore;
  uniform vec3 uColorEdge;
  varying float vAlpha;

  void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    if (d > 0.5) discard;

    float falloff = 1.0 - smoothstep(0.0, 0.5, d);
    vec3 color = mix(uColorEdge, uColorCore, falloff);

    gl_FragColor = vec4(color, falloff * vAlpha * 0.6);
  }
`;

const GLOW_GEO = new THREE.SphereGeometry(1, 8, 8);
const CORE_GEO = new THREE.SphereGeometry(1, 6, 6);
const HIT_GEO = new THREE.SphereGeometry(1, 6, 6);
const HIT_MAT = new THREE.MeshBasicMaterial({ visible: false });

const Nebula = memo(function Nebula({
  position,
  txHash,
  identifier,
  selectedRef,
  connectedRef,
  onSelect,
}: {
  position: [number, number, number];
  txHash: string;
  identifier: string;
  selectedRef: React.RefObject<string | null>;
  connectedRef: React.RefObject<Set<string>>;
  onSelect: (txHash: string) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const hoveredRef = useRef(0);
  const hoverTargetRef = useRef(0);

  const { geometry, uniforms } = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const sizes = new Float32Array(PARTICLE_COUNT);
    const phases = new Float32Array(PARTICLE_COUNT);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = Math.pow(Math.random(), 0.6) * 1.0;

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      sizes[i] = 3.0 + Math.random() * 4.0;
      phases[i] = Math.random();
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));

    const u = {
      uTime: { value: 0 },
      uScale: { value: 0.7 },
      uColorCore: { value: new THREE.Color("#DD88FF") },
      uColorEdge: { value: new THREE.Color("#4466CC") },
    };

    return { geometry: geo, uniforms: u };
  }, []);

  const handleClick = useCallback((e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    onSelect(txHash);
  }, [onSelect, txHash]);

  useFrame(() => {
    const now = performance.now() * 0.001;
    uniforms.uTime.value = now;

    const selected = selectedRef.current;
    const isSelected = selected === identifier;
    const hasSelection = selected !== null;
    const isConnected = hasSelection && !isSelected && connectedRef.current.has(identifier);
    const isUnrelated = hasSelection && !isSelected && !isConnected;

    if (groupRef.current) groupRef.current.visible = !isUnrelated;

    hoveredRef.current += (hoverTargetRef.current - hoveredRef.current) * 0.08;

    const hoverMul = 1.0 + hoveredRef.current * 0.25;
    uniforms.uScale.value = 0.7 * hoverMul;

    if (glowRef.current) {
      const s = (0.6 + Math.sin(now * 1.5) * 0.06) * hoverMul;
      glowRef.current.scale.setScalar(s);
      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.12 + hoveredRef.current * 0.13;
    }

    if (coreRef.current) {
      const s = (0.12 + Math.sin(now * 3.0) * 0.02) * hoverMul;
      coreRef.current.scale.setScalar(s);
      const mat = coreRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.5 + hoveredRef.current * 0.3;
    }
  });

  return (
    <group
      ref={groupRef}
      position={position}
      onClick={handleClick}
      onPointerOver={(e) => { e.stopPropagation(); hoverTargetRef.current = 1; document.body.style.cursor = "pointer"; }}
      onPointerOut={() => { hoverTargetRef.current = 0; document.body.style.cursor = "auto"; }}
    >
      <mesh geometry={HIT_GEO} material={HIT_MAT} scale={0.5} />

      {/* Bright inner core — visible anchor point from far away */}
      <mesh ref={coreRef} geometry={CORE_GEO} scale={0.12}>
        <meshBasicMaterial
          color="#AA77CC"
          toneMapped={false}
          transparent
          opacity={0.5}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      <points geometry={geometry}>
        <shaderMaterial
          vertexShader={NEBULA_VERTEX}
          fragmentShader={NEBULA_FRAGMENT}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </points>

      <mesh ref={glowRef} geometry={GLOW_GEO} scale={0.6}>
        <meshBasicMaterial
          color="#6644AA"
          transparent
          opacity={0.12}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
});

export { Nebula };
