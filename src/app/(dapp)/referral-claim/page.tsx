"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Navbar } from "@/components/Navbar";
import { BackgroundEffects } from "@/components/BackgroundEffects";
import {
  User,
  Mail,
  Wallet,
  UserPlus,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  Gift,
  TrendingUp,
  Users,
  ExternalLink,
  Info,
  DollarSign,
} from "lucide-react";
import toast from "react-hot-toast";
import { useCoinsVerification } from "@/hooks/useCoinsVerification";
import { useAI7Investment } from "@/hooks/useAI7Investment";

// Constants
const MIN_RP_REQUIRED = 50;
const MIN_INVESTMENT_USD = 5;
const COINS_SOCIAL_VERIFICATION_URL = "https://app.coins.me/on-off-ramp";

export interface ReferralUser {
  id: number;
  name: string;
  email: string;
  wallet_address: string;
  created_at: string;
}

export interface Referral {
  id: number;
  referrer_wallet: string;
  referee_wallet: string;
  signed_up_at: string;
  expires_at: string;
  status: "active" | "expired";
}

export interface ReferralSignupResponse {
  success: boolean;
  user: ReferralUser;
  current_investment_usd: string;
  rewards_earned: {
    tier1: string;
    tier2: string;
    tier3: string;
    total: string;
    txHash?: string | null;
    payoutError?: string;
  };
  referrer_rewards?: {
    wallet: string;
    amount: string;
    txHash?: string | null;
    error?: string | null;
  };
  referral?: Referral;
}

// Validation helpers
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isValidWalletAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

// Input Field Component
interface FormInputProps {
  id: string;
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  error?: string | null;
  success?: boolean;
  isLoading?: boolean;
  helperText?: string;
  disabled?: boolean;
}

const FormInput: React.FC<FormInputProps> = ({
  id,
  label,
  icon,
  value,
  onChange,
  placeholder,
  type = "text",
  error,
  success,
  isLoading,
  helperText,
  disabled,
}) => {
  const borderColor = error
    ? "border-red-500 focus:border-red-500"
    : success
      ? "border-emerald-500 focus:border-emerald-500"
      : "border-[#303136] focus:border-blue-500";

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium text-gray-300">
        {label}
      </label>
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
          {icon}
        </div>
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled || isLoading}
          className={`w-full pl-12 pr-12 py-3.5 bg-[#1a1a1c] rounded-xl border ${borderColor} 
            text-white placeholder-gray-500 transition-colors outline-none
            disabled:opacity-50 disabled:cursor-not-allowed`}
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          {isLoading ? (
            <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
          ) : error ? (
            <XCircle className="w-5 h-5 text-red-500" />
          ) : success ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          ) : null}
        </div>
      </div>
      {error && (
        <p className="text-sm text-red-400 flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4" />
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
};

// Info Card Component
const InfoCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  variant?: "default" | "warning" | "success";
}> = ({ icon, title, children, variant = "default" }) => {
  const bgColor =
    variant === "warning"
      ? "bg-amber-500/10 border-amber-500/30"
      : variant === "success"
        ? "bg-emerald-500/10 border-emerald-500/30"
        : "bg-[#303136]/20 border-[#303136]";

  const iconColor =
    variant === "warning"
      ? "text-amber-400"
      : variant === "success"
        ? "text-emerald-400"
        : "text-blue-400";

  return (
    <div className={`p-4 rounded-xl border ${bgColor}`}>
      <div className="flex items-start gap-3">
        <div className={iconColor}>{icon}</div>
        <div>
          <h4 className="text-white font-medium mb-1">{title}</h4>
          <div className="text-gray-400 text-sm">{children}</div>
        </div>
      </div>
    </div>
  );
};

// Incentive Tier Component
const IncentiveTier: React.FC<{
  threshold: string;
  reward: string;
  description: string;
}> = ({ threshold, reward, description }) => (
  <div className="flex items-center justify-between p-3 bg-[#1a1a1c] rounded-lg">
    <div>
      <span className="text-white font-medium">{threshold}</span>
      <p className="text-gray-500 text-xs mt-0.5">{description}</p>
    </div>
    <span className="text-emerald-400 font-semibold">{reward}</span>
  </div>
);

