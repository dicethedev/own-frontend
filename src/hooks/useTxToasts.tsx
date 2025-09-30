"use client";

import { useEffect, useRef } from "react";
import toast from "react-hot-toast";

type UseTxToastsProps = {
  isApprovalPending: boolean;
  isPermit2ApprovalPending: boolean;
  isSwapPending: boolean;
  activeTab: string;
};

export function useTxToasts({
  isApprovalPending,
  isPermit2ApprovalPending,
  isSwapPending,
  activeTab,
}: UseTxToastsProps) {
  const toastIdRef = useRef<string | null>(null);

  useEffect(() => {
    let message: string | null = null;

    if (isApprovalPending) {
      message = "Getting permission to use your tokens...";
    } else if (isPermit2ApprovalPending) {
      message = "Setting things up for you...";
    } else if (isSwapPending) {
       if (activeTab === "buy" || activeTab === "sell") {
       message = `${activeTab === "buy" ? "Buying" : "Selling"} your tokens...`;
     }
    }

    if (message) {
      if (toastIdRef.current) {
        toast.loading(message, { id: toastIdRef.current });
      } else {
        toastIdRef.current = toast.loading(message, { duration: Infinity });
      }
    } else {
      if (toastIdRef.current) {
        toast.dismiss(toastIdRef.current);
        toastIdRef.current = null;
      }
    }

    return () => {
      if (toastIdRef.current) {
        toast.dismiss(toastIdRef.current);
        toastIdRef.current = null;
      }
    };
  }, [isApprovalPending, isPermit2ApprovalPending, isSwapPending, activeTab]);
}
