"use client";

import { ReactNode, useState } from "react";

interface TokenInputProps {
  amount: string;
  tokenName: string;
  tokenAddress: string;
  balance: string;
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

  return (
    <div>
      <div className="flex-1 mb-1">
        {align === "from" ? (
          <span id="from-token-slot">From</span>
        ) : (
          <span id="to-token-slot">To</span>
        )}
      </div>

      <div className="rounded-xl bg-white/5 p-4 mb-3">
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
          <span>Balance: {balance}</span>
        </div>
      </div>
    </div>
  );
}
