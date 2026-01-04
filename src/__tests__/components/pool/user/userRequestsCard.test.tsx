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
}));

// Mock user hooks
jest.mock("@/hooks/user", () => ({
  useUserPoolManagement: jest.fn(),
  formatCurrency: jest.fn((val) => `$${val}`),
}));

// Mock toast
jest.mock("react-hot-toast", () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

// Mock viem
jest.mock("viem", () => ({
  formatUnits: (val: bigint, decimals: number) =>
    (Number(val) / Math.pow(10, decimals)).toString(),
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
  prevRebalancePrice: BigInt("150000000000000000000"), // 150 with 18 decimals
};

const TIMESTAMP = BigInt(Math.floor(Date.now() / 1000));

const baseUserData: UserData = {
  isUser: true,
  userPosition: null,
  userRequest: null,
  isLoading: false,
  error: null,
};

const mockUserRequestBase = {
  id: "req1",
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
    expect(screen.getByText(/Error loading request/i)).toBeInTheDocument();
    expect(screen.getByText(/Failed/i)).toBeInTheDocument();
  });

  it("renders empty state when no active request", () => {
    render(<UserRequestsCard pool={mockPool} userData={baseUserData} />);
    expect(screen.getByText(/No pending request/i)).toBeInTheDocument();
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

    const consoleErrorMock = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

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

    consoleErrorMock.mockRestore();
  });

  it("shows empty state when no address", () => {
    (useAccount as jest.Mock).mockReturnValue({ address: null });
    render(<UserRequestsCard pool={mockPool} userData={baseUserData} />);
    expect(screen.getByText(/No pending request/i)).toBeInTheDocument();
  });

  it("renders request type correctly for NONE type", () => {
    render(
      <UserRequestsCard
        pool={mockPool}
        userData={{
          ...baseUserData,
          userRequest: {
            ...mockUserRequestBase,
            requestType: UserRequestType.NONE,
            amount: BigInt(0),
            collateralAmount: BigInt(0),
            requestCycle: BigInt(5),
          },
        }}
      />
    );
    expect(screen.getByText(/No pending request/i)).toBeInTheDocument();
  });
});
