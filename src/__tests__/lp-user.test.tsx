import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import LPApp from "@/components/lp/LPApp";
import { RefreshProvider } from "@/context/RefreshContext";
import { Pool } from "@/types/pool";
import "@testing-library/jest-dom";

export interface MockNextImageProps
  extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
}

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

// Mock viem
jest.mock("viem", () => ({
  createPublicClient: jest.fn(),
  createWalletClient: jest.fn(),
  http: jest.fn(),
  parseEther: jest.fn(),
  formatEther: jest.fn(),
  formatUnits: jest.fn(() => "100.00"),
  getAddress: jest.fn(),
}));

// Mock children components to isolate UI
jest.mock("@/components/Navbar", () => ({
  Navbar: () => <div data-testid="navbar" />,
}));

jest.mock("@/components/Footer", () => ({
  Footer: () => <div data-testid="footer" />,
}));

jest.mock("@/components/BackgroundEffects", () => ({
  BackgroundEffects: () => <div data-testid="background-effects" />,
}));

// Mock Next.js Link component
jest.mock("next/link", () => {
  const Link = ({
    href,
    children,
  }: {
    href: string;
    children: React.ReactNode;
  }) => <a href={href}>{children}</a>;
  Link.displayName = "Link";
  return Link;
});

//Mock Next.js Image component
/* eslint-disable @next/next/no-img-element */
jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt, ...rest }: MockNextImageProps) => (
    <img src={src} alt={alt} {...rest} />
  ),
}));

// Mock pool hook
jest.mock("@/hooks/pool", () => ({
  usePool: jest.fn(),
}));

// Mock inside a factory function
jest.mock("@/context/PoolContext", () => {
  const mockUsePoolContext = jest.fn();

  return {
    usePoolContext: mockUsePoolContext,
    PoolProvider: ({ children }: { children: React.ReactNode }) => (
      <>{children}</>
    ),
    __mockUsePoolContext: mockUsePoolContext,
  };
});

const { __mockUsePoolContext: mockUsePoolContext } = jest.requireMock(
  "@/context/PoolContext"
);

export const mockPools = new Map([
  [
    "tsla",
    {
      address: "0x123" as `0x${string}`,
      assetTokenSymbol: "xTSLA",
      assetName: "Tesla Inc",
      assetSymbol: "TSLA",
      assetTokenAddress: "0x456" as `0x${string}`,
      assetTokenDecimals: 18,
      assetPrice: 250.5,
      oraclePrice: 250.45,
      priceChange: 2.5,
      reserveToken: "USDC",
      reserveTokenAddress: "0x789" as `0x${string}`,
      reserveTokenDecimals: 6,
      liquidityManagerAddress: "0xabc" as `0x${string}`,
      cycleManagerAddress: "0xdef" as `0x${string}`,
      poolStrategyAddress: "0x111" as `0x${string}`,
      oracleAddress: "0x222" as `0x${string}`,
      volume24h: "1000000",
      currentCycle: 5,
      poolStatus: "ACTIVE" as const,
      cycleState: "POOL_ACTIVE",
      totalLPLiquidityCommited: BigInt("1000000000000"),
      totalLPCollateral: BigInt("500000000000"),
    } as Pool,
  ],
  [
    "aapl",
    {
      address: "0x333" as `0x${string}`,
      assetTokenSymbol: "xAAPL",
      assetName: "Apple Inc",
      assetSymbol: "AAPL",
      assetTokenAddress: "0x444" as `0x${string}`,
      assetTokenDecimals: 18,
      assetPrice: 180.25,
      oraclePrice: 180.2,
      priceChange: -1.2,
      reserveToken: "USDC",
      reserveTokenAddress: "0x789" as `0x${string}`,
      reserveTokenDecimals: 6,
      liquidityManagerAddress: "0x555" as `0x${string}`,
      cycleManagerAddress: "0x666" as `0x${string}`,
      poolStrategyAddress: "0x777" as `0x${string}`,
      oracleAddress: "0x888" as `0x${string}`,
      volume24h: "750000",
      currentCycle: 3,
      poolStatus: "ACTIVE" as const,
      cycleState: "POOL_ACTIVE",
      totalLPLiquidityCommited: BigInt("800000000000"),
      totalLPCollateral: BigInt("400000000000"),
    } as Pool,
  ],
]);

const mockPool = mockPools.get("tsla")!;

