"use client";
import { redirect } from "next/navigation";

export default function PoolPage({ params }: { params: { symbol: string } }) {
  const { symbol } = params;
  redirect(`/pools/${symbol}/user`);
}
