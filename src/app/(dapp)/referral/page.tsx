"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import toast from "react-hot-toast";
import {
  User,
  Mail,
  Phone,
  Wallet,
  UserPlus,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  Gift,
  Users,
  ExternalLink,
  Info,
  DollarSign,
  X,
  PartyPopper,
} from "lucide-react";
import { useCoinsVerification } from "@/hooks/useCoinsVerification";
import { useAI7Investment } from "@/hooks/useAI7Investment";

// Constants
const MIN_RP_REQUIRED = 50;
const MIN_INVESTMENT_USD = 100;
const COINS_SOCIAL_VERIFICATION_URL = "https://app.coins.me/on-off-ramp";

// Types
type ContactMethod = "email" | "phone";

// Validation helpers
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isValidPhone = (phone: string): boolean => {
  // Must start with + and contain at least 10 digits
  const phoneRegex = /^\+[1-9]\d{9,14}$/;
  return phoneRegex.test(phone.replace(/\s/g, ""));
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
        <div className={`mt-0.5 ${iconColor}`}>{icon}</div>
        <div className="flex-1">
          <h4 className="font-medium text-white mb-1">{title}</h4>
          <div className="text-sm text-gray-400">{children}</div>
        </div>
      </div>
    </div>
  );
};

// Radio Option Component
const RadioOption: React.FC<{
  id: string;
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  icon: React.ReactNode;
  label: string;
}> = ({ id, name, value, checked, onChange, icon, label }) => (
  <label
    htmlFor={id}
    className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
      checked
        ? "border-blue-500 bg-blue-500/10"
        : "border-[#303136] bg-[#1a1a1c] hover:border-[#404146]"
    }`}
  >
    <input
      type="radio"
      id={id}
      name={name}
      value={value}
      checked={checked}
      onChange={onChange}
      className="w-4 h-4 text-blue-500 bg-gray-700 border-gray-600 focus:ring-blue-500 focus:ring-offset-gray-800"
    />
    <div className="flex items-center gap-2">
      <span className={checked ? "text-blue-400" : "text-gray-400"}>
        {icon}
      </span>
      <span className={checked ? "text-white" : "text-gray-300"}>{label}</span>
    </div>
  </label>
);

// Helper function to format USD
const formatUSD = (value: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

function ReferralPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Form state
  const [name, setName] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [contactMethod, setContactMethod] = useState<ContactMethod>("email");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [referrerWallet, setReferrerWallet] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [rewardAmount, setRewardAmount] = useState<number>(0);

  // Hooks
  const userVerification = useCoinsVerification();
  const investmentCheck = useAI7Investment();

  // Pre-fill referrer from ?ref=0x... (referral link)
  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref && isValidWalletAddress(ref)) {
      setReferrerWallet(ref.trim());
    }
  }, [searchParams]);

  // Debounce timers
  const [userVerifyTimer, setUserVerifyTimer] = useState<NodeJS.Timeout | null>(
    null,
  );
  const [investmentTimer, setInvestmentTimer] = useState<NodeJS.Timeout | null>(
    null,
  );
  const [referrerSignupTimer, setReferrerSignupTimer] =
    useState<NodeJS.Timeout | null>(null);

  // Referrer signup check (is this wallet signed up to referral program?)
  const [referrerSignupStatus, setReferrerSignupStatus] = useState<{
    signedUp: boolean | null;
    isLoading: boolean;
  }>({ signedUp: null, isLoading: false });

  // Trigger user verification when wallet and contact are valid
  useEffect(() => {
    if (userVerifyTimer) clearTimeout(userVerifyTimer);

    const isContactValid =
      contactMethod === "email"
        ? isValidEmail(email)
        : isValidPhone(phoneNumber);

    if (isContactValid && isValidWalletAddress(walletAddress)) {
      const timer = setTimeout(() => {
        if (contactMethod === "email") {
          userVerification.verify(email, walletAddress);
        } else {
          userVerification.verifyPhone(
            phoneNumber.replace(/\s/g, ""),
            walletAddress,
          );
        }
      }, 500);
      setUserVerifyTimer(timer);
    } else {
      userVerification.reset();
    }

    return () => {
      if (userVerifyTimer) clearTimeout(userVerifyTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, phoneNumber, walletAddress, contactMethod]);

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

  // Check if referrer wallet is signed up to the referral program
  useEffect(() => {
    if (referrerSignupTimer) clearTimeout(referrerSignupTimer);

    const trimmed = referrerWallet.trim();
    const walletValid = isValidWalletAddress(trimmed);
    const isSameAsUser =
      walletAddress.trim().toLowerCase() === trimmed.toLowerCase();

    if (!trimmed || !walletValid || isSameAsUser) {
      setReferrerSignupStatus({ signedUp: null, isLoading: false });
      return;
    }

    const timer = setTimeout(async () => {
      setReferrerSignupStatus((prev) => ({ ...prev, isLoading: true }));
      try {
        const baseUrl =
          process.env.NEXT_PUBLIC_API_URL || "https://api.ownfinance.org";
        const response = await fetch(
          `${baseUrl}/api/referral/is-signed-up/${encodeURIComponent(trimmed)}`,
        );
        const data = await response.json().catch(() => ({}));
        const signedUp =
          data?.success === true && data?.data?.is_signed_up === true;
        setReferrerSignupStatus({ signedUp, isLoading: false });
      } catch {
        setReferrerSignupStatus({ signedUp: null, isLoading: false });
      }
    }, 500);

    setReferrerSignupTimer(timer);
    return () => {
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [referrerWallet, walletAddress]);

  // Reset contact fields when switching method
  const handleContactMethodChange = (method: ContactMethod) => {
    setContactMethod(method);
    userVerification.reset();
  };

  // Validation state
  const userValidation = useMemo(() => {
    const contactValid =
      contactMethod === "email"
        ? isValidEmail(email)
        : isValidPhone(phoneNumber);
    const walletValid = isValidWalletAddress(walletAddress);
    const isVerified = userVerification.data?.verified === true;
    const hasEnoughRP = (userVerification.data?.rp || 0) >= MIN_RP_REQUIRED;
    const hasEnoughInvestment =
      (investmentCheck.usdValue || 0) >= MIN_INVESTMENT_USD;

    let contactError: string | null = null;
    if (contactMethod === "email") {
      if (email && !isValidEmail(email)) {
        contactError = "Please enter a valid email address";
      } else if (
        isValidEmail(email) &&
        walletValid &&
        userVerification.data &&
        !isVerified
      ) {
        contactError = "This email is not linked to your coins.me wallet";
      }
    } else {
      if (phoneNumber && !isValidPhone(phoneNumber)) {
        contactError =
          "Please enter a valid phone number (e.g., +919876543210)";
      } else if (
        isValidPhone(phoneNumber) &&
        walletValid &&
        userVerification.data &&
        !isVerified
      ) {
        contactError =
          "This phone number is not linked to your coins.me wallet";
      }
    }

    return {
      contactValid,
      walletValid,
      isVerified,
      hasEnoughRP,
      hasEnoughInvestment,
      contactError,
      walletError:
        walletAddress && !walletValid
          ? "Please enter a valid wallet address (0x...)"
          : contactValid && walletValid && userVerification.data && !isVerified
            ? "This wallet is not linked to your coins.me account"
            : null,
    };
  }, [
    email,
    phoneNumber,
    walletAddress,
    contactMethod,
    userVerification.data,
    investmentCheck.usdValue,
  ]);

  // Referrer validation
  const referrerValidation = useMemo(() => {
    if (!referrerWallet.trim()) {
      return {
        walletValid: true,
        walletError: null,
        isSameAsUser: false,
        isSignedUp: true,
        isSignedUpLoading: false,
      };
    }

    const walletValid = isValidWalletAddress(referrerWallet);
    const isSameWallet =
      walletAddress.trim().toLowerCase() ===
      referrerWallet.trim().toLowerCase();

    let walletError: string | null = null;
    if (!walletValid) {
      walletError = "Please enter a valid wallet address (0x...)";
    } else if (
      isSameWallet &&
      walletValid &&
      isValidWalletAddress(walletAddress)
    ) {
      walletError = "Referrer wallet cannot be the same as your wallet";
    } else if (
      walletValid &&
      !referrerSignupStatus.isLoading &&
      referrerSignupStatus.signedUp === false
    ) {
      walletError = "Referrer is not signed up to the referral program";
    }

    return {
      walletValid,
      isSameAsUser:
        isSameWallet && walletValid && isValidWalletAddress(walletAddress),
      isSignedUp: referrerSignupStatus.signedUp,
      isSignedUpLoading: referrerSignupStatus.isLoading,
      walletError,
    };
  }, [walletAddress, referrerWallet, referrerSignupStatus]);

  // Can submit check
  const canSubmit = useMemo(() => {
    const referrerOk =
      !referrerValidation.walletError &&
      !referrerValidation.isSameAsUser &&
      (referrerWallet.trim() === "" || referrerValidation.isSignedUp === true);

    return (
      name.trim().length >= 2 &&
      userValidation.walletValid &&
      userValidation.contactValid &&
      userValidation.isVerified &&
      userValidation.hasEnoughRP &&
      userValidation.hasEnoughInvestment &&
      referrerOk
    );
  }, [name, userValidation, referrerValidation, referrerWallet]);

  // Trigger confetti effect
  const triggerConfetti = () => {
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ["#3b82f6", "#8b5cf6", "#10b981"],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ["#3b82f6", "#8b5cf6", "#10b981"],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();
  };

  // Handle success modal close - redirect to referral link generator
  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    router.push("/referral/link");
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);

    try {
      const payload = {
        name: name.trim(),
        ...(contactMethod === "email"
          ? { email: email.trim() }
          : { phone_number: phoneNumber.replace(/\s/g, "") }),
        wallet_address: walletAddress.trim(),
        referrer_wallet: referrerWallet.trim() || undefined,
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || ""}/api/referral/signup`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to submit claim");
      }

      // Fetch reward status
      const statusResponse = await fetch(
        `https://api.ownfinance.org/api/referral/status/${walletAddress.trim()}`,
      );

      if (statusResponse.ok) {
        const statusData = await statusResponse.json();

        if (statusData.success && statusData.data?.referral_reward_events) {
          // Get today's date (start of day)
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          // Filter signup rewards from today
          const todaySignupRewards =
            statusData.data.referral_reward_events.filter(
              (event: {
                event_type: string;
                created_at: string;
                reward_amount: number;
              }) => {
                const eventDate = new Date(event.created_at);
                eventDate.setHours(0, 0, 0, 0);
                return (
                  event.event_type.startsWith("signup") &&
                  eventDate.getTime() === today.getTime()
                );
              },
            );

          // Sum up the rewards
          const totalReward = todaySignupRewards.reduce(
            (sum: number, event: { reward_amount: number }) =>
              sum + event.reward_amount,
            0,
          );

          setRewardAmount(totalReward);
        }
      }

      // Show success modal and confetti
      setShowSuccessModal(true);
      triggerConfetti();
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("Failed to submit claim.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex flex-col min-h-screen bg-[#111113]">
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-12 sm:pt-24">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 mb-4">
            <Gift className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Referral Signup
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Submit your details to signup for the referral program and start
            earning rewards when you refer friends to invest in AI7 on coins.me!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <form
              onSubmit={handleSubmit}
              className="bg-[#1a1a1c] rounded-2xl border border-[#303136] p-6 sm:p-8 space-y-6"
            >
              {/* Your Details Section */}
              <div>
                <h2 className="text-xl font-semibold text-white flex items-center gap-2 mb-6">
                  <User className="w-5 h-5 text-blue-400" />
                  Your Details
                </h2>

                <div className="space-y-4">
                  {/* Name */}
                  <FormInput
                    id="name"
                    label="Your Name"
                    icon={<User className="w-5 h-5" />}
                    value={name}
                    onChange={setName}
                    placeholder="Enter your name"
                    error={
                      name && name.trim().length < 2
                        ? "Name must be at least 2 characters"
                        : null
                    }
                  />

                  {/* Wallet Address */}
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

                  {/* Contact Method Selection */}
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-300">
                      Contact Method
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <RadioOption
                        id="contact-email"
                        name="contactMethod"
                        value="email"
                        checked={contactMethod === "email"}
                        onChange={() => handleContactMethodChange("email")}
                        icon={<Mail className="w-5 h-5" />}
                        label="Email"
                      />
                      <RadioOption
                        id="contact-phone"
                        name="contactMethod"
                        value="phone"
                        checked={contactMethod === "phone"}
                        onChange={() => handleContactMethodChange("phone")}
                        icon={<Phone className="w-5 h-5" />}
                        label="Mobile"
                      />
                    </div>
                  </div>

                  {/* Email or Phone Input */}
                  {contactMethod === "email" ? (
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
                        userValidation.contactValid && userValidation.isVerified
                      }
                      error={userValidation.contactError}
                    />
                  ) : (
                    <FormInput
                      id="phone"
                      label="Your Phone Number (used on your coins.me account)"
                      icon={<Phone className="w-5 h-5" />}
                      value={phoneNumber}
                      onChange={setPhoneNumber}
                      placeholder="+919876543210"
                      type="tel"
                      isLoading={userVerification.isLoading}
                      success={
                        userValidation.contactValid && userValidation.isVerified
                      }
                      error={userValidation.contactError}
                      helperText="Enter with country code (e.g., +91 for India)"
                    />
                  )}
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
                        You need at least {MIN_RP_REQUIRED} RP to signup for the referral program.
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
                        to signup for the referral program.
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
                        href="https://app.coins.me/"
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
                <h2 className="text-xl font-semibold text-white flex items-center gap-2 mb-4">
                  <UserPlus className="w-5 h-5 text-blue-400" />
                  Referrer Details
                  <span className="text-sm font-normal text-gray-500">
                    (Optional)
                  </span>
                </h2>

                <FormInput
                  id="referrerWallet"
                  label="Referrer's Wallet Address"
                  icon={<Wallet className="w-5 h-5" />}
                  value={referrerWallet}
                  onChange={setReferrerWallet}
                  placeholder="0x... (optional)"
                  isLoading={referrerValidation.isSignedUpLoading}
                  success={
                    referrerWallet.trim() !== "" &&
                    referrerValidation.walletValid &&
                    !referrerValidation.isSameAsUser &&
                    referrerValidation.isSignedUp === true
                  }
                  error={referrerValidation.walletError}
                  helperText="If someone referred you, enter their wallet address"
                />
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
                    <UserPlus className="w-5 h-5" />
                    Signup
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Sidebar - How It Works */}
          <div className="space-y-6">
            {/* Referral Bonus */}
            <div className="bg-[#1a1a1c] rounded-2xl border border-[#303136] p-6">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-purple-400" />
                Referral Reward
              </h3>
              <div className="space-y-3">
                <p className="text-gray-400 text-sm leading-relaxed">
                  Earn a{" "}
                  <span className="text-white font-medium">3% reward</span> on
                  referrals who invest
                  <span className="text-white font-medium"> $100 or more</span>.
                  Rewards are issued 2 weeks after the investment date.
                </p>

                <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                  <p className="text-sm text-purple-300">
                    <strong>Example:</strong> Your referral invests $1,000.
                    After 14 days, you receive a <strong>$30</strong> bonus!
                  </p>
                </div>
              </div>
            </div>

            {/* Requirements */}
            <div className="bg-[#1a1a1c] rounded-2xl border border-[#303136] p-6">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                <Info className="w-5 h-5 text-blue-400" />
                Signup Requirements
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
                  Minimum $100 AI7 investment
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={handleSuccessModalClose}
          />

          {/* Modal */}
          <div className="relative bg-[#1a1a1c] rounded-2xl border border-[#303136] p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Close button */}
            <button
              onClick={handleSuccessModalClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Content */}
            <div className="text-center">
              {/* Icon */}
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500/20 to-blue-500/20 mb-6">
                <PartyPopper className="w-10 h-10 text-emerald-400" />
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold text-white mb-3">
                Congratulations! 🎉
              </h2>

              {/* Message */}
              {rewardAmount > 0 ? (
                <p className="text-gray-300 mb-6">
                  You&apos;ve received{" "}
                  <span className="text-emerald-400 font-semibold text-xl">
                    ${rewardAmount.toFixed(2)}
                  </span>{" "}
                  in rewards! It has been sent to your coins.me wallet.
                </p>
              ) : (
                <p className="text-gray-300 mb-6">
                  You&apos;ve successfully registered for the referral program!
                  Refer your friends to earn rewards.
                </p>
              )}

              {/* Reward breakdown if exists */}
              {rewardAmount > 0 && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Signup Reward</span>
                    <span className="text-emerald-400 font-semibold">
                      ${rewardAmount.toFixed(2)} USDC
                    </span>
                  </div>
                </div>
              )}

              {/* Close button */}
              <button
                onClick={handleSuccessModalClose}
                className="w-full py-3 px-6 rounded-xl font-semibold text-white bg-blue-500 hover:bg-blue-600 transition-colors"
              >
                Refer friends
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function ReferralPage() {
  return (
    <Suspense
      fallback={
        <main className="flex flex-col min-h-screen bg-[#111113]">
          <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-12 sm:pt-24 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
          </div>
        </main>
      }
    >
      <ReferralPageContent />
    </Suspense>
  );
}
