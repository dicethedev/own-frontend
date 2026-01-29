// src/hooks/useCoinsVerification.ts
import { useState, useCallback, useEffect, useRef } from "react";

export interface SocialVerifications {
  X: boolean;
  Meta: boolean;
  Linkedin: boolean;
  Github: boolean;
}

export interface CoinsVerificationResponse {
  email?: string;
  phone_number?: string;
  walletAddress: string;
  verified: boolean;
  rp?: number;
  currency?: string;
  socialVerifications?: SocialVerifications;
}

export interface CoinsVerificationResult {
  data: CoinsVerificationResponse | null;
  isLoading: boolean;
  error: string | null;
  verify: (
    email: string,
    walletAddress: string,
  ) => Promise<CoinsVerificationResponse | null>;
  verifyPhone: (
    phoneNumber: string,
    walletAddress: string,
  ) => Promise<CoinsVerificationResponse | null>;
  reset: () => void;
}

const VERIFICATION_API_URL =
  process.env.NEXT_PUBLIC_COINS_VERIFICATION_API || "";

export function useCoinsVerification(): CoinsVerificationResult {
  const [data, setData] = useState<CoinsVerificationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const verify = useCallback(
    async (
      email: string,
      walletAddress: string,
    ): Promise<CoinsVerificationResponse | null> => {
      // Cancel any pending request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();

      setIsLoading(true);
      setError(null);
      setData(null);

      try {
        const response = await fetch(VERIFICATION_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            walletAddress: walletAddress.trim(),
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`Verification failed: ${response.statusText}`);
        }

        const result: CoinsVerificationResponse = await response.json();
        setData(result);
        return result;
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          // Request was cancelled, don't update state
          return null;
        }
        const errorMessage =
          err instanceof Error ? err.message : "Verification failed";
        setError(errorMessage);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const verifyPhone = useCallback(
    async (
      phoneNumber: string,
      walletAddress: string,
    ): Promise<CoinsVerificationResponse | null> => {
      // Cancel any pending request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();

      setIsLoading(true);
      setError(null);
      setData(null);

      try {
        const response = await fetch(VERIFICATION_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phoneNumber: phoneNumber.trim(),
            walletAddress: walletAddress.trim(),
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`Verification failed: ${response.statusText}`);
        }

        const result: CoinsVerificationResponse = await response.json();
        setData(result);
        return result;
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          // Request was cancelled, don't update state
          return null;
        }
        const errorMessage =
          err instanceof Error ? err.message : "Verification failed";
        setError(errorMessage);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    data,
    isLoading,
    error,
    verify,
    verifyPhone,
    reset,
  };
}
