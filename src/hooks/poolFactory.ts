import { useEffect, useState } from "react";
import { Address, getAbiItem } from "viem";
import { usePublicClient } from "wagmi";
import { assetPoolFactoryABI } from "@/config/abis";
import { getContractConfig } from "@/config/contracts";
import { PoolEvent } from "@/types/pool";

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
