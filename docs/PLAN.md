# Constellation: The Visual Blockchain Explorer

## 1. Vision & Elevator Pitch

Constellation is a blockchain explorer reimagined as a living, breathing 3D galaxy. Instead of boring tables and hash strings, every wallet is a star, every transaction is a beam of light traveling between stars, and every block is a pulse that ripples through the cosmos. It combines the full utility of a blockchain explorer with a visually stunning 3D interface that makes onchain data feel alive.

> "What if Etherscan was designed by NASA?"

## 2. Core Concept

Traditional blockchain explorers present data as rows in a table. Constellation transforms that same data into a spatial, visual experience:

| Traditional Explorer | Constellation |
|---|---|
| Wallet address as hex string | A glowing star in 3D space |
| Transaction list in a table | Animated light beam between two stars |
| Block number and timestamp | A cosmic pulse/ripple that propagates through the galaxy |
| Token balance as a number | Star size and brightness |
| Transaction volume | Thickness and color intensity of constellation lines |
| Contract interactions | Orbital rings around a star |
| Search bar for addresses | Click a star or search to zoom into it |
| Gas fees | Particle trail density on transaction beams |

## 3. User Flows

### Flow 1: Landing Experience (The "Woah" Moment)

```
User opens app
    → Camera slowly drifts through a dark galaxy
    → Stars (wallets) gently pulse and float
    → Occasional transaction beams shoot between stars
    → Ambient particle field fills the background
    → Soft glow effects, lens flare, bloom
    → Search bar and "Connect Wallet" float in glassmorphic UI overlay
    → User is immediately captivated
```

### Flow 2: Explore a Wallet (Star Deep-Dive)

```
User searches a wallet address OR clicks a star
    → Camera smoothly zooms in toward that star
    → Star grows larger, reveals detail:
        - Name/ENS if available
        - Token balance shown as orbiting rings
        - Recent transactions shown as light trails going to/from other stars
    → Side panel slides in with traditional explorer data:
        - Address
        - Balance (ETH/NEO)
        - Token holdings
        - Transaction history (scrollable list)
        - Each transaction row is ALSO highlighted as a beam in the 3D view
    → User can click a transaction → camera follows the beam to the other wallet
```

### Flow 3: Connect Your Wallet (Become a Star)

```
User clicks "Connect Wallet"
    → RainbowKit modal opens
    → Wallet connects
    → Camera zooms to the user's star (creates one if first time)
    → User's star has a special glow/ring to distinguish it
    → Side panel shows YOUR data: balance, transactions, tokens
    → Optional: "Register" onchain to claim your star permanently
        (writes to a simple smart contract)
    → Star gets a custom color or constellation badge after registration
```

### Flow 4: Explore a Transaction

```
User clicks a transaction (from list or from a beam in 3D)
    → Camera positions to show both sender and receiver stars
    → A detailed beam animation replays the transaction
    → Info overlay shows:
        - Tx hash
        - From → To
        - Value transferred
        - Gas used
        - Block number
        - Timestamp
    → User can click either wallet to navigate to that star
```

### Flow 5: Explore a Block (Cosmic Pulse)

```
User searches a block number or clicks "Latest Blocks"
    → A ripple/shockwave animates outward from the center
    → All transactions in that block light up simultaneously
    → Side panel shows:
        - Block number
        - Timestamp
        - Number of transactions
        - Miner/Validator
        - Gas used
        - Transaction list
    → Each transaction in the list is clickable → goes to Flow 4
```

### Flow 6: Live Mode (Real-Time Galaxy)

```
User toggles "Live Mode" ON
    → App subscribes to new blocks via WebSocket
    → Every new transaction appears as a NEW beam shooting across the galaxy
    → New wallets that appear for the first time = new stars born (with a sparkle animation)
    → Pulse ripples every time a new block is confirmed
    → Counter in corner shows: "Block #____" incrementing live
    → This is the DEMO SHOWSTOPPER — leave this running during presentation
```

## 4. Information Architecture

