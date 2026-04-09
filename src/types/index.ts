export interface WalletNode {
  address: string;
  balance: bigint;
  transactionCount: number;
  position: [number, number, number];
  ensName?: string;
  tokens?: TokenBalance[];
  registeredStar?: StarRegistration;
  isContract?: boolean;
}

export interface TransactionEdge {
  hash: string;
  from: string;
  to: string;
  value: bigint;
  gasUsed: bigint;
  gasPrice: bigint;
  blockNumber: number;
  timestamp: number;
  status: "success" | "failed";
}

export interface BlockData {
  number: number;
  timestamp: number;
  transactionCount: number;
  gasUsed: bigint;
  miner: string;
  transactions: TransactionEdge[];
}

export interface StarRegistration {
  name: string;
  colorIndex: number;
  registeredAt: number;
  exists: boolean;
}

export interface TokenBalance {
  symbol: string;
  name: string;
  balance: bigint;
  decimals: number;
  contractAddress: string;
}

export interface ContractCreation {
  txHash: string;
  creator: string;
  position: [number, number, number];
  blockNumber: number;
  timestamp: number;
}

export type SelectedEntityType = "wallet" | "transaction" | "block" | "contract";

export interface SelectedEntity {
  type: SelectedEntityType;
  id: string;
}

export interface GalaxyState {
  wallets: Map<string, WalletNode>;
  transactions: TransactionEdge[];
  liveQueue: TransactionEdge[];
  selectedEntity: SelectedEntity | null;
  cameraTarget: {
    position: [number, number, number];
    lookAt: [number, number, number];
  } | null;
  isLiveMode: boolean;
}

export interface PlanetPalette {
  coreLight: string;
  coreMid: string;
  coreDeep: string;
  rim: string;
  aura: string;
}

export const PLANET_PALETTES: readonly PlanetPalette[] = [
  { coreLight: "#FF6EC7", coreMid: "#CC33FF", coreDeep: "#220066", rim: "#88DDFF", aura: "#4466FF" }, // 0: Nebula Rose
  { coreLight: "#FFD066", coreMid: "#FF8C00", coreDeep: "#331800", rim: "#FFEEAA", aura: "#FF8844" }, // 1: Solar Flare
  { coreLight: "#66DDFF", coreMid: "#0088FF", coreDeep: "#001144", rim: "#AAFFFF", aura: "#2266FF" }, // 2: Blue Giant
  { coreLight: "#FF6666", coreMid: "#CC2244", coreDeep: "#220011", rim: "#FFAAAA", aura: "#FF4466" }, // 3: Red Dwarf
  { coreLight: "#66FFAA", coreMid: "#00CC66", coreDeep: "#002211", rim: "#AAFFDD", aura: "#22FF88" }, // 4: Emerald Pulse
  { coreLight: "#BB66FF", coreMid: "#7700EE", coreDeep: "#110022", rim: "#DD99FF", aura: "#6633FF" }, // 5: Void Shard
  { coreLight: "#FFAA44", coreMid: "#FF5500", coreDeep: "#221100", rim: "#FFCC88", aura: "#FF6622" }, // 6: Inferno
  { coreLight: "#AADDFF", coreMid: "#4488FF", coreDeep: "#001133", rim: "#DDFFFF", aura: "#4466CC" }, // 7: Frost Crystal
] as const;
