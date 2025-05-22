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
