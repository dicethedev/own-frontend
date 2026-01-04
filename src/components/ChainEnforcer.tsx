"use client";

import { useEffect, useRef } from "react";
import { useAccount, useSwitchChain } from "wagmi";
import { base } from "wagmi/chains";

const DEFAULT_CHAIN_ID = base.id; // 8453

/**
 * ChainEnforcer
 *
 * Automatically switches the user's wallet to Base mainnet on initial connection
 * if they're on an unsupported chain. Allows manual switching between supported chains.
 */
export function ChainEnforcer({ children }: { children: React.ReactNode }) {
  const { isConnected, chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const hasEnforcedRef = useRef(false);

  useEffect(() => {
    // Reset the flag when disconnected
    if (!isConnected) {
      hasEnforcedRef.current = false;
      return;
    }

    // Only enforce once per connection session
    if (hasEnforcedRef.current) {
      return;
    }

    // If connected to an unsupported chain, switch to Base mainnet
    if (chainId && chainId !== DEFAULT_CHAIN_ID && switchChain) {
      hasEnforcedRef.current = true;
      switchChain({ chainId: DEFAULT_CHAIN_ID });
    } else if (chainId === DEFAULT_CHAIN_ID) {
      // Mark as enforced if already on a supported chain
      hasEnforcedRef.current = true;
    }
  }, [isConnected, chainId, switchChain]);

  return <>{children}</>;
}
