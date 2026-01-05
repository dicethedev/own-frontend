"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider, usePostHog } from "posthog-js/react";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import { useAccount } from "wagmi";

// Initialize PostHog
if (typeof window !== "undefined") {
  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;

  if (posthogKey && posthogHost) {
    posthog.init(posthogKey, {
      api_host: posthogHost,
      person_profiles: "identified_only",
      capture_pageview: false, // We handle this manually for App Router
      capture_pageleave: true,
      // Session recordings
      disable_session_recording:
        process.env.NODE_ENV === "development" ? true : false,
      // Web analytics
      autocapture: true,
    });
  }
}

// Component to track pageviews
function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const posthogClient = usePostHog();

  useEffect(() => {
    if (pathname && posthogClient) {
      let url = window.origin + pathname;
      if (searchParams.toString()) {
        url = url + `?${searchParams.toString()}`;
      }
      posthogClient.capture("$pageview", { $current_url: url });
    }
  }, [pathname, searchParams, posthogClient]);

  return null;
}

// Component to identify user by wallet address
function PostHogWalletIdentifier() {
  const { address, isConnected } = useAccount();
  const posthogClient = usePostHog();

  useEffect(() => {
    if (posthogClient) {
      if (isConnected && address) {
        // Identify user with wallet address
        posthogClient.identify(address, {
          wallet_address: address,
        });
      } else {
        // Reset identification when wallet disconnects
        posthogClient.reset();
      }
    }
  }, [address, isConnected, posthogClient]);

  return null;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      <PostHogWalletIdentifier />
      {children}
    </PHProvider>
  );
}
