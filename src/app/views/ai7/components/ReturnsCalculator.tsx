"use client";

import React, { useMemo } from "react";
import { Calculator } from "lucide-react";

interface ReturnsCalculatorProps {
  investmentAmount: number;
  expectedGrowthRate?: number;
  boostRate?: number;
}

export const ReturnsCalculator: React.FC<ReturnsCalculatorProps> = ({
  investmentAmount,
  expectedGrowthRate = 45,
  boostRate = 24,
}) => {
  const calculations = useMemo(() => {
    const principal = investmentAmount || 0;
    const totalAPY = expectedGrowthRate + boostRate;
    const expectedAnnualAmount = principal + (principal * totalAPY) / 100;

    return {
      principal,
      expectedGrowthRate,
      boostRate,
      expectedAnnualAmount,
    };
  }, [investmentAmount, expectedGrowthRate, boostRate]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value}%`;
  };

  const stats = [
    {
      label: "Net Investment",
      value: formatCurrency(calculations.principal),
      colour: "white",
    },
    {
      label: "Expected Returns (%)",
      value: formatPercent(calculations.expectedGrowthRate),
      colour: "white",
    },
    {
      label: "Boosted Returns (%)",
      value: formatPercent(calculations.boostRate),
      colour: "green",
    },
    {
      label: "Annual Returns (USD)",
      value: formatCurrency(calculations.expectedAnnualAmount),
      colour: "green",
    },
  ];

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-gray-400" />
          <h3 className="text-white font-medium">Returns Calculator</h3>
        </div>
        <span className="text-gray-500 text-sm sm:ml-1">
          Update buy amount to see your expected returns
        </span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-3 sm:p-4"
          >
            <p className="text-gray-400 text-[10px] sm:text-xs mb-1 truncate">
              {stat.label}
            </p>
            <p
              className={`font-semibold text-sm sm:text-lg truncate ${
                stat.colour === "green" ? "text-emerald-400" : "text-white"
              }`}
            >
              {stat.label === "Boosted Returns (%)"
                ? "+" + stat.value
                : stat.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReturnsCalculator;
