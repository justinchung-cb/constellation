"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { OrbitControls, Text, Billboard } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import type { Mesh } from "three";
import * as THREE from "three";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { walletToPosition, starBrightness, starSize } from "@/lib/galaxy-math";
import { PLANET_PALETTES } from "@/types";
import { useGalaxyStore } from "@/hooks/useGalaxyStore";
import { CameraController } from "./CameraController";
import { ConstellationLines } from "./ConstellationLines";
import { TransactionBeam } from "./TransactionBeam";
import { BlockPulse } from "./BlockPulse";
import { Nebula } from "./Nebula";
import { StarBirth } from "./StarBirth";
import { StarDeath } from "./StarDeath";
import { FlowArrows } from "./FlowArrows";
import { StarField } from "./StarField";

const PLANET_GEO = (() => {
  const geo = mergeVertices(new THREE.IcosahedronGeometry(1, 20));
  geo.computeTangents();
  return geo;
})();
const SHARED_HIT_GEO = new THREE.SphereGeometry(1, 6, 6);
const HIT_MAT = new THREE.MeshBasicMaterial({ visible: false });
const CROWN_GEO = new THREE.TorusGeometry(1, 0.035, 8, 48);


const FLASH_DURATION = 1.8;
const BIRTH_DURATION = 1.0;
const ORBIT_PARTICLE_COUNT = 30;

const PARTICLE_ORBIT_VERT = /* glsl */ `
  uniform float uTime;
  uniform float uBrightness;
  attribute float aPhase;
  attribute float aOrbitRadius;
  attribute float aOrbitSpeed;
  attribute float aSize;
  attribute float aOrbitTilt;
  varying float vAlpha;

  void main() {
    float angle = uTime * aOrbitSpeed + aPhase;
    float tilt = aOrbitTilt;
    float ct = cos(tilt);
    float st = sin(tilt);

    vec3 orbitPos = vec3(
      cos(angle) * aOrbitRadius,
      sin(angle) * aOrbitRadius * st,
      sin(angle) * aOrbitRadius * ct
    );

    vec4 mvPos = modelViewMatrix * vec4(orbitPos, 1.0);
    gl_Position = projectionMatrix * mvPos;
    gl_PointSize = aSize * (60.0 / -mvPos.z);
    vAlpha = (0.3 + 0.2 * sin(uTime * 1.5 + aPhase * 6.28)) * min(uBrightness, 1.0);
  }
`;

const PARTICLE_ORBIT_FRAG = /* glsl */ `
  uniform vec3 uColor;
  varying float vAlpha;

  void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    if (d > 0.5) discard;
    float falloff = 1.0 - smoothstep(0.0, 0.5, d);
    gl_FragColor = vec4(uColor, falloff * vAlpha);
  }
`;

// ---------------------------------------------------------------------------
// GLSL — displaced sphere planet shader (smoothMod banding + noise)
// ---------------------------------------------------------------------------

