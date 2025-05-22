import React from "react";
import { Pool } from "../../types/pool";
import { PoolCard } from "./PoolCard";
import { Plus } from "lucide-react";
import { Button } from "../ui/BaseComponents";
import Link from "next/link";
import { Footer } from "../Footer";

export const PoolContainer: React.FC<{
  pools: Pool[];
  type: "user" | "lp";
}> = ({ pools, type }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <PoolListHeader type={type} />
          <PoolGrid pools={pools} type={type} />
        </div>
      </div>
      <Footer />
    </div>
  );
};

export const PoolGrid: React.FC<{
  pools: Pool[];
  type: "user" | "lp";
}> = ({ pools, type }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {pools.map((pool) => (
        <PoolCard key={pool.assetSymbol} pool={pool} type={type} />
      ))}
    </div>
  );
};

export const PoolListHeader: React.FC<{
  type: "user" | "lp";
}> = ({ type }) => {
  return (
    <div className="flex justify-between items-center mt-8 mb-8">
      <h2 className="text-2xl font-bold">Active Pools</h2>
      {type === "lp" && (
        <Link href="/pool/create">
          <Button className="flex items-center gap-2">
            <Plus size={16} />
            Create Pool
          </Button>
        </Link>
      )}
    </div>
  );
};
