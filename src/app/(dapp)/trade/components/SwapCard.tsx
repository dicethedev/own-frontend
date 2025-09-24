"use client";

import { useState } from "react";
import { ArrowUpDown } from "lucide-react";
import TokenSelect from "./TokenSelect";
import TokenInput from "./TokenIput";
import { Token } from "./types";
import SwapSettings from "./SwapSettings";

const tokenList = [
  { symbol: "USDC", name: "USDC Coin", logo: "/icons/usdc-logo.png" },
  { symbol: "USDT", name: "USDT Coin", logo: "/icons/usdt-logo.png" },
];

const tokenListRWA = [
  { symbol: "xTSLA", name: "Tesla Inc.", logo: "/icons/tesla-logo.svg" },
];

export default function SwapCard() {
  const [fromToken, setFromToken] = useState<Token>(tokenList[0]);
  const [toToken, setToToken] = useState<Token>(tokenListRWA[0]);

  const [fromAmount, setFromAmount] = useState<string>("");
  const [toAmount, setToAmount] = useState<string>("");

  // Swap tokens (switch between From & To)
  const handleSwitch = () => {
    const tempToken = fromToken;
    const tempAmount = fromAmount;
    setFromToken(toToken);
    setFromAmount(toAmount);
    setToToken(tempToken);
    setToAmount(tempAmount);
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4">
      <div className="w-full max-w-md mx-auto rounded-2xl bg-[#101828] p-6 shadow-xl border border-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Swap</h2>
          <SwapSettings />
        </div>

        {/* From Section */}
        <TokenInput
          tokenName={fromToken.name}
          amount={fromAmount}
          balance="16,600.087"
          align="from"
          percentageChange={0}
          onAmountChange={setFromAmount}
          tokenSelect={
            <TokenSelect
              tokens={tokenList}
              selected={fromToken}
              onSelect={setFromToken}
            />
          }
        />

        {/* Switch Button */}
        <div className="flex justify-center my-2">
          <button
            onClick={handleSwitch}
            className="p-2 bg-[#1B2430] rounded-full hover:bg-[#243040] transition"
          >
            <ArrowUpDown size={20} className="text-gray-300" />
          </button>
        </div>

        {/* To Section */}
        <TokenInput
          tokenName={toToken.name}
          amount={toAmount}
          percentageChange={1.05}
          balance="2.45"
          align="to"
          onAmountChange={setToAmount}
          tokenSelect={
            <TokenSelect
              tokens={tokenListRWA}
              selected={toToken}
              onSelect={setToToken}
            />
          }
        />

        {/* Swap Button */}
        <button
          className="w-full mt-10 py-3 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#1E3A8A]
          text-white font-medium hover:opacity-90 transition"
        >
          Enter an amount
        </button>
      </div>
    </div>
  );
}
