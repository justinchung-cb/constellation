"use client";

import { useCallback, useRef } from "react";

let sharedCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (sharedCtx && sharedCtx.state !== "closed") return sharedCtx;
  try {
    sharedCtx = new AudioContext();
  } catch {
    return null;
  }
  return sharedCtx;
}

/**
 * Plays a short crystalline "ping" — two layered sine oscillators with a
 * quick frequency sweep and exponential decay. Designed to feel cosmic and
 * unobtrusive, matching the space-explorer aesthetic.
 */
function playPing(ctx: AudioContext) {
  const now = ctx.currentTime;

  const master = ctx.createGain();
  master.gain.setValueAtTime(0.18, now);
  master.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
  master.connect(ctx.destination);

  // Primary tone — high crystalline note with downward sweep
  const osc1 = ctx.createOscillator();
  osc1.type = "sine";
  osc1.frequency.setValueAtTime(1800, now);
  osc1.frequency.exponentialRampToValueAtTime(900, now + 0.35);
  osc1.connect(master);
  osc1.start(now);
  osc1.stop(now + 0.45);

  // Harmonic overtone for shimmer
  const overtoneGain = ctx.createGain();
  overtoneGain.gain.setValueAtTime(0.08, now);
  overtoneGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
  overtoneGain.connect(ctx.destination);

  const osc2 = ctx.createOscillator();
  osc2.type = "sine";
  osc2.frequency.setValueAtTime(2600, now);
  osc2.frequency.exponentialRampToValueAtTime(1400, now + 0.2);
  osc2.connect(overtoneGain);
  osc2.start(now);
  osc2.stop(now + 0.25);
}

export function useTransactionSound() {
  const lastPlayRef = useRef(0);

  const play = useCallback(() => {
    const ctx = getAudioContext();
    if (!ctx) return;

    // Resume if suspended (browser autoplay policy)
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    // Throttle to at most one ping per 150ms to avoid stacking
    const now = performance.now();
    if (now - lastPlayRef.current < 150) return;
    lastPlayRef.current = now;

    playPing(ctx);
  }, []);

  return play;
}
