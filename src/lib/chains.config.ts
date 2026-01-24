import { base, baseSepolia } from "wagmi/chains";
import type { Chain } from "wagmi/chains";

type Environment = "dev" | "prod";

const ENV = (process.env.NEXT_PUBLIC_ENV || "dev") as Environment;

type ChainTuple = readonly [Chain, ...Chain[]];

// Validate environment
if (!["dev", "prod"].includes(ENV)) {
  console.warn(
    `Invalid NEXT_PUBLIC_ENV value: "${ENV}". Defaulting to "dev".`
  );
}

// Chain configuration based on environment
const chainConfig: Record<Environment, ChainTuple> = {
  dev: [baseSepolia],
  prod: [base],
};

export const supportedChains = chainConfig[ENV] || chainConfig.dev;
export const defaultChain = supportedChains[0];
export const currentEnvironment = ENV;
export const isProduction = ENV === "prod";
export const isDevelopment = ENV === "dev";
// Chain IDs for easy reference
export const BASE_MAINNET_CHAIN_ID = base.id; // Should be 8453
export const BASE_SEPOLIA_CHAIN_ID = baseSepolia.id; // Should be 84532