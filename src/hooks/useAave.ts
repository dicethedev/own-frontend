import { useState, useEffect, useCallback, useRef } from "react";
import {
  useAccount,
  useChainId,
  useWriteContract,
  useReadContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { Address, formatUnits, maxUint256, parseUnits } from "viem";
import toast from "react-hot-toast";
import { getAaveConfig, aavePoolABI, isAaveSupported } from "@/config/aave";
import { erc20ABI } from "@/config/abis";

export type AaveAction = "supply" | "withdraw" | "approve" | null;

export type TxPhase = "idle" | "wallet" | "confirming";

export interface AaveTxState {
  action: AaveAction;
  phase: TxPhase;
}

export function useAave() {
  const { address } = useAccount();
  const chainId = useChainId();
  const config = getAaveConfig(chainId);

  const [txState, setTxState] = useState<AaveTxState>({
    action: null,
    phase: "idle",
  });
  const [error, setError] = useState<Error | null>(null);
  const [lastSuccess, setLastSuccess] = useState<"supply" | "withdraw" | null>(
    null,
  );

  const cachedUsdcBalance = useRef<string>("0");
  const cachedAUsdcBalance = useRef<string>("0");
  const approvedMax = useRef(false);

  const {
    writeContract: writeApprove,
    data: approveHash,
    error: approveWriteError,
    reset: resetApprove,
  } = useWriteContract();

  const {
    writeContract: writeAction,
    data: actionHash,
    error: actionWriteError,
    reset: resetAction,
  } = useWriteContract();

  const {
    isLoading: isApproveConfirming,
    isSuccess: isApproveSuccess,
    data: approveReceipt,
    error: approveReceiptError,
  } = useWaitForTransactionReceipt({ hash: approveHash });

  const {
    isLoading: isActionConfirming,
    isSuccess: isActionSuccess,
    data: actionReceipt,
    error: actionReceiptError,
  } = useWaitForTransactionReceipt({ hash: actionHash });

  const {
    data: usdcBalanceRaw,
    isLoading: isInitialUsdcLoad,
    refetch: refetchUsdcBalance,
  } = useReadContract({
    address: config?.usdcAddress,
    abi: erc20ABI,
    functionName: "balanceOf",
    args: [address as Address],
    query: { enabled: !!address && !!config },
  });

  const {
    data: aUsdcBalanceRaw,
    isLoading: isInitialAUsdcLoad,
    refetch: refetchAUsdcBalance,
  } = useReadContract({
    address: config?.aUsdcAddress,
    abi: erc20ABI,
    functionName: "balanceOf",
    args: [address as Address],
    query: { enabled: !!address && !!config },
  });

  const { data: usdcAllowanceRaw, refetch: refetchAllowance } = useReadContract(
    {
      address: config?.usdcAddress,
      abi: erc20ABI,
      functionName: "allowance",
      args: address && config ? [address, config.poolAddress] : undefined,
      query: { enabled: !!address && !!config },
    },
  );

  const usdcBalance = usdcBalanceRaw as bigint | undefined;
  const aUsdcBalance = aUsdcBalanceRaw as bigint | undefined;
  const usdcAllowance = usdcAllowanceRaw as bigint | undefined;

  if (usdcBalance !== undefined) {
    cachedUsdcBalance.current = formatUnits(
      usdcBalance,
      config?.usdcDecimals ?? 6,
    );
  }
  if (aUsdcBalance !== undefined) {
    cachedAUsdcBalance.current = formatUnits(
      aUsdcBalance,
      config?.aUsdcDecimals ?? 6,
    );
  }

  const formattedUsdcBalance = cachedUsdcBalance.current;
  const formattedAUsdcBalance = cachedAUsdcBalance.current;

  const isLoadingUsdcBalance = isInitialUsdcLoad && usdcBalance === undefined;
  const isLoadingAUsdcBalance =
    isInitialAUsdcLoad && aUsdcBalance === undefined;

  useEffect(() => {
    if (txState.action === "approve") {
      if (isApproveConfirming && txState.phase !== "confirming") {
        setTxState({ action: "approve", phase: "confirming" });
      }
    } else if (txState.action === "supply" || txState.action === "withdraw") {
      if (isActionConfirming && txState.phase !== "confirming") {
        setTxState((prev) => ({ ...prev, phase: "confirming" }));
      }
    }
  }, [txState.action, txState.phase, isApproveConfirming, isActionConfirming]);

  const refetchAll = useCallback(() => {
    refetchUsdcBalance();
    refetchAUsdcBalance();
    refetchAllowance();
  }, [refetchUsdcBalance, refetchAUsdcBalance, refetchAllowance]);

  useEffect(() => {
    if (isApproveSuccess && approveReceipt && txState.action === "approve") {
      toast.success("USDC approved for Aave");
      approvedMax.current = true;
      setTxState({ action: null, phase: "idle" });
      resetApprove();
      refetchAllowance();

      const timer = setTimeout(() => refetchAllowance(), 2500);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isApproveSuccess, approveReceipt]);

  useEffect(() => {
    if (
      isActionSuccess &&
      actionReceipt &&
      (txState.action === "supply" || txState.action === "withdraw")
    ) {
      const completedAction = txState.action;
      toast.success(
        completedAction === "supply"
          ? "USDC supplied to Aave successfully"
          : "USDC withdrawn from Aave successfully",
      );

      setLastSuccess(completedAction);
      setTxState({ action: null, phase: "idle" });
      resetAction();
      refetchAll();

      const timer = setTimeout(refetchAll, 2500);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActionSuccess, actionReceipt]);

  useEffect(() => {
    const err = approveWriteError || approveReceiptError;
    if (err && txState.action === "approve") {
      const reason =
        (err as { shortMessage?: string })?.shortMessage ||
        (err instanceof Error ? err.message : "Approval failed");
      console.error("Aave approve error:", err);
      setError(new Error(reason));
      toast.error(`Approval failed: ${reason}`);
      setTxState({ action: null, phase: "idle" });
      resetApprove();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [approveWriteError, approveReceiptError]);

  useEffect(() => {
    const err = actionWriteError || actionReceiptError;
    if (err && (txState.action === "supply" || txState.action === "withdraw")) {
      const reason =
        (err as { shortMessage?: string })?.shortMessage ||
        (err instanceof Error ? err.message : "Transaction failed");
      console.error("Aave action error:", err);
      setError(new Error(reason));
      toast.error(
        txState.action === "supply"
          ? `Supply failed: ${reason}`
          : `Withdraw failed: ${reason}`,
      );
      setTxState({ action: null, phase: "idle" });
      resetAction();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionWriteError, actionReceiptError]);

  const needsApproval = useCallback(
    (amount: string): boolean => {
      if (approvedMax.current) return false;
      if (!config || usdcAllowance === undefined) return true;
      try {
        const parsedAmount = parseUnits(amount, config.usdcDecimals);
        return usdcAllowance < parsedAmount;
      } catch {
        return true;
      }
    },
    [config, usdcAllowance],
  );

  const approveUsdc = useCallback(() => {
    if (!config || !address) {
      toast.error("Wallet not connected or chain not supported");
      return;
    }

    setError(null);
    setTxState({ action: "approve", phase: "wallet" });

    writeApprove({
      address: config.usdcAddress,
      abi: erc20ABI,
      functionName: "approve",
      args: [config.poolAddress, maxUint256],
    });
  }, [config, address, writeApprove]);

  const supply = useCallback(
    (amount: string) => {
      if (!config || !address) {
        toast.error("Wallet not connected or chain not supported");
        return;
      }

      if (usdcBalance === undefined) {
        toast.error("Balance not loaded yet. Please try again.");
        return;
      }

      const parsedAmount = parseUnits(amount, config.usdcDecimals);
      if (usdcBalance < parsedAmount) {
        toast.error("Insufficient USDC balance");
        return;
      }

      setError(null);
      setLastSuccess(null);
      setTxState({ action: "supply", phase: "wallet" });

      writeAction({
        address: config.poolAddress,
        abi: aavePoolABI,
        functionName: "supply",
        args: [config.usdcAddress, parsedAmount, address, 0],
      });
    },
    [config, address, usdcBalance, writeAction],
  );

  const withdraw = useCallback(
    (amount: string) => {
      if (!config || !address) {
        toast.error("Wallet not connected or chain not supported");
        return;
      }

      if (aUsdcBalance === undefined) {
        toast.error("Balance not loaded yet. Please try again.");
        return;
      }

      const parsedAmount = parseUnits(amount, config.aUsdcDecimals);
      if (aUsdcBalance < parsedAmount) {
        toast.error("Insufficient aUSDC balance");
        return;
      }

      setError(null);
      setLastSuccess(null);
      setTxState({ action: "withdraw", phase: "wallet" });

      writeAction({
        address: config.poolAddress,
        abi: aavePoolABI,
        functionName: "withdraw",
        args: [config.usdcAddress, parsedAmount, address],
      });
    },
    [config, address, aUsdcBalance, writeAction],
  );

  const isBusy = txState.phase !== "idle";
  const isSupported = isAaveSupported(chainId);

  return {
    txState,
    isBusy,
    isSupported,
    error,
    lastSuccess,
    clearLastSuccess: () => setLastSuccess(null),
    usdcBalance,
    aUsdcBalance,
    formattedUsdcBalance,
    formattedAUsdcBalance,
    isLoadingUsdcBalance,
    isLoadingAUsdcBalance,
    needsApproval,
    approveUsdc,
    supply,
    withdraw,
    refetchBalances: refetchAll,
  };
}
