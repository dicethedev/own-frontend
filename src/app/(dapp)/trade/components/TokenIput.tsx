"use client";

import { ReactNode, useState } from "react";

interface TokenInputProps {
  amount: string;
  tokenName: string;
  tokenAddress: string;
  balance: string;
  isLoading?: boolean;
  align?: "from" | "to";
  onAmountChange: (val: string) => void;
  placeholder?: string;
  tokenSelect?: ReactNode;
}

export default function TokenInput({
  amount,
  tokenName,
  tokenAddress,
  balance,
  isLoading,
  align,
  onAmountChange,
  placeholder = "0.0",
  tokenSelect,
}: TokenInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  // Custom formatter for display when not typing
  const formatNumber = (val: string) => {
    if (!val) return "";
    const num = parseFloat(val);
    if (isNaN(num)) return val;

    // Format big numbers but keep up to 6 decimals
    return num.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 6,
    });
  };

  const handleSelectPercent = (percent: number) => {
    const bal = parseFloat(balance);
    if (isNaN(bal)) return;
    const val = ((bal * percent) / 100).toString();
    onAmountChange(val);
  };

  return (
    <div>
      <div className="flex-1 mb-1">
        {align === "from" ? (
          <span id="from-token-slot"></span>
        ) : (
          <span id="to-token-slot"></span>
        )}
      </div>

      <div className="rounded-xl bg-white/5 p-4 mb-3 group relative">
        {/* Max Button section */}
        <div
          className="flex justify-end gap-1 mb-2 opacity-0 group-hover:opacity-100 
            transition-opacity duration-200"
        >
          {[25, 50, 75, 100].map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => handleSelectPercent(p)}
              className="px-1.5 py-0.5 rounded text-xs font-medium bg-gray-800/40 border-gray-200
               text-gray-400 hover:bg-gray-700/50"
            >
              <span>{p === 100 ? "Max" : `${p}%`}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between mb-2">
          {/* Left side: TokenSelect */}
          <div className="flex-1">{tokenSelect}</div>

          {/* Right side: Amount Input */}
          <input
            type="text"
            inputMode="decimal"
            placeholder={placeholder}
            value={isFocused ? amount : formatNumber(amount)}
            onChange={(e) => {
              const val = e.target.value;
              //allow only digits + one dot
              if (/^\d*\.?\d*$/.test(val)) {
                onAmountChange(val);
              }
            }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="bg-transparent text-right text-xl font-medium text-white outline-none w-28 
            [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none
            [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>

        {/* Token Info */}
        <div className="flex items-center justify-between text-xs text-gray-400 mt-4">
          <span className="flex items-center gap-1">
            <a
              href={`https://basescan.org/token/${tokenAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-400 hover:underline"
            >
              {tokenName}
            </a>
          </span>
          {isLoading ? (
            <div className="h-4 bg-gray-600 rounded w-24 animate-pulse" />
          ) : (
            <span>Balance: {Number(balance).toFixed(6)}</span>
          )}
        </div>
      </div>
    </div>
  );
}
