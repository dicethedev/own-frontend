import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import LPPage from "@/components/pool/lp/LPPage";
import { useAccount } from "wagmi";
import { useLPData } from "@/hooks/lp";
import { Pool } from "@/types/pool";
import { LPData, LPRequestType } from "@/types/lp";


// Mock wagmi
jest.mock("wagmi", () => ({
  useAccount: jest.fn(() => ({ address: "0x123", isConnected: true })),
  useChainId: jest.fn(() => 1),
  useConfig: jest.fn(() => ({})),
  useWriteContract: jest.fn(() => ({
    writeContract: jest.fn(),
    data: undefined,
    isPending: false,
  })),
  useWaitForTransactionReceipt: jest.fn(() => ({ isLoading: false })),
  createConfig: jest.fn(),
  http: jest.fn(),
  WagmiProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

jest.mock("@/hooks/lp", () => ({
  useLPData: jest.fn(),
}));

// Mock Supabase whitelist check - default to true so existing tests pass
const mockCheckIfUserIsWhitelisted = jest.fn();
jest.mock("@/services/supabase", () => ({
  checkIfUserIsWhitelisted: (address: string) => mockCheckIfUserIsWhitelisted(address),
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        ilike: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ error: null, data: null })),
        })),
      })),
    })),
  },
}));

// Mock LPWhitelistCard
jest.mock("@/components/LPWhitelistCard/LPWhitelistCard", () => ({
  LPWhitelistCard: ({ title }: { title: string }) => (
    <div data-testid="lp-whitelist-card">
      LP Whitelist Card - {title}
    </div>
  ),
}));

jest.mock("@/components/ui/BaseComponents", () => ({
  Card: ({
    children,
    className,
  }: React.PropsWithChildren<{ className?: string }>) => (
    <div className={className}>{children}</div>
  ),
  CardHeader: ({
    children,
    className,
  }: React.PropsWithChildren<{ className?: string }>) => (
    <div className={className}>{children}</div>
  ),
  CardTitle: ({
    children,
    className,
  }: React.PropsWithChildren<{ className?: string }>) => (
    <h3 className={className}>{children}</h3>
  ),
  CardContent: ({
    children,
    className,
  }: React.PropsWithChildren<{ className?: string }>) => (
    <div className={className}>{children}</div>
  ),
  Button: ({
    children,
    className,
    ...props
  }: React.PropsWithChildren<{ className?: string }>) => (
    <button className={className} {...props}>
      {children}
    </button>
  ),
}));

jest.mock("@/components/pool/TradingViewComponent", () => ({
  TradingViewWidget: ({ symbol }: { symbol: string }) => (
    <div data-testid="trading-view-widget">TradingView: {symbol}</div>
  ),
}));

jest.mock("@/components/pool/lp/LPActionsCard", () => ({
  LPActionsCard: ({
    pool,
    isBlockedFromNewRequests,
    blockMessage,
  }: {
    pool: { assetSymbol: string };
    lpData?: unknown;
    isBlockedFromNewRequests?: boolean;
    blockMessage?: string;
  }) => (
    <div data-testid="lp-actions-card">
      LP Actions Card - Pool: {pool.assetSymbol} - Blocked:{" "}
      {isBlockedFromNewRequests?.toString()} - Message: {blockMessage}
    </div>
  ),
}));

jest.mock("@/components/pool/lp/UnconnectedActionsCard", () => ({
  UnconnectedActionsCard: () => (
    <div data-testid="unconnected-actions-card">Unconnected Actions Card</div>
  ),
}));

jest.mock("@/components/pool/lp/AdditionalActionsCard", () => ({
  AdditionalActionsCard: () => (
    <div data-testid="additional-actions-card">Additional Actions Card</div>
  ),
}));

jest.mock("@/components/pool/lp/LPInfoCard", () => ({
  LPInfoCard: ({
    pool,
  }: {
    pool: { assetSymbol: string };
    lpData?: unknown;
  }) => (
    <div data-testid="lp-info-card">
      LP Info Card - Pool: {pool.assetSymbol}
    </div>
  ),
}));

jest.mock("@/components/pool/lp/LPRequestsCard", () => ({
  LPRequestsCard: ({
    pool,
  }: {
    pool: { assetSymbol: string };
    lpData?: unknown;
  }) => (
    <div data-testid="lp-requests-card">
      LP Requests Card - Pool: {pool.assetSymbol}
    </div>
  ),
}));

jest.mock("@/components/pool/lp/LPPositionsCard", () => ({
  LPPositionsCard: ({
    pool,
  }: {
    pool: { assetSymbol: string };
    lpData?: unknown;
  }) => (
    <div data-testid="lp-positions-card">
      LP Positions Card - Pool: {pool.assetSymbol}
    </div>
  ),
}));

