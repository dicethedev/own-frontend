import React from "react";
import { Pool } from "../types/pool";
import { PoolCard } from "./PoolCard";
import { Plus } from "lucide-react";
import { Button } from "../ui/BaseComponents";

export const PoolContainer: React.FC<{
  pools: Pool[];
  type: "user" | "liquidity";
}> = ({ pools, type }) => {
  return (
    <div className="max-w-7xl mx-auto px-6 py-24">
      <PoolListHeader />
      <PoolGrid pools={pools} type={type} />
    </div>
  );
};

export const PoolGrid: React.FC<{
  pools: Pool[];
  type: "user" | "liquidity";
}> = ({ pools, type }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {pools.map((pool) => (
        <PoolCard key={pool.symbol} pool={pool} type={type} />
      ))}
    </div>
  );
};

export const PoolListHeader: React.FC = () => {
  return (
    <div className="flex justify-between items-center mt-8 mb-8">
      <h2 className="text-2xl font-bold">Active Pools</h2>
      <Button className="flex items-center gap-2">
        <Plus size={16} />
        Create Pool
      </Button>
    </div>
  );
};