export default function ReferralClaimPage() {
  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [hasReferrer, setHasReferrer] = useState(false);
  const [referrerEmail, setReferrerEmail] = useState("");
  const [referrerWallet, setReferrerWallet] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Verification hooks
  const userVerification = useCoinsVerification();
  const referrerVerification = useCoinsVerification();
  const investmentCheck = useAI7Investment();

  // Debounce timers
  const [userVerifyTimer, setUserVerifyTimer] = useState<NodeJS.Timeout | null>(
    null,
  );
  const [referrerVerifyTimer, setReferrerVerifyTimer] =
    useState<NodeJS.Timeout | null>(null);
  const [investmentTimer, setInvestmentTimer] = useState<NodeJS.Timeout | null>(
    null,
  );

  // Trigger user verification when both email and wallet are valid
  useEffect(() => {
    if (userVerifyTimer) clearTimeout(userVerifyTimer);

    if (isValidEmail(email) && isValidWalletAddress(walletAddress)) {
      const timer = setTimeout(() => {
        userVerification.verify(email, walletAddress);
      }, 500);
      setUserVerifyTimer(timer);
    } else {
      userVerification.reset();
    }

    return () => {
      if (userVerifyTimer) clearTimeout(userVerifyTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, walletAddress]);

  // Trigger investment check when wallet is valid
  useEffect(() => {
    if (investmentTimer) clearTimeout(investmentTimer);

    if (isValidWalletAddress(walletAddress)) {
      const timer = setTimeout(() => {
        investmentCheck.checkInvestment(walletAddress);
      }, 500);
      setInvestmentTimer(timer);
    } else {
      investmentCheck.reset();
    }

    return () => {
      if (investmentTimer) clearTimeout(investmentTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletAddress]);

  // Trigger referrer verification when both email and wallet are valid
  useEffect(() => {
    if (!hasReferrer) {
      referrerVerification.reset();
      return;
    }

    if (referrerVerifyTimer) clearTimeout(referrerVerifyTimer);

    if (isValidEmail(referrerEmail) && isValidWalletAddress(referrerWallet)) {
      const timer = setTimeout(() => {
        referrerVerification.verify(referrerEmail, referrerWallet);
      }, 500);
      setReferrerVerifyTimer(timer);
    } else {
      referrerVerification.reset();
    }

    return () => {
      if (referrerVerifyTimer) clearTimeout(referrerVerifyTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [referrerEmail, referrerWallet, hasReferrer]);

  // Check if wallet is already signed up
  useEffect(() => {
    const checkSignupStatus = async () => {
      if (!isValidWalletAddress(walletAddress)) return;

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || ""}/api/referral/is-signed-up/${walletAddress}`
        );
        if (response.ok) {
          const data = await response.json();
          if (data.isSignedUp) {
            toast.error("This wallet has already claimed rewards!");
          }
        }
      } catch (error) {
        console.error("Error checking signup status:", error);
      }
    };

    const timer = setTimeout(checkSignupStatus, 500);
    return () => clearTimeout(timer);
  }, [walletAddress]);

  // Validation state
  const userValidation = useMemo(() => {
    const emailValid = isValidEmail(email);
    const walletValid = isValidWalletAddress(walletAddress);
    const isVerified = userVerification.data?.verified === true;
    const hasEnoughRP = (userVerification.data?.rp || 0) >= MIN_RP_REQUIRED;
    const hasEnoughInvestment =
      (investmentCheck.usdValue || 0) >= MIN_INVESTMENT_USD;

    return {
      emailValid,
      walletValid,
      isVerified,
      hasEnoughRP,
      hasEnoughInvestment,
      emailError:
        email && !emailValid
          ? "Please enter a valid email address"
          : emailValid && walletValid && userVerification.data && !isVerified
            ? "This email is not linked to your coins.me wallet"
            : null,
      walletError:
        walletAddress && !walletValid
          ? "Please enter a valid wallet address (0x...)"
          : walletValid && emailValid && userVerification.data && !isVerified
            ? "This wallet is not linked to your coins.me email"
            : null,
    };
  }, [email, walletAddress, userVerification.data, investmentCheck.usdValue]);

  const referrerValidation = useMemo(() => {
    if (!hasReferrer)
      return {
        emailValid: true,
        walletValid: true,
        isVerified: true,
        emailError: null,
        walletError: null,
        isSameAsUser: false,
      };

    const emailValid = isValidEmail(referrerEmail);
    const walletValid = isValidWalletAddress(referrerWallet);
    const isVerified = referrerVerification.data?.verified === true;

    // Check if referrer is the same as the user
    const isSameEmail =
      email.trim().toLowerCase() === referrerEmail.trim().toLowerCase();
    const isSameWallet =
      walletAddress.trim().toLowerCase() ===
      referrerWallet.trim().toLowerCase();
    const isSameAsUser =
      (isSameEmail && emailValid && isValidEmail(email)) ||
      (isSameWallet && walletValid && isValidWalletAddress(walletAddress));

    return {
      emailValid,
      walletValid,
      isVerified,
      isSameAsUser,
      emailError:
        referrerEmail && !emailValid
          ? "Please enter a valid email address"
          : emailValid && isValidEmail(email) && isSameEmail
            ? "Referrer email cannot be the same as your email"
            : emailValid &&
                walletValid &&
                referrerVerification.data &&
                !isVerified
              ? "This email is not linked to the referrer's coins.me wallet"
              : null,
      walletError:
        referrerWallet && !walletValid
          ? "Please enter a valid wallet address (0x...)"
          : walletValid && isValidWalletAddress(walletAddress) && isSameWallet
            ? "Referrer wallet cannot be the same as your wallet"
            : walletValid &&
                emailValid &&
                referrerVerification.data &&
                !isVerified
              ? "This wallet is not linked to the referrer's coins.me email"
              : null,
    };
  }, [
    hasReferrer,
    referrerEmail,
    referrerWallet,
    referrerVerification.data,
    email,
    walletAddress,
  ]);

  // Check if form can be submitted
  const canSubmit = useMemo(() => {
    const nameValid = name.trim().length >= 2;
    const userValid =
      userValidation.emailValid &&
      userValidation.walletValid &&
      userValidation.isVerified &&
      userValidation.hasEnoughRP &&
      userValidation.hasEnoughInvestment;

    const referrerValid =
      !hasReferrer ||
      (referrerValidation.emailValid &&
        referrerValidation.walletValid &&
        referrerValidation.isVerified &&
        !referrerValidation.isSameAsUser);

    return (
      nameValid &&
      userValid &&
      referrerValid &&
      !userVerification.isLoading &&
      !referrerVerification.isLoading &&
      !investmentCheck.isLoading
    );
  }, [
    name,
    userValidation,
    referrerValidation,
    hasReferrer,
    userVerification.isLoading,
    referrerVerification.isLoading,
    investmentCheck.isLoading,
  ]);

  // Handle form submission
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!canSubmit) return;

      setIsSubmitting(true);

      try {
        const payload = {
          name,
          email,
          wallet_address: walletAddress,
          ...(hasReferrer && {
            referrer_wallet: referrerWallet,
            referrer_email: referrerEmail,
          }),
        };

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || ""}/api/referral/signup`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || "Failed to submit claim");
        }
        // TODO: display the rewards earned
        // const data: ReferralSignupResponse = await response.json();
        toast.success(
          `Claim submitted successfully! Check your Coins.me account for your rewards.`
        );
      } catch (error) {
        console.error("Error submitting claim:", error);
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to submit claim. Please try again."
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      canSubmit,
      name,
      email,
      walletAddress,
      hasReferrer,
      referrerEmail,
      referrerWallet,
    ],
  );

  // Format USD value
  const formatUSD = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  return (
    <main className="min-h-screen flex flex-col">
      <BackgroundEffects />
      <Navbar />

      <div className="flex-1 px-4 py-24 max-w-4xl mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
            Claim Your Referral Rewards
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Earn rewards for investing in AI7 and referring friends. Complete
            the form below to claim your incentives.
          </p>
        </div>

        <div className="grid lg:grid-cols-[1fr_380px] gap-8">
          {/* Form Section */}
          <div className="rounded-2xl bg-[#222325] p-6 md:p-8 shadow-xl border border-[#303136]">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Your Details Section */}
              <div>
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-400" />
                  Your Details
                </h2>

                <div className="space-y-4">
                  <FormInput
                    id="name"
                    label="Your Name"
                    icon={<User className="w-5 h-5" />}
                    value={name}
                    onChange={setName}
                    placeholder="Enter your full name"
                    success={name.trim().length >= 2}
                    error={
                      name && name.trim().length < 2
                        ? "Name must be at least 2 characters"
                        : null
                    }
                  />

                  <FormInput
                    id="email"
                    label="Your Email (used on your coins.me account)"
                    icon={<Mail className="w-5 h-5" />}
                    value={email}
                    onChange={setEmail}
                    placeholder="your@email.com"
                    type="email"
                    isLoading={userVerification.isLoading}
                    success={
                      userValidation.emailValid && userValidation.isVerified
                    }
                    error={userValidation.emailError}
                  />

                  <FormInput
                    id="wallet"
                    label="Your coins.me Wallet Address"
                    icon={<Wallet className="w-5 h-5" />}
                    value={walletAddress}
                    onChange={setWalletAddress}
                    placeholder="0x..."
                    isLoading={
                      userVerification.isLoading || investmentCheck.isLoading
                    }
                    success={
                      userValidation.walletValid && userValidation.isVerified
                    }
                    error={userValidation.walletError}
                  />
                </div>
              </div>

              {/* Validation Status Cards */}
              {userValidation.isVerified && (
                <div className="space-y-3">
                  {/* RP Check */}
                  {!userValidation.hasEnoughRP && (
                    <InfoCard
                      icon={<AlertCircle className="w-5 h-5" />}
                      title="Social Verification Required"
                      variant="warning"
                    >
                      <p className="mb-2">
                        You need at least {MIN_RP_REQUIRED} RP to claim rewards.
                        Please verify your social accounts on coins.me.
                      </p>
                      <a
                        href={COINS_SOCIAL_VERIFICATION_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-amber-400 hover:text-amber-300 transition-colors"
                      >
                        Verify on coins.me <ExternalLink className="w-4 h-4" />
                      </a>
                    </InfoCard>
                  )}

                  {/* Investment Check */}
                  {!userValidation.hasEnoughInvestment && (
                    <InfoCard
                      icon={<DollarSign className="w-5 h-5" />}
                      title="Minimum Investment Required"
                      variant="warning"
                    >
                      <p className="mb-2">
                        You need at least ${MIN_INVESTMENT_USD} invested in AI7
                        to claim rewards.
                        {investmentCheck.usdValue !== null && (
                          <span className="block mt-1">
                            Current investment:{" "}
                            <span className="text-white font-medium">
                              {formatUSD(investmentCheck.usdValue)}
                            </span>
                          </span>
                        )}
                      </p>
                      <a
                        href="https://app.coins.me"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-amber-400 hover:text-amber-300 transition-colors"
                      >
                        Invest in AI7 <ExternalLink className="w-4 h-4" />
                      </a>
                    </InfoCard>
                  )}

                  {/* All checks passed */}
                  {userValidation.hasEnoughRP &&
                    userValidation.hasEnoughInvestment && (
                      <InfoCard
                        icon={<CheckCircle2 className="w-5 h-5" />}
                        title="Verification Complete"
                        variant="success"
                      >
                        <p>
                          Your account is verified and eligible for rewards.
                          {investmentCheck.usdValue !== null && (
                            <span className="block mt-1">
                              Current AI7 investment:{" "}
                              <span className="text-white font-medium">
                                {formatUSD(investmentCheck.usdValue)}
                              </span>
                            </span>
                          )}
                        </p>
                      </InfoCard>
                    )}
                </div>
              )}

              {/* Referrer Section */}
              <div className="pt-4 border-t border-[#303136]">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-blue-400" />
                    Referrer Details
                  </h2>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-sm text-gray-400">
                      I was referred
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={hasReferrer}
                      onClick={() => setHasReferrer(!hasReferrer)}
                      className={`relative w-11 h-6 rounded-full transition-colors ${
                        hasReferrer ? "bg-blue-500" : "bg-[#303136]"
                      }`}
                    >
                      <span
                        className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                          hasReferrer ? "translate-x-5" : ""
                        }`}
                      />
                    </button>
                  </label>
                </div>

                {hasReferrer && (
                  <div className="space-y-4">
                    <FormInput
                      id="referrerEmail"
                      label="Referrer's coins.me Email"
                      icon={<Mail className="w-5 h-5" />}
                      value={referrerEmail}
                      onChange={setReferrerEmail}
                      placeholder="referrer@email.com"
                      type="email"
                      isLoading={referrerVerification.isLoading}
                      success={
                        referrerValidation.emailValid &&
                        referrerValidation.isVerified &&
                        !referrerValidation.isSameAsUser &&
                        !referrerValidation.emailError
                      }
                      error={referrerValidation.emailError}
                    />

                    <FormInput
                      id="referrerWallet"
                      label="Referrer's coins.me Wallet Address"
                      icon={<Wallet className="w-5 h-5" />}
                      value={referrerWallet}
                      onChange={setReferrerWallet}
                      placeholder="0x..."
                      isLoading={referrerVerification.isLoading}
                      success={
                        referrerValidation.walletValid &&
                        referrerValidation.isVerified &&
                        !referrerValidation.isSameAsUser &&
                        !referrerValidation.walletError
                      }
                      error={referrerValidation.walletError}
                    />

                    {referrerValidation.isVerified &&
                      !referrerValidation.isSameAsUser &&
                      referrerEmail &&
                      referrerWallet && (
                        <InfoCard
                          icon={<CheckCircle2 className="w-5 h-5" />}
                          title="Referrer Verified"
                          variant="success"
                        >
                          Referrer account is verified and linked.
                        </InfoCard>
                      )}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!canSubmit || isSubmitting}
                className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2
                  ${
                    canSubmit && !isSubmitting
                      ? "bg-blue-500 hover:bg-blue-600 shadow-lg shadow-blue-500/25"
                      : "bg-[#303136] cursor-not-allowed opacity-60"
                  }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Gift className="w-5 h-5" />
                    Submit Claim
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Incentives Info Sidebar */}
          <div className="space-y-6">
            {/* How It Works */}
            <div className="rounded-2xl bg-[#222325] p-6 shadow-xl border border-[#303136]">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Gift className="w-5 h-5 text-emerald-400" />
                Reward Tiers
              </h3>
              <div className="space-y-3">
                <IncentiveTier
                  threshold="First $5"
                  reward="$1"
                  description="Your first investment milestone"
                />
                <IncentiveTier
                  threshold="Reach $100"
                  reward="+$5"
                  description="Additional reward at $100"
                />
                <IncentiveTier
                  threshold="Above $100"
                  reward="3%"
                  description="Of new investment peaks"
                />
              </div>
              <p className="text-gray-500 text-xs mt-4">
                Rewards are based on your highest investment amount (high
                watermark). You only earn on new peaks.
              </p>
            </div>

            {/* Referral Bonus */}
            <div className="rounded-2xl bg-[#222325] p-6 shadow-xl border border-[#303136]">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" />
                Referral Bonus
              </h3>
              <div className="space-y-3 text-gray-400 text-sm">
                <p>
                  When you refer someone, you{" "}
                  <span className="text-white font-medium">
                    both earn matching rewards
                  </span>{" "}
                  for the first 3 months from signup.
                </p>
                <div className="p-3 bg-[#1a1a1c] rounded-lg">
                  <p className="text-xs text-gray-500 mb-2">Example:</p>
                  <p className="text-white">
                    If your referral invests $300 and earns $12, you also get{" "}
                    <span className="text-emerald-400 font-semibold">$12</span>.
                  </p>
                </div>
              </div>
            </div>

            {/* Example Calculation */}
            <div className="rounded-2xl bg-gradient-to-br from-blue-500/10 to-emerald-500/10 p-6 border border-blue-500/20">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-400" />
                Quick Example
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-400">
                  <span>Invest $300</span>
                  <span className="text-white">→</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">First $5 bonus</span>
                  <span className="text-emerald-400">$1</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">$100 milestone</span>
                  <span className="text-emerald-400">$5</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">3% of $200</span>
                  <span className="text-emerald-400">$6</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-[#303136]">
                  <span className="text-white font-medium">Total Reward</span>
                  <span className="text-emerald-400 font-semibold">$12</span>
                </div>
              </div>
            </div>

            {/* Requirements */}
            <div className="rounded-2xl bg-[#222325] p-6 shadow-xl border border-[#303136]">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Info className="w-5 h-5 text-gray-400" />
                Requirements
              </h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                  Linked coins.me account
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                  At least 50 RP (verify socials)
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                  Minimum $5 AI7 investment
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
