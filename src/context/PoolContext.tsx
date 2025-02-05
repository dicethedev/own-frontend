"use client";

import React, { createContext, useContext } from "react";
import { Pool } from "@/types/pool";

interface PoolContextType {
  pool: Pool;
}

const PoolContext = createContext<PoolContextType | undefined>(undefined);

export function PoolProvider({
  children,
  pool,
}: {
  children: React.ReactNode;
  pool: Pool;
}) {
  return (
    <PoolContext.Provider value={{ pool }}>{children}</PoolContext.Provider>
  );
}

export function usePool() {
  const context = useContext(PoolContext);
  if (!context) {
    throw new Error("usePool must be used within a PoolProvider");
  }
  return context;
}