```
┌─────────────────────────────────────────────┐
│                 CONSTELLATION                │
│              Blockchain Explorer             │
├─────────────────────────────────────────────┤
│                                             │
│   ┌─────────────────────────────────────┐   │
│   │         3D GALAXY VIEWPORT          │   │
│   │                                     │   │
│   │    ★ ·  ·    ★        ·    ★       │   │
│   │      · ════════════ ·              │   │
│   │   ·    ★    ·    ★    ·    ★       │   │
│   │         ════════                    │   │
│   │    ★    ·   ★   ·    ★    ·        │   │
│   │                                     │   │
│   └─────────────────────────────────────┘   │
│                                             │
│   ┌──────────┐  ┌─────────────────────────┐ │
│   │ SEARCH   │  │ CONNECT WALLET  │ LIVE  │ │
│   │ BAR      │  │ BUTTON          │ TOGGLE│ │
│   └──────────┘  └─────────────────────────┘ │
│                                             │
│   ┌─────────────────────────────────────┐   │
│   │         DETAIL SIDE PANEL           │   │
│   │  (Slides in from right)             │   │
│   │                                     │   │
│   │  Context-dependent:                 │   │
│   │  - Wallet details                   │   │
│   │  - Transaction details              │   │
│   │  - Block details                    │   │
│   │  - Token list                       │   │
│   │  - Traditional table data           │   │
│   │                                     │   │
│   └─────────────────────────────────────┘   │
│                                             │
│   ┌─────────────────────────────────────┐   │
│   │         BOTTOM STATUS BAR           │   │
│   │  Latest Block: #XXXXX | TPS: XX    │   │
│   │  Connected Wallets: XX | Gas: XX   │   │
│   └─────────────────────────────────────┘   │
│                                             │
└─────────────────────────────────────────────┘
```

## 5. Technical Architecture

### 5.1 Stack

```
Frontend:
├── Next.js (App Router)
├── React Three Fiber (3D rendering)
├── Three.js (underlying 3D engine)
├── @react-three/drei (helpers: OrbitControls, Stars, etc.)
├── @react-three/postprocessing (Bloom, glow effects)
├── Framer Motion (UI panel animations)
├── Tailwind CSS (glassmorphic UI overlay)
├── wagmi + RainbowKit (wallet connection)
├── viem (blockchain data reading)
└── Deployed on Vercel

Blockchain Data:
├── Base RPC / NEO RPC for reading chain data
├── WebSocket provider for live block/tx subscription
├── Optional: Alchemy/Infura enhanced APIs for richer data
└── Simple smart contract for "star registration"

Smart Contract (Minimal):
├── StarRegistry.sol
│   ├── registerStar(string name, uint8 color)
│   ├── getStarInfo(address wallet) → (name, color, timestamp)
│   └── getAllStars() → address[]
└── Deployed on Base/NEO testnet or mainnet
```

### 5.2 Component Tree

```
app/
├── layout.tsx                    # Root layout, fonts, providers
├── page.tsx                      # Main page, composes everything
├── providers.tsx                 # Wagmi, RainbowKit, QueryClient providers
│
├── components/
│   ├── galaxy/
│   │   ├── GalaxyCanvas.tsx      # Main R3F Canvas wrapper
│   │   ├── GalaxyScene.tsx       # Scene setup: lights, camera, controls
│   │   ├── StarField.tsx         # Background ambient particles
│   │   ├── WalletStar.tsx        # Individual wallet = star mesh
│   │   ├── TransactionBeam.tsx   # Animated beam between two stars
│   │   ├── BlockPulse.tsx        # Ripple animation for new blocks
│   │   ├── ConstellationLines.tsx # Persistent lines between connected wallets
│   │   └── CameraController.tsx  # Smooth camera transitions/zoom
│   │
│   ├── ui/
│   │   ├── SearchBar.tsx         # Glassmorphic search input
│   │   ├── WalletButton.tsx      # Connect wallet button
│   │   ├── LiveToggle.tsx        # Toggle live mode on/off
│   │   ├── StatusBar.tsx         # Bottom bar with network stats
│   │   ├── DetailPanel.tsx       # Slide-in right panel (polymorphic)
│   │   ├── WalletDetail.tsx      # Wallet info for detail panel
│   │   ├── TransactionDetail.tsx # Transaction info for detail panel
│   │   ├── BlockDetail.tsx       # Block info for detail panel
│   │   └── TransactionList.tsx   # Scrollable tx list (traditional format)
│   │
│   └── shared/
│       ├── AddressChip.tsx       # Truncated address with copy button
│       ├── ValueDisplay.tsx      # ETH/token value with formatting
│       └── LoadingSpinner.tsx    # Cosmic-themed loading indicator
│
├── hooks/
│   ├── useBlockchainData.ts     # Fetch wallet/tx/block data
│   ├── useLiveBlocks.ts         # WebSocket subscription to new blocks
│   ├── useGalaxyPositions.ts    # Algorithm to position stars in 3D space
│   ├── useStarRegistry.ts      # Read/write to StarRegistry contract
│   └── useCameraNavigation.ts  # Imperative camera control
│
├── lib/
│   ├── contracts.ts             # Contract ABIs and addresses
│   ├── chains.ts                # Chain configuration (Base/NEO)
│   ├── utils.ts                 # Address truncation, formatting
│   └── galaxy-math.ts           # Position hashing, orbit calculations
│
├── types/
│   └── index.ts                 # TypeScript interfaces
│
└── contracts/
    └── StarRegistry.sol         # Solidity smart contract
```

