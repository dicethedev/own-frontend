import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { LPActionsCard } from "@/components/pool/lp/LPActionsCard";
import { useAccount } from "wagmi";
import { useLiquidityManagement } from "@/hooks/lp";
import { LPData, LPPosition, LPRequest, LPRequestType } from "@/types/lp";
import { Pool } from "@/types/pool";

// Mock wagmi
jest.mock("wagmi", () => ({
  useAccount: jest.fn(),
}));

// Mock liquidity management hook
jest.mock("@/hooks/lp", () => ({
  useLiquidityManagement: jest.fn(),
}));

jest.mock("@/utils", () => ({
  formatTokenBalance: jest.fn((val) => val),
  formatTokenAmount: jest.fn((val) => val),
}));
jest.mock("@/utils/truncate", () => ({
  truncateMessage: jest.fn((msg) => msg),
}));

const mockPool: Pool = {
  address: "0x123",
  assetName: "Apple Inc.",
  assetSymbol: "AAPL",
  assetTokenSymbol: "xAAPL",
  assetTokenAddress: "0xasset",
  assetTokenDecimals: 18,
  assetPrice: 150.25,
  oraclePrice: 150.25,
  priceChange: 2.5,
  reserveToken: "USDC",
  reserveTokenAddress: "0xdef",
  reserveTokenDecimals: 6,
  liquidityManagerAddress: "0x456",
  cycleManagerAddress: "0x789",
  poolStrategyAddress: "0xstrategy",
  oracleAddress: "0xabc",
  volume24h: "0",
  currentCycle: 5,
  poolStatus: "ACTIVE",
  totalLPLiquidityCommited: BigInt("1000000000"),
  lpCount: BigInt(10),
  poolInterestRate: BigInt(500),
  poolUtilizationRatio: BigInt(7500),
  assetSupply: BigInt("10000000000000000000"),
  cycleTotalDeposits: BigInt("500000000"),
  cycleTotalRedemptions: BigInt("200000000000000000000"),
  lpHealthyCollateralRatio: 3000,
  cycleState: "OPEN",
};

const baseLpData: LPData = {
  isLoading: false,
  isLP: false,
  lpPosition: null,
  lpRequest: null,
  error: null,
};

const mockLiquidityManagement = {
  increaseLiquidity: jest.fn(),
  decreaseLiquidity: jest.fn(),
  registerLP: jest.fn(),
  addCollateral: jest.fn(),
  reduceCollateral: jest.fn(),
  claimInterest: jest.fn(),
  approve: jest.fn(),
  checkApproval: jest.fn(),
  checkSufficientBalance: jest.fn(() => true),
  isLoading: false,
  isLoadingBalance: false,
  isApproved: false,
  error: null,
  userBalance: "100",
};

