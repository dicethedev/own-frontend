import { useCallback, useEffect, useState } from "react";
import { Address, decodeEventLog, getAbiItem } from "viem";
import {
  useAccount,
  usePublicClient,
  useReadContract,
  useWatchContractEvent,
  useWriteContract,
} from "wagmi";
import { assetPoolFactoryABI } from "@/config/abis";
import { getContractConfig } from "@/config/contracts";
import { PoolEvent } from "@/types/pool";

interface CreatePoolParams {
  depositToken: Address;
  assetSymbol: string;
  oracle: Address;
  poolStrategy: Address;
}

export function useCreatePool(chainId: number) {
  const { address: userAddress } = useAccount();
  const { assetPoolFactory } = getContractConfig(chainId);
  const [createdPoolAddress, setCreatedPoolAddress] = useState<Address | null>(
    null
  );
  const [isSuccess, setIsSuccess] = useState(false);

  // Check if user is owner
  const { data: isOwner } = useReadContract({
    address: assetPoolFactory.address,
    abi: assetPoolFactoryABI,
    functionName: "owner",
    query: {
      enabled: !!userAddress,
      select: (data) => data === userAddress,
    },
  });

  // Create pool transaction
  const {
    writeContract: createPool,
    isPending: isPoolCreating,
    error: poolFactoryError,
  } = useWriteContract();

  // Watch for AssetPoolCreated event
  useWatchContractEvent({
    address: assetPoolFactory.address,
    abi: assetPoolFactoryABI,
    eventName: "AssetPoolCreated",
    onLogs: (logs) => {
      const log = logs[0];
      try {
        const event = decodeEventLog({
          abi: assetPoolFactoryABI,
          data: log.data,
          topics: log.topics,
        });

        // Type guard to ensure we're handling AssetPoolCreated event
        if (event.eventName === "AssetPoolCreated") {
          const { pool } = event.args;

          // Set the created pool address
          setCreatedPoolAddress(pool);
          setIsSuccess(true);
        }
      } catch (error) {
        console.error("Error decoding event:", error);
      }
    },
  });

  const create = useCallback(
    async (params: CreatePoolParams) => {
      if (!isOwner) {
        throw new Error("Not authorized to create pool");
      }

      createPool({
        address: assetPoolFactory.address,
        abi: assetPoolFactoryABI,
        functionName: "createPool",
        args: [
          params.depositToken,
          params.assetSymbol,
          params.oracle,
          params.poolStrategy,
        ],
      });
    },
    [isOwner, createPool, assetPoolFactory.address]
  );

  return {
    create,
    createdPoolAddress,
    isOwner,
    isLoading: isPoolCreating,
    isSuccess,
    error: poolFactoryError,
  };
}

// Currently not used. Used to fetch recent pool events from the AssetPoolFactory contract
export function useRecentPoolEvents(
  chainId: number,
  limit: number,
  refreshKey: number = 0
) {
  const [poolEvents, setPoolEvents] = useState<PoolEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const publicClient = usePublicClient();
  const { assetPoolFactory } = getContractConfig(chainId);

  useEffect(() => {
    async function fetchRecentPoolEvents() {
      try {
        setIsLoading(true);

        // Get the AssetPoolCreated event signature
        const eventAbi = getAbiItem({
          abi: assetPoolFactoryABI,
          name: "AssetPoolCreated",
        });

        // Fetch recent events
        const events = await publicClient?.getLogs({
          address: assetPoolFactory.address,
          event: eventAbi,
          fromBlock: "earliest",
          toBlock: "latest",
        });

        if (!events) throw new Error("Failed to fetch events");

        // Sort events by block number in descending order and take the last 'limit' events
        const sortedEvents = events
          .sort((a, b) => Number(b.blockNumber) - Number(a.blockNumber))
          .slice(0, limit)
          .map((event) => ({
            ...event.args,
            blockNumber: event.blockNumber,
          })) as PoolEvent[];

        setPoolEvents(sortedEvents);
        setError(null);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to fetch recent pools")
        );
      } finally {
        setIsLoading(false);
      }
    }

    fetchRecentPoolEvents();
  }, [chainId, limit, publicClient, assetPoolFactory.address, refreshKey]);

  return {
    poolEvents,
    isLoading,
    error,
  };
}
