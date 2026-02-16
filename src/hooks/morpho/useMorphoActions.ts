// src/hooks/useMorphoActions.ts
import { useCallback, useMemo, useState } from "react";
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useAccount,
} from "wagmi";
import { parseUnits, erc20Abi } from "viem";
import toast from "react-hot-toast";
import {
  MORPHO_BLUE_ADDRESS,
  MorphoBlueABI,
  MorphoMarketParams,
  USDC_DECIMALS,
  AI7_DECIMALS,
} from "@/config/morpho";

export type MorphoActionType =
  | "supply"
  | "withdraw"
  | "supplyCollateral"
  | "withdrawCollateral"
  | "borrow"
  | "repay"
  | "approveUsdc"
  | "approveAi7";

export interface MorphoActionsResult {
  // Actions
  approveUsdc: (amount: string) => Promise<void>;
  approveAi7: (amount: string) => Promise<void>;
  supply: (amount: string) => Promise<void>;
  withdraw: (
    amount: string,
    useShares?: boolean,
    shares?: bigint,
  ) => Promise<void>;
  supplyCollateral: (amount: string) => Promise<void>;
  withdrawCollateral: (amount: string) => Promise<void>;
  borrow: (amount: string) => Promise<void>;
  repay: (
    amount: string,
    useShares?: boolean,
    shares?: bigint,
  ) => Promise<void>;
  // State
  currentAction: MorphoActionType | null;
  isPending: boolean;
  isConfirming: boolean;
  isSuccess: boolean;
  errorMessage: string | null;
  txHash: `0x${string}` | undefined;
  reset: () => void;
}