describe("LP App", () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Reset mocks after each test
    mockUsePoolContext.mockReset();
  });

  /**
   * Validates that the loading spinner is shown when data is being fetched.
   * This ensures the user gets feedback while the pools are still loading.
   */
  it("shows loading spinner when isLoading is true", () => {
    mockUsePoolContext.mockReturnValue({
      pools: new Map(),
      isLoading: true,
      error: null,
      getPool: jest.fn().mockReturnValue(undefined),
      isInitialized: false,
      refresh: jest.fn(),
      lastUpdated: Date.now(),
    });

    render(
      <RefreshProvider>
        <LPApp />
      </RefreshProvider>
    );

    const spinner = screen.getByRole("status", { hidden: true });
    expect(spinner).toBeInTheDocument();
  });

  /**
   * Validates error UI when the pool fetch fails.
   * Ensures the user is informed when there's a backend or network issue.
   */
  it("shows error message when error exists", () => {
    mockUsePoolContext.mockReturnValue({
      pools: new Map(),
      isLoading: false,
      error: new Error("Fetch failed"),
      getPool: jest.fn().mockReturnValue(undefined),
      isInitialized: true,
      refresh: jest.fn(),
      lastUpdated: Date.now(),
    });

    render(
      <RefreshProvider>
        <LPApp />
      </RefreshProvider>
    );

    expect(screen.getByText(/couldn't fetch pools/i)).toBeInTheDocument();
  });

  /**
   * Renders a pool card correctly when a valid pool is available.
   * It checks the key UI elements like name, symbol, TVL, and "Go to pool" button.
   */
  it("renders pool cards on successful load", async () => {
    const mockMap = new Map<string, Pool>([
      [mockPool.assetSymbol.toLowerCase(), mockPool],
    ]);

    mockUsePoolContext.mockReturnValue({
      pools: mockMap,
      isLoading: false,
      error: null,
      getPool: jest.fn().mockReturnValue(mockPool),
      isInitialized: true,
      refresh: jest.fn(),
      lastUpdated: Date.now(),
    });

    render(
      <RefreshProvider>
        <LPApp />
      </RefreshProvider>
    );

    // Assert name, symbol, and TVL presence
    expect(await screen.findByText("Tesla Inc")).toBeInTheDocument();
    expect(screen.getByText("TSLA")).toBeInTheDocument();
    expect(screen.getByText(/TVL/i)).toBeInTheDocument();

    // Button for users
    expect(
      screen.getByRole("button", { name: /manage liquidity/i })
    ).toBeInTheDocument();

    // Link correctness
    const link = screen.getByRole("link", { name: /manage liquidity/i });
    expect(link).toHaveAttribute("href", "/protocol/lp/sell-side/tsla");
  });

  /**
   * Verifies fallback rendering when a logo is missing.
   *  pool card should gracefully fall back to showing symbol initials (e.g., "TS").
   */
  it("displays fallback logo if logo is not present", async () => {
    const poolWithoutLogo: Pool = { ...mockPool, logoUrl: undefined };
    const mockMap = new Map<string, Pool>([
      [poolWithoutLogo.assetSymbol.toLowerCase(), poolWithoutLogo],
    ]);

    mockUsePoolContext.mockReturnValue({
      pools: mockMap,
      isLoading: false,
      error: null,
      getPool: jest.fn().mockReturnValue(poolWithoutLogo),
      isInitialized: true,
      refresh: jest.fn(),
      lastUpdated: Date.now(),
    });

    render(
      <RefreshProvider>
        <LPApp />
      </RefreshProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("TS")).toBeInTheDocument(); // Fallback initials
    });
  });

  /**
   * Tests the empty state UI.
   * This confirms that a friendly message is shown when the app has no pools to display.
   */
  it("shows empty state when no pools are available but initialized", () => {
    mockUsePoolContext.mockReturnValue({
      pools: new Map(),
      isLoading: false,
      error: null,
      getPool: jest.fn(),
      isInitialized: true,
      refresh: jest.fn(),
      lastUpdated: Date.now(),
    });

    render(
      <RefreshProvider>
        <LPApp />
      </RefreshProvider>
    );

    expect(screen.getByTestId("empty-state")).toHaveTextContent(
      /no pools available/i
    );
  });

  /**
   * Confirms multiple pool cards are rendered when multiple pools exist.
   * This is important for ensuring scalability when the user has access to more than one pool.
   */
  it("renders multiple pool cards when multiple pools exist", async () => {
    const secondPool: Pool = {
      ...mockPool,
      address: "0x333" as `0x${string}`,
      assetName: "Apple Inc",
      assetSymbol: "AAPL",
    };

    const mockMap = new Map<string, Pool>([
      [mockPool.assetSymbol.toLowerCase(), mockPool],
      [secondPool.assetSymbol.toLowerCase(), secondPool],
    ]);

    mockUsePoolContext.mockReturnValue({
      pools: mockMap,
      isLoading: false,
      error: null,
      getPool: jest.fn(),
      isInitialized: true,
      refresh: jest.fn(),
      lastUpdated: Date.now(),
    });

    render(
      <RefreshProvider>
        <LPApp />
      </RefreshProvider>
    );

    expect(await screen.findByText("Tesla Inc")).toBeInTheDocument();
    expect(await screen.findByText("Apple Inc")).toBeInTheDocument();
  });

  /**
   * Verifies that a logo image is rendered correctly when `logoUrl` is provided.
   * Important for branding and accurate display of pool information.
   */
  it("renders logo image when logoUrl is provided", async () => {
    const poolWithLogo: Pool = {
      ...mockPool,
      logoUrl: "https://iown.co/logo.png",
    };

    const mockMap = new Map<string, Pool>([
      [poolWithLogo.assetSymbol.toLowerCase(), poolWithLogo],
    ]);

    mockUsePoolContext.mockReturnValue({
      pools: mockMap,
      isLoading: false,
      error: null,
      getPool: jest.fn(),
      isInitialized: true,
      refresh: jest.fn(),
      lastUpdated: Date.now(),
    });

    render(
      <RefreshProvider>
        <LPApp />
      </RefreshProvider>
    );

    const logoImg = await screen.findByRole("img");
    expect(logoImg).toHaveAttribute("src", "https://iown.co/logo.png");
  });

  /**
   * Ensures the app doesn't crash when name/symbol is missing.
   * Confirms the UI still renders something meaningful and doesn't break.
   */
  it("handles missing asset name and symbol gracefully", async () => {
    const incompletePool: Pool = {
      ...mockPool,
      assetName: "",
      assetSymbol: "",
    };

    const mockMap = new Map<string, Pool>([["", incompletePool]]);

    mockUsePoolContext.mockReturnValue({
      pools: mockMap,
      isLoading: false,
      error: null,
      getPool: jest.fn(),
      isInitialized: true,
      refresh: jest.fn(),
      lastUpdated: Date.now(),
    });

    render(
      <RefreshProvider>
        <LPApp />
      </RefreshProvider>
    );

    expect(screen.getByTestId("asset-name")).toBeInTheDocument();
    expect(screen.getByTestId("asset-symbol")).toBeInTheDocument();
  });
});
