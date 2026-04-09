<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Constellation — Project Conventions

Constellation is a 3D blockchain explorer where wallets are stars, transactions are beams of light, and blocks are cosmic pulses. Full spec lives in `docs/PLAN.md`.

## Stack

- **Framework:** Next.js 16 (App Router) + Tailwind v4
- **3D:** React Three Fiber + @react-three/drei + @react-three/postprocessing
- **Blockchain:** wagmi + viem + RainbowKit (Base Sepolia)
- **Animation:** Framer Motion (UI panels)
- **Fonts:** Inter (body, matches CDS default), system monospace (addresses/hashes)

## Directory Layout

| Path | Purpose |
|---|---|
| `src/components/galaxy/` | R3F 3D components (stars, beams, particles, camera) |
| `src/components/ui/` | HTML overlay UI (search bar, panels, status bar) |
| `src/components/shared/` | Reusable primitives (AddressChip, ValueDisplay, etc.) |
| `src/hooks/` | Custom React hooks |
| `src/lib/` | Pure utilities, chain config, contract ABIs, math |
| `src/types/` | TypeScript interfaces |
| `docs/PLAN.md` | Full project spec (read on-demand per phase) |

## Component Rules

- All 3D/R3F components **must** be `"use client"`.
- Galaxy components receive data via props or context — no direct RPC calls inside R3F.
- UI overlay components use the glassmorphic panel style (see Design Tokens below).

## Design Tokens

| Token | Value |
|---|---|
| Accent | `#00FFAA` |
| Accent hover | `#00DDBB` |
| Panel bg | `rgba(10, 10, 30, 0.7)` + `backdrop-blur(20px)` |
| Panel border | `1px solid rgba(255, 255, 255, 0.08)` |
| Panel shadow | `0 8px 32px rgba(0, 0, 0, 0.4)`, inset `0 1px 0 rgba(255, 255, 255, 0.05)` |
| Panel radius | `16px` |
| Text primary | `#FFFFFF` |
| Text secondary | `#888899` |
| Background | `#000000` to `#0a0a1a` |

Planet palettes (indexed 0-3): Lightest, Light, Medium, Darkest — four Coinbase blue gradients ordered light-to-dark, derived from the CDS `defaultTheme` dark spectrum blue hue. Each is a 5-color palette (`coreLight`, `coreMid`, `coreDeep`, `rim`, `aura`) defined in `src/types/index.ts` as `PLANET_PALETTES`. Stars use a GLSL marble shader with noise-driven swirl, Phong lighting, Fresnel rim glow, multi-layer transparent glow meshes, and an orbital ring.

## Post-Processing

- **Bloom:** intensity 1.8, luminanceThreshold 0.4, levels 6, mipmapBlur
- **Vignette:** subtle

## Key Algorithms

- `walletToPosition(address)` in `src/lib/galaxy-math.ts` — deterministic keccak256-based mapping from address to spherical coordinates (flat disk galaxy shape).
- `starBrightness(balance)` and `starSize(balance)` — also in `galaxy-math.ts`. Both use logarithmic scaling with a generous minimum so zero-balance wallets remain visible.

## Chain & Contract Config

- **Chain:** Base Sepolia (configured in `src/lib/chains.ts`)
- **StarRegistry ABI + address:** `src/lib/contracts.ts` (address is placeholder until deployed)
- **RPC:** wagmi default provider; WalletConnect project ID via `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`

## Build Phases

See `docs/PLAN.md` for full details on each phase.

1. **Galaxy Foundation** — R3F canvas, star field, bloom, orbit controls, test stars
2. **Blockchain Data** — wallet connect, search, RPC data, address-to-star, constellation lines
3. **Detail Panels** — wallet/tx/block panels, glassmorphic styling, Framer Motion
4. **Live Mode** — WebSocket block subscription, real-time beams, block pulse
5. **Smart Contract** — StarRegistry deployment, claim-your-star flow
6. **Final Polish** — seed data, loading states, error handling, deploy
