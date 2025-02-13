import { redirect } from "next/navigation";

export default async function PoolPage({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  const { symbol } = await params;
  redirect(`/pool/${symbol}/user`);
}
