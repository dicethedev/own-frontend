"use client";

import { useChainId } from "wagmi";
import SwapCard from "./components/SwapCard";

export default function TradePage() {
  const chainId = useChainId();
  return <SwapCard key={chainId} />;
}
