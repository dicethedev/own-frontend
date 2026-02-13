"use client";

import React from "react";
import { Button } from "@/components/ui/BaseComponents";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

interface GetReserveButtonProps {
  /** The token symbol to display (e.g., "aUSDC") */
  tokenSymbol?: string;
  /** Optional label override */
  label?: string;
  /** Whether this is for converting aUSDC back to USDC */
  isWithdraw?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * A button that links to the /reserve page.
 * Use this to replace action buttons when the user doesn't have enough aUSDC
 * (for deposits/collateral) or when they want to convert aUSDC → USDC (after claims).
 */
export const GetReserveButton: React.FC<GetReserveButtonProps> = ({
  tokenSymbol = "aUSDC",
  label,
  isWithdraw = false,
  className = "",
}) => {
  const defaultLabel = isWithdraw
    ? `Convert ${tokenSymbol} → USDC`
    : `Get ${tokenSymbol}`;

  return (
    <Link href="/reserve" className="block w-full">
      <Button
        variant="primary"
        className={`w-full h-12 rounded-xl ${className}`}
      >
        {label || defaultLabel}
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </Link>
  );
};

/**
 * Inline text link to the /reserve page.
 * Use within info text, balance displays, etc.
 */
export const GetReserveLink: React.FC<{
  isWithdraw?: boolean;
  className?: string;
}> = ({ isWithdraw = false, className = "" }) => {
  return (
    <Link
      href="/reserve"
      className={`text-blue-400 hover:text-blue-300 transition-colors text-sm inline-flex items-center gap-1 ${className}`}
    >
      {isWithdraw ? "Convert aUSDC → USDC" : "Get aUSDC"}
      <ArrowRight className="w-3 h-3" />
    </Link>
  );
};
