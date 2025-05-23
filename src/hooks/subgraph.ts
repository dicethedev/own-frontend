export async function querySubgraph(query: string) {
  const subgraphUrl = process.env.NEXT_PUBLIC_SUBGRAPH_BASE_SEPOLIA;

  if (!subgraphUrl) {
    throw new Error("SUBGRAPH_BASE_SEPOLIA environment variable is not set");
  }

  try {
    const response = await fetch(subgraphUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error(`Subgraph request failed: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
    }

    return data.data;
  } catch (error) {
    console.error("Error querying subgraph:", error);
    throw error;
  }
}

// src/hooks/subgraph.ts - Add this function
export async function waitForSubgraphSync(
  targetBlockNumber: bigint,
  maxWaitTime: number = 10000, // 10 seconds max
  pollInterval: number = 2000 // Check every 2 seconds
): Promise<boolean> {
  const startTime = Date.now();

  const metaQuery = `
    query GetMeta {
      _meta {
        block {
          number
          hash
          timestamp
        }
        deployment
        hasIndexingErrors
      }
    }
  `;

  while (Date.now() - startTime < maxWaitTime) {
    try {
      const data = await querySubgraph(metaQuery);
      const currentBlock = BigInt(data._meta.block.number);

      console.log(
        `Subgraph at block ${currentBlock}, waiting for ${targetBlockNumber}`
      );

      if (currentBlock >= targetBlockNumber) {
        console.log(`Subgraph synced to block ${currentBlock}`);
        return true;
      }

      // Wait before next check
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    } catch (error) {
      console.error("Error checking subgraph sync:", error);
      // Continue trying even if there's an error
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }
  }

  console.warn(`Subgraph sync timeout after ${maxWaitTime}ms`);
  return false; // Timeout reached
}
