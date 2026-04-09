import { mainnet as viemMainnet, baseSepolia } from "wagmi/chains";

// Override mainnet's default RPC to avoid the broken eth.merkle.io
const mainnet = {
  ...viemMainnet,
  rpcUrls: {
    default: {
      http: ["https://eth.llamarpc.com"],
    },
  },
} as const;

export { mainnet, baseSepolia };

export const SUPPORTED_CHAINS = [
  { id: 1, name: "Ethereum" },
  { id: 84532, name: "Base Sepolia" },
] as const;
