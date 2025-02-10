"use client";

import { BackgroundEffects } from "@/components/BackgroundEffects";
import { Navbar } from "@/components/Navbar";
import { PoolProvider } from "@/context/PoolContext";

export default function DAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-900 text-white relative">
      <BackgroundEffects />
      <Navbar />
      <PoolProvider>{children}</PoolProvider>
    </div>
  );
}
