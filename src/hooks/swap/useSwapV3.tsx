// src/hooks/swap/useSwapV3.ts
import { useCallback, useState, useMemo } from "react";
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
} from "wagmi";
import { parseUnits, encodePacked, getAddress, Abi, erc20Abi } from "viem";
import { RoutePlanner, CommandType } from "@uniswap/universal-router-sdk";
import { Permit2ABIBase } from "@/config/abis/Permit2ABIBase";
import { UniversalRouterABIBase } from "@/config/abis/UniversalRouterABIBase";
import {
  UniswapV3PoolABI,
  UniswapV3FactoryABI,
} from "@/config/abis/UniswapV3PoolABI";
import { UseSwapV3Params, SwapResult } from "./types";
import { useUniswapContract } from "./useUniswapContract";

const V3_FEE = 3000; // 0.3%

/**
 * useSwapV3
 *
 * Custom React hook to execute swaps via Uniswap V3 through Universal Router.
 * Uses Permit2 for approvals (same flow as V4).
 */
export function useSwapV3({
  fromToken,
  toToken,
  fee = V3_FEE,
  userAddress,
}: UseSwapV3Params): SwapResult {
  const universalRouterAddress = useUniswapContract(
    "universalRouter"
  ) as `0x${string}`;
  const permit2Address = useUniswapContract("permit2") as `0x${string}`;
  const factoryAddress = useUniswapContract("factory") as `0x${string}`;

  const {
    writeContractAsync,
    isPending,
    isError,
    reset: resetWrite,
  } = useWriteContract();

  const [approvalTxHash, setApprovalTxHash] = useState<`0x${string}` | null>(
    null
  );
  const [permit2ApprovalTxHash, setPermit2ApprovalTxHash] = useState<
    `0x${string}` | null
  >(null);
  const [swapTxHash, setSwapTxHash] = useState<`0x${string}` | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Sort tokens
  const [token0, token1] = useMemo(() => {
    const addr0 = getAddress(fromToken.address);
    const addr1 = getAddress(toToken.address);
    return addr0.toLowerCase() < addr1.toLowerCase()
      ? [addr0, addr1]
      : [addr1, addr0];
  }, [fromToken.address, toToken.address]);

  // Get pool address for liquidity check
  const { data: poolAddress } = useReadContract({
    address: factoryAddress,
    abi: UniswapV3FactoryABI,
    functionName: "getPool",
    args: [token0, token1, fee],
    query: {
      enabled: !!factoryAddress && !!token0 && !!token1,
    },
  });

  // Check pool liquidity
  const { data: poolLiquidity, isLoading: isPoolLoading } = useReadContract({
    address: poolAddress as `0x${string}`,
    abi: UniswapV3PoolABI,
    functionName: "liquidity",
    query: {
      enabled:
        !!poolAddress &&
        poolAddress !== "0x0000000000000000000000000000000000000000",
    },
  });

  // Check ERC20 allowance for Permit2
  const { data: erc20Allowance } = useReadContract({
    address: fromToken.address as `0x${string}`,
    abi: erc20Abi,
    functionName: "allowance",
    args: [userAddress!, permit2Address],
    query: { enabled: !!userAddress && !!permit2Address },
  });

  // Check Permit2 allowance for Universal Router
  const { data: permit2Allowance } = useReadContract({
    address: permit2Address,
    abi: Permit2ABIBase as Abi,
    functionName: "allowance",
    args: [userAddress!, fromToken.address, universalRouterAddress],
    query: {
      enabled: !!userAddress && !!permit2Address && !!universalRouterAddress,
    },
  });

  // Transaction receipt hooks
  const { isLoading: isApprovalPending, isSuccess: approvalConfirmed } =
    useWaitForTransactionReceipt({
      hash: approvalTxHash!,
      query: { enabled: !!approvalTxHash },
    });

  const {
    isLoading: isPermit2ApprovalPending,
    isSuccess: permit2ApprovalConfirmed,
  } = useWaitForTransactionReceipt({
    hash: permit2ApprovalTxHash!,
    query: { enabled: !!permit2ApprovalTxHash },
  });

  const {
    isLoading: isSwapPending,
    isSuccess: swapConfirmed,
    isError: swapIsError,
  } = useWaitForTransactionReceipt({
    hash: swapTxHash!,
    query: { enabled: !!swapTxHash },
  });

  // Reset swap state
  const resetSwapState = useCallback(() => {
    setApprovalTxHash(null);
    setPermit2ApprovalTxHash(null);
    setSwapTxHash(null);
    setErrorMessage(null);
    setIsProcessing(false);
    resetWrite();
  }, [resetWrite]);

  // While processing
  const resetSwapStateWhileProcessing = useCallback(() => {
    setApprovalTxHash(null);
    setPermit2ApprovalTxHash(null);
    setSwapTxHash(null);
    setErrorMessage(null);
    resetWrite();
  }, [resetWrite]);

  // Check if approvals are needed
  const needsERC20Approval = useCallback(
    (amountIn: string | bigint) => {
      const amount =
        typeof amountIn === "string"
          ? parseUnits(amountIn, fromToken.decimals)
          : amountIn;
      return !erc20Allowance || erc20Allowance < amount;
    },
    [erc20Allowance, fromToken.decimals]
  );

  const needsPermit2Approval = useCallback(
    (amountIn: string | bigint) => {
      const amount =
        typeof amountIn === "string"
          ? parseUnits(amountIn, fromToken.decimals)
          : amountIn;
      if (!permit2Allowance) return true;
      const [allowedAmount, expiration] = permit2Allowance as [
        bigint,
        bigint,
        bigint
      ];
      const now = BigInt(Math.floor(Date.now() / 1000));
      return allowedAmount < amount || expiration <= now;
    },
    [permit2Allowance, fromToken.decimals]
  );

  // Error handler
  function handleWriteError(err: unknown) {
    const message = (() => {
      if (!err) return "Unknown error";
      if (typeof err === "object" && err !== null) {
        const errorObj = err as { code?: number; message?: string };
        if (errorObj.code === 4001) return "Transaction was cancelled!";
        if (errorObj.message?.includes("User rejected")) {
          return "Transaction was cancelled!";
        }
        return errorObj.message ?? "Unknown error";
      }
      return String(err);
    })();
    setErrorMessage(message);
    console.error("write error:", err);
    return message;
  }

  // Approve ERC20 for Permit2
  async function approveERC20() {
    const MAX_UINT256 = (1n << 256n) - 1n;
    try {
      const txHash = await writeContractAsync({
        address: fromToken.address as `0x${string}`,
        abi: erc20Abi,
        functionName: "approve",
        args: [permit2Address, MAX_UINT256],
      });
      setApprovalTxHash(txHash);
      return txHash;
    } catch (error) {
      handleWriteError(error);
      throw error;
    }
  }

  // Approve Universal Router on Permit2
  async function approvePermit2() {
    const oneYear = 365 * 24 * 60 * 60;
    const deadline = BigInt(Math.floor(Date.now() / 1000) + oneYear);
    const MAX_UINT160 = (1n << 160n) - 1n;
    try {
      const txHash = await writeContractAsync({
        address: permit2Address,
        abi: Permit2ABIBase as Abi,
        functionName: "approve",
        args: [
          fromToken.address,
          universalRouterAddress,
          MAX_UINT160,
          deadline,
        ],
      });
      setPermit2ApprovalTxHash(txHash);
      return txHash;
    } catch (error) {
      handleWriteError(error);
      throw error;
    }
  }

  // Main swap execution
  async function executeSwap(
    amountIn: string,
    minAmountOut: string
  ): Promise<`0x${string}` | undefined> {
    if (!userAddress) {
      setErrorMessage("User address is required");
      return;
    }

    setErrorMessage(null);
    setIsProcessing(true);

    try {
      if (isPoolLoading) {
        throw new Error("Pool state still loading...");
      }

      // Check liquidity
      const liquidity = poolLiquidity as bigint | undefined;
      if (!liquidity || liquidity === 0n) {
        throw new Error("Pool has no liquidity. Cannot swap.");
      }

      const parsedIn = parseUnits(amountIn, fromToken.decimals);
      const parsedMinOut = parseUnits(minAmountOut, toToken.decimals);

      // Handle ERC20 approval
      if (needsERC20Approval(parsedIn)) {
        console.log("ERC20 approval needed...");
        await approveERC20();
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }

      // Handle Permit2 approval
      if (needsPermit2Approval(parsedIn)) {
        console.log("Permit2 approval needed...");
        await approvePermit2();
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }

      // Encode the V3 swap path: tokenIn + fee + tokenOut
      const path = encodePacked(
        ["address", "uint24", "address"],
        [getAddress(fromToken.address), fee, getAddress(toToken.address)]
      );

      // Create route planner for Universal Router with V3_SWAP_EXACT_IN
      const routePlanner = new RoutePlanner();

      // V3_SWAP_EXACT_IN command
      // Parameters: [recipient, amountIn, amountOutMin, path, payerIsUser]
      routePlanner.addCommand(CommandType.V3_SWAP_EXACT_IN, [
        userAddress, // recipient
        parsedIn, // amountIn
        parsedMinOut, // amountOutMinimum
        path, // encoded path
        true, // payerIsUser (tokens come from msg.sender via Permit2)
      ]);

      const commands = routePlanner.commands;
      const inputs = routePlanner.inputs;

      // Execute swap
      const txHash = await writeContractAsync({
        address: universalRouterAddress,
        abi: UniversalRouterABIBase as Abi,
        functionName: "execute",
        args: [commands, inputs],
      });

      setSwapTxHash(txHash);
      return txHash;
    } catch (err) {
      handleWriteError(err);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }

  return {
    executeSwap,
    isPending,
    isApprovalPending,
    approvalConfirmed,
    isPermit2ApprovalPending,
    permit2ApprovalConfirmed,
    isSwapPending,
    swapConfirmed,
    swapIsError,
    isError,
    errorMessage,
    resetSwapState,
    resetSwapStateWhileProcessing,
    needsERC20Approval,
    needsPermit2Approval,
    isProcessing,
  };
}
