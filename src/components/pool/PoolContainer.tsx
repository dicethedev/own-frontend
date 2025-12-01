import React from "react";
import { Pool } from "../../types/pool";
import { PoolCard } from "./PoolCard";
import { Plus } from "lucide-react";
import { Button } from "../ui/BaseComponents";
import Link from "next/link";
import {
  COMING_SOON_POOLS,
  ComingSoonPool,
  isIndexPool,
} from "@/utils/comingSoonPools";
import { useChainId } from "wagmi";

export const PoolContainer: React.FC<{
  pools: Pool[];
  type: "user" | "lp";
}> = ({ pools, type }) => {
  const chainId = useChainId();
  const isBaseMainnet = chainId === 8453;
  return (
    <div className="flex-1">
      <div className="max-w-7xl mx-auto px-6 py-24">
        <PoolListHeader type={type} />
        {isBaseMainnet ? (
          <SectionedPoolGrid pools={pools} type={type} />
        ) : (
          <PoolGrid pools={pools} type={type} />
        )}
      </div>
    </div>
  );
};

export const SectionedPoolGrid: React.FC<{
  pools: Pool[];
  type: "user" | "lp";
}> = ({ pools, type }) => {
  // Separate active pools into indices and stocks
  const activeIndices = pools.filter((pool) => isIndexPool(pool.assetSymbol));
  const activeStocks = pools.filter((pool) => !isIndexPool(pool.assetSymbol));

  // Get coming soon pools
  const comingSoonIndices = COMING_SOON_POOLS.filter(
    (p) => p.category === "index"
  );
  const comingSoonStocks = COMING_SOON_POOLS.filter(
    (p) => p.category === "stock"
  );

  // Combine active and coming soon
  const allIndices: (Pool | ComingSoonPool)[] = [
    ...activeIndices,
    ...comingSoonIndices,
  ];
  const allStocks: (Pool | ComingSoonPool)[] = [
    ...activeStocks,
    ...comingSoonStocks,
  ];

  return (
    <div className="space-y-12">
      {/* Indices Section */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <h3 className="text-xl font-semibold text-white">Indices</h3>
        </div>
        {allIndices.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            No index pools available
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allIndices.map((pool) => (
              <PoolCard
                key={pool.assetSymbol}
                pool={pool as Pool & { comingSoon?: boolean }}
                type={type}
              />
            ))}
          </div>
        )}
      </section>

      {/* Stocks Section */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <h3 className="text-xl font-semibold text-white">Stocks</h3>
        </div>
        {allStocks.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            No stock pools available
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allStocks.map((pool) => (
              <PoolCard
                key={pool.assetSymbol}
                pool={pool as Pool & { comingSoon?: boolean }}
                type={type}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export const PoolGrid: React.FC<{
  pools: Pool[];
  type: "user" | "lp";
}> = ({ pools, type }) => {
  if (pools.length === 0) {
    return (
      <div className="text-center text-gray-400 py-8" data-testid="empty-state">
        No pools available
      </div>
    );
  }

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
      <h2 className="text-2xl font-bold">
        Pools - {type === "user" ? "Buy side" : "Sell side"}
      </h2>
      {type === "lp" && (
        <Link href="/protocol/lp/create">
          <Button className="flex items-center gap-2">
            <Plus size={16} />
            Create Pool
          </Button>
        </Link>
      )}
    </div>
  );
};
