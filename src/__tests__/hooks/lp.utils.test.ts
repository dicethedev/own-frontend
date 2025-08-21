import { calculateRebalanceState, isUSMarketOpen } from "@/hooks/lp";
import { RebalanceState, Pool } from "@/types/pool";
import "@testing-library/jest-dom";
import MockDate from "mockdate";

jest.mock("wagmi", () => ({
  useAccount: jest.fn(() => ({ address: "0x123", isConnected: true })),
  useChainId: jest.fn(() => 1),
  useConfig: jest.fn(() => ({})),
  createConfig: jest.fn(),
  http: jest.fn(),
}));

describe("isUSMarketOpen", () => {
  afterEach(() => {
    MockDate.reset();
  });

  it("returns true during US market hours (mocked 10:00 AM ET)", () => {
    MockDate.set("2023-07-28T14:00:00Z"); // 10 AM ET on a Friday
    expect(isUSMarketOpen()).toBe(true);
  });

  it("returns false outside US market hours (mocked 8:00 AM ET)", () => {
    MockDate.set("2023-07-28T12:00:00Z"); // 8 AM ET on a Friday
    expect(isUSMarketOpen()).toBe(false);
  });

  it("returns false on a weekend", () => {
    MockDate.set("2023-07-29T14:00:00Z"); // Saturday
    expect(isUSMarketOpen()).toBe(false);
  });
});

describe("calculateRebalanceState", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    MockDate.reset();
  });

  const basePool: Pool = {
    address: "0x0",
    assetTokenSymbol: "xMOCK",
    assetName: "Mock Asset",
    assetSymbol: "MOCK",
    assetTokenAddress: "0x0",
    assetTokenDecimals: 18,
    assetPrice: 0,
    oraclePrice: 0,
    priceChange: 0,
    reserveToken: "MOCK",
    reserveTokenAddress: "0x0",
    reserveTokenDecimals: 18,
    liquidityManagerAddress: "0x0",
    cycleManagerAddress: "0x0",
    poolStrategyAddress: "0x0",
    oracleAddress: "0x0",
    volume24h: "0",
    currentCycle: 0,
    poolStatus: "ACTIVE",
    cycleState: "OPEN",
    lpHealthyCollateralRatio: 0,
  };

  it("returns READY_FOR_OFFCHAIN_REBALANCE when ACTIVE and market is open", () => {
    // Market open time on a weekday
    MockDate.set("2023-07-26T14:00:00Z"); // 10 AM ET Wednesday
    const { rebalanceState } = calculateRebalanceState(basePool);
    expect(rebalanceState).toBe(RebalanceState.READY_FOR_OFFCHAIN_REBALANCE);
  });

  it("returns ACTIVE when pool is ACTIVE but market is closed", () => {
    // Weekend time (market closed)
    MockDate.set("2023-07-29T14:00:00Z"); // Saturday
    const { rebalanceState } = calculateRebalanceState(basePool);
    expect(rebalanceState).toBe(RebalanceState.ACTIVE);
  });

  it("returns OFFCHAIN_REBALANCE_IN_PROGRESS when REBALANCING OFFCHAIN and market is open", () => {
    const pool = { ...basePool, poolStatus: "REBALANCING OFFCHAIN" as const };
    MockDate.set("2023-07-26T14:00:00Z"); // Market open
    const { rebalanceState } = calculateRebalanceState(pool);
    expect(rebalanceState).toBe(RebalanceState.OFFCHAIN_REBALANCE_IN_PROGRESS);
  });

  it("returns READY_FOR_ONCHAIN_REBALANCE when REBALANCING OFFCHAIN but market is closed", () => {
    const pool = { ...basePool, poolStatus: "REBALANCING OFFCHAIN" as const };
    MockDate.set("2023-07-29T14:00:00Z"); // Weekend, market closed
    const { rebalanceState } = calculateRebalanceState(pool);
    expect(rebalanceState).toBe(RebalanceState.READY_FOR_ONCHAIN_REBALANCE);
  });

  it("returns ONCHAIN_REBALANCE_IN_PROGRESS when REBALANCING ONCHAIN", () => {
    const pool = { ...basePool, poolStatus: "REBALANCING ONCHAIN" as const };
    // Date/time here is irrelevant for this state
    const { rebalanceState } = calculateRebalanceState(pool);
    expect(rebalanceState).toBe(RebalanceState.ONCHAIN_REBALANCE_IN_PROGRESS);
  });

  it("defaults to ACTIVE if pool is undefined", () => {
    // const minimalPool = { ...basePool, poolStatus: undefined as RebalanceState | undefined };
    MockDate.set("2023-07-26T14:00:00Z"); // Market open
    const result = calculateRebalanceState(undefined as unknown as Pool);
    expect(result.rebalanceState).toBe(RebalanceState.ACTIVE);
  });
});
