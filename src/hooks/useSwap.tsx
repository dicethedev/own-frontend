import { useCallback } from "react";
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
} from "wagmi";
import type { WriteContractParameters } from "wagmi/actions";
import { V4Planner, Actions, PoolKey } from "@uniswap/v4-sdk";
import { RoutePlanner, CommandType } from "@uniswap/universal-router-sdk";
import { Abi, erc20Abi, parseUnits } from "viem";
import { Token } from "@uniswap/sdk-core";
import { useUniswapContract } from "./useUniswapContract";
import { UniversalRouterABIBase } from "@/config/abis/UniversalRouterABIBase";
import { Permit2ABIBase } from "@/config/abis/Permit2ABIBase";
import { useState } from "react";
import { usePoolLiquidity } from "./usePoolLiquidity";
import { getFriendlyErrorMessage } from "@/app/(dapp)/trade/components/types";

export interface UseSwapParams {
  amountIn?: string;
  fromToken: Token;
  toToken: Token;
  slippage?: number;
  poolKey: PoolKey;
  zeroForOne: boolean;
  userAddress?: `0x${string}`;
}

export function useSwap({
  fromToken,
  toToken,
  poolKey,
  zeroForOne,
  userAddress,
}: UseSwapParams) {
  const universalRouterAddress = useUniswapContract("universalRouter");
  const permit2Address = useUniswapContract("permit2");
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

  const { data: poolLiquidity, isLoading: isPoolLoading } = usePoolLiquidity(
    poolKey
  ) as {
    data: bigint;
    isLoading: boolean;
  };

  // Check ERC20 allowance for Permit2
  const { data: erc20Allowance } = useReadContract({
    address: fromToken.address as `0x${string}`,
    abi: erc20Abi,
    functionName: "allowance",
    args: [userAddress!, permit2Address as `0x${string}`],
    query: { enabled: !!userAddress && !!permit2Address },
  });

  // Check Permit2 allowance for Universal Router
  const { data: permit2Allowance } = useReadContract({
    address: permit2Address as `0x${string}`,
    abi: Permit2ABIBase as Abi,
    functionName: "allowance",
    args: [userAddress!, fromToken.address, universalRouterAddress],
    query: {
      enabled: !!userAddress && !!permit2Address && !!universalRouterAddress,
    },
  });

  // Hook to track ERC20 approval receipt
  const {
    data: approvalReceipt,
    isLoading: isApprovalPending,
    isSuccess: approvalConfirmed,
  } = useWaitForTransactionReceipt({
    hash: approvalTxHash!,
    query: { enabled: !!approvalTxHash },
  });

  // Hook to track Permit2 approval receipt
  const {
    data: permit2ApprovalReceipt,
    isLoading: isPermit2ApprovalPending,
    isSuccess: permit2ApprovalConfirmed,
  } = useWaitForTransactionReceipt({
    hash: permit2ApprovalTxHash!,
    query: { enabled: !!permit2ApprovalTxHash },
  });

  // Hook to track swap receipt
  const {
    data: swapReceipt,
    isLoading: isSwapPending,
    isSuccess: swapConfirmed,
    error: swapError,
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

  // Check if approvals are needed
  const needsERC20Approval = useCallback(
    (amountIn: bigint) => {
      return !erc20Allowance || erc20Allowance < amountIn;
    },
    [erc20Allowance]
  );

  const needsPermit2Approval = useCallback(
    (amountIn: bigint) => {
      if (!permit2Allowance) return true;
      const [amount, expiration] = permit2Allowance as [bigint, bigint, bigint];
      const now = BigInt(Math.floor(Date.now() / 1000));
      return amount < amountIn || expiration <= now;
    },
    [permit2Allowance]
  );

  //Approve ERC20 for Permit2
  async function approveERC20() {
    const MAX_UINT256 = (1n << 256n) - 1n; // 2^256 - 1
    try {
      const txHash = await writeContractAsync({
        address: fromToken.address as `0x${string}`,
        abi: erc20Abi,
        functionName: "approve",
        args: [permit2Address as `0x${string}`, MAX_UINT256], // Use exact amount or max if preferred
      });

      setApprovalTxHash(txHash);
      return txHash;
    } catch (error) {
      const friendlyMessage = getFriendlyErrorMessage(error);
      console.error("ERC20 approval failed:", friendlyMessage);
      setErrorMessage(friendlyMessage);
      throw error;
    }
  }

  // Step 2: Approve Universal Router on Permit2
  async function approvePermit2() {
    const oneYear = 365 * 24 * 60 * 60; // 1 year in seconds
    const deadline = BigInt(Math.floor(Date.now() / 1000) + oneYear);
    const MAX_UINT160 = (1n << 160n) - 1n;
    try {
      const txHash = await writeContractAsync({
        address: permit2Address as `0x${string}`,
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
      console.error("Permit2 approval failed:", error);
      throw error;
    }
  }

  // Main swap execution function
  async function executeSwap(amountIn: string, minAmountOut: string) {
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
      const liquidity = poolLiquidity;
      if (!liquidity || liquidity === 0n) {
        throw new Error("Pool has no liquidity. Cannot swap.");
      }

      const parsedIn = parseUnits(amountIn, fromToken.decimals);
      const parsedMinOut = parseUnits(minAmountOut, toToken.decimals);

      //Check and handle ERC20 approval
      if (needsERC20Approval(parsedIn)) {
        console.log("ERC20 approval needed...");
        await approveERC20();

        // add a 3 second delay to ensure the approval is mined before proceeding
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }

      //Check and handle Permit2 approval
      if (needsPermit2Approval(parsedIn)) {
        console.log("Permit2 approval needed...");
        await approvePermit2();

        // add a 3 second delay to ensure the approval is mined before proceeding
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }

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

      // Finalize the V4 plan - this returns encoded calldata
      const encodedActions = v4Planner.finalize();

      // Create route planner for Universal Router
      const routePlanner = new RoutePlanner();
      routePlanner.addCommand(CommandType.V4_SWAP, [encodedActions]);

      // Get the final commands and inputs
      const commands = routePlanner.commands;
      const inputs = routePlanner.inputs;

      // Execute the swap transaction
      const contractCallParams: WriteContractParameters = {
        address: universalRouterAddress as `0x${string}`,
        abi: UniversalRouterABIBase as Abi,
        functionName: "execute",
        args: [commands, inputs],
        // Only send ETH value if swapping from ETH (currency0 is ETH and zeroForOne is true)
        value:
          poolKey.currency0 === "0x0000000000000000000000000000000000000000" &&
          zeroForOne
            ? parsedIn
            : 0n,
      };

      const swapTx = await writeContractAsync(contractCallParams);
      setSwapTxHash(swapTx);

      return swapTx;
    } catch (error) {
      const friendlyMessage = getFriendlyErrorMessage(error);
      console.error("Swap failed:", friendlyMessage);
      setErrorMessage(friendlyMessage);
      return;
    } finally {
      setIsProcessing(false);
    }
  }

  return {
    executeSwap,
    approvalReceipt,
    permit2ApprovalReceipt,
    swapReceipt,
    swapError,
    swapIsError,
    isApprovalPending,
    approvalConfirmed,
    isPermit2ApprovalPending,
    permit2ApprovalConfirmed,
    isSwapPending,
    swapConfirmed,
    isPending: isPending || isProcessing,
    isError,
    errorMessage,
    resetSwapState,
    needsERC20Approval: (amountIn: string) =>
      needsERC20Approval(parseUnits(amountIn, fromToken.decimals)),
    needsPermit2Approval: (amountIn: string) =>
      needsPermit2Approval(parseUnits(amountIn, fromToken.decimals)),
  };
}