jest.mock("@/components/pool/lp/RebalanceCard", () => ({
  RebalanceCard: ({
    pool,
  }: {
    pool: { assetSymbol: string };
    lpData?: unknown;
  }) => (
    <div data-testid="rebalance-card">
      Rebalance Card - Pool: {pool.assetSymbol}
    </div>
  ),
}));

jest.mock("@/components/Footer", () => ({
  Footer: () => <div data-testid="footer">Footer</div>,
}));

export const mockPool: Pool = {
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
  prevRebalancePrice: BigInt("1000000000000000000"), // 1.0
};

export const mockLPData: LPData = {
  isLP: true,
  lpPosition: {
    id: "0x123-0x456",
    lp: "0x123",
    pool: "0x456",
    delegateAddress: "0x789",
    liquidityCommitment: BigInt("1000000000"),
    collateralAmount: BigInt("300000000"),
    interestAccrued: BigInt("50000000"),
    liquidityHealth: 3,
    assetShare: BigInt("100000000000000000000"),
    lastRebalanceCycle: BigInt(4),
    lastRebalancePrice: BigInt("150250000000000000000"),
    createdAt: BigInt(1234567890),
    updatedAt: BigInt(1234567900),
  },
  lpRequest: null,
  isLoading: false,
  error: null,
};

