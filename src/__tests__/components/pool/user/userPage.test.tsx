import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { useUserData } from "@/hooks/user";
import { Pool } from "@/types/pool";
import { UserRequestType, UserData } from "@/types/user";
import UserPage from "@/components/pool/user/UserPage";
import { Connector, useAccount, UseAccountReturnType } from "wagmi";
import { Chain } from "viem";

// Mock wagmi
jest.mock("wagmi", () => ({
  useAccount: jest.fn(() => ({ address: "0x123", isConnected: true })),
  useChainId: jest.fn(() => 1),
  useConfig: jest.fn(() => ({})),
  createConfig: jest.fn(),
  http: jest.fn(),
  WagmiProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock useUserData hook
jest.mock("@/hooks/user", () => ({
  useUserData: jest.fn(),
}));

jest.mock("@/components/ui/BaseComponents", () => ({
  Card: ({ children, className }: React.PropsWithChildren<{ className?: string }>) => (
    <div className={className}>{children}</div>
  ),
  CardHeader: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  CardContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  CardTitle: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));

jest.mock("@/components/pool/TradingViewComponent", () => ({
  TradingViewWidget: ({ symbol }: { symbol: string }) => (
    <div data-testid="trading-view-widget">TradingView: {symbol}</div>
  ),
}));

jest.mock("@/components/pool/user/UserActionsCard", () => ({
  UserActionsCard: ({
    pool,
    isBlockedFromNewRequests,
    blockMessage,
  }: {
    pool: { assetSymbol: string };
    isBlockedFromNewRequests?: boolean;
    blockMessage?: string;
  }) => (
    <div data-testid="user-actions-card">
      User Actions Card - Pool: {pool.assetSymbol} - Blocked:{" "}
      {isBlockedFromNewRequests?.toString()} - Message: {blockMessage}
    </div>
  ),
}));

jest.mock("@/components/pool/user/UserRequestsCard", () => ({
  UserRequestsCard: ({ pool }: { pool: { assetSymbol: string } }) => (
    <div data-testid="user-requests-card">User Requests Card - Pool: {pool.assetSymbol}</div>
  ),
}));

jest.mock("@/components/pool/user/UserPositionsCard", () => ({
  UserPositionsCard: ({ pool }: { pool: { assetSymbol: string } }) => (
    <div data-testid="user-positions-card">User Positions Card - Pool: {pool.assetSymbol}</div>
  ),
}));

jest.mock("@/components/pool/user/UnconnectedActionsCard", () => ({
  UnconnectedActionsCard: () => <div data-testid="unconnected-actions-card">Unconnected Actions</div>,
}));

jest.mock("@/components/pool/user/UnconnectedPositionsCard", () => ({
  UnconnectedPositionsCard: () => (
    <div data-testid="unconnected-positions-card">Unconnected Positions</div>
  ),
}));

jest.mock("@/components/Footer", () => ({
  Footer: () => <div data-testid="footer">Footer</div>,
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

export const baseUserData: UserData = {
  isUser: true,
  userPosition: {
    id: "pos1",
    user: "0x123",
    pool: "0x456",
    assetAmount: BigInt("100000000000000000000"),
    depositAmount: BigInt("1000000000"),
    collateralAmount: BigInt("300000000"),
    createdAt: BigInt(123),
    updatedAt: BigInt(123),
  },
  userRequest: null,
  isLoading: false,
  error: null,
};

describe("UserPage", () => {
  const mockUseAccount = useAccount as jest.MockedFunction<typeof useAccount>;
  const mockUseUserData = useUserData as jest.MockedFunction<typeof useUserData>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("when wallet is not connected", () => {
    beforeEach(() => {
      mockUseAccount.mockReturnValue({
        address: undefined,
        addresses: undefined,
        chain: undefined,
        chainId: undefined,
        connector: undefined,
        isConnected: false,
        isReconnecting: false,
        isConnecting: false,
        isDisconnected: true,
        status: "disconnected",
      } as unknown as UseAccountReturnType);
      mockUseUserData.mockReturnValue(baseUserData);
    });

    it("renders unconnected actions and positions", () => {
      render(<UserPage pool={mockPool} />);

      expect(screen.getByTestId("unconnected-actions-card")).toBeInTheDocument();
      expect(screen.getByTestId("unconnected-positions-card")).toBeInTheDocument();
    });
  });

  describe("when wallet is connected", () => {
    beforeEach(() => {
      mockUseAccount.mockReturnValue({
        address: "0x123" as `0x${string}`,
        addresses: ["0x123"] as [`0x${string}`, ...`0x${string}`[]],
        chain: { id: 84532, name: "Base Sepolia" } as unknown as Chain,
        chainId: 84532,
        connector: { id: "injected", name: "Injected" } as unknown as Connector,
        isConnected: true,
        isReconnecting: false,
        isConnecting: false,
        isDisconnected: false,
        status: "connected",
      } as unknown as UseAccountReturnType);
    });

    it("renders connected actions and positions", () => {
      mockUseUserData.mockReturnValue(baseUserData);
      render(<UserPage pool={mockPool} />);
      expect(screen.getByTestId("user-actions-card")).toBeInTheDocument();
      expect(screen.getByTestId("user-positions-card")).toBeInTheDocument();
    });

    it("blocks user if active request in current cycle", () => {
      mockUseUserData.mockReturnValue({
        ...baseUserData,
        userRequest: {
          id: "req1",
          requestType: UserRequestType.DEPOSIT,
          amount: BigInt(1),
          collateralAmount: BigInt(1),
          requestCycle: BigInt(mockPool.currentCycle),
          createdAt: BigInt(1),
          updatedAt: BigInt(1),
        },
      });
      render(<UserPage pool={mockPool} />);
      const actionsCard = screen.getByTestId("user-actions-card");
      expect(actionsCard).toHaveTextContent("Blocked: true");
      expect(actionsCard).toHaveTextContent("You have an active request");
    });

    it("blocks user if active request from past cycle (claimable)", () => {
      mockUseUserData.mockReturnValue({
        ...baseUserData,
        userRequest: {
          id: "req2",
          requestType: UserRequestType.DEPOSIT,
          amount: BigInt(1),
          collateralAmount: BigInt(1),
          requestCycle: BigInt(mockPool.currentCycle - 1),
          createdAt: BigInt(1),
          updatedAt: BigInt(1),
        },
      });
      render(<UserPage pool={mockPool} />);
      const actionsCard = screen.getByTestId("user-actions-card");
      expect(actionsCard).toHaveTextContent("Please claim your processed request");
    });

    it("shows loading state when data is loading", () => {
      mockUseUserData.mockReturnValue({ ...baseUserData, isLoading: true });
      render(<UserPage pool={mockPool} />);

      expect(screen.getByTestId("user-actions-card")).toBeInTheDocument();
      expect(screen.getByTestId("user-positions-card")).toBeInTheDocument();
    });

    it("handles error state gracefully", () => {
      mockUseUserData.mockReturnValue({
        ...baseUserData,
        error: new Error("Failed to fetch"),
      });
      render(<UserPage pool={mockPool} />);
      expect(screen.getByTestId("user-actions-card")).toBeInTheDocument();
    });
  });
});
