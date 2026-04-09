"use client";

import { Suspense, useState, useRef, useCallback, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { GalaxyScene } from "./GalaxyScene";
import { IntroGalaxy } from "./IntroGalaxy";
import { GalaxyProvider } from "@/hooks/GalaxyProvider";
import { SearchBar } from "@/components/ui/SearchBar";
import { WalletButton } from "@/components/ui/WalletButton";
import { NavButtons } from "@/components/ui/NavButtons";
import { InfoModal } from "@/components/ui/InfoModal";
import { DetailPanel } from "@/components/ui/DetailPanel";
import { StatusBar } from "@/components/ui/StatusBar";
import { ActivityLog } from "@/components/ui/ActivityLog";
import { ErrorToast } from "@/components/ui/ErrorToast";
import { LiveBlocksWatcher } from "./LiveBlocksWatcher";
import { StarRegistryLoader } from "./StarRegistryLoader";

export type IntroPhase = "intro" | "zooming" | "whiteout" | "ready";

const INTRO_HOLD = 2.5;
const ZOOM_DURATION = 2.5;
const WHITEOUT_DURATION = 1.5;

const INTRO_POS = new THREE.Vector3(0, 7, 0);
const ZOOM_TARGET = new THREE.Vector3(0, 0, 0);
const CONSTELLATION_CAM = new THREE.Vector3(0, 15, 40);
const ORIGIN = new THREE.Vector3(0, 0, 0);

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function easeInQuad(t: number): number {
  return t * t;
}

function IntroCameraRig({
  phase,
  onPhaseChange,
}: {
  phase: IntroPhase;
  onPhaseChange: (p: IntroPhase) => void;
}) {
  const { camera } = useThree();
  const startTimeRef = useRef<number | null>(null);
  const introStartRef = useRef<number>(performance.now() * 0.001);
  const zoomFromRef = useRef(new THREE.Vector3());
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  useEffect(() => {
    camera.up.set(0, 0, -1);
    camera.position.copy(INTRO_POS);
    camera.lookAt(ORIGIN);
  }, [camera]);

  useFrame(() => {
    const now = performance.now() * 0.001;

    if (phaseRef.current === "intro") {
      const elapsed = now - introStartRef.current;

      camera.position.copy(INTRO_POS);
      camera.lookAt(ORIGIN);

      if (elapsed >= INTRO_HOLD) {
        startTimeRef.current = now;
        zoomFromRef.current.copy(camera.position);
        onPhaseChange("zooming");
      }
      return;
    }

    if (phaseRef.current === "zooming" && startTimeRef.current !== null) {
      const elapsed = now - startTimeRef.current;
      const raw = Math.min(elapsed / ZOOM_DURATION, 1);
      const t = easeInOutCubic(raw);

      camera.position.lerpVectors(zoomFromRef.current, ZOOM_TARGET, t);
      camera.lookAt(ORIGIN);

      if (raw >= 1) {
        onPhaseChange("whiteout");
      }
      return;
    }

    if (phaseRef.current === "whiteout") {
      camera.up.set(0, 1, 0);
      camera.position.copy(CONSTELLATION_CAM);
      camera.lookAt(new THREE.Vector3(0, 5, 0));
    }
  });

  return null;
}

export function GalaxyCanvas() {
  const [phase, setPhase] = useState<IntroPhase>("intro");
  const [galaxyOpacity, setGalaxyOpacity] = useState(1);
  const [whiteFlash, setWhiteFlash] = useState(0);

  const handlePhaseChange = useCallback((p: IntroPhase) => {
    setPhase(p);
  }, []);

  // Galaxy fades + white builds during zooming
  useEffect(() => {
    if (phase !== "zooming") return;
    const start = performance.now();
    let raf: number;
    const tick = () => {
      const elapsed = (performance.now() - start) / 1000;
      const t = Math.min(elapsed / ZOOM_DURATION, 1);

      // Galaxy fades out over the full zoom
      setGalaxyOpacity(1 - easeInOutCubic(t));

      // White flash builds in the last 40% of the zoom
      const flashT = t < 0.6 ? 0 : easeInQuad((t - 0.6) / 0.4);
      setWhiteFlash(flashT);

      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  // Whiteout: starts fully white, fades to transparent
  useEffect(() => {
    if (phase !== "whiteout") return;
    setWhiteFlash(1);
    setGalaxyOpacity(0);
    const start = performance.now();
    let raf: number;
    const tick = () => {
      const elapsed = (performance.now() - start) / 1000;
      const t = Math.min(elapsed / WHITEOUT_DURATION, 1);
      setWhiteFlash(1 - easeInOutCubic(t));
      if (t >= 1) {
        setPhase("ready");
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  const titleOpacity = phase === "intro" ? 1 : phase === "zooming" ? galaxyOpacity : 0;
  const showUI = phase === "ready";
  const showIntroGalaxy = phase === "intro" || phase === "zooming";

  return (
    <GalaxyProvider>
      <LiveBlocksWatcher />
      <StarRegistryLoader />

      {/* 3D Layer */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, background: "#0a0a1a" }}>
        <Canvas
          camera={{ position: [0, 7, 0], fov: 60, near: 0.1, far: 1000 }}
          dpr={[1, 1.5]}
          gl={{ antialias: false, alpha: false, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}
          style={{ width: "100%", height: "100%" }}
        >
          <color attach="background" args={["#0a0a1a"]} />

          {phase !== "ready" && (
            <IntroCameraRig phase={phase} onPhaseChange={handlePhaseChange} />
          )}

          <Suspense fallback={null}>
            {showIntroGalaxy && <IntroGalaxy opacity={galaxyOpacity} />}
            <GalaxyScene introPhase={phase} />
          </Suspense>
        </Canvas>
      </div>

      {/* White flash overlay */}
      {whiteFlash > 0 && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 15,
            backgroundColor: "#ffffff",
            opacity: whiteFlash,
            pointerEvents: "none",
          }}
        />
      )}

      {/* Title overlay during intro */}
      {(phase === "intro" || phase === "zooming") && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 20,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
            opacity: titleOpacity,
            transition: "opacity 0.3s ease",
          }}
        >
          <h1
            style={{
              fontFamily: "var(--font-inter), 'Inter', sans-serif",
              fontSize: "clamp(3rem, 8vw, 7rem)",
              fontWeight: 700,
              color: "#ffffff",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              textShadow:
                "0 0 40px rgba(0, 255, 170, 0.4), 0 0 80px rgba(0, 255, 170, 0.2), 0 0 120px rgba(68, 102, 255, 0.15)",
              margin: 0,
              transform: "translateY(-20vh)",
            }}
          >
            Constellation
          </h1>
        </div>
      )}

      {/* Top bar: search + wallet */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          opacity: showUI ? 1 : 0,
          pointerEvents: showUI ? "auto" : "none",
          transition: "opacity 0.6s ease",
        }}
        className="flex items-center gap-3 p-4"
      >
        <NavButtons />
        <SearchBar />
        <WalletButton />
        <InfoModal />
      </div>

      {/* Bottom status bar */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          opacity: showUI ? 1 : 0,
          pointerEvents: showUI ? "auto" : "none",
          transition: "opacity 0.6s ease",
        }}
      >
        <StatusBar />
      </div>

      {/* Live activity log (top-right) */}
      {showUI && <ActivityLog />}

      {/* Detail side panel */}
      {showUI && <DetailPanel />}

      {/* Error toast */}
      {showUI && <ErrorToast />}
    </GalaxyProvider>
  );
}
