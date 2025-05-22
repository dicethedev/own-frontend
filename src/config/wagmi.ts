"use client";

import { http } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "";

// RainbowKit config with wagmi
export const config = getDefaultConfig({
  appName: "Own Protocol",
  projectId: projectId,
  chains: [baseSepolia],
  transports: {
    [baseSepolia.id]: http(),
  },
});

// Types for wallet connection state
export interface WalletState {
  address: string | undefined;
  isConnecting: boolean;
  isDisconnected: boolean;
  isReconnecting: boolean;
  status: "connecting" | "reconnecting" | "connected" | "disconnected";
}

// Constants
export const SUPPORTED_CHAINS = [baseSepolia];
