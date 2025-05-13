export async function querySubgraph(query: string) {
  const subgraphUrl =
    "https://api.goldsky.com/api/public/project_cmajbfoxi8fdd01w937dd93ap/subgraphs/own-subgraph/1.0.0/gn";

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
