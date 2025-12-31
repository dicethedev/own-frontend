"use client";

import { useChainId } from "wagmi";
import SwapCard from "./components/SwapCard";

export interface SwapCardProps {
  initialAmount?: string;
  onAmountChange?: (amount: string) => void;
}

export default function SwapUI({
  initialAmount = "",
  onAmountChange,
}: SwapCardProps) {
  const chainId = useChainId();
  return (
    <SwapCard
      key={chainId}
      initialAmount={initialAmount}
      onAmountChange={onAmountChange}
    />
  );
}
