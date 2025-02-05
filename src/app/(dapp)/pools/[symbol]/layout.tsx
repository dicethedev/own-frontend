import { PoolProvider } from "@/context/PoolContext";
import { getPoolData } from "@/lib/pool";

export default async function PoolLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { symbol: string };
}) {
  const { symbol } = await params;
  const pool = await getPoolData(symbol);

  return <PoolProvider pool={pool}>{children}</PoolProvider>;
}
