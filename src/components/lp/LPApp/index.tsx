"use client";

import React from "react";
import { PoolContainer } from "@/components/pool/PoolContainer";
import { usePoolContext } from "@/context/PoolContext";

const LPApp: React.FC = () => {
  const [userType] = React.useState<"user" | "lp">("lp");
  const { pools, isLoading, error } = usePoolContext();

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h2 className="text-xl mb-2">Couldn&apos;t fetch pools</h2>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div
            role="status"
            className="w-8 h-8 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin mb-4"
          />
        </div>
      </div>
    );
  }

  return <PoolContainer pools={Array.from(pools.values())} type={userType} />;
};

export default LPApp;
