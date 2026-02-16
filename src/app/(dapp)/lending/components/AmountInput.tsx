"use client";

import React from "react";
import Image from "next/image";

interface AmountInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  tokenSymbol: string;
  tokenLogo: string;
  balance: string;
  balanceLabel?: string;
  decimals?: number;
  disabled?: boolean;
}

export const AmountInput: React.FC<AmountInputProps> = ({
  label,
  value,
  onChange,
  tokenSymbol,
  tokenLogo,
  balance,
  balanceLabel = "Balance",
  disabled = false,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Allow empty, numbers, and single decimal
    if (val === "" || /^\d*\.?\d*$/.test(val)) {
      onChange(val);
    }
  };

  const handleMax = () => {
    onChange(balance);
  };

  const formatBalance = (val: string) => {
    const num = parseFloat(val);
    if (isNaN(num) || num === 0) return "0.00";
    if (num < 0.0001 && num > 0) return "<0.0001";
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: num >= 1 ? 2 : 4,
    }).format(num);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm text-gray-400">{label}</label>
        <button
          type="button"
          onClick={handleMax}
          className="text-xs text-[#2660F5] hover:text-[#4d80ff] transition"
          disabled={disabled}
        >
          {balanceLabel}: {formatBalance(balance)} {tokenSymbol}
        </button>
      </div>
      <div className="flex items-center rounded-xl border border-[#303136] bg-[#1a1b1f] px-3 py-2.5 focus-within:border-[#2660F5] transition">
        <div className="flex items-center gap-2 mr-3 shrink-0">
          <Image
            src={tokenLogo}
            alt={tokenSymbol}
            width={24}
            height={24}
            className="rounded-full"
          />
          <span className="text-sm font-medium text-gray-300">
            {tokenSymbol}
          </span>
        </div>
        <input
          type="text"
          inputMode="decimal"
          placeholder="0.00"
          value={value}
          onChange={handleChange}
          disabled={disabled}
          className="flex-1 bg-transparent text-right text-lg font-medium text-white placeholder-gray-600 outline-none disabled:opacity-50"
        />
      </div>
    </div>
  );
};

export default AmountInput;
