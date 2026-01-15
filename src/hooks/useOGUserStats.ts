"use client";

import { useQuery } from "@tanstack/react-query";

export interface OGUserRewards {
  accrued_usdc: string;
  claimed_usdc: string;
  unclaimed_usdc: string;
  current_ai7_balance: string;
  last_accrual_time: string;
  event_transfer_time: string | null;
}

export interface OGUserStats {
  wallet_address: string;
  total_bought: string;
  total_sold: string;
  net_ai7_amount: string;
  total_usdc_spent: string;
  total_usdc_received: string;
  avg_buy_price: string;
  avg_sell_price: string;
  total_buy_transactions: number;
  total_sell_transactions: number;
  first_transaction_at: string;
  last_transaction_at: string;
  rewards: OGUserRewards;
}

interface OGUserStatsResponse {
  success: boolean;
  data: OGUserStats;
}

// Rewards History Types
export interface AirdropHistoryItem {
  usdc_amount: number;
  tx_hash: string;
  airdrop_round: string;
  status: string;
  created_at: string;
}

export interface RewardsDetails {
  wallet_address: string;
  accrued_usdc: string;
  claimed_usdc: string;
  total_rewards_usdc: string;
  last_accrual_time: string;
  apy: string;
  is_eligible: boolean;
  airdrop_history: AirdropHistoryItem[];
}

interface RewardsDetailsResponse {
  success: boolean;
  data: RewardsDetails;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

async function fetchOGUserStats(
  walletAddress: string
): Promise<OGUserStats | null> {
  if (!walletAddress) return null;

  const response = await fetch(
    `${API_BASE_URL}/api/og-users/stats/${walletAddress}`
  );

  if (!response.ok) {
    if (response.status === 404) {
      return null; // User not found
    }
    throw new Error("Failed to fetch OG user stats");
  }

  const result: OGUserStatsResponse = await response.json();

  if (!result.success) {
    return null;
  }

  return result.data;
}

export function useOGUserStats(walletAddress: string | undefined) {
  return useQuery({
    queryKey: ["og-user-stats", walletAddress],
    queryFn: () => fetchOGUserStats(walletAddress || ""),
    enabled: !!walletAddress,
    staleTime: 300_000, // Consider data stale after 5 minutes
    refetchInterval: 600_000, // Refetch every 10 minutes
  });
}

// Fetch rewards details including airdrop history
async function fetchRewardsDetails(
  walletAddress: string
): Promise<RewardsDetails | null> {
  if (!walletAddress) return null;

  const response = await fetch(
    `${API_BASE_URL}/api/rewards/${walletAddress}/details`
  );

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error("Failed to fetch rewards details");
  }

  const result: RewardsDetailsResponse = await response.json();

  if (!result.success) {
    return null;
  }

  return result.data;
}

export function useRewardsDetails(walletAddress: string | undefined) {
  return useQuery({
    queryKey: ["rewards-details", walletAddress],
    queryFn: () => fetchRewardsDetails(walletAddress || ""),
    enabled: !!walletAddress,
    staleTime: 300_000, // Consider data stale after 5 minutes
    refetchInterval: 600_000, // Refetch every 10 minutes
  });
}
