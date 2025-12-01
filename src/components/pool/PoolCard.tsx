import React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/BaseComponents";
import { Pool } from "../../types/pool";
import Link from "next/link";
import { formatUnits } from "viem";
import { formatTVL } from "@/utils/tvl-formatting";
import { Clock } from "lucide-react";

export const PoolCard: React.FC<{ pool: Pool; type: "user" | "lp" }> = ({
  pool,
  type,
}) => {
  const href =
    type === "user"
      ? `/protocol/lp/buy-side/${pool.assetSymbol.toLowerCase()}`
      : `/protocol/lp/sell-side/${pool.assetSymbol.toLowerCase()}`;

  const isComingSoon = "comingSoon" in pool && pool.comingSoon;

  const poolTVL = formatTVL(
    Number(
      formatUnits(
        pool.totalLPLiquidityCommited || BigInt(0),
        pool.reserveTokenDecimals
      )
    ) *
      ((pool.lpHealthyCollateralRatio || 0) / 10000) +
      // Number(
      //   formatUnits(
      //     pool.totalLPCollateral || BigInt(0),
      //     pool.reserveTokenDecimals
      //   )
      // ) +
      Number(
        formatUnits(
          pool.aggregatePoolReserves || BigInt(0),
          pool.reserveTokenDecimals
        )
      )
  );

  return (
    <div
      className={`p-4 rounded-lg border transition-all duration-200 ${
        isComingSoon
          ? "bg-white/5 border-gray-700/50 opacity-60"
          : "bg-white/10 border-gray-800 hover:border-gray-700"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
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
            <h3
              data-testid="asset-name"
              className={`font-semibold ${
                isComingSoon ? "text-gray-500" : "text-white"
              }`}
            >
              {pool.assetName}
            </h3>
            <p
              data-testid="asset-symbol"
              className={isComingSoon ? "text-gray-600" : "text-gray-400"}
            >
              {pool.assetSymbol}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p
            className={`font-semibold ${
              isComingSoon ? "text-gray-500" : "text-white"
            }`}
          >
            $
            {pool.assetPrice?.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }) ?? "—"}
          </p>
          <p
            className={
              isComingSoon
                ? "text-gray-600"
                : pool.priceChange >= 0
                ? "text-green-500"
                : "text-red-500"
            }
          >
            {pool.priceChange >= 0 ? "+" : ""}
            {pool.priceChange}%
          </p>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className={isComingSoon ? "text-gray-600" : "text-gray-400"}>
            Deposit Token:
          </span>
          <span className={isComingSoon ? "text-gray-500" : "text-white"}>
            {pool.reserveToken}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className={isComingSoon ? "text-gray-600" : "text-gray-400"}>
            TVL
          </span>
          <span className={isComingSoon ? "text-gray-500" : "text-white"}>
            {isComingSoon ? "—" : poolTVL}
          </span>
        </div>
      </div>

      {/* Action Button */}
      <div className="flex gap-2">
        {isComingSoon ? (
          <Button
            variant="outline"
            className="w-full cursor-not-allowed opacity-50 border-gray-700 text-gray-500"
            disabled
          >
            <Clock className="w-4 h-4 mr-2" />
            Coming Soon
          </Button>
        ) : (
          <Link href={href} className="flex-1">
            <Button variant="outline" className="w-full">
              {type === "user" ? "Manage Position" : "Manage Liquidity"}
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
};
