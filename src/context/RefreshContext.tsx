"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

interface RefreshContextType {
  refreshTrigger: number;
  triggerRefresh: () => void;
}

const RefreshContext = createContext<RefreshContextType>({
  refreshTrigger: 0,
  triggerRefresh: () => {},
});

export const RefreshProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  return (
    <RefreshContext.Provider value={{ refreshTrigger, triggerRefresh }}>
      {children}
    </RefreshContext.Provider>
  );
};

export const useRefreshContext = () => useContext(RefreshContext);