### 5.3 Key Technical Details

#### Star Positioning Algorithm

Every wallet address needs a deterministic 3D position so the same wallet always appears in the same place:

```
function walletToPosition(address: string): [x, y, z] {
    // Hash the address to get deterministic pseudo-random values
    const hash = keccak256(address)

    // Use different segments of the hash for x, y, z
    // Map to spherical coordinates for a galaxy-like distribution
    const r = mapToRange(hash.slice(0, 8), 5, 50)      // distance from center
    const theta = mapToRange(hash.slice(8, 16), 0, 2pi) // horizontal angle
    const phi = mapToRange(hash.slice(16, 24), -0.3, 0.3) // vertical (flat galaxy)

    return [
        r * cos(theta) * cos(phi),
        r * sin(phi),              // small y = flat disk shape
        r * sin(theta) * cos(phi)
    ]
}
```

This ensures:
- Same address = same position every time
- Galaxy has a disk/spiral shape (small y-range)
- Wallets are spread out and don't overlap

#### Star Visual Properties

```
Star brightness = log(balance + 1) * multiplier
Star size       = clamp(transactionCount / 100, 0.1, 2.0)
Star color      = determined by address hash (or custom if registered)
Star pulse rate = recent activity frequency
Orbital rings   = one per unique token held
```

#### Transaction Beam Animation

```
A beam is a line/tube geometry between two star positions.
Animation:
1. A point of light spawns at sender star
2. Travels along the line to receiver star (duration ~1.5s)
3. Receiver star pulses/glows on arrival
4. Line fades to a dim persistent constellation line
5. Line opacity = recency (newer = brighter, old = dim)
```

## 6. Smart Contract

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract StarRegistry {
    struct Star {
        string name;          // Display name for the star
        uint8 colorIndex;     // 0-7 for predefined color palette
        uint256 registeredAt; // Block timestamp
        bool exists;          // Whether this star is registered
    }

    mapping(address => Star) public stars;
    address[] public registeredAddresses;

    event StarRegistered(
        address indexed wallet,
        string name,
        uint8 colorIndex,
        uint256 timestamp
    );

    event StarUpdated(
        address indexed wallet,
        string name,
        uint8 colorIndex
    );

    function registerStar(string calldata _name, uint8 _colorIndex) external {
        require(_colorIndex < 8, "Invalid color index");
        require(!stars[msg.sender].exists, "Star already registered");
        require(bytes(_name).length > 0 && bytes(_name).length <= 32, "Invalid name");

        stars[msg.sender] = Star({
            name: _name,
            colorIndex: _colorIndex,
            registeredAt: block.timestamp,
            exists: true
        });

        registeredAddresses.push(msg.sender);

        emit StarRegistered(msg.sender, _name, _colorIndex, block.timestamp);
    }

    function updateStar(string calldata _name, uint8 _colorIndex) external {
        require(stars[msg.sender].exists, "Star not registered");
        require(_colorIndex < 8, "Invalid color index");
        require(bytes(_name).length > 0 && bytes(_name).length <= 32, "Invalid name");

        stars[msg.sender].name = _name;
        stars[msg.sender].colorIndex = _colorIndex;

        emit StarUpdated(msg.sender, _name, _colorIndex);
    }

    function getStarInfo(address _wallet) external view returns (
        string memory name,
        uint8 colorIndex,
        uint256 registeredAt,
        bool exists
    ) {
        Star memory star = stars[_wallet];
        return (star.name, star.colorIndex, star.registeredAt, star.exists);
    }

    function getAllRegisteredAddresses() external view returns (address[] memory) {
        return registeredAddresses;
    }

    function getRegisteredCount() external view returns (uint256) {
        return registeredAddresses.length;
    }
}
```

## 7. UI/Visual Design Spec

### Color Palette

```
Background:         #000000 → #0a0a1a (deep space black/navy)

