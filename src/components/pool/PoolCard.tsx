import React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/BaseComponents";
import { Pool } from "../../types/pool";
import Link from "next/link";
import { formatUnits } from "viem";
import { formatTVL } from "@/utils/tvl-formatting";

export const PoolCard: React.FC<{ pool: Pool; type: "user" | "lp" }> = ({
  pool,
  type,
}) => {
  const href = `/pool/${pool.assetSymbol.toLowerCase()}/${type}`;

  const poolTVL = formatTVL(
    Number(
      formatUnits(
        pool.totalLPLiquidityCommited || BigInt(0),
        pool.reserveTokenDecimals
      )
    ) +
      Number(
        formatUnits(
          pool.totalLPCollateral || BigInt(0),
          pool.reserveTokenDecimals
        )
      ) +
      Number(
        formatUnits(
          pool.totalUserDeposits || BigInt(0),
          pool.reserveTokenDecimals
        )
      ) +
      Number(
        formatUnits(
          pool.totalUserCollateral || BigInt(0),
          pool.reserveTokenDecimals
        )
      )
  );

  return (
    <div className="p-6 rounded-lg border border-gray-800 bg-white/5 hover:bg-white/10 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-white/10 overflow-hidden flex items-center justify-center">
            {pool.logoUrl ? (
              <Image
                src={pool.logoUrl}
                alt={`${pool.assetSymbol} logo`}
                width={48}
                height={48}
                className="object-cover"
              />
            ) : (
              <div className="text-xl font-bold text-white/50">
                {pool.assetSymbol.slice(0, 2)}
              </div>
            )}
          </div>
          <div>
            <h3 className="text-xl font-bold">{pool.assetName}</h3>
            <p className="text-gray-400">{pool.assetSymbol}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold">
            ${pool.assetPrice.toFixed(2).toLocaleString()}
          </p>
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
          <span>{pool.reserveToken}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">TVL</span>
          <span>{poolTVL}</span>
        </div>
      </div>
      <div className="flex gap-2">
        <Link href={href} className="flex-1">
          <Button variant="outline" className="w-full">
            {type === "user" ? "Go to Pool" : "Manage Liquidity"}
          </Button>
        </Link>
      </div>
    </div>
  );
};
