// src/hooks/useAssetPool.ts
import {
  useWriteContract,
  useReadContract,
  useWaitForTransactionReceipt,
  useSimulateContract,
} from "wagmi";
import { Address, parseUnits } from "viem";
import toast from "react-hot-toast";
import { assetPoolABI, lpRegistryABI } from "@/config/abis";
import { getContractConfig } from "@/config/contracts";

export const useRegisterLP = (chainId: number) => {
  const { lpRegistry } = getContractConfig(chainId);

  const { data: simulateData, error: simulateError } = useSimulateContract({
    address: lpRegistry.address,
    abi: lpRegistryABI,
    functionName: "registerLP",
  });

  const { writeContract, data: hash, error, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const registerLP = async (
    pool: Address,
    lp: Address,
    liquidityAmount: string
  ) => {
    try {
      const parsedAmount = parseUnits(liquidityAmount, 18);
      if (!simulateData?.request) {
        throw new Error("Transaction simulation failed");
      }
      const hash = await writeContract({
        address: lpRegistry.address,
        abi: lpRegistryABI,
        functionName: "registerLP",
        args: [pool, lp, parsedAmount],
      });
      toast.success("LP registration initiated");
      return hash;
    } catch (error) {
      console.error("Error registering LP:", error);
      toast.error("Failed to register LP");
      throw error;
    }
  };

  return {
    registerLP,
    isLoading: isPending || isConfirming,
    isSuccess,
    error: error || simulateError,
    hash,
  };
};

export const useDepositRequest = (poolAddress: Address) => {
  const { data: simulateData, error: simulateError } = useSimulateContract({
    address: poolAddress,
    abi: assetPoolABI,
    functionName: "depositRequest",
  });

  const { writeContract, data: hash, error, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const deposit = async (amount: string) => {
    try {
      const parsedAmount = parseUnits(amount, 18);
      if (!simulateData?.request) {
        throw new Error("Transaction simulation failed");
      }
      const hash = await writeContract({
        address: poolAddress,
        abi: assetPoolABI,
        functionName: "depositRequest",
        args: [parsedAmount],
      });
      toast.success("Deposit request initiated");
      return hash;
    } catch (error) {
      console.error("Error making deposit request:", error);
      toast.error("Failed to make deposit request");
      throw error;
    }
  };

  return {
    deposit,
    isLoading: isPending || isConfirming,
    isSuccess,
    error: error || simulateError,
    hash,
  };
};

export const useRedemptionRequest = (poolAddress: Address) => {
  const { data: simulateData, error: simulateError } = useSimulateContract({
    address: poolAddress,
    abi: assetPoolABI,
    functionName: "redemptionRequest",
  });

  const { writeContract, data: hash, error, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const redeem = async (amount: string) => {
    try {
      const parsedAmount = parseUnits(amount, 18);
      if (!simulateData?.request) {
        throw new Error("Transaction simulation failed");
      }
      const hash = await writeContract({
        address: poolAddress,
        abi: assetPoolABI,
        functionName: "redemptionRequest",
        args: [parsedAmount],
      });
      toast.success("Redemption request initiated");
      return hash;
    } catch (error) {
      console.error("Error making redemption request:", error);
      toast.error("Failed to make redemption request");
      throw error;
    }
  };

  return {
    redeem,
    isLoading: isPending || isConfirming,
    isSuccess,
    error: error || simulateError,
    hash,
  };
};

export const useCancelRequest = (poolAddress: Address) => {
  const { data: simulateData, error: simulateError } = useSimulateContract({
    address: poolAddress,
    abi: assetPoolABI,
    functionName: "cancelRequest",
  });

  const { writeContract, data: hash, error, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const cancel = async () => {
    try {
      if (!simulateData?.request) {
        throw new Error("Transaction simulation failed");
      }
      const hash = await writeContract({
        address: poolAddress,
        abi: assetPoolABI,
        functionName: "cancelRequest",
      });
      toast.success("Request cancellation initiated");
      return hash;
    } catch (error) {
      console.error("Error cancelling request:", error);
      toast.error("Failed to cancel request");
      throw error;
    }
  };

  return {
    cancel,
    isLoading: isPending || isConfirming,
    isSuccess,
    error: error || simulateError,
    hash,
  };
};

export const useClaimRequest = (poolAddress: Address) => {
  const { data: simulateData, error: simulateError } = useSimulateContract({
    address: poolAddress,
    abi: assetPoolABI,
    functionName: "claimRequest",
  });

  const { writeContract, data: hash, error, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const claim = async (user: Address) => {
    try {
      if (!simulateData?.request) {
        throw new Error("Transaction simulation failed");
      }
      const hash = await writeContract({
        address: poolAddress,
        abi: assetPoolABI,
        functionName: "claimRequest",
        args: [user],
      });
      toast.success("Claim request initiated");
      return hash;
    } catch (error) {
      console.error("Error claiming request:", error);
      toast.error("Failed to claim request");
      throw error;
    }
  };

  return {
    claim,
    isLoading: isPending || isConfirming,
    isSuccess,
    error: error || simulateError,
    hash,
  };
};

// Read hooks for fetching user request status
export const useUserRequest = (poolAddress: Address, userAddress: Address) => {
  return useReadContract({
    address: poolAddress,
    abi: assetPoolABI,
    functionName: "pendingRequests",
    args: [userAddress],
  });
};
