"use client";

import { BackgroundEffects } from "@/components/BackgroundEffects";
import { Navbar } from "@/components/Navbar";
import UserPage from "@/components/pool/user/UserPage";
import { useSpecificPool } from "@/hooks/pool";
import { useParams } from "next/navigation";
import React from "react";

const UserPoolPage: React.FC = () => {
  const params = useParams();
  const symbol = params.symbol as string;
  const { pool, isLoading, error, notFound } = useSpecificPool(symbol);

  return (
    <div className="min-h-screen bg-gray-900 text-white relative">
      <BackgroundEffects />
      <Navbar />
      {error && (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h2 className="text-xl mb-2">Couldn&apos;t fetch pool</h2>
          </div>
        </div>
      )}
      {notFound && (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h2 className="text-xl mb-2">Pool not found</h2>
          </div>
        </div>
      )}
      {isLoading && !pool && (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-8 h-8 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin mb-4" />
          </div>
        </div>
      )}
      {pool && !error && <UserPage pool={pool} />}
    </div>
  );
};

export default UserPoolPage;
