"use client";

import { useEffect, useState } from "react";
import { useBalance } from "wagmi";
import { formatUnits } from "viem";

interface UseTokenBalanceProps {
  address?: `0x${string}`; // user wallet
  tokenAddress: `0x${string}`; // token contract (ERC20)
  decimals: number; // token decimals
}

export function useTokenBalance({ address, tokenAddress, decimals }: UseTokenBalanceProps) {
    const { data, isError, isLoading: isLoadingBalance, refetch } = useBalance({
    address,
    token: tokenAddress,
    query: {
      enabled: Boolean(address),
      refetchInterval: 10_000
     },
  });

  const [balance, setBalance] = useState<string>("0");
  const [percentages, setPercentages] = useState({
    p25: "0",
    p50: "0",
    p100: "0",
  });

  useEffect(() => {
     if (!address) {
      setBalance("0");
      setPercentages({ p25: "0", p50: "0", p100: "0" });
      return;
    }

    if (data?.value) {
      const formatted = formatUnits(data.value, decimals);
      setBalance(formatted);

      const num = parseFloat(formatted);
      setPercentages({
        p25: (num * 0.25).toFixed(6),
        p50: (num * 0.5).toFixed(6),
        p100: num.toFixed(6),
      });
    }
  }, [data, decimals, address]);

  return { balance, percentages, isLoadingBalance, isError, refetch };
}