Transaction beams:  #00FFAA → #FFFFFF (teal-white gradient)
Block pulse:        #FFFFFF at 10% opacity, expanding ring
Constellation lines:#FFFFFF at 5-15% opacity

UI Overlay:
  Panel background:  rgba(10, 10, 30, 0.8) + backdrop-blur(20px)
  Border:            rgba(255, 255, 255, 0.1)
  Text primary:      #FFFFFF
  Text secondary:    #888899
  Accent:            #00FFAA
  Accent hover:      #00DDBB
```

### Planet / Wallet-Star Orb Design

Each wallet star is rendered as a marble-textured planet with four visual layers:

| Layer                  | Description                                          |
|------------------------|------------------------------------------------------|
| **Core sphere**        | Fluid marble interior (3-D value noise through a 3-stop color ramp) with Phong lighting (diffuse + specular) and animated swirl |
| **Rim / specular**     | Fresnel-based rim glow using the palette's `rim` color; Blinn-Phong specular highlight on upper-left |
| **Inner aura**         | Transparent sphere at 2× radius using the `aura` color |
| **Outer halo**         | Transparent sphere at 4× radius using the `coreDeep` color; bloom post-processing spreads this further |
| **Orbital energy ring**| Thin torus at 1.8× radius, tilted per-address, slowly rotating |

**8 Planet Palettes** (defined in `src/types/index.ts` as `PLANET_PALETTES`):

```
  #  Name            coreLight   coreMid     coreDeep    rim         aura
  0  Nebula Rose     #FF6EC7     #CC33FF     #220066     #88DDFF     #4466FF
  1  Solar Flare     #FFD066     #FF8C00     #331800     #FFEEAA     #FF8844
  2  Blue Giant      #66DDFF     #0088FF     #001144     #AAFFFF     #2266FF
  3  Red Dwarf       #FF6666     #CC2244     #220011     #FFAAAA     #FF4466
  4  Emerald Pulse   #66FFAA     #00CC66     #002211     #AAFFDD     #22FF88
  5  Void Shard      #BB66FF     #7700EE     #110022     #DD99FF     #6633FF
  6  Inferno         #FFAA44     #FF5500     #221100     #FFCC88     #FF6622
  7  Frost Crystal   #AADDFF     #4488FF     #001133     #DDFFFF     #4466CC
```

**GLSL Shader Summary:**
- Vertex: passes object-space position (for noise), view-space normal, world view direction
- Fragment: 3-D value noise → marble function (sin distortion) → 3-stop color ramp
  (coreDeep → coreMid → coreLight), Lambertian wrap diffuse, Blinn-Phong specular,
  Fresnel rim glow, emissive self-illumination
- Each star gets a unique `uSeed` vec3 derived from its position for varied marble patterns

**Bloom Post-Processing:**
- intensity: 1.8, luminanceThreshold: 0.4, levels: 6, mipmapBlur
- Handles the atmospheric halo spread beyond the explicit glow meshes

### Glassmorphic UI Style

```css
.glass-panel {
    background: rgba(10, 10, 30, 0.7);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 16px;
    box-shadow:
        0 8px 32px rgba(0, 0, 0, 0.4),
        inset 0 1px 0 rgba(255, 255, 255, 0.05);
}
```

### Post-Processing Effects (React Three Fiber)

```
- Bloom: intensity 1.5, luminanceThreshold 0.6
  (makes bright stars glow, beams glow)
