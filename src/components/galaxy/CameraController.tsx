"use client";

import { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useGalaxyStore } from "@/hooks/useGalaxyStore";

const LERP_SPEED = 3;
const ARRIVE_THRESHOLD = 0.5;

export function CameraController({
  orbitRef,
  introPhase = "ready",
}: {
  orbitRef: React.RefObject<{ target: THREE.Vector3; update: () => void } | null>;
  introPhase?: "intro" | "zooming" | "whiteout" | "ready";
}) {
  const { cameraTarget } = useGalaxyStore();
  const { camera } = useThree();
  const isFlying = useRef(false);
  const targetPos = useRef(new THREE.Vector3(0, 15, 40));
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0));
  const pendingTarget = useRef(false);

  useEffect(() => {
    if (cameraTarget) {
      targetPos.current.set(...cameraTarget.position);
      targetLookAt.current.set(...cameraTarget.lookAt);
      if (introPhase === "ready") {
        isFlying.current = true;
      } else {
        pendingTarget.current = true;
      }
    }
  }, [cameraTarget, introPhase]);

  useEffect(() => {
    if (introPhase === "ready" && pendingTarget.current) {
      pendingTarget.current = false;
      isFlying.current = true;
    }
  }, [introPhase]);

  useFrame((_, delta) => {
    if (!isFlying.current || !orbitRef.current) return;

    const alpha = 1 - Math.exp(-LERP_SPEED * delta);

    camera.position.lerp(targetPos.current, alpha);
    orbitRef.current.target.lerp(targetLookAt.current, alpha);
    orbitRef.current.update();

    const dist = camera.position.distanceTo(targetPos.current);
    if (dist < ARRIVE_THRESHOLD) {
      isFlying.current = false;
    }
  });

  return null;
}
