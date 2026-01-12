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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

async function fetchOGUserStats(walletAddress: string): Promise<OGUserStats | null> {
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
    staleTime: 30_000, // Consider data stale after 30 seconds
    refetchInterval: 60_000, // Refetch every minute
  });
}