- Vignette: subtle darkening at screen edges
- ChromaticAberration: very subtle, 0.002 offset
  (gives a cinematic feel)
```

### Typography

```
Font: "Space Grotesk" (Google Fonts)
Monospace (addresses, hashes): "JetBrains Mono"
```

## 8. Data Flow Architecture

```
┌──────────────────────────────────────────────┐
│                   USER INPUT                  │
│  (Search address, click star, connect wallet) │
└──────────────────┬───────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────┐
│              REACT STATE LAYER                │
│                                              │
│  selectedEntity: {                           │
│    type: 'wallet' | 'transaction' | 'block'  │
│    id: string (address / txHash / blockNum)   │
│  }                                           │
│                                              │
│  galaxyData: {                               │
│    wallets: Map<address, WalletNode>         │
│    transactions: TransactionEdge[]           │
│    liveQueue: NewTransaction[]               │
│  }                                           │
│                                              │
│  cameraTarget: {                             │
│    position: [x, y, z]                       │
│    lookAt: [x, y, z]                         │
│  }                                           │
└──────────┬───────────────┬───────────────────┘
           │               │
     ┌─────▼─────┐  ┌─────▼──────┐
     │  3D LAYER  │  │  UI LAYER   │
     │ (R3F)      │  │ (HTML/CSS)  │
     │            │  │             │
     │ Stars      │  │ SearchBar   │
     │ Beams      │  │ DetailPanel │
     │ Particles  │  │ StatusBar   │
     │ Camera     │  │ WalletBtn   │
     └────────────┘  └─────────────┘
           │
     ┌─────▼───────────────────────┐
     │      DATA FETCHING LAYER     │
     │                             │
     │  RPC Calls (viem):          │
     │  - getBalance               │
     │  - getTransactionCount      │
     │  - getBlock                 │
     │  - getTransaction           │
     │  - getBlockTransactions     │
     │                             │
     │  WebSocket:                 │
     │  - watchBlocks              │
     │  - watchPendingTransactions │
     │                             │
     │  Contract Reads:            │
     │  - StarRegistry.getAllStars │
     │  - StarRegistry.getStarInfo│
     └─────────────────────────────┘
```

## 9. Implementation Priority (Build Plan)

### Phase 1: The Galaxy Foundation -- CRITICAL

- Next.js project setup with Tailwind
- React Three Fiber canvas with:
  - Background star field (drei Stars component)
  - OrbitControls (mouse drag to rotate galaxy)
  - Post-processing: Bloom effect
  - 20-30 hardcoded test stars (glowing spheres)
  - Basic animation (stars pulsing gently)
- Deploy to Vercel

**Checkpoint:** Beautiful spinning galaxy. Already demo-worthy.

### Phase 2: Blockchain Data to Stars -- CRITICAL

- Wallet connection (wagmi + RainbowKit)
- Search bar UI (glassmorphic, floating over galaxy)
- Fetch wallet data via RPC: getBalance, getTransactionCount
- Convert address to 3D position (hashing algorithm)
- When searching an address:
  - Star appears at calculated position
  - Camera smoothly zooms to it
  - Side panel shows wallet data
- Fetch recent transactions for that wallet
- For each transaction, plot the counterparty as another star
- Draw constellation lines between them

**Checkpoint:** Search a wallet and see its transaction network as stars.

### Phase 3: Polish & Detail Panels -- IMPORTANT

- Detail panel with proper formatting:
  - Wallet view: address, balance, tx count, tx list
  - Transaction view: hash, from, to, value, gas, block
  - Block view: number, timestamp, tx count, tx list
- Click a star to navigate to that wallet
- Click a transaction in the list to show that tx detail
- Glassmorphic styling on all panels
- Framer Motion animations on panel open/close
- Bottom status bar: latest block, network name
- Address truncation + copy button

**Checkpoint:** Fully functional explorer with beautiful UI.

### Phase 4: Live Mode -- DEMO WOW FACTOR

- WebSocket subscription to new blocks
- When new block arrives:
  - Block pulse ripple animation
  - Fetch transactions in that block
  - Animate beams shooting between wallet stars
  - New wallets = new stars with birth animation
- Live transaction counter
- Toggle to turn live mode on/off

**Checkpoint:** Galaxy is ALIVE. Transactions happening in real-time.

### Phase 5: Smart Contract Integration -- NICE TO HAVE

- Deploy StarRegistry contract to Base testnet
- "Claim Your Star" button when wallet connected
- Pick a name and color, write to contract
- Registered stars show name label + custom color
- Read all registered stars on load with special highlighting

**Checkpoint:** Onchain component complete. Full app done.

### Phase 6: Final Polish -- DEMO PREP

- Loading states (cosmic spinner)
- Error handling (graceful failures)


## 10. Demo Script (3-4 Minutes)

```
[0:00 - 0:30] THE HOOK
"This is Constellation — a blockchain explorer that turns onchain data
into a living galaxy."
→ Show the landing page: stunning 3D galaxy spinning slowly
→ Stars twinkling, ambient particles, bloom effects
→ "Every star you see represents a wallet on the blockchain."

