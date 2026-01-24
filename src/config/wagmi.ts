"use client";

import { http, Transport } from "wagmi";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { supportedChains, defaultChain } from "@/lib/chains.config";

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "";

// Create transports dynamically based on supported chains
const transports: Record<number, Transport> = supportedChains.reduce(
  (acc, chain) => {
    acc[chain.id] = http();
    return acc;
  },
  {} as Record<number, Transport>
);

// RainbowKit config with wagmi
export const config = getDefaultConfig({
  appName: "Own Finance",
  projectId: projectId,
  chains: supportedChains,
  transports,
});

// Types for wallet connection state
export interface WalletState {
  address: string | undefined;
  isConnecting: boolean;
  isDisconnected: boolean;
  isReconnecting: boolean;
  status: "connecting" | "reconnecting" | "connected" | "disconnected";
}

// Export supported chains for reference
export { supportedChains, defaultChain };