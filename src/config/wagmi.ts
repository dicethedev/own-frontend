"use client";

import { http, createConfig } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { injected, metaMask } from "wagmi/connectors";

// Wagmi config
export const config = createConfig({
  chains: [baseSepolia],
  connectors: [metaMask(), injected()],
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
