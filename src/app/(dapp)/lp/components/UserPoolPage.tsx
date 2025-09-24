"use client";

import UserPage from "@/components/pool/user/UserPage";
import { useSpecificPool } from "@/hooks/pool";
import { useParams } from "next/navigation";
import React from "react";

const UserPoolPage: React.FC = () => {
  const params = useParams();
  const symbol = params.symbol as string;
  const { pool, isLoading, error, notFound } = useSpecificPool(symbol);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h2 className="text-xl mb-2">Couldn&apos;t fetch pool</h2>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h2 className="text-xl mb-2">Pool not found</h2>
        </div>
      </div>
    );
  }

  if (isLoading && !pool) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-8 h-8 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin mb-4" />
        </div>
      </div>
    );
  }

  return pool && !error ? <UserPage pool={pool} /> : null;
};

export default UserPoolPage;
