import { PoolProvider } from "@/context/PoolContext";
import { getPoolData } from "@/config/pool";

export default async function PoolLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ symbol: string }>;
}) {
  const { symbol } = await params;
  const pool = await getPoolData(symbol);

  return <PoolProvider pool={pool}>{children}</PoolProvider>;
}
