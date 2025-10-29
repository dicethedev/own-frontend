import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { UserPositionsCard } from "@/components/pool/user/UserPositionsCard";
import { Pool } from "@/types/pool";
import { UserData } from "@/types/user";
import { useChainId } from "wagmi";
import { calculateUserPositionMetrics } from "@/hooks/user";
import { getExplorerUrl } from "@/utils/explorer";

// Mock wagmi
jest.mock("wagmi", () => ({
  useAccount: jest.fn(() => ({ address: "0x123", isConnected: true })),
  useChainId: jest.fn(() => 1),
  useConfig: jest.fn(() => ({})),
  createConfig: jest.fn(),
  http: jest.fn(),
  WagmiProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

jest.mock("@/hooks/user", () => ({
  calculateUserPositionMetrics: jest.fn(),
  formatCurrency: jest.fn((val) => `$${val}`),
  formatNumber: jest.fn((val) => val.toString()),
}));

jest.mock("@/utils/explorer", () => ({
  getExplorerUrl: jest.fn(() => "http://mock-explorer/token"),
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

const baseUserData: UserData = {
  isUser: true,
  userPosition: {
    id: "pos1",
    user: "0xuser",
    pool: "0xpool",
    assetAmount: BigInt("1000000000000000000"), // 1 token
    depositAmount: BigInt("1000000000"),
    collateralAmount: BigInt("300000000"),
    createdAt: BigInt(0),
    updatedAt: BigInt(0),
  },
  userRequest: null,
  isLoading: false,
  error: null,
};

describe("UserPositionsCard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useChainId as jest.Mock).mockReturnValue(1);
    (calculateUserPositionMetrics as jest.Mock).mockReturnValue({
      positionValue: 150,
      entryPrice: 100,
      pnlValue: 50,
      pnlPercentage: 50,
    });
  });

  it("renders loading state", () => {
    render(
      <UserPositionsCard
        pool={mockPool}
        userData={{ ...baseUserData, isLoading: true }}
      />
    );
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("renders error state", () => {
    render(
      <UserPositionsCard
        pool={mockPool}
        userData={{ ...baseUserData, error: new Error("Fetch failed") }}
      />
    );
    expect(screen.getByText(/Error loading position/i)).toBeInTheDocument();
    expect(screen.getByText(/Fetch failed/i)).toBeInTheDocument();
  });

  it("renders empty state when not a user", () => {
    render(
      <UserPositionsCard
        pool={mockPool}
        userData={{ ...baseUserData, isUser: false }}
      />
    );
    expect(screen.getByText(/No open position yet/i)).toBeInTheDocument();
  });

  it("renders empty state when asset amount is zero", () => {
    const zeroPosition = {
      ...baseUserData,
      userPosition: { ...baseUserData.userPosition!, assetAmount: BigInt(0) },
    };
    render(<UserPositionsCard pool={mockPool} userData={zeroPosition} />);
    expect(screen.getByText(/No open position yet/i)).toBeInTheDocument();
  });

  it("renders position table correctly", () => {
    render(<UserPositionsCard pool={mockPool} userData={baseUserData} />);
    expect(screen.getByText("xAAPL")).toBeInTheDocument();
    expect(screen.getByText("$150")).toBeInTheDocument(); // position value
    expect(screen.getByText("$100")).toBeInTheDocument(); // entry price
    expect(screen.getByText(/\+50.00%/)).toBeInTheDocument(); // PNL
  });

  it("renders negative PNL in red", () => {
    (calculateUserPositionMetrics as jest.Mock).mockReturnValueOnce({
      positionValue: 100,
      entryPrice: 150,
      pnlValue: -50,
      pnlPercentage: -33.33,
    });
    render(<UserPositionsCard pool={mockPool} userData={baseUserData} />);
    const pnl = document.querySelector(".text-red-500");
    expect(pnl?.textContent).toMatch(/-33.33%/);
  });

  it("links to correct explorer URL", () => {
    render(<UserPositionsCard pool={mockPool} userData={baseUserData} />);
    const link = screen.getByRole("link", { name: /xAAPL/i });
    expect(link).toHaveAttribute("href", "http://mock-explorer/token");
    expect(getExplorerUrl).toHaveBeenCalledWith(mockPool.assetTokenAddress, 1);
  });

  it("handles null userPosition gracefully", () => {
    render(
      <UserPositionsCard
        pool={mockPool}
        userData={{ ...baseUserData, userPosition: null }}
      />
    );
    expect(screen.getByText(/No open position yet/i)).toBeInTheDocument();
  });

  it("handles NaN pnlPercentage safely", () => {
    (calculateUserPositionMetrics as jest.Mock).mockReturnValueOnce({
      positionValue: 0,
      entryPrice: 0,
      pnlValue: 0,
      pnlPercentage: NaN,
    });

    render(<UserPositionsCard pool={mockPool} userData={baseUserData} />);
    const pnlElement = screen.getByTestId("pnl-value");
    expect(pnlElement).toBeInTheDocument();
    expect(pnlElement.textContent).toMatch(/NaN%/);
  });
});
