// src/config/morpho.ts
// Morpho Blue configuration for Base mainnet

import { Address } from "viem";

// ─── Addresses ───────────────────────────────────────────────
export const MORPHO_BLUE_ADDRESS =
  "0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb" as Address;

// The market ID for the AI7-USDC market on Morpho Blue (Base mainnet)
export const MORPHO_MARKET_ID =
  "0xc0401033c803a6a14a7eaa080ba518d12138096f429ccec727154b2a4e23ad57" as `0x${string}`;

// Token addresses on Base mainnet
export const USDC_ADDRESS =
  "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as Address;
export const AI7_ADDRESS =
  "0x2567563f230A3A30A5ba9de84157E0449c00EB36" as Address;

export const USDC_DECIMALS = 6;
export const AI7_DECIMALS = 18;

// ─── MarketParams struct type ────────────────────────────────
export interface MorphoMarketParams {
  loanToken: Address;
  collateralToken: Address;
  oracle: Address;
  irm: Address;
  lltv: bigint;
}

// ─── Morpho Blue ABI (minimal, only functions we need) ───────
export const MorphoBlueABI = [
  // ── Read functions ──
  {
    type: "function",
    name: "idToMarketParams",
    inputs: [{ name: "id", type: "bytes32", internalType: "Id" }],
    outputs: [
      { name: "loanToken", type: "address", internalType: "address" },
      { name: "collateralToken", type: "address", internalType: "address" },
      { name: "oracle", type: "address", internalType: "address" },
      { name: "irm", type: "address", internalType: "address" },
      { name: "lltv", type: "uint256", internalType: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "market",
    inputs: [{ name: "id", type: "bytes32", internalType: "Id" }],
    outputs: [
      {
        name: "totalSupplyAssets",
        type: "uint128",
        internalType: "uint128",
      },
      {
        name: "totalSupplyShares",
        type: "uint128",
        internalType: "uint128",
      },
      {
        name: "totalBorrowAssets",
        type: "uint128",
        internalType: "uint128",
      },
      {
        name: "totalBorrowShares",
        type: "uint128",
        internalType: "uint128",
      },
      { name: "lastUpdate", type: "uint128", internalType: "uint128" },
      { name: "fee", type: "uint128", internalType: "uint128" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "position",
    inputs: [
      { name: "id", type: "bytes32", internalType: "Id" },
      { name: "user", type: "address", internalType: "address" },
    ],
    outputs: [
      { name: "supplyShares", type: "uint256", internalType: "uint256" },
      { name: "borrowShares", type: "uint256", internalType: "uint256" },
      { name: "collateral", type: "uint256", internalType: "uint256" },
    ],
    stateMutability: "view",
  },
  // ── Write functions ──
  {
    type: "function",
    name: "supply",
    inputs: [
      {
        name: "marketParams",
        type: "tuple",
        internalType: "struct MarketParams",
        components: [
          { name: "loanToken", type: "address", internalType: "address" },
          {
            name: "collateralToken",
            type: "address",
            internalType: "address",
          },
          { name: "oracle", type: "address", internalType: "address" },
          { name: "irm", type: "address", internalType: "address" },
          { name: "lltv", type: "uint256", internalType: "uint256" },
        ],
      },
      { name: "assets", type: "uint256", internalType: "uint256" },
      { name: "shares", type: "uint256", internalType: "uint256" },
      { name: "onBehalf", type: "address", internalType: "address" },
      { name: "data", type: "bytes", internalType: "bytes" },
    ],
    outputs: [
      { name: "assetsSupplied", type: "uint256", internalType: "uint256" },
      { name: "sharesSupplied", type: "uint256", internalType: "uint256" },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "withdraw",
    inputs: [
      {
        name: "marketParams",
        type: "tuple",
        internalType: "struct MarketParams",
        components: [
          { name: "loanToken", type: "address", internalType: "address" },
          {
            name: "collateralToken",
            type: "address",
            internalType: "address",
          },
          { name: "oracle", type: "address", internalType: "address" },
          { name: "irm", type: "address", internalType: "address" },
          { name: "lltv", type: "uint256", internalType: "uint256" },
        ],
      },
      { name: "assets", type: "uint256", internalType: "uint256" },
      { name: "shares", type: "uint256", internalType: "uint256" },
      { name: "onBehalf", type: "address", internalType: "address" },
      { name: "receiver", type: "address", internalType: "address" },
    ],
    outputs: [
      { name: "assetsWithdrawn", type: "uint256", internalType: "uint256" },
      { name: "sharesWithdrawn", type: "uint256", internalType: "uint256" },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "supplyCollateral",
    inputs: [
      {
        name: "marketParams",
        type: "tuple",
        internalType: "struct MarketParams",
        components: [
          { name: "loanToken", type: "address", internalType: "address" },
          {
            name: "collateralToken",
            type: "address",
            internalType: "address",
          },
          { name: "oracle", type: "address", internalType: "address" },
          { name: "irm", type: "address", internalType: "address" },
          { name: "lltv", type: "uint256", internalType: "uint256" },
        ],
      },
      { name: "assets", type: "uint256", internalType: "uint256" },
      { name: "onBehalf", type: "address", internalType: "address" },
      { name: "data", type: "bytes", internalType: "bytes" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "withdrawCollateral",
    inputs: [
      {
        name: "marketParams",
        type: "tuple",
        internalType: "struct MarketParams",
        components: [
          { name: "loanToken", type: "address", internalType: "address" },
          {
            name: "collateralToken",
            type: "address",
            internalType: "address",
          },
          { name: "oracle", type: "address", internalType: "address" },
          { name: "irm", type: "address", internalType: "address" },
          { name: "lltv", type: "uint256", internalType: "uint256" },
        ],
      },
      { name: "assets", type: "uint256", internalType: "uint256" },
      { name: "onBehalf", type: "address", internalType: "address" },
      { name: "receiver", type: "address", internalType: "address" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "borrow",
    inputs: [
      {
        name: "marketParams",
        type: "tuple",
        internalType: "struct MarketParams",
        components: [
          { name: "loanToken", type: "address", internalType: "address" },
          {
            name: "collateralToken",
            type: "address",
            internalType: "address",
          },
          { name: "oracle", type: "address", internalType: "address" },
          { name: "irm", type: "address", internalType: "address" },
          { name: "lltv", type: "uint256", internalType: "uint256" },
        ],
      },
      { name: "assets", type: "uint256", internalType: "uint256" },
      { name: "shares", type: "uint256", internalType: "uint256" },
      { name: "onBehalf", type: "address", internalType: "address" },
      { name: "receiver", type: "address", internalType: "address" },
    ],
    outputs: [
      { name: "assetsBorrowed", type: "uint256", internalType: "uint256" },
      { name: "sharesBorrowed", type: "uint256", internalType: "uint256" },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "repay",
    inputs: [
      {
        name: "marketParams",
        type: "tuple",
        internalType: "struct MarketParams",
        components: [
          { name: "loanToken", type: "address", internalType: "address" },
          {
            name: "collateralToken",
            type: "address",
            internalType: "address",
          },
          { name: "oracle", type: "address", internalType: "address" },
          { name: "irm", type: "address", internalType: "address" },
          { name: "lltv", type: "uint256", internalType: "uint256" },
        ],
      },
      { name: "assets", type: "uint256", internalType: "uint256" },
      { name: "shares", type: "uint256", internalType: "uint256" },
      { name: "onBehalf", type: "address", internalType: "address" },
      { name: "data", type: "bytes", internalType: "bytes" },
    ],
    outputs: [
      { name: "assetsRepaid", type: "uint256", internalType: "uint256" },
      { name: "sharesRepaid", type: "uint256", internalType: "uint256" },
    ],
    stateMutability: "nonpayable",
  },
] as const;

// ─── AdaptiveCurveIRM ABI (borrowRateView only) ─────────────
export const AdaptiveCurveIrmABI = [
  {
    type: "function",
    name: "borrowRateView",
    inputs: [
      {
        name: "marketParams",
        type: "tuple",
        internalType: "struct MarketParams",
        components: [
          { name: "loanToken", type: "address", internalType: "address" },
          {
            name: "collateralToken",
            type: "address",
            internalType: "address",
          },
          { name: "oracle", type: "address", internalType: "address" },
          { name: "irm", type: "address", internalType: "address" },
          { name: "lltv", type: "uint256", internalType: "uint256" },
        ],
      },
      {
        name: "market",
        type: "tuple",
        internalType: "struct Market",
        components: [
          {
            name: "totalSupplyAssets",
            type: "uint128",
            internalType: "uint128",
          },
          {
            name: "totalSupplyShares",
            type: "uint128",
            internalType: "uint128",
          },
          {
            name: "totalBorrowAssets",
            type: "uint128",
            internalType: "uint128",
          },
          {
            name: "totalBorrowShares",
            type: "uint128",
            internalType: "uint128",
          },
          { name: "lastUpdate", type: "uint128", internalType: "uint128" },
          { name: "fee", type: "uint128", internalType: "uint128" },
        ],
      },
    ],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
] as const;

// ─── Constants ───────────────────────────────────────────────
export const SECONDS_PER_YEAR = 365.25 * 24 * 60 * 60; // 31_557_600
