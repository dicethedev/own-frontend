"use client";

import React from "react";
import { Pool } from "@/types/pool";
import { UserData } from "@/types/user";
import { UserCollateralManagementCard } from "./UserCollateralManagementCard";
import { UserExitPoolCard } from "./UserExitPoolCard";

interface UserAdditionalActionsCardProps {
  pool: Pool;
  userData: UserData;
}

export const UserAdditionalActionsCard: React.FC<
  UserAdditionalActionsCardProps
> = ({ pool, userData }) => {
  // Check if pool is halted
  const isPoolHalted = pool?.poolStatus === "HALTED";

  // Show Exit Pool UI only when pool is halted
  if (isPoolHalted) {
    return <UserExitPoolCard pool={pool} userData={userData} />;
  }

  // Otherwise show normal User collateral management
  return <UserCollateralManagementCard pool={pool} userData={userData} />;
};
