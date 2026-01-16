"use client";

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";

interface RefreshContextType {
  refreshTrigger: number;
  triggerRefresh: () => void;
  isPolling: boolean;
  startPolling: () => void;
}

const POLLING_DURATION = 30_000; // 30 seconds of aggressive polling after swap

const RefreshContext = createContext<RefreshContextType>({
  refreshTrigger: 0,
  triggerRefresh: () => {},
  isPolling: false,
  startPolling: () => {},
});

export const RefreshProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isPolling, setIsPolling] = useState(false);
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const triggerRefresh = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  const startPolling = useCallback(() => {
    // Clear any existing timeout
    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current);
    }

    // Enable polling mode
    setIsPolling(true);

    // Disable polling after duration
    pollingTimeoutRef.current = setTimeout(() => {
      setIsPolling(false);
    }, POLLING_DURATION);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingTimeoutRef.current) {
        clearTimeout(pollingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <RefreshContext.Provider value={{ refreshTrigger, triggerRefresh, isPolling, startPolling }}>
      {children}
    </RefreshContext.Provider>
  );
};

export const useRefreshContext = () => useContext(RefreshContext);
