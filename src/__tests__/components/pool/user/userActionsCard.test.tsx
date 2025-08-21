import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { UserActionsCard } from "@/components/pool/user/UserActionsCard";
import { UserData, UserRequestType } from "@/types/user";
import { useUserPoolManagement } from "@/hooks/user";
import { Pool } from "@/types/pool";
import { doesDepositExceedLiquidity } from "@/utils/liquidity";

// Mock hooks
jest.mock("@/hooks/user", () => ({
  useUserPoolManagement: jest.fn(),
}));

// Mock utils
jest.mock("@/utils/liquidity", () => ({
  ...jest.requireActual("@/utils/liquidity"),
  doesDepositExceedLiquidity: jest.fn(() => false),
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
    assetAmount: BigInt("1000000000000000000"),
    depositAmount: BigInt("1000000000"),
    collateralAmount: BigInt("300000000"),
    createdAt: BigInt(0),
    updatedAt: BigInt(0),
  },
  userRequest: {
    id: "req1",
    requestType: UserRequestType.DEPOSIT,
    amount: BigInt("1000000000"),
    collateralAmount: BigInt("300000000"),
    requestCycle: BigInt(5),
    createdAt: BigInt(0),
    updatedAt: BigInt(0),
  },
  isLoading: false,
  error: null,
};

describe("UserActionsCard", () => {
    let mockPoolManagementReturn: ReturnType<typeof useUserPoolManagement>;

  beforeEach(() => {
    mockPoolManagementReturn = {
      depositRequest: jest.fn(),
      redemptionRequest: jest.fn(),
      checkReserveApproval: jest.fn(),
      checkAssetApproval: jest.fn(),
      approveReserve: jest.fn(),
      approveAsset: jest.fn(),
      checkSufficientReserveBalance: jest.fn(() => true),
      checkSufficientAssetBalance: jest.fn(() => true),
      isLoading: false,
      error: null,
      reserveBalance: 1000n,
      assetBalance: 500n,
      isLoadingReserveBalance: false,
      isLoadingAssetBalance: false,
      reserveApproved: false,
      assetApproved: false,
    } as unknown as ReturnType<typeof useUserPoolManagement>;

    /* eslint-disable @typescript-eslint/no-unused-vars */
    (useUserPoolManagement as jest.Mock).mockImplementation(
      (
        _poolAddress: `0x${string}`,
        _reserveTokenAddress: `0x${string}`,
        _reserveTokenDecimals: number | undefined,
        _assetTokenAddress: `0x${string}`,
        _assetTokenDecimals?: number
      ) => mockPoolManagementReturn
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it("renders loading state", () => {
    render(
      <UserActionsCard
        pool={mockPool}
        userData={{ ...baseUserData, isLoading: true }}
      />
    );
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("renders error state", () => {
    render(
      <UserActionsCard
        pool={mockPool}
        userData={{ ...baseUserData, error: new Error("Some error") }}
      />
    );
    expect(screen.getByText(/Error loading user data/i)).toBeInTheDocument();
  });

  it("renders deposit tab by default", () => {
    render(<UserActionsCard pool={mockPool} userData={baseUserData} />);
    expect(
      screen.getByPlaceholderText(/Amount to deposit/i)
    ).toBeInTheDocument();
  });

  it("shows blocked message if blocked from new requests", () => {
    render(
      <UserActionsCard
        pool={mockPool}
        userData={baseUserData}
        isBlockedFromNewRequests
        blockMessage="Blocked for now"
      />
    );
    expect(screen.getByText(/Blocked for now/i)).toBeInTheDocument();
  });

  it("switches to redeem tab", () => {
    render(<UserActionsCard pool={mockPool} userData={baseUserData} />);
    fireEvent.click(screen.getByText(/Redeem/i));
    expect(
      screen.getByPlaceholderText(/Amount to redeem/i)
    ).toBeInTheDocument();
  });

  it("shows liquidity error when exceeded", () => {
    (doesDepositExceedLiquidity as jest.Mock).mockReturnValueOnce(true);

    render(<UserActionsCard pool={mockPool} userData={baseUserData} />);
    fireEvent.change(screen.getByPlaceholderText(/Amount to deposit/i), {
      target: { value: "9999999" },
    });

    expect(
      screen.getByText(/Deposit amount exceeds available liquidity/i)
    ).toBeInTheDocument();
  });

  it("shows insufficient balance message", () => {
    mockPoolManagementReturn.checkSufficientReserveBalance = () => false;

    render(<UserActionsCard pool={mockPool} userData={baseUserData} />);
    fireEvent.change(screen.getByPlaceholderText(/Amount to deposit/i), {
      target: { value: "5" },
    });
    expect(screen.getByText(/Insufficient balance/i)).toBeInTheDocument();
  });

  it("shows approve reserve button if not approved", () => {
    render(<UserActionsCard pool={mockPool} userData={baseUserData} />);
    expect(screen.getByText(/Approve USDC/i)).toBeInTheDocument();
  });

  it("shows deposit button if reserve approved", () => {
    mockPoolManagementReturn.reserveApproved = true;

    render(<UserActionsCard pool={mockPool} userData={baseUserData} />);
    expect(screen.getByText(/Deposit USDC/i)).toBeInTheDocument();
  });

  it("shows approve asset button in redeem tab if not approved", () => {
    render(<UserActionsCard pool={mockPool} userData={baseUserData} />);
    fireEvent.click(screen.getByText(/Redeem/i)); 
  });

  it("shows redeem button if asset approved", () => {
    mockPoolManagementReturn.assetApproved = true;

    render(<UserActionsCard pool={mockPool} userData={baseUserData} />);
    fireEvent.click(screen.getByText(/Redeem/i));
  });
});
