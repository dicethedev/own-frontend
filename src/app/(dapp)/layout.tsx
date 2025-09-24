"use client";

import { ReactNode } from "react";
import { BackgroundEffects } from "@/components/BackgroundEffects";
import { Navbar } from "@/components/Navbar";
import { PoolProvider } from "@/context/PoolContext";
import { Footer } from "@/components/Footer";
interface MainDAppLayoutProps {
  children: ReactNode;
}

const MainDAppLayout: React.FC<MainDAppLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-900 text-white relative flex flex-col">
      <BackgroundEffects />
      <Navbar />
      <PoolProvider>
       <main className="flex-1 flex flex-col">{children}</main>
      </PoolProvider>
      <Footer />
    </div>
  );
};

export default MainDAppLayout;
