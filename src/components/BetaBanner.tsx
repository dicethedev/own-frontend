"use client";

import { X, InfoIcon } from "lucide-react";
import { useChainId } from "wagmi";
import { base } from "wagmi/chains";
import { useState, useEffect } from "react";

export const BetaBanner: React.FC = () => {
  const chainId = useChainId();
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [isReady, setIsReady] = useState<boolean>(false);

  useEffect(() => {
    // Check localStorage after mount
    const dismissed = localStorage.getItem('betaBannerDismissed') === 'true';
    setIsDismissed(dismissed);
    setIsReady(true);
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('betaBannerDismissed', 'true');
  };

  if (!isReady) {
    return <div className="fixed top-16 left-0 right-0 w-full h-0" />;
  }

  if (isDismissed || chainId !== base.id) {
    return <div className="fixed top-16 left-0 right-0 w-full h-0" />;
  }

  return (
    <div className="fixed top-16 left-0 right-0 w-full bg-gradient-to-r from-amber-600/20 via-orange-600/20 to-amber-600/20 backdrop-blur-sm border-b border-amber-600/30 z-40">
      <div className="max-w-7xl mx-auto px-6 py-3">
        <div className="flex items-center justify-center gap-4 relative pr-8">
          <div className="flex items-center justify-center gap-3">
            <InfoIcon className="h-5 w-5 text-amber-400 flex-shrink-0" />
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-sm text-center sm:text-left">
              <span className="font-semibold text-amber-100">
                Beta Version on Base Mainnet
              </span>
              <span className="text-amber-200/90">
                The protocol is scheduled for a full audit. Please use
                responsibly until audit is complete.
              </span>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="absolute right-0 p-1 hover:bg-amber-600/20 rounded transition-colors flex-shrink-0"
            aria-label="Dismiss banner"
          >
            <X className="h-4 w-4 text-amber-300" />
          </button>
        </div>
      </div>
    </div>
  );
};
