// src/hooks/swap/useSwapV4.ts
import { useCallback, useState } from "react";
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
} from "wagmi";
import type { WriteContractParameters } from "wagmi/actions";
import { V4Planner, Actions } from "@uniswap/v4-sdk";
import { RoutePlanner, CommandType } from "@uniswap/universal-router-sdk";
import { Abi, erc20Abi, parseUnits } from "viem";
import { UniversalRouterABIBase } from "@/config/abis/UniversalRouterABIBase";
import { Permit2ABIBase } from "@/config/abis/Permit2ABIBase";
import { usePoolLiquidityV4 } from "./usePoolLiquidityV4";
import { UseSwapV4Params, SwapResult } from "./types";
import { useUniswapContract } from "./useUniswapContract";

/**
 * useSwapV4
 *
 * Custom React hook to execute swaps via Uniswap V4 through Universal Router.
 */
export function useSwapV4({
  fromToken,
  toToken,
  poolKey,
  zeroForOne,
  userAddress,
}: UseSwapV4Params): SwapResult {
  const universalRouterAddress = useUniswapContract(
    "universalRouter"
  ) as `0x${string}`;
  const permit2Address = useUniswapContract("permit2") as `0x${string}`;

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

  const { liquidity: poolLiquidity, isLoading: isPoolLoading } =
    usePoolLiquidityV4(poolKey);

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
      if (!poolLiquidity || poolLiquidity === 0n) {
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

      // Build V4 swap plan
      const v4Planner = new V4Planner();

      v4Planner.addAction(Actions.SWAP_EXACT_IN_SINGLE, [
        {
          poolKey,
          zeroForOne,
          amountIn: parsedIn,
          amountOutMinimum: parsedMinOut,
          hookData: "0x",
        },
      ]);

      // Settle the input token
      v4Planner.addAction(Actions.SETTLE_ALL, [
        zeroForOne ? poolKey.currency0 : poolKey.currency1,
        parsedIn,
      ]);

      // Take the output token
      v4Planner.addAction(Actions.TAKE_ALL, [
        zeroForOne ? poolKey.currency1 : poolKey.currency0,
        parsedMinOut,
      ]);

      const encodedActions = v4Planner.finalize();

      // Create route planner for Universal Router
      const routePlanner = new RoutePlanner();
      routePlanner.addCommand(CommandType.V4_SWAP, [encodedActions]);

      const commands = routePlanner.commands;
      const inputs = routePlanner.inputs;

      // Execute swap
      const contractCallParams: WriteContractParameters = {
        address: universalRouterAddress,
        abi: UniversalRouterABIBase as Abi,
        functionName: "execute",
        args: [commands, inputs],
        value:
          poolKey.currency0 === "0x0000000000000000000000000000000000000000" &&
          zeroForOne
            ? parsedIn
            : 0n,
      };

      const txHash = await writeContractAsync(contractCallParams);
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
