export const STAR_REGISTRY_ADDRESS =
  "0xd9145CCE52D386f254917e481eB44e9943F39138" as const;

export const STAR_REGISTRY_ABI = [
  {
    type: "function",
    name: "registerStar",
    inputs: [
      { name: "_name", type: "string" },
      { name: "_colorIndex", type: "uint8" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "updateStar",
    inputs: [
      { name: "_name", type: "string" },
      { name: "_colorIndex", type: "uint8" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getStarInfo",
    inputs: [{ name: "_wallet", type: "address" }],
    outputs: [
      { name: "name", type: "string" },
      { name: "colorIndex", type: "uint8" },
      { name: "registeredAt", type: "uint256" },
      { name: "exists", type: "bool" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getAllRegisteredAddresses",
    inputs: [],
    outputs: [{ name: "", type: "address[]" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getRegisteredCount",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
] as const;
