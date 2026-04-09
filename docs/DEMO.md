# Constellation Demo Video Script

## Pre-Recording Checklist

- Clear localStorage (`Reset Data` in status bar, or DevTools) so the intro and loading screen play fresh
- MetaMask/Rainbow wallet ready on Base Sepolia with a small ETH balance
- Have 2-3 addresses ready to paste (your own wallet, a known active address, a contract address)
- Have a transaction hash ready from a recent Base Sepolia tx
- Screen resolution: 1920x1080 or higher; browser in full screen (F11)
- Close DevTools and any browser extensions that overlay UI
- Sound ON -- transaction ping adds polish; make sure system audio is captured

---

## Scene 1: The Hook -- Loading and Intro (0:00 - 0:35)

**What to show:** The very first page load experience.

1. Open the app URL -- the Cosmic Spinner appears immediately (three orbiting rings, pulsing core, "Entering the galaxy..." text)
2. Spinner fades, intro sequence begins:
   - Spiral particle galaxy fills the screen (200k particles, blue gradient, slowly rotating)
   - Large "CONSTELLATION" title with green/blue glow, centered
   - Hold for ~2.5s, then camera dives into the galaxy center
   - Galaxy fades, white flash builds
   - Flash clears to reveal the main constellation view -- stars, bloom, vignette, starfield backdrop
3. UI fades in: search bar, wallet button, status bar, info button

**Voiceover:** "This is Constellation -- a blockchain explorer that turns on-chain data into a living galaxy. Every star is a wallet. Every line is a transaction. Every pulse is a new block."

---

## Scene 2: Explore a Wallet (0:35 - 1:30)

**What to show:** Search, camera navigation, detail panel, constellation lines.

1. Click the search bar, paste a wallet address -- note the loading spinner in the search field
2. Camera smoothly flies to the star -- it brightens, other unrelated stars hide
3. Detail panel slides in from the right:
   - Address with copy button
   - ETH balance
   - Token holdings (if any, with expandable list)
   - Total transactions count
   - Recent activity (sent/received, counterparty chips, ETH amounts)
   - Connected Stars and Connected Nebulae lists
4. Point out the constellation lines -- "These lines connect this wallet to every wallet it has transacted with. This is Focus Mode -- only relevant connections are shown."
5. Click a connected star in the detail panel or directly in the 3D view -- camera flies to the new star, panel updates
6. Show Back/Forward buttons working to navigate history
7. Search a transaction hash -- panel switches to Transaction Detail (hash, status, from/to, value, gas, block number, timestamp)

**Voiceover:** "Search any address or transaction hash. The camera flies you straight to it. You get full explorer data -- balance, tokens, transaction history -- but presented as a living constellation."

---

## Scene 3: Connect Your Wallet (1:30 - 2:20)

**What to show:** Wallet connection, your star appearing, Claim Your Star flow.