[0:30 - 1:15] EXPLORE A WALLET
"Let me show you how it works."
→ Type a well-known wallet address into the search bar
→ Camera zooms smoothly toward a star
→ Star grows, detail panel slides in
→ "You can see the balance, transaction count, and full history."
→ "Notice the constellation lines — each one is a transaction
   connecting this wallet to others."
→ Click on a connected star → camera flies to it
→ "You can navigate the entire transaction graph visually."

[1:15 - 2:00] CONNECT & REGISTER
"But the real magic is when you become part of the galaxy."
→ Click Connect Wallet → connect with MetaMask/Rainbow
→ "There's my star!"
→ Camera zooms to your star
→ Click "Claim Your Star" → pick name "Supernova" and color blue
→ Confirm transaction
→ Star transforms with custom color and name label
→ "Now I'm permanently part of the constellation."

[2:00 - 2:45] LIVE MODE
"Now let me show you Live Mode."
→ Toggle Live Mode ON
→ "We're now watching the blockchain in real-time."
→ Wait for a block...
→ A pulse ripple expands outward
→ Transaction beams shoot across the galaxy
→ New stars appear with sparkle animation
→ "Every beam is a real transaction happening right now.
   Every new star is a wallet interacting for the first time."
→ Let it run for a few seconds — mesmerizing

[2:45 - 3:15] TRADITIONAL EXPLORER
"And you still get everything a traditional explorer gives you."
→ Show the detail panel with full tx data
→ Click a transaction → show hash, value, gas, block
→ Search a block number → show block details with tx list
→ "It's a fully functional blockchain explorer —
   it just happens to look like the cosmos."

[3:15 - 3:30] CLOSE
"Constellation. Built on Base.
Explore the blockchain like you've never seen it before."
→ Camera slowly pulls back to show the full galaxy
→ Fade to logo
```

## 11. Fallback / Simplification Strategies

| Priority | What to Cut | Impact |
|---|---|---|
| Cut last | Smart contract registration | Lose "claim your star" but explorer still works |
| Cut 5th | Live mode | Lose the wow factor but core explorer works |
| Cut 4th | Block exploration | Just focus on wallets and transactions |
| Cut 3rd | Transaction detail view | Show tx list but don't let users click into them |
| Cut 2nd | Real blockchain data | Use HARDCODED fake data. The visual still looks amazing |
| Cut first | Nothing else | If you have the galaxy + hardcoded stars, you have a demo |

**The nuclear option:** If blockchain RPC calls are failing or slow, hardcode everything. Pre-fetch data for 20 interesting wallets, store as JSON, render from that. Nobody will know during a 3-minute demo. The visual IS the product.

## 12. Key Libraries & Code Snippets

Key drei components to use:
- `<Stars />` -- instant background star field
- `<OrbitControls />` -- mouse-drag camera rotation
- `<Float />` -- make things bob gently
- `<Billboard />` -- text labels always face camera
- `<Line />` -- draw lines between points (constellation lines)
- `<Sphere />` -- basic star mesh

Key postprocessing:
- `<Bloom />` -- makes bright things glow
- `<Vignette />` -- cinematic dark edges
