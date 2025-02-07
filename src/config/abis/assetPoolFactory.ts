export const assetPoolFactoryABI = [
  {
    type: "constructor",
    inputs: [
      { name: "_lpRegistry", type: "address", internalType: "address" },
      {
        name: "_assetPoolImplementation",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "assetPoolImplementation",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "createPool",
    inputs: [
      { name: "depositToken", type: "address", internalType: "address" },
      { name: "assetName", type: "string", internalType: "string" },
      { name: "assetSymbol", type: "string", internalType: "string" },
      { name: "oracle", type: "address", internalType: "address" },
      { name: "cycleLength", type: "uint256", internalType: "uint256" },
      { name: "rebalanceLength", type: "uint256", internalType: "uint256" },
    ],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "lpRegistry",
    inputs: [],
    outputs: [
      { name: "", type: "address", internalType: "contract ILPRegistry" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "owner",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "renounceOwnership",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "transferOwnership",
    inputs: [{ name: "newOwner", type: "address", internalType: "address" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "updateLPRegistry",
    inputs: [
      { name: "newLPRegistry", type: "address", internalType: "address" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "event",
    name: "AssetPoolCreated",
    inputs: [
      { name: "pool", type: "address", indexed: true, internalType: "address" },
      {
        name: "assetSymbol",
        type: "string",
        indexed: false,
        internalType: "string",
      },
      {
        name: "depositToken",
        type: "address",
        indexed: false,
        internalType: "address",
      },
      {
        name: "oracle",
        type: "address",
        indexed: false,
        internalType: "address",
      },
      {
        name: "cycleLength",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "rebalanceLength",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "LPRegistryUpdated",
    inputs: [
      {
        name: "lpRegistry",
        type: "address",
        indexed: false,
        internalType: "address",
      },
      {
        name: "newLPRegistry",
        type: "address",
        indexed: false,
        internalType: "address",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "OwnershipTransferred",
    inputs: [
      {
        name: "previousOwner",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "newOwner",
        type: "address",
        indexed: true,
        internalType: "address",
      },
    ],
    anonymous: false,
  },
  { type: "error", name: "FailedDeployment", inputs: [] },
  {
    type: "error",
    name: "InsufficientBalance",
    inputs: [
      { name: "balance", type: "uint256", internalType: "uint256" },
      { name: "needed", type: "uint256", internalType: "uint256" },
    ],
  },
  { type: "error", name: "InvalidParams", inputs: [] },
  {
    type: "error",
    name: "OwnableInvalidOwner",
    inputs: [{ name: "owner", type: "address", internalType: "address" }],
  },
  {
    type: "error",
    name: "OwnableUnauthorizedAccount",
    inputs: [{ name: "account", type: "address", internalType: "address" }],
  },
  { type: "error", name: "ZeroAddress", inputs: [] },
] as const;
