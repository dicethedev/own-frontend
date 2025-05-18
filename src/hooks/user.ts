// src/hooks/user.ts
import { useState, useEffect } from "react";
import { Address } from "viem";
import { useAccount } from "wagmi";
import { querySubgraph } from "./subgraph";
import { UserData, UserPosition, UserRequest } from "@/types/user";

/**
 * Hook to fetch user-specific data related to a pool
 * @param poolAddress The address of the pool to query
 * @returns User data including positions and requests
 */
export const useUserData = (poolAddress: Address): UserData => {
  const { address } = useAccount();
  const [data, setData] = useState<{
    userPosition: UserPosition | null;
    userRequest: UserRequest | null;
    isUser: boolean;
  }>({
    userPosition: null,
    userRequest: null,
    isUser: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!address) {
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setIsLoading(true);

        const query = `
          query GetUserData {
            userPosition(id: "${address.toLowerCase()}-${poolAddress.toLowerCase()}") {
              id
              user
              pool {
                id
              }
              assetAmount
              depositAmount
              collateralAmount
              createdAt
              updatedAt
            }
            userRequest(id: "${address.toLowerCase()}-${poolAddress.toLowerCase()}") {
              id
              requestType
              amount
              collateralAmount
              requestCycle
              liquidator
              createdAt
              updatedAt
            }
          }
        `;

        const response = await querySubgraph(query);

        setData({
          userPosition: response?.userPosition || null,
          userRequest: response?.userRequest || null,
          isUser: !!response?.userPosition,
        });

        setError(null);
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError(
          err instanceof Error ? err : new Error("Failed to fetch user data")
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [address, poolAddress]);

  return {
    ...data,
    isLoading,
    error,
  };
};

/**
 * Calculate user's position details
 * @param userPosition The user's position data
 * @param assetPrice Current asset price
 * @param oraclePrice Oracle price
 * @returns Calculated metrics for the position
 */
export const calculateUserPositionMetrics = (
  userPosition: UserPosition | null,
  assetPrice: number,
  oraclePrice: number
) => {
  if (!userPosition) {
    return {
      positionValue: 0,
      entryPrice: 0,
      pnlValue: 0,
      pnlPercentage: 0,
      collateralRatio: 0,
    };
  }

  // Calculate with correct decimals
  const assetAmount = Number(userPosition.assetAmount) / 1e18;
  const depositAmount = Number(userPosition.depositAmount) / 1e6;
  const collateralAmount = Number(userPosition.collateralAmount) / 1e6;

  // Calculate position details
  const positionValue = assetAmount * assetPrice;
  const entryPrice = assetAmount > 0 ? depositAmount / assetAmount : 0;
  const pnlValue = assetAmount * (assetPrice - entryPrice);
  const pnlPercentage =
    entryPrice > 0 ? ((assetPrice - entryPrice) / entryPrice) * 100 : 0;

  // Calculate collateral health ratio
  const currentValue = assetAmount * oraclePrice;
  const collateralRatio =
    currentValue > 0 ? (collateralAmount / currentValue) * 100 : 0;

  return {
    positionValue,
    entryPrice,
    pnlValue,
    pnlPercentage,
    collateralRatio,
  };
};

/**
 * Format a number for display based on its magnitude
 * @param value The number to format
 * @returns Formatted string representation
 */
export const formatNumber = (value: number): string => {
  if (Math.abs(value) >= 1) {
    return value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
  return value.toLocaleString(undefined, {
    minimumSignificantDigits: 2,
    maximumSignificantDigits: 4,
  });
};

/**
 * Format a value as currency
 * @param value The number to format as currency
 * @returns Formatted currency string
 */
export const formatCurrency = (value: number): string => {
  return `$${formatNumber(value)}`;
};

/**
 * Check if a user has a pending request
 * @param userRequest The user request data
 * @param currentCycle The current cycle number
 * @returns Boolean indicating if the request is still pending
 */
export const hasPendingRequest = (
  userRequest: UserRequest | null,
  currentCycle: number
): boolean => {
  if (!userRequest) return false;
  return (
    userRequest.requestType !== "NONE" &&
    Number(userRequest.requestCycle) <= currentCycle
  );
};
