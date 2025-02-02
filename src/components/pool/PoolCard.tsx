import React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/BaseComponents";
import { Pool } from "../types/pool";

export const PoolCard: React.FC<{ pool: Pool; type: "user" | "liquidity" }> = ({
  pool,
  type,
}) => {
  return (
    <div className="p-6 rounded-lg border border-gray-800 bg-white/5 hover:bg-white/10 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-black/10 overflow-hidden flex items-center justify-center">
            {pool.logoUrl ? (
              <Image
                src={pool.logoUrl}
                alt={`${pool.symbol} logo`}
                width={48}
                height={48}
                className="object-cover"
              />
            ) : (
              <div className="text-xl font-bold text-black/50">
                {pool.symbol.slice(0, 2)}
              </div>
            )}
          </div>
          <div>
            <h3 className="text-xl font-bold">{pool.name}</h3>
            <p className="text-gray-400">{pool.symbol}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold">${pool.price.toLocaleString()}</p>
          <p
            className={
              pool.priceChange >= 0 ? "text-green-500" : "text-red-500"
            }
          >
            {pool.priceChange >= 0 ? "+" : ""}
            {pool.priceChange}%
          </p>
        </div>
      </div>
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Deposit Token:</span>
          <span>{pool.depositToken}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">24h Volume:</span>
          <span>{pool.volume24h}</span>
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" className="flex-1">
          Details
        </Button>
        <Button className="flex-1">
          {type === "user" ? "Deposit" : "Provide Liquidity"}
        </Button>
      </div>
    </div>
  );
};
