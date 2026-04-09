"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const BEAM_DURATION = 2.2;
const TRAIL_COUNT = 8;
const SPARKLE_COUNT = 4;

const CORE_GEO = new THREE.SphereGeometry(0.1, 10, 10);
const GLOW_GEO = new THREE.SphereGeometry(0.28, 8, 8);
const HAZE_GEO = new THREE.SphereGeometry(0.65, 6, 6);
const TRAIL_GEO = new THREE.SphereGeometry(1, 6, 6);
const SPARKLE_GEO = new THREE.SphereGeometry(0.035, 4, 4);
const RING_GEO = new THREE.RingGeometry(0.3, 0.55, 24);
const RING2_GEO = new THREE.RingGeometry(0.2, 0.4, 24);
const FLASH_GEO = new THREE.SphereGeometry(0.25, 8, 8);

const _tempVec = new THREE.Vector3();

interface TransactionBeamProps {
  from: [number, number, number];
  to: [number, number, number];
  onComplete: () => void;
}

export function TransactionBeam({ from, to, onComplete }: TransactionBeamProps) {
  const progressRef = useRef(0);
  const completedRef = useRef(false);
  const impactPhase = useRef(-1);

  const coreRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const hazeRef = useRef<THREE.Mesh>(null);
  const trailRefs = useRef<(THREE.Mesh | null)[]>(new Array(TRAIL_COUNT).fill(null));
  const sparkleRefs = useRef<(THREE.Mesh | null)[]>(new Array(SPARKLE_COUNT).fill(null));
  const impactRingRef = useRef<THREE.Mesh>(null);
  const impactRing2Ref = useRef<THREE.Mesh>(null);
  const impactFlashRef = useRef<THREE.Mesh>(null);

  const sparkleOffsets = useMemo(
    () =>
      Array.from({ length: SPARKLE_COUNT }, () => ({
        theta: Math.random() * Math.PI * 2,
        phi: Math.random() * Math.PI,
        speed: 3 + Math.random() * 5,
        radius: 0.2 + Math.random() * 0.3,
      })),
    [],
  );

  const startVec = useMemo(() => new THREE.Vector3(...from), [from]);
  const endVec = useMemo(() => new THREE.Vector3(...to), [to]);

  const curve = useMemo(() => {
    const mid = startVec.clone().lerp(endVec, 0.5);
    const dist = startVec.distanceTo(endVec);
    const dir = endVec.clone().sub(startVec).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const perp = new THREE.Vector3().crossVectors(dir, up).normalize();
    if (perp.lengthSq() < 0.01) {
      perp.crossVectors(dir, new THREE.Vector3(1, 0, 0)).normalize();
    }
    mid.addScaledVector(up, dist * 0.25);
    mid.addScaledVector(perp, dist * 0.08);
    return new THREE.QuadraticBezierCurve3(startVec, mid, endVec);
  }, [startVec, endVec]);

  useFrame((_, delta) => {
    if (completedRef.current) return;

    const time = performance.now() * 0.001;

    // --- Impact phase ---
    if (impactPhase.current >= 0) {
      impactPhase.current += delta * 3.5;
      const s = impactPhase.current;

      if (impactRingRef.current) {
        impactRingRef.current.scale.setScalar(1 + s * 4);
        (impactRingRef.current.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.9 - s);
      }
      if (impactRing2Ref.current) {
        const s2 = Math.max(0, s - 0.15);
        impactRing2Ref.current.scale.setScalar(1 + s2 * 3);
        (impactRing2Ref.current.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.6 - s2);
      }
      if (impactFlashRef.current) {
        impactFlashRef.current.scale.setScalar(0.3 + s * 2.5);
        (impactFlashRef.current.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.7 - s * 0.9);
      }

      if (coreRef.current) coreRef.current.visible = false;
      if (glowRef.current) glowRef.current.visible = false;
      if (hazeRef.current) hazeRef.current.visible = false;
      for (let i = 0; i < SPARKLE_COUNT; i++) {
        if (sparkleRefs.current[i]) sparkleRefs.current[i]!.visible = false;
      }
      for (let i = 0; i < TRAIL_COUNT; i++) {
        const mesh = trailRefs.current[i];
        if (!mesh) continue;
        const mat = mesh.material as THREE.MeshBasicMaterial;
        mat.opacity *= 0.88;
        if (mat.opacity < 0.01) mesh.visible = false;
      }

      if (impactPhase.current >= 1) {
        completedRef.current = true;
        onComplete();
      }
      return;
    }

    // --- Main beam flight ---
    progressRef.current += delta / BEAM_DURATION;
    const t = Math.min(progressRef.current, 1);
    const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    curve.getPoint(eased, _tempVec);

    if (coreRef.current) {
      coreRef.current.position.copy(_tempVec);
      coreRef.current.scale.setScalar(1 + Math.sin(time * 18) * 0.25);
    }
    if (glowRef.current) {
      glowRef.current.position.copy(_tempVec);
      glowRef.current.scale.setScalar(1 + Math.sin(time * 10) * 0.3);
    }
    if (hazeRef.current) {
      hazeRef.current.position.copy(_tempVec);
      hazeRef.current.scale.setScalar(1 + Math.sin(time * 5) * 0.15);
    }

    for (let i = 0; i < TRAIL_COUNT; i++) {
      const mesh = trailRefs.current[i];
      if (!mesh) continue;

      const trailT = Math.max(0, eased - (i + 1) * 0.045);
      curve.getPoint(trailT, _tempVec);

      const wobbleX = Math.sin(time * 3.5 + i * 1.8) * 0.06;
      const wobbleY = Math.cos(time * 4.2 + i * 1.3) * 0.04;
      mesh.position.set(_tempVec.x + wobbleX, _tempVec.y + wobbleY, _tempVec.z + wobbleX * 0.5);

      const fade = 1 - i / TRAIL_COUNT;
      mesh.scale.setScalar(fade * 0.08 + 0.015);
      (mesh.material as THREE.MeshBasicMaterial).opacity = fade * 0.65;
    }

    for (let i = 0; i < SPARKLE_COUNT; i++) {
      const mesh = sparkleRefs.current[i];
      if (!mesh) continue;

      curve.getPoint(eased, _tempVec);
      const o = sparkleOffsets[i];
      const angle = time * o.speed + o.theta;
      mesh.position.set(
        _tempVec.x + Math.cos(angle) * Math.sin(o.phi + time * 0.7) * o.radius,
        _tempVec.y + Math.sin(angle) * o.radius * 0.8,
        _tempVec.z + Math.cos(angle + Math.PI * 0.5) * Math.cos(o.phi) * o.radius,
      );
      mesh.scale.setScalar(0.3 + Math.sin(time * 12 + i * 2.5) * 0.3);
    }

    if (t >= 1 && impactPhase.current < 0) {
      impactPhase.current = 0;
      if (impactRingRef.current) impactRingRef.current.position.copy(endVec);
      if (impactRing2Ref.current) impactRing2Ref.current.position.copy(endVec);
      if (impactFlashRef.current) impactFlashRef.current.position.copy(endVec);
    }
  });

  return (
    <group>
      <mesh ref={coreRef} geometry={CORE_GEO} position={from}>
        <meshBasicMaterial color="#FFFFFF" toneMapped={false} />
      </mesh>

      <mesh ref={glowRef} geometry={GLOW_GEO} position={from}>
        <meshBasicMaterial
          color="#0052FF"
          toneMapped={false}
          transparent
          opacity={0.55}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      <mesh ref={hazeRef} geometry={HAZE_GEO} position={from}>
        <meshBasicMaterial
          color="#3377FF"
          toneMapped={false}
          transparent
          opacity={0.1}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {Array.from({ length: TRAIL_COUNT }).map((_, i) => (
        <mesh
          key={`t${i}`}
          ref={(el) => { trailRefs.current[i] = el; }}
          geometry={TRAIL_GEO}
          position={from}
          scale={0.05}
        >
          <meshBasicMaterial
            color={i < 3 ? "#99BBFF" : "#0052FF"}
            toneMapped={false}
            transparent
            opacity={0.6}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}

      {Array.from({ length: SPARKLE_COUNT }).map((_, i) => (
        <mesh
          key={`s${i}`}
          ref={(el) => { sparkleRefs.current[i] = el; }}
          geometry={SPARKLE_GEO}
          position={from}
        >
          <meshBasicMaterial
            color="#FFFFFF"
            toneMapped={false}
            transparent
            opacity={0.85}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}

      <mesh ref={impactRingRef} geometry={RING_GEO} position={to} rotation={[Math.PI / 2, 0, 0]}>
        <meshBasicMaterial
          color="#0052FF"
          toneMapped={false}
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      <mesh ref={impactRing2Ref} geometry={RING2_GEO} position={to} rotation={[Math.PI * 0.35, Math.PI * 0.25, 0]}>
        <meshBasicMaterial
          color="#6699FF"
          toneMapped={false}
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      <mesh ref={impactFlashRef} geometry={FLASH_GEO} position={to}>
        <meshBasicMaterial
          color="#99BBFF"
          toneMapped={false}
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
