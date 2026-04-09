"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGalaxyStore } from "@/hooks/useGalaxyStore";

const MIN_WIDTH = 0.02;
const MAX_WIDTH = 0.12;
const ARROW_HEAD_LEN = 0.35;
const ARROW_HEAD_EXTRA = 2.0; // multiplier on shaft width
const SHAFT_PULL_BACK = 0.8; // stop shaft before star center

export function FlowArrows() {
  const { transactions, wallets, contractCreations, clusteredPositions, selectedEntity } =
    useGalaxyStore();

  const selectedAddr =
    selectedEntity?.type === "wallet" || selectedEntity?.type === "contract"
      ? selectedEntity.id
      : null;

  const arrows = useMemo(() => {
    if (!selectedAddr) return [];

    // Aggregate per counterparty: total value and tx count for sent/received
    const agg = new Map<
      string,
      { sentVal: bigint; recvVal: bigint; sentCount: number; recvCount: number }
    >();
    for (const tx of transactions) {
      const isSender = tx.from === selectedAddr;
      const isReceiver = tx.to === selectedAddr;
      if (!isSender && !isReceiver) continue;

      const counterparty = isSender ? tx.to : tx.from;
      const entry = agg.get(counterparty) ?? {
        sentVal: BigInt(0), recvVal: BigInt(0), sentCount: 0, recvCount: 0,
      };
      if (isSender) { entry.sentVal += tx.value; entry.sentCount++; }
      else { entry.recvVal += tx.value; entry.recvCount++; }
      agg.set(counterparty, entry);
    }

    if (agg.size === 0) return [];

    // Check if any tx has non-zero value — if not, fall back to tx count for sizing
    let hasValue = false;
    let maxVal = BigInt(0);
    let maxCount = 0;
    for (const { sentVal, recvVal, sentCount, recvCount } of agg.values()) {
      if (sentVal > BigInt(0) || recvVal > BigInt(0)) hasValue = true;
      if (sentVal > maxVal) maxVal = sentVal;
      if (recvVal > maxVal) maxVal = recvVal;
      if (sentCount > maxCount) maxCount = sentCount;
      if (recvCount > maxCount) maxCount = recvCount;
    }

    const selectedPos =
      clusteredPositions.get(selectedAddr) ?? wallets.get(selectedAddr)?.position;
    if (!selectedPos) return [];

    const result: {
      key: string;
      from: [number, number, number];
      to: [number, number, number];
      width: number;
    }[] = [];

    for (const [counterparty, { sentVal, recvVal, sentCount, recvCount }] of agg) {
      const cpPos =
        clusteredPositions.get(counterparty) ??
        (counterparty.startsWith("contract:")
          ? contractCreations.get(counterparty.slice(9))?.position
          : wallets.get(counterparty)?.position);
      if (!cpPos) continue;

      // Sent arrow: selectedAddr -> counterparty
      if (sentCount > 0) {
        const ratio = hasValue && maxVal > BigInt(0)
          ? Number(sentVal) / Number(maxVal)
          : sentCount / maxCount;
        const width = MIN_WIDTH + Math.max(ratio, 0.15) * (MAX_WIDTH - MIN_WIDTH);
        result.push({ key: `sent-${counterparty}`, from: selectedPos, to: cpPos, width });
      }

      // Received arrow: counterparty -> selectedAddr
      if (recvCount > 0) {
        const ratio = hasValue && maxVal > BigInt(0)
          ? Number(recvVal) / Number(maxVal)
          : recvCount / maxCount;
        const width = MIN_WIDTH + Math.max(ratio, 0.15) * (MAX_WIDTH - MIN_WIDTH);
        result.push({ key: `recv-${counterparty}`, from: cpPos, to: selectedPos, width });
      }
    }

    return result;
  }, [selectedAddr, transactions, wallets, contractCreations, clusteredPositions]);

  if (arrows.length === 0) return null;

  return (
    <>
      {arrows.map((a) => (
        <FlowArrow key={a.key} from={a.from} to={a.to} width={a.width} />
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// Single arrow: shaft (tapered cylinder) + cone head
// ---------------------------------------------------------------------------

function FlowArrow({
  from,
  to,
  width,
}: {
  from: [number, number, number];
  to: [number, number, number];
  width: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const matRef = useRef<THREE.MeshBasicMaterial>(null);

  const { dir, length, midpoint, quaternion } = useMemo(() => {
    const start = new THREE.Vector3(...from);
    const end = new THREE.Vector3(...to);
    const d = end.clone().sub(start);
    const len = d.length();
    d.normalize();

    const mid = start.clone().lerp(end, 0.5);
    const q = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      d,
    );

    return { dir: d, length: len, midpoint: mid, quaternion: q };
  }, [from, to]);

  // Pull shaft back so it doesn't poke through stars
  const shaftLen = Math.max(0.1, length - SHAFT_PULL_BACK * 2 - ARROW_HEAD_LEN);
  const headSize = ARROW_HEAD_LEN;

  // Offset shaft center along direction from the `from` star
  const shaftCenter = useMemo(() => {
    const start = new THREE.Vector3(...from);
    return start
      .clone()
      .addScaledVector(dir, SHAFT_PULL_BACK + shaftLen / 2);
  }, [from, dir, shaftLen]);

  // Arrow head sits at the end of the shaft
  const headCenter = useMemo(() => {
    const start = new THREE.Vector3(...from);
    return start
      .clone()
      .addScaledVector(dir, SHAFT_PULL_BACK + shaftLen + headSize / 2);
  }, [from, dir, shaftLen, headSize]);

  // Gentle pulse
  useFrame(() => {
    if (matRef.current) {
      const t = performance.now() * 0.001;
      matRef.current.opacity = 0.2 + Math.sin(t * 2) * 0.04;
    }
  });

  if (shaftLen <= 0.1) return null;

  return (
    <group ref={groupRef}>
      {/* Shaft */}
      <mesh position={shaftCenter} quaternion={quaternion}>
        <cylinderGeometry args={[width * 0.5, width * 0.5, shaftLen, 8, 1]} />
        <meshBasicMaterial
          ref={matRef}
          color="#0052FF"
          transparent
          opacity={0.2}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* Arrow head (cone) */}
      <mesh position={headCenter} quaternion={quaternion}>
        <coneGeometry
          args={[width * ARROW_HEAD_EXTRA * 0.5, headSize, 8]}
        />
        <meshBasicMaterial
          color="#0052FF"
          transparent
          opacity={0.28}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