const PLANET_VERTEX = /* glsl */ `
  attribute vec4 tangent;

  uniform float uTime;
  uniform vec3 uSeed;
  uniform float uFractAmt;
  uniform float uDisplaceAmt;
  uniform float uSpeed;
  uniform float uNoiseScale;
  uniform float uWarpStrength;
  uniform float uBandTilt;

  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying float vPattern;

  float hash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  float noise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash(i),               hash(i + vec3(1,0,0)), f.x),
          mix(hash(i + vec3(0,1,0)),  hash(i + vec3(1,1,0)), f.x), f.y),
      mix(mix(hash(i + vec3(0,0,1)),  hash(i + vec3(1,0,1)), f.x),
          mix(hash(i + vec3(0,1,1)),  hash(i + vec3(1,1,1)), f.x), f.y),
      f.z);
  }

  #define PI 3.14159265359

  float smoothMod(float axis, float amp, float rad) {
    float top = cos(PI * (axis / amp)) * sin(PI * (axis / amp));
    float bottom = pow(sin(PI * (axis / amp)), 2.0) + pow(rad, 2.0);
    float at = atan(top / bottom);
    return amp * 0.5 - (1.0 / PI) * at;
  }

  vec3 tiltBands(vec3 p) {
    float c = cos(uBandTilt);
    float s = sin(uBandTilt);
    return vec3(p.x, p.y * c - p.z * s, p.y * s + p.z * c);
  }

  float getDisplacement(vec3 p) {
    vec3 pos = tiltBands(p) + uSeed;
    pos.y -= uTime * uSpeed;
    pos += noise(pos * uNoiseScale) * 0.18;
    pos += noise(pos * 0.7 + uSeed) * uWarpStrength;
    return smoothMod(pos.y * uFractAmt, 1.0, 1.5) * uDisplaceAmt;
  }

  void main() {
    float pattern = getDisplacement(position);
    vPattern = pattern;

    vec3 displaced = position + normal * pattern;

    vec3 biTangent = cross(normal, tangent.xyz);
    float shift = 0.01;
    vec3 posA = position + tangent.xyz * shift;
    vec3 posB = position + biTangent * shift;
    posA += normal * getDisplacement(posA);
    posB += normal * getDisplacement(posB);

    vec3 toA = normalize(posA - displaced);
    vec3 toB = normalize(posB - displaced);
    vec3 newNormal = normalize(cross(toA, toB));

    vNormal = normalize(normalMatrix * newNormal);
    vec4 worldPos = modelMatrix * vec4(displaced, 1.0);
    vViewDir = normalize(cameraPosition - worldPos.xyz);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const PLANET_FRAGMENT = /* glsl */ `
  uniform vec3 uColorDeep;
  uniform vec3 uColorMid;
  uniform vec3 uColorLight;
  uniform vec3 uRimColor;
  uniform float uBrightness;
  uniform float uDisplaceAmt;

  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying float vPattern;

  void main() {
    vec3 N = normalize(vNormal);
    vec3 V = normalize(vViewDir);

    // Marble color banding — purely cosmetic pattern
    float t = smoothstep(0.0, uDisplaceAmt, vPattern);
    vec3 base;
    if (t < 0.5) {
      base = mix(uColorDeep, uColorMid, t * 2.0);
    } else {
      base = mix(uColorMid, uColorLight, (t - 0.5) * 2.0);
    }

    // Blend in the lightest palette color so dark palettes still radiate
    vec3 emissive = mix(base, uColorLight, 0.4);

    // Nearly uniform glow — only a subtle 20% falloff at edges avoids
    // the "lit from one direction" artifact from displaced normals
    float facing = max(dot(N, V), 0.0);
    float glow = 0.8 + 0.2 * facing;

    vec3 color = emissive * glow * uBrightness;

    // Rim light — subsurface scattering at the silhouette
    float rim = pow(1.0 - facing, 2.0);
    color += uRimColor * rim * 0.8 * uBrightness;

    // Center hot-spot — looking straight through to the bright core
    float hot = pow(facing, 4.0);
    color += uColorLight * hot * 0.35 * uBrightness;

    // Translucent surface lets the internal point light shine through
    float alpha = 0.35 + 0.3 * facing;
    gl_FragColor = vec4(color, alpha);
  }
