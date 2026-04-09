import { keccak256, toHex } from "viem";

export function walletToPosition(address: string): [number, number, number] {
  const hash = keccak256(toHex(address));
  const hexStr = hash.slice(2);

  const r = mapToRange(hexStr.slice(0, 8), 3, 22);
  const theta = mapToRange(hexStr.slice(8, 16), 0, Math.PI * 2);
  const phi = mapToRange(hexStr.slice(16, 24), -0.3, 0.3);

  return [
    r * Math.cos(theta) * Math.cos(phi),
    r * Math.sin(phi),
    r * Math.sin(theta) * Math.cos(phi),
  ];
}

/**
 * Builds a graph of wallet connections from transactions and shifts
 * positions toward the centroid of each connected cluster.
 * `pull` controls how much (0 = no clustering, 1 = collapse to centroid).
 * `extraPositions` are additional fixed positions (e.g. seed stars) that
 * participate in collision separation but are not themselves shifted.
 */
export function clusterPositions(
  wallets: Map<string, { address: string; position: [number, number, number] }>,
  transactions: { from: string; to: string }[],
  pull = 0.45,
  extraPositions: { key: string; pos: [number, number, number] }[] = [],
): Map<string, [number, number, number]> {
  const adj = new Map<string, Set<string>>();
  for (const tx of transactions) {
    const f = tx.from.toLowerCase();
    const t = tx.to.toLowerCase();
    if (!wallets.has(f) || !wallets.has(t)) continue;
    if (!adj.has(f)) adj.set(f, new Set());
    if (!adj.has(t)) adj.set(t, new Set());
    adj.get(f)!.add(t);
    adj.get(t)!.add(f);
  }

  const visited = new Set<string>();
  const clusters: string[][] = [];

  for (const addr of adj.keys()) {
    if (visited.has(addr)) continue;
    const cluster: string[] = [];
    const stack = [addr];
    while (stack.length > 0) {
      const cur = stack.pop()!;
      if (visited.has(cur)) continue;
      visited.add(cur);
      cluster.push(cur);
      const neighbors = adj.get(cur);
      if (neighbors) for (const n of neighbors) if (!visited.has(n)) stack.push(n);
    }
    if (cluster.length > 1) clusters.push(cluster);
  }

  const result = new Map<string, [number, number, number]>();

  for (const cluster of clusters) {
    let cx = 0, cy = 0, cz = 0;
    for (const addr of cluster) {
      const pos = wallets.get(addr)!.position;
      cx += pos[0]; cy += pos[1]; cz += pos[2];
    }
    cx /= cluster.length;
    cy /= cluster.length;
    cz /= cluster.length;

    for (const addr of cluster) {
      const pos = wallets.get(addr)!.position;
      result.set(addr, [
        pos[0] + (cx - pos[0]) * pull,
        pos[1] + (cy - pos[1]) * pull,
        pos[2] + (cz - pos[2]) * pull,
      ]);
    }
  }

  separateOverlaps(wallets, result, extraPositions);

  return result;
}

const MIN_SEPARATION = 3.0;
const SEPARATION_ITERATIONS = 10;

/**
 * Iterative relaxation: pushes overlapping stars apart so no two
 * are closer than MIN_SEPARATION. Mutates `overrides` in place and
 * adds entries for unclustered wallets that need nudging.
 * `extras` are additional positions (e.g. seed stars) that push dynamic
 * stars away but are themselves immovable.
 */
function separateOverlaps(
  wallets: Map<string, { address: string; position: [number, number, number] }>,
  overrides: Map<string, [number, number, number]>,
  extras: { key: string; pos: [number, number, number] }[] = [],
): void {
  const entries: { key: string; pos: [number, number, number]; fixed: boolean }[] = [];

  const extraKeys = new Set(extras.map((e) => e.key));
  for (const extra of extras) {
    entries.push({ key: extra.key, pos: [...extra.pos], fixed: true });
  }
  for (const [addr, w] of wallets) {
    if (extraKeys.has(addr)) continue;
    entries.push({ key: addr, pos: overrides.get(addr) ?? [...w.position], fixed: false });
  }

  if (entries.length < 2) return;

  for (let iter = 0; iter < SEPARATION_ITERATIONS; iter++) {
    for (let i = 0; i < entries.length; i++) {
      for (let j = i + 1; j < entries.length; j++) {
        const a = entries[i];
        const b = entries[j];
        if (a.fixed && b.fixed) continue;

        const dx = b.pos[0] - a.pos[0];
        const dy = b.pos[1] - a.pos[1];
        const dz = b.pos[2] - a.pos[2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist < MIN_SEPARATION && dist > 0.001) {
          const overlap = MIN_SEPARATION - dist;
          const nx = dx / dist;
          const ny = dy / dist;
          const nz = dz / dist;

          if (a.fixed) {
            b.pos[0] += nx * overlap;
            b.pos[1] += ny * overlap;
            b.pos[2] += nz * overlap;
          } else if (b.fixed) {
            a.pos[0] -= nx * overlap;
            a.pos[1] -= ny * overlap;
            a.pos[2] -= nz * overlap;
          } else {
            const half = overlap * 0.5;
            a.pos[0] -= nx * half;
            a.pos[1] -= ny * half;
            a.pos[2] -= nz * half;
            b.pos[0] += nx * half;
            b.pos[1] += ny * half;
            b.pos[2] += nz * half;
          }
        } else if (dist <= 0.001) {
          const jitter = 0.5 + Math.random() * 0.5;
          const target = b.fixed ? a : b;
          target.pos[0] += jitter;
          target.pos[2] += jitter;
        }
      }
    }
  }

  for (const entry of entries) {
    overrides.set(entry.key, entry.pos);
  }
}

function mapToRange(hex: string, min: number, max: number): number {
  const value = parseInt(hex, 16);
  const maxHex = 0xffffffff;
  return min + (value / maxHex) * (max - min);
}

export function starBrightness(balance: bigint): number {
  const eth = Number(balance) / 1e18;
  return 0.6 + Math.log1p(eth * 100) / Math.log1p(1e7) * 2.0;
}

const STAR_MIN = 0.5;
const STAR_MAX = 2.0;
const BALANCE_AMPLIFIER = 500;
const BALANCE_CAP = 10_000;

export function starSize(balance: bigint): number {
  const eth = Number(balance) / 1e18;
  const t = Math.log1p(eth * BALANCE_AMPLIFIER) / Math.log1p(BALANCE_CAP * BALANCE_AMPLIFIER);
  return STAR_MIN + (STAR_MAX - STAR_MIN) * Math.min(t, 1);
}
