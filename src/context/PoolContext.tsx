"use client";

import React, { createContext, useContext, useCallback } from "react";
import { usePools } from "@/hooks/pool";
import { Pool } from "@/types/pool";

interface PoolContextType {
  pools: Map<string, Pool>;
  isLoading: boolean;
  error: Error | null;
  getPool: (symbol: string) => Pool | undefined;
  isInitialized: boolean;
  refresh: () => void;
  lastUpdated: number;
}

const REFRESH_INTERVAL = 300000; // 30 seconds, adjust as needed

const PoolContext = createContext<PoolContextType | undefined>(undefined);

export const PoolProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [poolsMap, setPoolsMap] = React.useState<Map<string, Pool>>(new Map());
  const [isInitialized, setIsInitialized] = React.useState(false);
  const [lastUpdated, setLastUpdated] = React.useState<number>(Date.now());
  const [refreshKey, setRefreshKey] = React.useState(0);

  const chainId = 84532;
  const {
    pools: verifiedPools,
    isLoading,
    error,
  } = usePools(chainId, 3, refreshKey);

  React.useEffect(() => {
    if (!isLoading && verifiedPools) {
      const newPoolsMap = new Map();
      verifiedPools.forEach((pool) => {
        newPoolsMap.set(pool.assetSymbol.toLowerCase(), pool);
      });
      setPoolsMap(newPoolsMap);
      setIsInitialized(true);
      setLastUpdated(Date.now());
    }
  }, [verifiedPools, isLoading]);

  const refresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  // Auto-refresh logic
  React.useEffect(() => {
    const handleVisibilityChange = () => {
      if (
        document.visibilityState === "visible" &&
        Date.now() - lastUpdated > REFRESH_INTERVAL
      ) {
        refresh();
      }
    };

    // Refresh when tab becomes visible
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Periodic refresh when tab is visible
    let intervalId: NodeJS.Timeout | null = null;
    if (document.visibilityState === "visible") {
      intervalId = setInterval(() => {
        refresh();
      }, REFRESH_INTERVAL);
    }

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (intervalId) clearInterval(intervalId);
    };
  }, [lastUpdated, refresh]);

  const getPool = useCallback(
    (symbol: string) => {
      return poolsMap.get(symbol.toLowerCase());
    },
    [poolsMap]
  );

  return (
    <PoolContext.Provider
      value={{
        pools: poolsMap,
        isLoading,
        error,
        getPool,
        isInitialized,
        refresh,
        lastUpdated,
      }}
    >
      {children}
    </PoolContext.Provider>
  );
};

export const usePoolContext = () => {
  const context = useContext(PoolContext);
  if (!context) {
    throw new Error("usePoolContext must be used within a PoolProvider");
  }
  return context;
};
