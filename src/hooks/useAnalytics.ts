"use client";

import { usePostHog } from "posthog-js/react";
import { useCallback } from "react";

export type SwapEventData = {
  from_token: string;
  to_token: string;
  from_amount: string;
  to_amount: string;
  transaction_hash?: string;
  chain_id: number;
};

export type PoolEventData = {
  pool_symbol: string;
  pool_address: string;
  amount: string;
  transaction_hash?: string;
  chain_id: number;
};

export type MintEventData = {
  pool_symbol: string;
  pool_address: string;
  deposit_amount: string;
  collateral_amount: string;
  chain_id: number;
  transaction_hash?: string;
};

export type RedeemEventData = {
  pool_symbol: string;
  pool_address: string;
  amount: string;
  asset_symbol: string;
  chain_id: number;
  transaction_hash?: string;
};

export type ClaimEventData = {
  pool_symbol: string;
  pool_address: string;
  claim_type: "asset" | "reserve";
  chain_id: number;
  transaction_hash?: string;
};

export type CollateralEventData = {
  pool_symbol: string;
  pool_address: string;
  amount: string;
  action: "add" | "reduce";
  chain_id: number;
  transaction_hash?: string;
};

export type ApprovalEventData = {
  token_symbol: string;
  token_address: string;
  spender: string;
  amount: string;
  chain_id: number;
  transaction_hash?: string;
};

export function useAnalytics() {
  const posthog = usePostHog();

  // Wallet events
  const trackWalletConnect = useCallback(
    (address: string, chainId: number) => {
      posthog?.capture("wallet_connected", {
        wallet_address: address,
        chain_id: chainId,
      });
    },
    [posthog]
  );

  const trackWalletDisconnect = useCallback(() => {
    posthog?.capture("wallet_disconnected");
  }, [posthog]);

  // Swap events
  const trackSwapInitiated = useCallback(
    (data: SwapEventData) => {
      posthog?.capture("swap_initiated", data);
    },
    [posthog]
  );

  const trackSwapCompleted = useCallback(
    (data: SwapEventData) => {
      posthog?.capture("swap_completed", data);
    },
    [posthog]
  );

  const trackSwapFailed = useCallback(
    (data: SwapEventData & { error?: string }) => {
      posthog?.capture("swap_failed", data);
    },
    [posthog]
  );

  // Mint/Deposit events
  const trackDepositInitiated = useCallback(
    (data: MintEventData) => {
      posthog?.capture("deposit_initiated", data);
    },
    [posthog]
  );

  const trackDepositCompleted = useCallback(
    (data: MintEventData) => {
      posthog?.capture("deposit_completed", data);
    },
    [posthog]
  );

  const trackDepositFailed = useCallback(
    (data: MintEventData & { error?: string }) => {
      posthog?.capture("deposit_failed", data);
    },
    [posthog]
  );

  // Redeem events
  const trackRedeemInitiated = useCallback(
    (data: RedeemEventData) => {
      posthog?.capture("redeem_initiated", data);
    },
    [posthog]
  );

  const trackRedeemCompleted = useCallback(
    (data: RedeemEventData) => {
      posthog?.capture("redeem_completed", data);
    },
    [posthog]
  );

  const trackRedeemFailed = useCallback(
    (data: RedeemEventData & { error?: string }) => {
      posthog?.capture("redeem_failed", data);
    },
    [posthog]
  );

  // Claim events
  const trackClaimInitiated = useCallback(
    (data: ClaimEventData) => {
      posthog?.capture("claim_initiated", data);
    },
    [posthog]
  );

  const trackClaimCompleted = useCallback(
    (data: ClaimEventData) => {
      posthog?.capture("claim_completed", data);
    },
    [posthog]
  );

  const trackClaimFailed = useCallback(
    (data: ClaimEventData & { error?: string }) => {
      posthog?.capture("claim_failed", data);
    },
    [posthog]
  );

  // Collateral events
  const trackCollateralAction = useCallback(
    (data: CollateralEventData) => {
      posthog?.capture("collateral_action", data);
    },
    [posthog]
  );

  // Approval events
  const trackApprovalInitiated = useCallback(
    (data: ApprovalEventData) => {
      posthog?.capture("approval_initiated", data);
    },
    [posthog]
  );

  const trackApprovalCompleted = useCallback(
    (data: ApprovalEventData) => {
      posthog?.capture("approval_completed", data);
    },
    [posthog]
  );

  // Generic event tracker
  const trackEvent = useCallback(
    (eventName: string, properties?: Record<string, unknown>) => {
      posthog?.capture(eventName, properties);
    },
    [posthog]
  );

  return {
    // Wallet
    trackWalletConnect,
    trackWalletDisconnect,
    // Swaps
    trackSwapInitiated,
    trackSwapCompleted,
    trackSwapFailed,
    // Mint/Deposit
    trackDepositInitiated,
    trackDepositCompleted,
    trackDepositFailed,
    // Redeem
    trackRedeemInitiated,
    trackRedeemCompleted,
    trackRedeemFailed,
    // Claim
    trackClaimInitiated,
    trackClaimCompleted,
    trackClaimFailed,
    // Collateral
    trackCollateralAction,
    // Approvals
    trackApprovalInitiated,
    trackApprovalCompleted,
    // Generic
    trackEvent,
  };
}