describe("LPActionsCard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAccount as jest.Mock).mockReturnValue({ address: "0x123" });
    (useLiquidityManagement as jest.Mock).mockReturnValue(
      mockLiquidityManagement
    );
  });

  it("renders loading state when lpData.isLoading is true", () => {
    render(
      <LPActionsCard
        pool={mockPool}
        lpData={{ ...baseLpData, isLoading: true }}
        isBlockedFromNewRequests={false}
        blockMessage=""
      />
    );
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText(/LP Actions/i)).toBeInTheDocument();
  });

  it("renders non-LP state with approval button", () => {
    render(
      <LPActionsCard pool={mockPool} lpData={{ ...baseLpData, isLP: false }} isBlockedFromNewRequests={false} blockMessage="" />
    );
    expect(
      screen.getByText(/Become a Liquidity Provider/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Approve/i })
    ).toBeInTheDocument();
  });

  it("disables approval button if balance is insufficient", () => {
    (useLiquidityManagement as jest.Mock).mockReturnValue({
      ...mockLiquidityManagement,
      checkSufficientBalance: jest.fn(() => false),
    });
    render(
      <LPActionsCard pool={mockPool} lpData={{ ...baseLpData, isLP: false }} isBlockedFromNewRequests={false} blockMessage="" />
    );
    const btn = screen.getByRole("button", { name: /Approve/i });
    expect(btn).toBeDisabled();
  });

  it("calls approve when approval button is clicked", async () => {
    render(
      <LPActionsCard pool={mockPool} lpData={{ ...baseLpData, isLP: false }} isBlockedFromNewRequests={false} blockMessage="" />
    );
    fireEvent.change(screen.getByPlaceholderText(/Enter amount/i), {
      target: { value: "10" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Approve/i }));
    await waitFor(() => {
      expect(mockLiquidityManagement.approve).toHaveBeenCalled();
    });
  });

  it("shows pool inactive message when pool is not active", () => {
    render(
      <LPActionsCard
        pool={{ ...mockPool, poolStatus: "HALTED" }}
        lpData={{ ...baseLpData, isLP: false }}
      />
    );
    expect(
      screen.getByText(/Liquidity commitment can only be modified/i)
    ).toBeInTheDocument();
  });

  it("calls increaseLiquidity when 'Add Commitment' is clicked", async () => {
    (useLiquidityManagement as jest.Mock).mockReturnValue({
      ...mockLiquidityManagement,
      isApproved: true,
    });
    render(
      <LPActionsCard pool={mockPool} lpData={{ ...baseLpData, isLP: true }} isBlockedFromNewRequests={false} blockMessage="" />
    );
    fireEvent.change(screen.getByPlaceholderText(/Enter amount to add/i), {
      target: { value: "5" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Add Commitment/i }));
    await waitFor(() => {
      expect(mockLiquidityManagement.increaseLiquidity).toHaveBeenCalledWith(
        "5"
      );
    });
  });

  it("calls claimInterest when button is clicked", async () => {
    render(
      <LPActionsCard
        pool={mockPool}
        lpData={{
          ...baseLpData,
          isLP: true,
          lpPosition: { interestAccrued: 10n } as LPPosition,
        }}
        isBlockedFromNewRequests={false}
        blockMessage=""
      />
    );

    // First switch to collateral tab
    fireEvent.click(screen.getByRole("button", { name: /Collateral/i }));

    fireEvent.click(screen.getByRole("button", { name: /Claim Interest/i }));

    await waitFor(() => {
      expect(mockLiquidityManagement.claimInterest).toHaveBeenCalled();
    });
  });

  it("renders error message when managementError is present", () => {
    (useLiquidityManagement as jest.Mock).mockReturnValue({
      ...mockLiquidityManagement,
      managementError: "Something went wrong",
    });
    render(<LPActionsCard pool={mockPool} lpData={baseLpData} isBlockedFromNewRequests={false} blockMessage="" />);
  });

  it("shows blocked state message when LP has pending request", () => {
    render(
      <LPActionsCard
        pool={mockPool}
        lpData={{
          ...baseLpData,
          isLP: true,
          lpRequest: {
            requestType: LPRequestType.ADDLIQUIDITY,
            requestAmount: 100n,
          } as LPRequest,
        }}
        isBlockedFromNewRequests={false}
        blockMessage=""
      />
    );
  });

  it("handles decreaseLiquidity correctly", async () => {
    (useLiquidityManagement as jest.Mock).mockReturnValue({
      ...mockLiquidityManagement,
      isApproved: true,
    });

    render(
      <LPActionsCard pool={mockPool} lpData={{ ...baseLpData, isLP: true }} isBlockedFromNewRequests={false} blockMessage="" />
    );

    // Select "Remove" radio or tab that sets actionType === "remove"
    fireEvent.click(screen.getByLabelText(/Remove/i)); // if the label for radio is "Remove"

    // Set amount input
    fireEvent.change(screen.getByPlaceholderText(/Enter amount to remove/i), {
      target: { value: "3" },
    });

    // Now click the button (should say "Remove Commitment")
    const removeBtn = screen.getByRole("button", {
      name: /Remove Commitment/i,
    });
    expect(removeBtn).toBeEnabled(); // button enabled now?
    fireEvent.click(removeBtn);

    await waitFor(() => {
      expect(mockLiquidityManagement.decreaseLiquidity).toHaveBeenCalledWith(
        "3"
      );
    });
  });

  it("calls reduceCollateral when 'Remove Collateral' is clicked", async () => {
    (useLiquidityManagement as jest.Mock).mockReturnValue({
      ...mockLiquidityManagement,
      isApproved: true,
    });
    render(
      <LPActionsCard
        pool={mockPool}
        lpData={{
          ...baseLpData,
          isLP: true,
          lpPosition: { collateralAmount: 10n } as LPPosition,
        }}
        isBlockedFromNewRequests={false}
        blockMessage=""
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /Collateral/i }));

    // Select "Remove" radio or tab that sets actionType === "remove"
    fireEvent.click(screen.getByLabelText(/Remove/i)); // if the label for radio is "Remove"

    fireEvent.change(screen.getByPlaceholderText(/Enter amount to remove/i), {
      target: { value: "4" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Remove Collateral/i }));
    await waitFor(() => {
      expect(mockLiquidityManagement.reduceCollateral).toHaveBeenCalledWith(
        "4"
      );
    });
  });

  it("handles empty input gracefully", async () => {
    (useLiquidityManagement as jest.Mock).mockReturnValue({
      ...mockLiquidityManagement,
      isApproved: true,
    });
    render(
      <LPActionsCard pool={mockPool} lpData={{ ...baseLpData, isLP: true }} isBlockedFromNewRequests={false} blockMessage="" />
    );
    fireEvent.click(screen.getByRole("button", { name: /Add Commitment/i }));
    await waitFor(() => {
      expect(mockLiquidityManagement.increaseLiquidity).not.toHaveBeenCalled();
    });
  });
});
