// src/hooks/faucet.ts
import {
  useWriteContract,
  useReadContract,
  useWaitForTransactionReceipt,
  useAccount,
} from "wagmi";
import { Address, formatUnits, parseUnits } from "viem";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { erc20ABI } from "@/config/abis";

// SimpleToken ABI - extends ERC20 with mint function and mintedByAddress
const simpleTokenABI = [
  ...erc20ABI,
  {
    inputs: [{ name: "amount", type: "uint256" }],
    name: "mint",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "mintedByAddress",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "nonOwnerMintLimit",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

interface FaucetTokenConfig {
  address: Address;
  symbol: string;
  name: string;
  decimals: number;
  mintAmount: string; // Amount to mint (e.g., "10000")
}

export const FAUCET_TOKENS: Record<string, FaucetTokenConfig> = {
  USDC: {
    address: "0x2cDAEADd29E6Ba0C3AF2551296D9729fB3c7eD99",
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    mintAmount: "10000",
  },
  USDT: {
    address: "0x7763CeA1702d831c29656b0400a31471e9dDd55d",
    symbol: "USDT",
    name: "Tether USD",
    decimals: 18,
    mintAmount: "10000",
  },
};

export const useFaucet = (tokenKey: keyof typeof FAUCET_TOKENS) => {
  const { address } = useAccount();
  const token = FAUCET_TOKENS[tokenKey];
  const [error, setError] = useState<Error | null>(null);

  const { writeContract, data: hash, isPending } = useWriteContract();
  const {
    isLoading: isConfirming,
    isSuccess,
    data: receipt,
  } = useWaitForTransactionReceipt({
    hash,
  });

  // Get user's token balance
  const {
    data: balance,
    isLoading: isLoadingBalance,
    refetch: refetchBalance,
  } = useReadContract({
    address: token.address,
    abi: simpleTokenABI,
    functionName: "balanceOf",
    args: [address!],
    query: {
      enabled: !!address,
    },
  });

  // Get how much user has already minted
  const {
    data: mintedAmount,
    isLoading: isLoadingMintedAmount,
    refetch: refetchMintedAmount,
  } = useReadContract({
    address: token.address,
    abi: simpleTokenABI,
    functionName: "mintedByAddress",
    args: [address!],
    query: {
      enabled: !!address,
    },
  });

  // Get the mint limit for non-owners
  const { data: mintLimit } = useReadContract({
    address: token.address,
    abi: simpleTokenABI,
    functionName: "nonOwnerMintLimit",
  });

  // Handle successful transaction
  useEffect(() => {
    if (isSuccess && receipt) {
      toast.success(`Successfully minted!`);
      // Refresh balances after successful mint
      setTimeout(() => {
        refetchBalance();
        refetchMintedAmount();
      }, 1000);
    }
  }, [isSuccess, receipt, refetchBalance, refetchMintedAmount]);

  // Mint tokens
  const mint = async () => {
    if (!address) {
      toast.error("Please connect your wallet");
      return;
    }

    try {
      setError(null);
      const mintAmountParsed = parseUnits(token.mintAmount, token.decimals);

      await writeContract({
        address: token.address,
        abi: simpleTokenABI,
        functionName: "mint",
        args: [mintAmountParsed],
      });
    } catch (error) {
      console.error("Error minting tokens:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to mint tokens";
      setError(new Error(errorMessage));
      toast.error(errorMessage);
    }
  };

  // Calculate if user can still mint this specific token
  const canMint = () => {
    if (!address || mintedAmount === undefined || !mintLimit) return true; // Allow if data not loaded yet
    const remainingAmount = mintLimit - mintedAmount;
    const mintAmountParsed = parseUnits(token.mintAmount, token.decimals);
    return remainingAmount >= mintAmountParsed;
  };

  // Calculate remaining mint amount for this specific token
  const getRemainingMintAmount = () => {
    if (mintedAmount === undefined || !mintLimit) return "0";
    const remaining = mintLimit - mintedAmount;
    return formatUnits(remaining, token.decimals);
  };

  return {
    // State
    isLoading: isPending || isConfirming,
    isLoadingBalance,
    isLoadingMintedAmount,
    isSuccess,
    error,
    transactionHash: hash,

    // Data
    balance: balance ? formatUnits(balance, token.decimals) : "0",
    mintedAmount: mintedAmount
      ? formatUnits(mintedAmount, token.decimals)
      : "0",
    mintLimit: mintLimit ? formatUnits(mintLimit, token.decimals) : "0",
    remainingMintAmount: getRemainingMintAmount(),

    // Actions
    mint,
    canMint: canMint(),

    // Token info
    token,
  };
};
