"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const PULSE_DURATION = 3.0;
const PARTICLE_COUNT = 60;
const SHOCKWAVE_GEO = new THREE.RingGeometry(0.92, 1, 32);
const FLASH_GEO = new THREE.SphereGeometry(1, 8, 8);

const EXPLOSION_VERTEX = /* glsl */ `
  attribute float aSize;
  attribute float aSpeed;
  attribute vec3 aDirection;

  uniform float uProgress;
  uniform float uMaxRadius;

  varying float vAlpha;

  void main() {
    float t = uProgress;

    float travel = t * aSpeed * uMaxRadius;
    vec3 pos = aDirection * travel;

    // Particles decelerate via easeOutQuad
    float fade = 1.0 - t;
    vAlpha = fade * fade;

    vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = aSize * (200.0 / -mvPos.z) * (1.0 - t * 0.5);
    gl_Position = projectionMatrix * mvPos;
  }
`;

const EXPLOSION_FRAGMENT = /* glsl */ `
  uniform vec3 uColorInner;
  uniform vec3 uColorOuter;
  uniform float uProgress;

  varying float vAlpha;

  void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    if (d > 0.5) discard;

    float soft = 1.0 - smoothstep(0.0, 0.5, d);
    vec3 color = mix(uColorInner, uColorOuter, uProgress);
    gl_FragColor = vec4(color, soft * vAlpha);
  }
`;

interface BlockPulseProps {
  startTime: number;
  onExpire: () => void;
}

export function BlockPulse({ startTime, onExpire }: BlockPulseProps) {
  const groupRef = useRef<THREE.Group>(null);
  const shockRef = useRef<THREE.Mesh>(null);
  const flashRef = useRef<THREE.Mesh>(null);
  const pointsRef = useRef<THREE.Points>(null);
  const expiredRef = useRef(false);

  const particleData = useMemo(() => {
    const dirs = new Float32Array(PARTICLE_COUNT * 3);
    const sizes = new Float32Array(PARTICLE_COUNT);
    const speeds = new Float32Array(PARTICLE_COUNT);
    const positions = new Float32Array(PARTICLE_COUNT * 3);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Random direction on a sphere
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      dirs[i * 3] = Math.sin(phi) * Math.cos(theta);
      dirs[i * 3 + 1] = Math.sin(phi) * Math.sin(theta);
      dirs[i * 3 + 2] = Math.cos(phi);

      sizes[i] = 1.5 + Math.random() * 4.0;
      speeds[i] = 0.4 + Math.random() * 0.8;
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aDirection", new THREE.BufferAttribute(dirs, 3));
    geo.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute("aSpeed", new THREE.BufferAttribute(speeds, 1));
    return geo;
  }, []);

  const particleUniforms = useRef({
    uProgress: { value: 0 },
    uMaxRadius: { value: 50 },
    uColorInner: { value: new THREE.Color("#FFFFFF") },
    uColorOuter: { value: new THREE.Color("#AABBCC") },
  }).current;

  useFrame(() => {
    if (expiredRef.current) return;

    const elapsed = performance.now() * 0.001 - startTime;
    const t = elapsed / PULSE_DURATION;

    if (t >= 1) {
      expiredRef.current = true;
      onExpire();
      return;
    }

    particleUniforms.uProgress.value = t;

    // Central flash: bright spike that fades fast
    if (flashRef.current) {
      const flashT = Math.min(t / 0.15, 1);
      const flashScale = 2 + flashT * 6;
      flashRef.current.scale.setScalar(flashScale);
      const mat = flashRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = (1 - flashT) * 0.9;
    }

    // Shockwave ring: expands with a delay, wider and brighter
    if (shockRef.current) {
      const shockDelay = 0.05;
      const shockT = Math.max(0, (t - shockDelay) / (1 - shockDelay));
      const eased = 1 - Math.pow(1 - shockT, 3);
      shockRef.current.scale.setScalar(eased * 80);
      const mat = shockRef.current.material as THREE.MeshBasicMaterial;
      const fade = shockT < 0.3 ? shockT / 0.3 : 1 - (shockT - 0.3) / 0.7;
      mat.opacity = fade * 0.3;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Central white flash */}
      <mesh ref={flashRef} geometry={FLASH_GEO}>
        <meshBasicMaterial
          color="#FFFFFF"
          toneMapped={false}
          transparent
          opacity={0.9}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Expanding shockwave ring */}
      <mesh
        ref={shockRef}
        rotation={[Math.PI / 2, 0, 0]}
        geometry={SHOCKWAVE_GEO}
      >
        <meshBasicMaterial
          color="#FFFFFF"
          toneMapped={false}
          transparent
          opacity={0.3}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Exploding particles */}
      <points ref={pointsRef} geometry={particleData}>
        <shaderMaterial
          vertexShader={EXPLOSION_VERTEX}
          fragmentShader={EXPLOSION_FRAGMENT}
          uniforms={particleUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}