1. Click Connect Wallet button (blue glass icon, top right)
2. RainbowKit modal opens -- connect with MetaMask
3. Button changes to show green dot + truncated address
4. Your wallet data loads, camera flies to your star -- a Star Birth animation plays (expanding rings + particles in your star's color)
5. Detail panel shows your wallet data with a golden "Claim Your Star" button
6. Click Claim Your Star -- the ClaimStarModal opens:
   - Type a star name (e.g., "Polaris") -- show the 32-char counter
   - Browse the 8-color palette (Rose, Solar, Blue, Red, Emerald, Void, Inferno, Frost)
   - Click Register Star -- "Waiting for wallet..." then "Confirming..."
   - Success message appears, modal auto-closes
7. Star now has a floating name label ("Polaris") and a golden crown ring orbiting it
8. In the detail panel, the registered star card shows the name, color dot, and "Edit registration" link

**Voiceover:** "Connect your wallet and you become part of the galaxy. Claim your star on-chain -- pick a name and color. Now you are permanently part of the constellation."

> If StarRegistry contract is not deployed, skip steps 5-8 and mention the feature briefly.

---

## Scene 4: Live Mode -- The Wow Factor (2:20 - 3:20)

**What to show:** Real-time blockchain visualization.

1. Point out the Status Bar: latest block number updating, green RPC health dot, star/nebula/tx counts, Live toggle (should already be ON)
2. If Live is off, toggle it ON -- the switch animates, pulsing green dot appears
3. Wait for new blocks (Base Sepolia ~2s blocks):
   - Block pulse: expanding shockwave ring + central flash + particle spray from the galaxy center
   - Transaction beams: curved light beams shoot between stars (comet head with glow + particle trail + sparkles, then impact rings at destination)
   - Receiver star flashes on beam arrival
   - New stars appear with Star Birth animation if new addresses are seen
4. Show the Activity Log (top-right): live feed updating, showing from/to/value/time-ago for each tx; click a row to open its detail
5. Toggle sound ON if not already -- the transaction ping plays on each matched tx
6. Let it run for a few seconds to build visual density -- multiple beams crossing, pulses rippling
7. Briefly toggle Live OFF to show the switch and that beams/pulses stop

**Voiceover:** "Live Mode. Every pulse is a real block arriving on Base Sepolia. Every beam is a real transaction. Watch the blockchain breathe."

---

## Scene 5: Contracts and Nebulae (3:20 - 3:50)

**What to show:** Contract interactions as nebulae.

1. If a wallet has interacted with contracts, point out the Nebulae in the scene -- swirling particle clouds, distinct from star spheres
2. Click a nebula -- Contract Detail panel opens:
   - Address or creation tx hash
   - Type label (Contract Creation vs Smart Contract)
   - Deployer (for creations)
   - Interaction count, connected stars
3. Show constellation lines connecting the nebula to wallets that interacted with it

**Voiceover:** "Smart contracts appear as nebulae -- cosmic clouds you can explore just like stars."

> If no contracts are visible, search an address known to have contract interactions.

---

## Scene 6: Polish Details (3:50 - 4:15)

**What to show:** Quick montage of quality-of-life features.

1. Search validation: type "hello" in the search bar -- amber hint appears
2. Info modal: click the "?" button -- shows explanation of stars, lines, nebulae, beams, pulses, and getting started tips
3. Remove a wallet: in the detail panel, click the trash icon -- star plays a Star Death animation and disappears
4. Refresh page -- data persists from localStorage; galaxy reconstructs immediately
5. Reset Data button in status bar -- clears everything, galaxy returns to seed stars only

**Voiceover:** "Every detail is polished -- input validation, persistent state across refreshes, graceful error handling, and an info guide for new users."

---

## Scene 7: The Close (4:15 - 4:30)

1. Clear selection so auto-rotate resumes
2. Camera slowly orbits the full galaxy -- all stars visible, constellation lines faintly connecting them, bloom softly glowing
3. If Live is on, let a few more beams fire during the pull-back

**Voiceover:** "Constellation. Built on Base. Explore the blockchain like you have never seen it before."

---

## Features Checklist

Ensure each is shown at least once during the recording.

### Core 3D
- [ ] Cosmic spinner (initial load)
- [ ] Intro sequence (spiral galaxy, title, zoom, white flash)
- [ ] Starfield backdrop
- [ ] Seed stars (15 preset wallets)
- [ ] Dynamic wallet stars (size/brightness by balance)
- [ ] Constellation lines (with focus filtering)
- [ ] Bloom + vignette post-processing
- [ ] Orbit controls (rotate, pan, zoom)
- [ ] Auto-rotate
- [ ] Camera fly-to on selection

### Search and Navigation
- [ ] Search by address
- [ ] Search by tx hash
- [ ] Recent searches dropdown
- [ ] Inline validation hint
- [ ] Back/forward navigation buttons

### Detail Panels
- [ ] Wallet detail (balance, tokens, tx list, connected stars/nebulae)
- [ ] Transaction detail (hash, status, from/to, value, gas, block, time)
- [ ] Contract/nebula detail
- [ ] AddressChip with copy

### Live Mode
- [ ] Block pulse (shockwave + particles + flash)
- [ ] Transaction beams (curved path, comet, trail, sparkles, impact)
- [ ] Receiver star flash on beam arrival
- [ ] Star birth animation (new wallets)
- [ ] Activity log (live tx feed)
- [ ] Transaction sound ping
- [ ] Live toggle switch

### Wallet and Registration
- [ ] Connect wallet (RainbowKit)
- [ ] Claim Your Star modal (name + color picker)
- [ ] Registered star name label (3D billboard text)
- [ ] Registered star crown ring
- [ ] Registration info in detail panel

### Polish
- [ ] Star death animation (remove wallet)
- [ ] Nebula visualization (contracts)
- [ ] Status bar (block, network, counts, RPC health)
- [ ] Error toast (auto-dismiss)
- [ ] Info modal
- [ ] Session persistence (localStorage)
- [ ] Reset data
- [ ] Sound toggle