describe("LPPage", () => {
  const mockUseAccount = useAccount as jest.MockedFunction<typeof useAccount>;
  const mockUseLPData = useLPData as jest.MockedFunction<typeof useLPData>;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    // Reset the whitelist check to return true by default and resolve immediately
    mockCheckIfUserIsWhitelisted.mockImplementation(() => Promise.resolve(true));
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
      });
      mockUseLPData.mockReturnValue(mockLPData);
    });

    it("renders basic layout with unconnected actions card", () => {
      render(<LPPage pool={mockPool} />);

      expect(screen.getByText("Apple Inc. (AAPL)")).toBeInTheDocument();
      expect(screen.getByText("$150.25")).toBeInTheDocument();
      expect(screen.getByText("+2.5%")).toBeInTheDocument();
      expect(screen.getByText("ACTIVE")).toBeInTheDocument();
      expect(screen.getByText("Cycle #5")).toBeInTheDocument();
      expect(screen.getByTestId("trading-view-widget")).toBeInTheDocument();
      expect(
        screen.getByTestId("unconnected-actions-card")
      ).toBeInTheDocument();
      expect(screen.getByTestId("lp-info-card")).toBeInTheDocument();
      expect(screen.queryByTestId("lp-requests-card")).not.toBeInTheDocument();
      expect(screen.queryByTestId("lp-positions-card")).not.toBeInTheDocument();
      expect(screen.queryByTestId("rebalance-card")).not.toBeInTheDocument();
    });

    it("displays correct price change styling for positive change", () => {
      render(<LPPage pool={mockPool} />);
      const priceChangeElement = screen.getByText("+2.5%");
      expect(priceChangeElement).toHaveClass("text-green-500");
    });

    it("displays correct price change styling for negative change", () => {
      const poolWithNegativeChange = { ...mockPool, priceChange: -1.5 };
      render(<LPPage pool={poolWithNegativeChange} />);
      const priceChangeElement = screen.getByText("-1.5%");
      expect(priceChangeElement).toHaveClass("text-red-500");
    });

    it("displays correct pool status styling for ACTIVE status", () => {
      render(<LPPage pool={mockPool} />);
      const statusElement = screen.getByText("ACTIVE");
      expect(statusElement).toHaveClass("text-green-500");
    });

    it("displays correct pool status styling for non-ACTIVE status", () => {
      const poolWithDifferentStatus = {
        ...mockPool,
        poolStatus: "REBALANCING ONCHAIN" as Pool["poolStatus"],
      };
      render(<LPPage pool={poolWithDifferentStatus} />);
      const statusElement = screen.getByText("REBALANCING ONCHAIN");
      expect(statusElement).toHaveClass("text-yellow-500");
    });
  });

  describe("when wallet is connected", () => {
    beforeEach(() => {
      mockUseAccount.mockReturnValue({
        address: "0x123",
        isConnected: true,
        status: "connected",
      } as unknown as ReturnType<typeof useAccount>);
    });

    describe("with no active LP request", () => {
      beforeEach(() => {
        mockUseLPData.mockReturnValue({
          ...mockLPData,
          lpRequest: null,
        });
      });

      it("renders connected layout with LP actions card and no blocking", async () => {
        render(<LPPage pool={mockPool} />);

        // Wait for the async whitelist check to complete and component to update
        await waitFor(() => {
          expect(screen.getByTestId("lp-actions-card")).toBeInTheDocument();
        });

        expect(screen.getByTestId("lp-actions-card")).toBeInTheDocument();
        expect(screen.getByTestId("lp-requests-card")).toBeInTheDocument();
        expect(screen.getByTestId("lp-positions-card")).toBeInTheDocument();
        expect(screen.getByTestId("rebalance-card")).toBeInTheDocument();

        const actionsCard = screen.getByTestId("lp-actions-card");
        expect(actionsCard).toHaveTextContent("Blocked: false");
        expect(actionsCard).toHaveTextContent(/Message:/);
      });
    });

    describe("with active LP request in current cycle", () => {
      beforeEach(() => {
        mockUseLPData.mockReturnValue({
          ...mockLPData,
          lpRequest: {
            id: "0x123-0x456-5",
            requestType: LPRequestType.ADDLIQUIDITY,
            requestAmount: BigInt("500000000"),
            requestCycle: BigInt(5), // Same as current cycle
            createdAt: BigInt(1234567890),
            updatedAt: BigInt(1234567900),
          },
        });
      });

      it("blocks new requests with appropriate message", async () => {
        render(<LPPage pool={mockPool} />);

        const actionsCard = await waitFor(() => screen.getByTestId("lp-actions-card"));
        expect(actionsCard).toHaveTextContent("Blocked: true");
        expect(actionsCard).toHaveTextContent(
          "Message: You already have an active request. You must wait for it to be processed before making a new one."
        );
      });
    });

    describe("with active LP request from previous cycle", () => {
      beforeEach(() => {
        mockUseLPData.mockReturnValue({
          ...mockLPData,
          lpRequest: {
            id: "0x123-0x456-4",
            requestType: LPRequestType.REDUCELIQUIDITY,
            requestAmount: BigInt("200000000"),
            requestCycle: BigInt(4), // Previous cycle
            createdAt: BigInt(1234567890),
            updatedAt: BigInt(1234567900),
          },
        });
      });

      it("blocks new requests with appropriate message", async () => {
        render(<LPPage pool={mockPool} />);

        const actionsCard = await waitFor(() => screen.getByTestId("lp-actions-card"));
        expect(actionsCard).toHaveTextContent("Blocked: true");
        expect(actionsCard).toHaveTextContent(
          "Message: You have an active liquidity request. You must wait for it to be processed before making a new one."
        );
      });
    });

    describe("when user is not an LP", () => {
      beforeEach(() => {
        mockUseLPData.mockReturnValue({
          ...mockLPData,
          isLP: false,
          lpPosition: null,
        });
      });

      it("does not render rebalance card", async () => {
        render(<LPPage pool={mockPool} />);

        await waitFor(() => {
          expect(screen.getByTestId("lp-actions-card")).toBeInTheDocument();
        });
        expect(screen.getByTestId("lp-requests-card")).toBeInTheDocument();
        expect(screen.getByTestId("lp-positions-card")).toBeInTheDocument();
        expect(screen.queryByTestId("rebalance-card")).not.toBeInTheDocument();
      });
    });

    describe("when LP data is loading", () => {
      beforeEach(() => {
        mockUseLPData.mockReturnValue({
          ...mockLPData,
          isLoading: true,
        });
      });

      it("still renders all components (individual components handle their own loading states)", async () => {
        render(<LPPage pool={mockPool} />);

        await waitFor(() => {
          expect(screen.getByTestId("lp-actions-card")).toBeInTheDocument();
        });
        expect(screen.getByTestId("lp-requests-card")).toBeInTheDocument();
        expect(screen.getByTestId("lp-positions-card")).toBeInTheDocument();
        expect(screen.getByTestId("rebalance-card")).toBeInTheDocument();
      });
    });
  });

  describe("edge cases", () => {
    beforeEach(() => {
      mockUseAccount.mockReturnValue({
        isConnected: true,
        address: "0x123",
      } as unknown as ReturnType<typeof useAccount>);
    });

    it("handles zero price change correctly", () => {
      const poolWithZeroChange = { ...mockPool, priceChange: 0 };
      render(<LPPage pool={poolWithZeroChange} />);

      const priceChangeElement = screen.getByText("+0%");
      expect(priceChangeElement).toHaveClass("text-green-500");
    });

    it("handles very large numbers correctly", () => {
      const poolWithLargePrice = { ...mockPool, assetPrice: 999999.99 };
      render(<LPPage pool={poolWithLargePrice} />);

      expect(screen.getByText("$999,999.99")).toBeInTheDocument();
    });

    it("handles missing LP request gracefully", async () => {
      mockUseLPData.mockReturnValue({
        ...mockLPData,
        lpRequest: null,
      });

      render(<LPPage pool={mockPool} />);

      const actionsCard = await waitFor(() => screen.getByTestId("lp-actions-card"));
      expect(actionsCard).toHaveTextContent("Blocked: false");
    });
  });
});
