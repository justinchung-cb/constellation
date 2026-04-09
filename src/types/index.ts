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
  { coreLight: "#F5F8FF", coreMid: "#B9CFFF", coreDeep: "#053BB1", rim: "#F5F8FF", aura: "#84AAFD" }, // 0: Lightest (blue100/90/20/100/80)
  { coreLight: "#B9CFFF", coreMid: "#578BFA", coreDeep: "#012A82", rim: "#F5F8FF", aura: "#3773F5" }, // 1: Light    (blue90/70/10/100/60)
  { coreLight: "#578BFA", coreMid: "#2162EE", coreDeep: "#011D5B", rim: "#84AAFD", aura: "#0A48CE" }, // 2: Medium   (blue70/50/5/80/30)
  { coreLight: "#2162EE", coreMid: "#0A48CE", coreDeep: "#001033", rim: "#3773F5", aura: "#053BB1" }, // 3: Darkest  (blue50/30/0/60/20)
] as const;