export function useMorphoActions(
  marketParams: MorphoMarketParams | null,
  onSuccess?: () => void,
): MorphoActionsResult {
  const { address } = useAccount();
  const [currentAction, setCurrentAction] = useState<MorphoActionType | null>(
    null,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    writeContractAsync,
    data: txHash,
    isPending,
    reset: resetWrite,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
    query: {
      enabled: !!txHash,
    },
  });

  // Handle success
  const handleSuccess = useCallback(
    (action: string) => {
      const messages: Record<string, string> = {
        supply: "USDC supplied successfully!",
        withdraw: "USDC withdrawn successfully!",
        supplyCollateral: "AI7 collateral deposited successfully!",
        withdrawCollateral: "AI7 collateral withdrawn successfully!",
        borrow: "USDC borrowed successfully!",
        repay: "Debt repaid successfully!",
        approveUsdc: "USDC approved successfully!",
        approveAi7: "AI7 approved successfully!",
      };
      toast.success(messages[action] || "Transaction successful!");
      onSuccess?.();
    },
    [onSuccess],
  );

  // Handle errors
  function handleError(err: unknown): string {
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
  }

  const marketParamsTuple = useMemo(
    () =>
      marketParams
        ? {
            loanToken: marketParams.loanToken,
            collateralToken: marketParams.collateralToken,
            oracle: marketParams.oracle,
            irm: marketParams.irm,
            lltv: marketParams.lltv,
          }
        : null,
    [marketParams],
  );

  // ── Approve USDC ──
  const approveUsdc = useCallback(
    async (amount: string) => {
      if (!address) return;
      setCurrentAction("approveUsdc");
      setErrorMessage(null);
      try {
        const parsedAmount = parseUnits(amount, USDC_DECIMALS);
        await writeContractAsync({
          address: marketParams!.loanToken,
          abi: erc20Abi,
          functionName: "approve",
          args: [MORPHO_BLUE_ADDRESS, parsedAmount],
        });
        handleSuccess("approveUsdc");
      } catch (err) {
        const msg = handleError(err);
        setErrorMessage(msg);
        toast.error(msg);
      }
    },
    [address, writeContractAsync, marketParams, handleSuccess],
  );

  // ── Approve AI7 ──
  const approveAi7 = useCallback(
    async (amount: string) => {
      if (!address) return;
      setCurrentAction("approveAi7");
      setErrorMessage(null);
      try {
        const parsedAmount = parseUnits(amount, AI7_DECIMALS);
        await writeContractAsync({
          address: marketParams!.collateralToken,
          abi: erc20Abi,
          functionName: "approve",
          args: [MORPHO_BLUE_ADDRESS, parsedAmount],
        });
        handleSuccess("approveAi7");
      } catch (err) {
        const msg = handleError(err);
        setErrorMessage(msg);
        toast.error(msg);
      }
    },
    [address, writeContractAsync, marketParams, handleSuccess],
  );

  // ── Supply USDC (lend) ──
  const supply = useCallback(
    async (amount: string) => {
      if (!address || !marketParamsTuple) return;
      setCurrentAction("supply");
      setErrorMessage(null);
      try {
        const parsedAmount = parseUnits(amount, USDC_DECIMALS);
        await writeContractAsync({
          address: MORPHO_BLUE_ADDRESS,
          abi: MorphoBlueABI,
          functionName: "supply",
          args: [marketParamsTuple, parsedAmount, 0n, address, "0x"],
        });
        handleSuccess("supply");
      } catch (err) {
        const msg = handleError(err);
        setErrorMessage(msg);
        toast.error(msg);
      }
    },
    [address, writeContractAsync, marketParamsTuple, handleSuccess],
  );

  // ── Withdraw USDC (un-lend) ──
  const withdraw = useCallback(
    async (amount: string, useShares = false, shares?: bigint) => {
      if (!address || !marketParamsTuple) return;
      setCurrentAction("withdraw");
      setErrorMessage(null);
      try {
        if (useShares && shares) {
          // Withdraw all using shares
          await writeContractAsync({
            address: MORPHO_BLUE_ADDRESS,
            abi: MorphoBlueABI,
            functionName: "withdraw",
            args: [marketParamsTuple, 0n, shares, address, address],
          });
        } else {
          const parsedAmount = parseUnits(amount, USDC_DECIMALS);
          await writeContractAsync({
            address: MORPHO_BLUE_ADDRESS,
            abi: MorphoBlueABI,
            functionName: "withdraw",
            args: [marketParamsTuple, parsedAmount, 0n, address, address],
          });
        }
        handleSuccess("withdraw");
      } catch (err) {
        const msg = handleError(err);
        setErrorMessage(msg);
        toast.error(msg);
      }
    },
    [address, writeContractAsync, marketParamsTuple, handleSuccess],
  );

  // ── Supply Collateral (deposit AI7) ──
  const supplyCollateral = useCallback(
    async (amount: string) => {
      if (!address || !marketParamsTuple) return;
      setCurrentAction("supplyCollateral");
      setErrorMessage(null);
      try {
        const parsedAmount = parseUnits(amount, AI7_DECIMALS);
        await writeContractAsync({
          address: MORPHO_BLUE_ADDRESS,
          abi: MorphoBlueABI,
          functionName: "supplyCollateral",
          args: [marketParamsTuple, parsedAmount, address, "0x"],
        });
        handleSuccess("supplyCollateral");
      } catch (err) {
        const msg = handleError(err);
        setErrorMessage(msg);
        toast.error(msg);
      }
    },
    [address, writeContractAsync, marketParamsTuple, handleSuccess],
  );

  // ── Withdraw Collateral (withdraw AI7) ──
  const withdrawCollateral = useCallback(
    async (amount: string) => {
      if (!address || !marketParamsTuple) return;
      setCurrentAction("withdrawCollateral");
      setErrorMessage(null);
      try {
        const parsedAmount = parseUnits(amount, AI7_DECIMALS);
        await writeContractAsync({
          address: MORPHO_BLUE_ADDRESS,
          abi: MorphoBlueABI,
          functionName: "withdrawCollateral",
          args: [marketParamsTuple, parsedAmount, address, address],
        });
        handleSuccess("withdrawCollateral");
      } catch (err) {
        const msg = handleError(err);
        setErrorMessage(msg);
        toast.error(msg);
      }
    },
    [address, writeContractAsync, marketParamsTuple, handleSuccess],
  );

  // ── Borrow USDC ──
  const borrow = useCallback(
    async (amount: string) => {
      if (!address || !marketParamsTuple) return;
      setCurrentAction("borrow");
      setErrorMessage(null);
      try {
        const parsedAmount = parseUnits(amount, USDC_DECIMALS);
        await writeContractAsync({
          address: MORPHO_BLUE_ADDRESS,
          abi: MorphoBlueABI,
          functionName: "borrow",
          args: [marketParamsTuple, parsedAmount, 0n, address, address],
        });
        handleSuccess("borrow");
      } catch (err) {
        const msg = handleError(err);
        setErrorMessage(msg);
        toast.error(msg);
      }
    },
    [address, writeContractAsync, marketParamsTuple, handleSuccess],
  );

  // ── Repay USDC ──
  const repay = useCallback(
    async (amount: string, useShares = false, shares?: bigint) => {
      if (!address || !marketParamsTuple) return;
      setCurrentAction("repay");
      setErrorMessage(null);
      try {
        if (useShares && shares) {
          // Full repay using shares to avoid dust
          await writeContractAsync({
            address: MORPHO_BLUE_ADDRESS,
            abi: MorphoBlueABI,
            functionName: "repay",
            args: [marketParamsTuple, 0n, shares, address, "0x"],
          });
        } else {
          const parsedAmount = parseUnits(amount, USDC_DECIMALS);
          await writeContractAsync({
            address: MORPHO_BLUE_ADDRESS,
            abi: MorphoBlueABI,
            functionName: "repay",
            args: [marketParamsTuple, parsedAmount, 0n, address, "0x"],
          });
        }
        handleSuccess("repay");
      } catch (err) {
        const msg = handleError(err);
        setErrorMessage(msg);
        toast.error(msg);
      }
    },
    [address, writeContractAsync, marketParamsTuple, handleSuccess],
  );

  const reset = useCallback(() => {
    setCurrentAction(null);
    setErrorMessage(null);
    resetWrite();
  }, [resetWrite]);

  return {
    approveUsdc,
    approveAi7,
    supply,
    withdraw,
    supplyCollateral,
    withdrawCollateral,
    borrow,
    repay,
    currentAction,
    isPending,
    isConfirming,
    isSuccess,
    errorMessage,
    txHash,
    reset,
  };
}
