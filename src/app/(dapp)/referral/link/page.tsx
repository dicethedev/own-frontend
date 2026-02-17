"use client";

import React, { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  Wallet,
  Copy,
  Check,
  Link2,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { SITE_URL } from "@/lib/site";
import toast from "react-hot-toast";

const isValidWalletAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address.trim());
};

export default function ReferralLinkPage() {
  const [walletAddress, setWalletAddress] = useState("");
  const [copied, setCopied] = useState(false);
  const [signupStatus, setSignupStatus] = useState<{
    signedUp: boolean | null;
    isLoading: boolean;
  }>({ signedUp: null, isLoading: false });

  const trimmedAddress = walletAddress.trim();
  const isValid =
    trimmedAddress.length > 0 && isValidWalletAddress(trimmedAddress);
  const referralLink = isValid
    ? `${SITE_URL}/referral?ref=${encodeURIComponent(trimmedAddress)}`
    : "";

  // Check if wallet is signed up for referral program
  useEffect(() => {
    if (!isValid) {
      setSignupStatus({ signedUp: null, isLoading: false });
      return;
    }

    let cancelled = false;
    setSignupStatus((prev) => ({ ...prev, isLoading: true }));

    const timer = setTimeout(async () => {
      try {
        const baseUrl =
          process.env.NEXT_PUBLIC_API_URL || "https://api.ownfinance.org";
        const response = await fetch(
          `${baseUrl}/api/referral/is-signed-up/${encodeURIComponent(trimmedAddress)}`,
        );
        const data = await response.json().catch(() => ({}));
        const signedUp =
          data?.success === true && data?.data?.is_signed_up === true;
        if (!cancelled) {
          setSignupStatus({ signedUp, isLoading: false });
        }
      } catch {
        if (!cancelled) {
          setSignupStatus({ signedUp: null, isLoading: false });
        }
      }
    }, 500);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [trimmedAddress, isValid]);

  const handleCopy = useCallback(async () => {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  }, [referralLink]);

  return (
    <main className="flex flex-col min-h-screen bg-[#111113]">
      <div className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 pt-20 pb-12 sm:pt-24">


        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 mb-4">
            <Link2 className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Generate referral link
          </h1>
          <p className="text-gray-400">
            Enter your wallet address to get a link you can share. Friends who
            sign up via your link will count as your referrals.
          </p>
        </div>

        <div className="bg-[#1a1a1c] rounded-2xl border border-[#303136] p-6 sm:p-8 space-y-6">
          <div className="space-y-2">
            <label
              htmlFor="wallet"
              className="block text-sm font-medium text-gray-300"
            >
              Your wallet address
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <Wallet className="w-5 h-5" />
              </div>
              <input
                id="wallet"
                type="text"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                placeholder="0x..."
                className="w-full pl-12 pr-4 py-3.5 bg-[#111113] rounded-xl border border-[#303136] focus:border-blue-500
                  text-white placeholder-gray-500 transition-colors outline-none"
              />
            </div>
            {trimmedAddress.length > 0 && !isValid && (
              <p className="text-sm text-red-400">
                Enter a valid Ethereum address (0x + 40 hex characters).
              </p>
            )}
            {isValid && signupStatus.isLoading && (
              <p className="text-sm text-gray-400 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Checking if wallet is signed up...
              </p>
            )}
            {isValid && !signupStatus.isLoading && signupStatus.signedUp === true && (
              <p className="text-sm text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                This wallet is signed up. Your referral link is valid.
              </p>
            )}
            {isValid && !signupStatus.isLoading && signupStatus.signedUp === false && (
              <p className="text-sm text-amber-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                This wallet is not signed up yet.{" "}
                <Link
                  href="/referral"
                  className="underline hover:text-amber-300"
                >
                  Sign up on the referral page
                </Link>
              </p>
            )}
          </div>

          {referralLink && signupStatus.signedUp === true && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                Your referral link
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={referralLink}
                  className="flex-1 px-4 py-3 bg-[#111113] rounded-xl border border-[#303136] text-white text-sm font-mono truncate"
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors shrink-0"
                >
                  {copied ? (
                    <>
                      <Check className="w-5 h-5" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-5 h-5" />
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
