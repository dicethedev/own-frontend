"use client";

import { BackgroundEffects } from "@/components/BackgroundEffects";
import { Navbar } from "@/components/Navbar";

export default function DAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-900 text-white relative">
      <BackgroundEffects />
      <Navbar />
      {children}
    </div>
  );
}
