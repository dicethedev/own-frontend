// Transaction messages for toasts
export const USER_TRANSACTION_MESSAGES = {
  approval: {
    pending: "Approving token spending...",
    success: "Token spending approved successfully",
    error: "Failed to approve token spending",
  },
  deposit: {
    pending: "Submitting deposit request...",
    success: "Deposit request submitted successfully",
    error: "Failed to submit deposit request",
  },
  redemption: {
    pending: "Submitting redemption request...",
    success: "Redemption request submitted successfully",
    error: "Failed to submit redemption request",
  },
  claimAsset: {
    pending: "Claiming assets...",
    success: "Assets claimed successfully",
    error: "Failed to claim assets",
  },
  claimReserve: {
    pending: "Claiming reserves...",
    success: "Reserves claimed successfully",
    error: "Failed to claim reserves",
  },
  addCollateral: {
    pending: "Adding collateral...",
    success: "Collateral added successfully",
    error: "Failed to add collateral",
  },
  reduceCollateral: {
    pending: "Reducing collateral...",
    success: "Collateral reduced successfully",
    error: "Failed to reduce collateral",
  },
  exitPool: {
    pending: "Exiting pool...",
    success: "Successfully exited pool",
    error: "Failed to exit pool",
  },
};


export const getFriendlyErrorMessage = (error: { message?: string } | null | undefined): string => {
  const rawMessage = error?.message ?? "";
  const message = rawMessage.toLowerCase();

  if (message.includes("user rejected") || message.includes("denied")) {
    return "Transaction rejected by you.";
  }

  if (message.includes("insufficient funds")) {
    return "Not enough balance to complete this transaction.";
  }

  if (message.includes("insufficient allowance")) {
    return "Token not approved. Please approve before continuing.";
  }

  if (message.includes("underflow") || message.includes("overflow")) {
    return "Invalid amount entered.";
  }

  if (message.includes("execution reverted")) {
    return "Transaction failed on-chain. Please check the details and try again.";
  }

  return "An unexpected error occurred. Please try again.";
};
