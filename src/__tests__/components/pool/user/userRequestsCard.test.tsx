import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { UserRequestsCard } from "@/components/pool/user/UserRequestsCard";
import { Pool } from "@/types/pool";
import { UserData, UserRequestType } from "@/types/user";
import { useAccount } from "wagmi";
import * as userHook from "@/hooks/user";
import toast from "react-hot-toast";

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
  useUserPoolManagement: jest.fn(),
  formatCurrency: jest.fn((val) => val.toFixed(2)),
}));

jest.mock("react-hot-toast", () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

const mockPool: Pool = {
  address: "0xpool",
  assetName: "Apple",
  assetSymbol: "AAPL",
  assetTokenSymbol: "xAAPL",
  assetTokenAddress: "0xasset",
  assetTokenDecimals: 18,
  assetPrice: 150,
  oraclePrice: 150,
  priceChange: 2,
  reserveToken: "USDC",
  reserveTokenAddress: "0xreserve",
  reserveTokenDecimals: 6,
  liquidityManagerAddress: "0xliquidity",
  cycleManagerAddress: "0xcycle",
  poolStrategyAddress: "0xstrategy",
  oracleAddress: "0xoracle",
  volume24h: "0",
  currentCycle: 5,
  poolStatus: "ACTIVE",
  totalLPLiquidityCommited: BigInt(0),
  lpCount: BigInt(0),
  poolInterestRate: BigInt(0),
  poolUtilizationRatio: BigInt(0),
  assetSupply: BigInt(0),
  cycleTotalDeposits: BigInt(0),
  cycleTotalRedemptions: BigInt(0),
  lpHealthyCollateralRatio: 0,
  cycleState: "OPEN",
  prevRebalancePrice: BigInt("1000000000000000000"), // 1.0
};

const baseUserData: UserData = {
  isUser: true,
  isLoading: false,
  error: null,
  userPosition: null,
  userRequest: null,
};

const TIMESTAMP = BigInt(Math.floor(Date.now() / 1000));

const mockUserRequestBase = {
  id: "req-1",
  createdAt: TIMESTAMP,
  updatedAt: TIMESTAMP,
};

describe("UserRequestsCard", () => {
  let claimAssetMock: jest.Mock;
  let claimReserveMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    (useAccount as jest.Mock).mockReturnValue({ address: "0x123" });
    claimAssetMock = jest.fn();
    claimReserveMock = jest.fn();
    (userHook.useUserPoolManagement as jest.Mock).mockReturnValue({
      claimAsset: claimAssetMock,
      claimReserve: claimReserveMock,
      isLoading: false,
    });
  });

  it("renders loading state", () => {
    render(
      <UserRequestsCard
        pool={mockPool}
        userData={{ ...baseUserData, isLoading: true }}
      />
    );
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("renders error state", () => {
    render(
      <UserRequestsCard
        pool={mockPool}
        userData={{ ...baseUserData, error: new Error("Failed") }}
      />
    );
    expect(screen.getByText(/Error loading requests/i)).toBeInTheDocument();
    expect(screen.getByText(/Failed/i)).toBeInTheDocument();
  });

  it("renders empty state when no active request", () => {
    render(<UserRequestsCard pool={mockPool} userData={baseUserData} />);
    expect(screen.getByText(/No pending requests/i)).toBeInTheDocument();
  });

  it("renders deposit request in current cycle", () => {
    render(
      <UserRequestsCard
        pool={mockPool}
        userData={{
          ...baseUserData,
          userRequest: {
            ...mockUserRequestBase,
            requestType: UserRequestType.DEPOSIT,
            amount: BigInt(1000000),
            collateralAmount: BigInt(500000),
            requestCycle: BigInt(5),
          },
        }}
      />
    );
    expect(screen.getByText(/Deposit/i)).toBeInTheDocument();
    expect(screen.getByText(/Claim Available Next Cycle/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Request submitted in current cycle/i)
    ).toBeInTheDocument();
  });

  it("renders redemption request claimable", () => {
    render(
      <UserRequestsCard
        pool={mockPool}
        userData={{
          ...baseUserData,
          userRequest: {
            ...mockUserRequestBase,
            requestType: UserRequestType.REDEEM,
            amount: BigInt(2000000),
            collateralAmount: BigInt(0),
            requestCycle: BigInt(3),
          },
        }}
      />
    );
    expect(screen.getByText(/Redemption/i)).toBeInTheDocument();
    expect(screen.getByText(/ready to claim/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Claim USDC/i })).toBeEnabled();
  });

  it("renders deposit request claimable with expected asset tokens", () => {
    render(
      <UserRequestsCard
        pool={mockPool}
        userData={{
          ...baseUserData,
          userRequest: {
            ...mockUserRequestBase,
            requestType: UserRequestType.DEPOSIT,
            amount: BigInt(2000000),
            collateralAmount: BigInt(1000000),
            requestCycle: BigInt(3),
          },
        }}
      />
    );
    expect(screen.getByText(/Expected xAAPL/i)).toBeInTheDocument();
    expect(screen.getByText(/ready to claim/i)).toBeInTheDocument();
  });

  it("disables claim button when not claimable", () => {
    render(
      <UserRequestsCard
        pool={mockPool}
        userData={{
          ...baseUserData,
          userRequest: {
            ...mockUserRequestBase,
            requestType: UserRequestType.REDEEM,
            amount: BigInt(2000000),
            collateralAmount: BigInt(0),
            requestCycle: BigInt(5), // current cycle
          },
        }}
      />
    );
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("calls claimAsset for deposit request", async () => {
    render(
      <UserRequestsCard
        pool={mockPool}
        userData={{
          ...baseUserData,
          userRequest: {
            ...mockUserRequestBase,
            requestType: UserRequestType.DEPOSIT,
            amount: BigInt(1000000),
            collateralAmount: BigInt(0),
            requestCycle: BigInt(3),
          },
        }}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /Claim xAAPL/i }));
    await waitFor(() => expect(claimAssetMock).toHaveBeenCalledWith("0x123"));
    expect(toast.success).toHaveBeenCalledWith("Request claimed successfully");
  });

  it("calls claimReserve for redeem request", async () => {
    render(
      <UserRequestsCard
        pool={mockPool}
        userData={{
          ...baseUserData,
          userRequest: {
            ...mockUserRequestBase,
            requestType: UserRequestType.REDEEM,
            amount: BigInt(1000000),
            collateralAmount: BigInt(0),
            requestCycle: BigInt(3),
          },
        }}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /Claim USDC/i }));
    await waitFor(() => expect(claimReserveMock).toHaveBeenCalledWith("0x123"));
    expect(toast.success).toHaveBeenCalledWith("Request claimed successfully");
  });

  it("handles claim errors gracefully", async () => {
    claimAssetMock.mockRejectedValueOnce(new Error("fail"));
    render(
      <UserRequestsCard
        pool={mockPool}
        userData={{
          ...baseUserData,
          userRequest: {
            ...mockUserRequestBase,
            requestType: UserRequestType.DEPOSIT,
            amount: BigInt(1000000),
            collateralAmount: BigInt(0),
            requestCycle: BigInt(3),
          },
        }}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /Claim xAAPL/i }));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Error claiming request")
    );
  });

  it("does nothing when no address or userRequest in claim", () => {
    (useAccount as jest.Mock).mockReturnValue({ address: null });
    render(<UserRequestsCard pool={mockPool} userData={baseUserData} />);
    expect(screen.getByText(/No pending requests/i)).toBeInTheDocument();
  });
});