`;


// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

const SEED_WALLETS = [
  { address: "0x000000000000000000000000000000000000dead", colorIndex: 3, size: 0.6, brightness: 1.8 },
  { address: "0xd8da6bf26964af9d7eed9e03e53415d37aa96045", colorIndex: 1, size: 0.5, brightness: 1.5 },
  { address: "0xbe0eb53f46cd790cd13851d5eff43d12404d33e8", colorIndex: 2, size: 0.45, brightness: 1.3 },
  { address: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2", colorIndex: 0, size: 0.55, brightness: 1.6 },
  { address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", colorIndex: 3, size: 0.4, brightness: 1.2 },
  { address: "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984", colorIndex: 1, size: 0.35, brightness: 1.1 },
  { address: "0x7a250d5630b4cf539739df2c5dacb4c659f2488d", colorIndex: 2, size: 0.5, brightness: 1.4 },
  { address: "0x6b175474e89094c44da98b954eedeac495271d0f", colorIndex: 1, size: 0.4, brightness: 1.3 },
  { address: "0xdac17f958d2ee523a2206206994597c13d831ec7", colorIndex: 0, size: 0.38, brightness: 1.2 },
  { address: "0x1111111254eeb25477b68fb85ed929f73a960582", colorIndex: 3, size: 0.42, brightness: 1.3 },
  { address: "0x514910771af9ca656af840dff83e8264ecf986ca", colorIndex: 2, size: 0.32, brightness: 1.0 },
  { address: "0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce", colorIndex: 2, size: 0.28, brightness: 0.9 },
  { address: "0xdef1c0ded9bec7f1a1670819833240f027b25eff", colorIndex: 0, size: 0.38, brightness: 1.1 },
  { address: "0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad", colorIndex: 1, size: 0.34, brightness: 1.0 },
  { address: "0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0", colorIndex: 3, size: 0.35, brightness: 1.1 },
];

function elasticOut(t: number): number {
  if (t === 0 || t === 1) return t;
  return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1;
}

// ---------------------------------------------------------------------------
// PulsingStar — marble-shaded planet with glow layers + orbital ring
// ---------------------------------------------------------------------------

interface PushEffect {
  origin: [number, number, number];
  startTime: number;
  strength: number;
}

const PUSH_DURATION = 0.8;
const PUSH_RADIUS = 3;

const PulsingStar = memo(function PulsingStar({
  position,
  size,
  colorIndex,
  brightness,
  address,
  starName,
  isRegistered,
  selectedRef,
  connectedRef,
  flashingRef,
  birthRef,
  pushEffectsRef,
  onSelect,
}: {
  position: [number, number, number];
  size: number;
  colorIndex: number;
  brightness: number;
  address: string;
  starName?: string;
  isRegistered?: boolean;
  selectedRef: React.RefObject<string | null>;
  connectedRef: React.RefObject<Set<string>>;
  flashingRef: React.RefObject<Map<string, number>>;
  birthRef: React.RefObject<Map<string, number>>;
  pushEffectsRef: React.RefObject<PushEffect[]>;
  onSelect: (address: string) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const starRef = useRef<Mesh>(null);
  const crownRef = useRef<Mesh>(null);
  const starLightRef = useRef<THREE.PointLight>(null);
  const hoveredRef = useRef(0);
  const hoverTargetRef = useRef(0);

  const particleRef = useRef<THREE.Points>(null);

  const palette = PLANET_PALETTES[colorIndex % PLANET_PALETTES.length];
  const hitSize = size;
  const seedVec = useMemo(
    () => new THREE.Vector3(position[0] * 1.3, position[1] * 1.7, position[2] * 2.1),
    [position],
  );

  const particleGeo = useMemo(() => {
    const positions = new Float32Array(ORBIT_PARTICLE_COUNT * 3);
    const phases = new Float32Array(ORBIT_PARTICLE_COUNT);
    const radii = new Float32Array(ORBIT_PARTICLE_COUNT);
    const speeds = new Float32Array(ORBIT_PARTICLE_COUNT);
    const sizes = new Float32Array(ORBIT_PARTICLE_COUNT);
    const tilts = new Float32Array(ORBIT_PARTICLE_COUNT);

    for (let i = 0; i < ORBIT_PARTICLE_COUNT; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;
      phases[i] = Math.random() * Math.PI * 2;
      radii[i] = 1.1 + Math.random() * 0.5;
      speeds[i] = 0.3 + Math.random() * 0.5;
      sizes[i] = 0.5 + Math.random() * 1.0;
      tilts[i] = (Math.random() - 0.5) * Math.PI;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
    geo.setAttribute("aOrbitRadius", new THREE.BufferAttribute(radii, 1));
    geo.setAttribute("aOrbitSpeed", new THREE.BufferAttribute(speeds, 1));
    geo.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute("aOrbitTilt", new THREE.BufferAttribute(tilts, 1));
    return geo;
  }, []);

  const particleUniforms = useRef({
    uTime: { value: 0 },
    uColor: { value: new THREE.Color(palette.aura) },
    uBrightness: { value: brightness },
  }).current;

  const variation = useMemo(() => {
    const b0 = parseInt(address.slice(2, 4), 16) / 255;
    const b1 = parseInt(address.slice(4, 6), 16) / 255;
    const b2 = parseInt(address.slice(6, 8), 16) / 255;
    const b3 = parseInt(address.slice(8, 10), 16) / 255;
    const b4 = parseInt(address.slice(10, 12), 16) / 255;
    const b5 = parseInt(address.slice(12, 14), 16) / 255;
    return {
      fractAmt: 1.5 + b0 * 5.0,
      displaceAmt: 0.06 + b1 * 0.35,
      speed: 0.01 + b2 * 0.12,
      noiseScale: 0.8 + b3 * 2.5,
      warpStrength: b4 * 0.3,
      bandTilt: b5 * Math.PI,
    };
  }, [address]);

  const uniforms = useRef({
    uColorDeep: { value: new THREE.Color(palette.coreDeep) },
    uColorMid: { value: new THREE.Color(palette.coreMid) },
    uColorLight: { value: new THREE.Color(palette.coreLight) },
    uRimColor: { value: new THREE.Color(palette.rim) },
    uTime: { value: 0 },
    uBrightness: { value: brightness },
    uSeed: { value: seedVec },
    uFractAmt: { value: variation.fractAmt },
    uDisplaceAmt: { value: variation.displaceAmt },
    uSpeed: { value: variation.speed },
    uNoiseScale: { value: variation.noiseScale },
    uWarpStrength: { value: variation.warpStrength },
    uBandTilt: { value: variation.bandTilt },
  }).current;

  useEffect(() => {
    uniforms.uColorDeep.value.set(palette.coreDeep);
    uniforms.uColorMid.value.set(palette.coreMid);
    uniforms.uColorLight.value.set(palette.coreLight);
    uniforms.uRimColor.value.set(palette.rim);
    particleUniforms.uColor.value.set(palette.aura);
  }, [palette, uniforms, particleUniforms]);

  const handleClick = useCallback((e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    onSelect(address);
  }, [onSelect, address]);

  useFrame(() => {
    if (!starRef.current) return;

    const now = performance.now() * 0.001;
    const selected = selectedRef.current;
    const isSelected = selected === address;
    const hasSelection = selected !== null;
    const isConnected = hasSelection && !isSelected && connectedRef.current.has(address);
    const isUnrelated = hasSelection && !isSelected && !isConnected;

    let flashBoost = 0;
    const flashStart = flashingRef.current.get(address);
    if (flashStart !== undefined) {
      const elapsed = now - flashStart;
      if (elapsed < FLASH_DURATION) {
        const t = elapsed / FLASH_DURATION;
        flashBoost = t < 0.1 ? t / 0.1 : 1 - (t - 0.1) / 0.9;
      } else {
        flashingRef.current.delete(address);
      }
    }

    let birthScale = 1;
    let birthEmissiveBoost = 0;
    const birthStart = birthRef.current.get(address);
    if (birthStart !== undefined) {
      const elapsed = now - birthStart;
      if (elapsed < BIRTH_DURATION) {
        const t = elapsed / BIRTH_DURATION;
        birthScale = elasticOut(t);
        birthEmissiveBoost = (1 - t) * 1.5;
      } else {
        birthRef.current.delete(address);
      }
    }

    if (groupRef.current) groupRef.current.visible = !isUnrelated;

    let pushX = 0, pushY = 0, pushZ = 0;
    for (const push of pushEffectsRef.current) {
      const elapsed = now - push.startTime;
      if (elapsed >= PUSH_DURATION) continue;
      const dx = position[0] - push.origin[0];
      const dy = position[1] - push.origin[1];
      const dz = position[2] - push.origin[2];
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist < 0.01 || dist > PUSH_RADIUS) continue;
      const falloff = 1 - dist / PUSH_RADIUS;
      const decay = 1 - elapsed / PUSH_DURATION;
      const eased = decay * decay;
      const mag = push.strength * falloff * eased / dist;
      pushX += dx * mag;
      pushY += dy * mag;
      pushZ += dz * mag;
    }
    if (groupRef.current) {
      groupRef.current.position.set(
        position[0] + pushX,
        position[1] + pushY,
        position[2] + pushZ,
      );
    }

    hoveredRef.current += (hoverTargetRef.current - hoveredRef.current) * 0.08;

    const hoverMul = 1.0 + hoveredRef.current * 0.15;
    const sizeMultiplier = (isSelected ? 1.3 : isConnected ? 1.0 : 1) * hoverMul;
    const pulse = sizeMultiplier * birthScale + Math.sin(now * 2 + position[0] * 10) * 0.06 * birthScale;
    const coreScale = size * 0.6 * pulse;
    starRef.current.scale.setScalar(coreScale);

    const dimFactor = isConnected ? 0.7 : 1;

    if (starLightRef.current) {
      starLightRef.current.intensity = brightness * size * 3.0 * pulse * dimFactor;
    }
    const hoverBrightness = hoveredRef.current * 0.5;
    const selectMul = isSelected ? 1.8 : 1.0;
    uniforms.uTime.value = now;
    const normBrightness = 1.0 + (brightness - 1.0) * 0.15;
    uniforms.uBrightness.value = normBrightness * dimFactor * selectMul + flashBoost * 2.0 + birthEmissiveBoost * 0.5 + hoverBrightness;

    particleUniforms.uTime.value = now;
    particleUniforms.uBrightness.value = dimFactor + hoveredRef.current * 0.3;
    if (particleRef.current) {
      particleRef.current.scale.setScalar(size * 0.6 * pulse);
    }

    if (crownRef.current) {
      crownRef.current.rotation.z = now * 0.3;
      crownRef.current.rotation.x = Math.PI / 2 + Math.sin(now * 0.5) * 0.15;
      const crownScale = size * 0.6 * pulse * 1.6;
      crownRef.current.scale.setScalar(crownScale);
      const crownMat = crownRef.current.material as THREE.MeshBasicMaterial;
      crownMat.opacity = (isConnected ? 0.3 : 0.6) + Math.sin(now * 2) * 0.1;
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
      <mesh geometry={SHARED_HIT_GEO} material={HIT_MAT} scale={hitSize} />

      {/* Core displaced planet */}
      <mesh ref={starRef} geometry={PLANET_GEO} scale={size}>
        <shaderMaterial
          vertexShader={PLANET_VERTEX}
          fragmentShader={PLANET_FRAGMENT}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* Emissive point light radiating from inside the star */}
      <pointLight
        ref={starLightRef}
        color={palette.aura}
        intensity={brightness * size * 3.0}
        distance={10}
        decay={2}
      />

      {/* Orbiting particles */}
      <points ref={particleRef} geometry={particleGeo} scale={size * 0.6} raycast={() => {}}>
        <shaderMaterial
          vertexShader={PARTICLE_ORBIT_VERT}
          fragmentShader={PARTICLE_ORBIT_FRAG}
          uniforms={particleUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </points>

      {/* Crown ring for registered stars */}
      {isRegistered && (
        <mesh ref={crownRef} geometry={CROWN_GEO} rotation={[Math.PI / 2, 0, 0]} scale={size * 0.6 * 1.6}>
          <meshBasicMaterial
            color="#FFFFFF"
            transparent
            opacity={0.6}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Name label for registered stars */}
      {starName && (
        <Billboard position={[0, size * 1.6, 0]}>
          <Text
            fontSize={0.22}
            color="#FFFFFF"
            anchorY="bottom"
            outlineWidth={0.015}
            outlineColor="#000000"
          >
            {starName}
          </Text>
        </Billboard>
      )}
    </group>
  );
});

// ---------------------------------------------------------------------------
// GalaxyScene
// ---------------------------------------------------------------------------

export function GalaxyScene({ introPhase = "ready" }: { introPhase?: "intro" | "zooming" | "whiteout" | "ready" }) {
  const {
    wallets, transactions, contractCreations, clusteredPositions, selectedEntity, cameraTarget,
    selectWallet, selectContract, liveQueue, promoteLiveTransaction, blockPulseRef, deathQueueRef,
  } = useGalaxyStore();
  const orbitRef = useRef<{ target: THREE.Vector3; update: () => void } | null>(null);

  const selectedAddr =
    (selectedEntity?.type === "wallet" || selectedEntity?.type === "contract") ? selectedEntity.id : null;
  const selectedRef = useRef<string | null>(selectedAddr);
  selectedRef.current = selectedAddr;

  const flashingRef = useRef<Map<string, number>>(new Map());
  const birthRef = useRef<Map<string, number>>(new Map());
  const connectedRef = useRef<Set<string>>(new Set());
  const knownAddrsRef = useRef<Set<string>>(new Set());

  const connectedSet = useMemo(() => {
    const connected = new Set<string>();
    if (selectedAddr) {
      for (const tx of transactions) {
        if (tx.from === selectedAddr) connected.add(tx.to);
        else if (tx.to === selectedAddr) connected.add(tx.from);
      }
    }
    return connected;
  }, [selectedAddr, transactions]);
  connectedRef.current = connectedSet;

  const [activePulses, setActivePulses] = useState<number[]>([]);
  const lastPulseCountRef = useRef(0);

  interface StarBirthEffect {
    address: string;
    position: [number, number, number];
    colorIndex: number;
    size: number;
    startTime: number;
  }
  const [activeBirths, setActiveBirths] = useState<StarBirthEffect[]>([]);

  interface StarDeathEffect {
    id: number;
    position: [number, number, number];
    color: string;
    size: number;
    startTime: number;
  }
  const [activeDeaths, setActiveDeaths] = useState<StarDeathEffect[]>([]);
  const deathIdCounter = useRef(0);
  const lastDeathCountRef = useRef(0);
  const pushEffectsRef = useRef<PushEffect[]>([]);

  useFrame(() => {
    const pulses = blockPulseRef.current;
    if (pulses.length > lastPulseCountRef.current) {
      const newPulses = pulses.slice(lastPulseCountRef.current);
      lastPulseCountRef.current = pulses.length;
      setActivePulses((prev) => [...prev, ...newPulses]);
    }

    const deaths = deathQueueRef.current;
    if (deaths.length > lastDeathCountRef.current) {
      const newDeaths = deaths.slice(lastDeathCountRef.current);
      lastDeathCountRef.current = deaths.length;
      const effects: StarDeathEffect[] = newDeaths.map((d) => {
        const palette = PLANET_PALETTES[d.colorIndex % PLANET_PALETTES.length];
        return {
          id: deathIdCounter.current++,
          position: d.position,
          color: palette.aura,
          size: d.size,
          startTime: d.startTime,
        };
      });
      setActiveDeaths((prev) => [...prev, ...effects]);
      for (const d of newDeaths) {
        pushEffectsRef.current.push({
          origin: d.position,
          startTime: d.startTime,
          strength: 0.6,
        });
      }
    }

    const now = performance.now() * 0.001;
    if (pushEffectsRef.current.length > 0) {
      pushEffectsRef.current = pushEffectsRef.current.filter(
        (p) => now - p.startTime < PUSH_DURATION,
      );
    }
  });

  const handlePulseExpire = useCallback((startTime: number) => {
    setActivePulses((prev) => prev.filter((t) => t !== startTime));
  }, []);

  const seedStars = useMemo(
    () =>
      SEED_WALLETS.map((w) => ({
        ...w,
        position: clusteredPositions.get(w.address) ?? walletToPosition(w.address),
      })),
    [clusteredPositions],
  );

  const dynamicStars = useMemo(() => {
    const seedAddrs = new Set(SEED_WALLETS.map((w) => w.address));
    return Array.from(wallets.values())
      .filter((w) => !seedAddrs.has(w.address) && !w.isContract)
      .map((w) => ({
        address: w.address,
        position: clusteredPositions.get(w.address) ?? w.position,
        size: starSize(w.balance),
        colorIndex: w.registeredStar?.colorIndex ?? Math.abs(parseInt(w.address.slice(2, 4), 16)) % 4,
        brightness: starBrightness(w.balance),
        starName: w.registeredStar?.name,
        isRegistered: w.registeredStar?.exists ?? false,
      }));
  }, [wallets, clusteredPositions]);

  const contractWallets = useMemo(() => {
    return Array.from(wallets.values())
      .filter((w) => w.isContract)
      .map((w) => ({
        address: w.address,
        position: clusteredPositions.get(w.address) ?? w.position,
      }));
  }, [wallets, clusteredPositions]);

  const nebulaList = useMemo(
    () => Array.from(contractCreations.values()).map((cc) => ({
      ...cc,
      position: clusteredPositions.get(`contract:${cc.txHash}`) ?? cc.position,
    })),
    [contractCreations, clusteredPositions],
  );

  const handleNebulaSelect = useCallback(
    (txHash: string) => {
      selectContract(`contract:${txHash}`);
    },
    [selectContract],
  );

  useEffect(() => {
    const currentAddrs = new Set(dynamicStars.map((s) => s.address));
    for (const addr of knownAddrsRef.current) {
      if (!currentAddrs.has(addr)) knownAddrsRef.current.delete(addr);
    }

    const now = performance.now() * 0.001;
    const newBirths: StarBirthEffect[] = [];
    for (const star of dynamicStars) {
      if (!knownAddrsRef.current.has(star.address)) {
        knownAddrsRef.current.add(star.address);
        birthRef.current.set(star.address, now);
        newBirths.push({
          address: star.address,
          position: star.position,
          colorIndex: star.colorIndex,
          size: star.size,
          startTime: now,
        });
      }
    }
    if (newBirths.length > 0) {
      setActiveBirths((prev) => [...prev, ...newBirths]);
    }
  }, [dynamicStars]);

  const handleBeamComplete = useCallback(
    (hash: string, receiverAddress: string) => {
      flashingRef.current.set(receiverAddress, performance.now() * 0.001);
      promoteLiveTransaction(hash);
    },
    [promoteLiveTransaction],
  );

  const handleBirthExpire = useCallback((address: string) => {
    setActiveBirths((prev) => prev.filter((b) => b.address !== address));
  }, []);

  const handleDeathExpire = useCallback((id: number) => {
    setActiveDeaths((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const constellationVisible = introPhase === "whiteout" || introPhase === "ready";

  return (
    <>
      <OrbitControls
        ref={orbitRef as React.RefObject<never>}
        enabled={introPhase === "ready"}
        enablePan
        enableZoom
        enableRotate
        autoRotate={introPhase === "ready" && !cameraTarget}
        autoRotateSpeed={0.3}
        maxDistance={120}
        minDistance={5}
        zoomSpeed={0.5}
        enableDamping
        dampingFactor={0.05}
      />

      <CameraController orbitRef={orbitRef} introPhase={introPhase} />

      {/* Constellation content — hidden during intro, appears as camera zooms in */}
      <group visible={constellationVisible}>
        <ambientLight intensity={0.15} />
        <pointLight position={[0, 0, 0]} intensity={0.8} color="#4466ff" />
        <hemisphereLight args={["#334488", "#0a0a1a", 0.12]} />

        <StarField />

        {seedStars.map((star) => (
          <PulsingStar
            key={star.address}
            address={star.address}
            position={star.position}
            size={star.size}
            colorIndex={star.colorIndex}
            brightness={star.brightness}
            selectedRef={selectedRef}
            connectedRef={connectedRef}
            flashingRef={flashingRef}
            birthRef={birthRef}
            pushEffectsRef={pushEffectsRef}
            onSelect={selectWallet}
          />
        ))}

        {dynamicStars.map((star) => (
          <PulsingStar
            key={star.address}
            address={star.address}
            position={star.position}
            size={star.size}
            colorIndex={star.colorIndex}
            brightness={star.brightness}
            starName={star.starName}
            isRegistered={star.isRegistered}
            selectedRef={selectedRef}
            connectedRef={connectedRef}
            flashingRef={flashingRef}
            birthRef={birthRef}
            pushEffectsRef={pushEffectsRef}
            onSelect={selectWallet}
          />
        ))}

        {liveQueue.map((tx) => {
          const fromPos = clusteredPositions.get(tx.from) ?? wallets.get(tx.from)?.position ?? null;
          const toPos = clusteredPositions.get(tx.to) ?? (
            tx.to.startsWith("contract:")
              ? contractCreations.get(tx.to.slice(9))?.position
              : wallets.get(tx.to)?.position
          ) ?? null;

          if (!fromPos || !toPos) return null;
          return (
            <TransactionBeam
              key={tx.hash}
              from={fromPos}
              to={toPos}
              onComplete={() => handleBeamComplete(tx.hash, tx.to)}
            />
          );
        })}

        {nebulaList.map((cc) => (
          <Nebula
            key={cc.txHash}
            txHash={cc.txHash}
            identifier={`contract:${cc.txHash}`}
            position={cc.position}
            selectedRef={selectedRef}
            connectedRef={connectedRef}
            onSelect={handleNebulaSelect}
          />
        ))}

        {contractWallets.map((cw) => (
          <Nebula
            key={cw.address}
            txHash={cw.address}
            identifier={cw.address}
            position={cw.position}
            selectedRef={selectedRef}
            connectedRef={connectedRef}
            onSelect={() => selectContract(cw.address)}
          />
        ))}

        {activeBirths.map((birth) => {
          const palette = PLANET_PALETTES[birth.colorIndex % PLANET_PALETTES.length];
          return (
            <StarBirth
              key={birth.address}
              position={birth.position}
              colorInner={palette.coreLight}
              colorOuter={palette.aura}
              size={birth.size}
              startTime={birth.startTime}
              onExpire={() => handleBirthExpire(birth.address)}
            />
          );
        })}

        {activeDeaths.map((death) => (
          <StarDeath
            key={death.id}
            position={death.position}
            color={death.color}
            size={death.size}
            startTime={death.startTime}
            onExpire={() => handleDeathExpire(death.id)}
          />
        ))}

        {activePulses.map((startTime, i) => (
          <BlockPulse
            key={`${startTime}-${i}`}
            startTime={startTime}
            onExpire={() => handlePulseExpire(startTime)}
          />
        ))}

        <ConstellationLines />
        <FlowArrows />
      </group>

      <EffectComposer multisampling={0}>
        <Bloom
          intensity={1.8}
          luminanceThreshold={0.4}
          luminanceSmoothing={0.9}
          mipmapBlur
          levels={6}
        />
        <Vignette offset={0.5} darkness={0.5} />
      </EffectComposer>
    </>
  );
}
