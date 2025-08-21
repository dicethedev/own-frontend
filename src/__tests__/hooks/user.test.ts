import toast from "react-hot-toast";
import { act, renderHook, waitFor } from "@testing-library/react";
import {
  calculateUserPositionMetrics,
  formatCurrency,
  hasPendingRequest,
  useUserData,
  useUserPoolManagement,
} from "@/hooks/user";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
} from "wagmi";
import { querySubgraph, waitForSubgraphSync } from "@/hooks/subgraph";
import { useRefreshContext } from "@/context/RefreshContext";
import "@testing-library/jest-dom";
import { UserRequestType } from "@/types/user";
import { formatUnits, parseUnits } from "viem";

jest.mock("react-hot-toast", () => ({
  error: jest.fn(),
  success: jest.fn(),
  loading: jest.fn(),
  dismiss: jest.fn(),
}));

jest.mock("wagmi", () => ({
  useAccount: jest.fn(),
  useChainId: jest.fn(),
  useConfig: jest.fn(),
  createConfig: jest.fn(),
  http: jest.fn(),
  useWriteContract: jest.fn(),
  useReadContract: jest.fn(),
  useWaitForTransactionReceipt: jest.fn(),
}));

jest.mock("@/hooks/subgraph", () => ({
  querySubgraph: jest.fn(),
  waitForSubgraphSync: jest.fn(),
}));

jest.mock("@/context/RefreshContext", () => ({
  useRefreshContext: jest.fn(),
}));

jest.mock("@/config/abis", () => ({
  assetPoolABI: [],
  erc20ABI: [],
  xTokenABI: [],
}));

jest.mock("@/utils/user", () => ({
  USER_TRANSACTION_MESSAGES: {
    approval: {
      pending: "Approving...",
      success: "Approved successfully",
      error: "Approval failed",
    },
    deposit: {
      pending: "Processing deposit...",
      success: "Deposit successful",
      error: "Deposit failed",
    },
    redemption: {
      pending: "Processing redemption...",
      success: "Redemption successful",
      error: "Redemption failed",
    },
  },
}));

jest.mock("viem", () => ({
  parseUnits: jest.fn(),
  formatUnits: jest.fn(),
}));

//Mock formatNumber helper\
export const formatNumber = (value: number): string => {
  if (Math.abs(value) >= 1) {
    return value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  } else {
    const formatted = value.toLocaleString(undefined, {
      minimumSignificantDigits: 2,
      maximumSignificantDigits: 4,
    });
    return formatted.replace(/(\.\d*?[1-9])0+$/g, "$1").replace(/\.0+$/g, "");
  }
};

// Mock addresses and data
const mockAddress = "0x123456789abcdef";
const mockPoolAddress = "0x789abcdef123456";
const mockReserveTokenAddress = "0x739abcdef123456";
const mockAssetTokenAddress = "0x456789abcdef123";

const mockUserPosition = {
  id: `${mockAddress.toLowerCase()}-${mockPoolAddress.toLowerCase()}`,
  user: mockAddress as `0x${string}`,
  pool: mockPoolAddress as `0x${string}`,
  assetAmount: BigInt("1000000000000000000"), // 1 token with 18 decimals
  reserveAmount: BigInt("500000000000000000"), // 0.5
  depositAmount: BigInt("1000000"), // 1 token with 6 decimals
  collateralAmount: BigInt("500000"), // 0.5 with 6 decimals
  entryPrice: BigInt("1000000"), // 1 USDC with 6 decimals
  createdAt: BigInt(Date.parse("2024-06-01T00:00:00Z")),
  updatedAt: BigInt(Date.parse("2024-06-01T00:00:00Z")),
  currentCycle: BigInt(5),
};

const mockUserRequest = {
  id: `${mockAddress.toLowerCase()}-${mockPoolAddress.toLowerCase()}`,
  requestType: UserRequestType.DEPOSIT,
  amount: BigInt("1000"),
  collateralAmount: BigInt("500"),
  requestCycle: BigInt(5),
  liquidator: undefined,
  createdAt: BigInt(Date.parse("2024-06-01T00:00:00Z")),
  updatedAt: BigInt(Date.parse("2024-06-01T00:00:00Z")),
};

describe("useUserPoolManagement", () => {
  let mockWriteContract: jest.Mock;
  let mockRefetchBalance: jest.Mock;
  let mockRefetchAllowance: jest.Mock;
  let mockTriggerRefresh: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(toast, "error").mockImplementation(jest.fn());

    mockWriteContract = jest.fn();
    mockRefetchBalance = jest.fn();
    mockRefetchAllowance = jest.fn();
    mockTriggerRefresh = jest.fn();

    (useAccount as jest.MockedFunction<typeof useAccount>).mockReturnValue({
      address: mockAddress,
      addresses: [mockAddress],
      chain: undefined,
      chainId: undefined,
      connector: undefined,
      isConnected: true,
      isConnecting: false,
      isDisconnected: false,
      isReconnecting: false,
      status: "connected",
    } as unknown as ReturnType<typeof useAccount>);

    (useWriteContract as jest.Mock).mockReturnValue({
      writeContract: mockWriteContract,
      data: undefined,
      isPending: false,
      error: null,
    });

    (useWaitForTransactionReceipt as jest.Mock).mockReturnValue({
      isLoading: false,
      isSuccess: false,
      data: null,
      error: null,
    });

    (useReadContract as jest.Mock).mockImplementation(({ functionName }) => {
      if (functionName === "balanceOf") {
        return {
          data: BigInt("1000000000000"), // 1 token
          isLoading: false,
          refetch: mockRefetchBalance,
        };
      }
      if (functionName === "allowance") {
        return {
          data: BigInt("1000000000000"), // 1 token approved
          refetch: mockRefetchAllowance,
        };
      }
      return { data: null, isLoading: false, refetch: jest.fn() };
    });

    (useRefreshContext as jest.Mock).mockReturnValue({
      triggerRefresh: mockTriggerRefresh,
      refreshTrigger: 0,
    });

    (parseUnits as jest.Mock).mockImplementation((value, decimals) => {
      const num = Number(value);
      if (isNaN(num)) {
        throw new Error(`Invalid number: ${value}`);
      }
      return BigInt(Math.floor(num * 10 ** decimals));
    });

    (formatUnits as jest.Mock).mockImplementation((value, decimals) =>
      (Number(value) / 10 ** decimals).toString()
    );

    (waitForSubgraphSync as jest.Mock).mockResolvedValue(true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return loading state when no address", () => {
    // Mock no address connected
    (useAccount as jest.Mock).mockReturnValue({
      address: undefined,
      isConnected: false,
    } as unknown as ReturnType<typeof useAccount>);

    const { result } = renderHook(() =>
      useUserPoolManagement(
        mockPoolAddress,
        mockReserveTokenAddress,
        6,
        mockAssetTokenAddress,
        18
      )
    );

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it("should initialize with correct default values", () => {
    const { result } = renderHook(() =>
      useUserPoolManagement(
        mockPoolAddress,
        mockReserveTokenAddress,
        6,
        mockAssetTokenAddress,
        18
      )
    );

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.reserveBalance).toBe("1000000");
    expect(result.current.assetBalance).toBe("0.000001");
  });

  it("should check sufficient reserve balance correctly", () => {
    const { result } = renderHook(() =>
      useUserPoolManagement(
        mockPoolAddress,
        mockReserveTokenAddress,
        6,
        mockAssetTokenAddress,
        18
      )
    );

    expect(result.current.checkSufficientReserveBalance("500")).toBe(true);
    expect(result.current.checkSufficientReserveBalance("2000")).toBe(true);
  });

  it("should check sufficient asset balance correctly", () => {
    const { result } = renderHook(() =>
      useUserPoolManagement(
        mockPoolAddress,
        mockReserveTokenAddress,
        6,
        mockAssetTokenAddress,
        18
      )
    );

    expect(result.current.checkSufficientAssetBalance("0.5")).toBe(false);
    expect(result.current.checkSufficientAssetBalance("2")).toBe(false);
  });

  it("should approve reserve token successfully", async () => {
    const { result } = renderHook(() =>
      useUserPoolManagement(
        mockPoolAddress,
        mockReserveTokenAddress,
        6,
        mockAssetTokenAddress,
        18
      )
    );

    await act(async () => {
      await result.current.approveReserve("100");
    });

    expect(mockWriteContract).toHaveBeenCalledWith({
      address: mockReserveTokenAddress,
      abi: [],
      functionName: "approve",
      args: [mockPoolAddress, BigInt("100000000")], // 100 * 10^6
    });
  });

  it("should handle insufficient balance error for reserve approval", async () => {
    const { result } = renderHook(() =>
      useUserPoolManagement(
        mockPoolAddress,
        mockReserveTokenAddress,
        6,
        mockAssetTokenAddress,
        18
      )
    );

    await act(async () => {
      await result.current.approveReserve("2000"); // More than balance
    });
  });

  it("should make deposit request successfully", async () => {
    mockWriteContract.mockResolvedValue("0x32163382");

    const { result } = renderHook(() =>
      useUserPoolManagement(
        mockPoolAddress,
        mockReserveTokenAddress,
        6,
        mockAssetTokenAddress,
        18
      )
    );

    // Mock checkReserveApproval to return true
    result.current.checkReserveApproval = jest.fn().mockResolvedValue(true);

    await act(async () => {
      await result.current.depositRequest("100", "50");
    });

    expect(mockWriteContract).toHaveBeenCalledWith({
      address: mockPoolAddress,
      abi: [],
      functionName: "depositRequest",
      args: [BigInt("100000000"), BigInt("50000000")], // 100 and 50 * 10^6
    });
  });

  it("should make redemption request successfully", async () => {
    mockWriteContract.mockResolvedValue("0x32163382");

    const { result } = renderHook(() =>
      useUserPoolManagement(
        mockPoolAddress,
        mockReserveTokenAddress,
        6,
        mockAssetTokenAddress,
        18
      )
    );

    // Mock checkAssetApproval to return true
    result.current.checkAssetApproval = jest.fn().mockResolvedValue(true);

    await act(async () => {
      await result.current.redemptionRequest("0.5");
    });
  });

  it("should claim asset successfully", async () => {
    const { result } = renderHook(() =>
      useUserPoolManagement(
        mockPoolAddress,
        mockReserveTokenAddress,
        6,
        mockAssetTokenAddress,
        18
      )
    );

    await act(async () => {
      await result.current.claimAsset(mockAddress);
    });

    expect(mockWriteContract).toHaveBeenCalledWith({
      address: mockPoolAddress,
      abi: [],
      functionName: "claimAsset",
      args: [mockAddress],
    });
  });

  it("should claim reserve successfully", async () => {
    const { result } = renderHook(() =>
      useUserPoolManagement(
        mockPoolAddress,
        mockReserveTokenAddress,
        6,
        mockAssetTokenAddress,
        18
      )
    );

    await act(async () => {
      await result.current.claimReserve(mockAddress);
    });

    expect(mockWriteContract).toHaveBeenCalledWith({
      address: mockPoolAddress,
      abi: [],
      functionName: "claimReserve",
      args: [mockAddress],
    });
  });

  it("should add collateral successfully", async () => {
    const { result } = renderHook(() =>
      useUserPoolManagement(
        mockPoolAddress,
        mockReserveTokenAddress,
        6,
        mockAssetTokenAddress,
        18
      )
    );

    // Mock checkReserveApproval to return true
    result.current.checkReserveApproval = jest.fn().mockResolvedValue(true);

    await act(async () => {
      await result.current.addCollateral(mockAddress, "100");
    });

    expect(mockWriteContract).toHaveBeenCalledWith({
      address: mockPoolAddress,
      abi: [],
      functionName: "addCollateral",
      args: [mockAddress, BigInt("100000000")],
    });

    expect(toast.success).toHaveBeenCalledWith("Collateral added successfully");
  });

  it("should reduce collateral successfully", async () => {
    const { result } = renderHook(() =>
      useUserPoolManagement(
        mockPoolAddress,
        mockReserveTokenAddress,
        6,
        mockAssetTokenAddress,
        18
      )
    );

    await act(async () => {
      await result.current.reduceCollateral("50");
    });

    expect(mockWriteContract).toHaveBeenCalledWith({
      address: mockPoolAddress,
      abi: [],
      functionName: "reduceCollateral",
      args: [BigInt("50000000")],
    });

    expect(toast.success).toHaveBeenCalledWith(
      "Collateral reduced successfully"
    );
  });

  it("should exit pool successfully", async () => {
    const { result } = renderHook(() =>
      useUserPoolManagement(
        mockPoolAddress,
        mockReserveTokenAddress,
        6,
        mockAssetTokenAddress,
        18
      )
    );

    await act(async () => {
      await result.current.exitPool("0.5");
    });
  });
});

describe("useUserData", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (useAccount as jest.Mock).mockReturnValue({
      address: mockAddress,
    });

    (useRefreshContext as jest.Mock).mockReturnValue({
      refreshTrigger: 0,
    });
  });

  it("should fetch user data successfully", async () => {
    (querySubgraph as jest.Mock).mockResolvedValue({
      userPosition: mockUserPosition,
      userRequest: mockUserRequest,
    });

    const { result } = renderHook(() => useUserData(mockPoolAddress));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.userPosition).toEqual(mockUserPosition);
    expect(result.current.userRequest).toEqual(mockUserRequest);
    expect(result.current.isUser).toBe(true);
    expect(result.current.error).toBe(null);
  });

  it("should handle no user data", async () => {
    (querySubgraph as jest.Mock).mockResolvedValue({
      userPosition: null,
      userRequest: null,
    });

    const { result } = renderHook(() => useUserData(mockPoolAddress));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.userPosition).toBe(null);
    expect(result.current.userRequest).toBe(null);
    expect(result.current.isUser).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('should handle query error', async () => {
  const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

  const mockError = new Error('Subgraph query failed');
  (querySubgraph as jest.Mock).mockRejectedValue(mockError);

  const { result } = renderHook(() => useUserData(mockPoolAddress));

  await waitFor(() => {
    expect(result.current.isLoading).toBe(false);
  });

  expect(result.current.error).toEqual(mockError);

  consoleErrorSpy.mockRestore();
});


  it("should not fetch data when address is not available", () => {
    (useAccount as jest.Mock).mockReturnValue({ address: null });

    const { result } = renderHook(() => useUserData(mockPoolAddress));

    expect(result.current.isLoading).toBe(false);
    expect(querySubgraph).not.toHaveBeenCalled();
  });
});

describe("calculateUserPositionMetrics", () => {
  it("should calculate metrics correctly for valid position", () => {
    const metrics = calculateUserPositionMetrics(
      mockUserPosition,
      150, // assetPrice
      18, // assetTokenDecimals
      6, // reserveTokenDecimals
      145 // oraclePrice
    );

    expect(metrics.positionValue).toBe(150); // 1 * 150
    expect(metrics.entryPrice).toBe(1); // 1 USDC / 1 token
    expect(metrics.pnlValue).toBe(149); // 1 * (150 - 1)
    expect(metrics.pnlPercentage).toBe(14900); // ((150 - 1) / 1) * 100
    expect(metrics.collateralRatio).toBeCloseTo(0.3448, 4); // (0.5 / 1.45) * 100
  });

  it("should return zero metrics for null position", () => {
    const metrics = calculateUserPositionMetrics(null, 150, 18, 6, 145);

    expect(metrics.positionValue).toBe(0);
    expect(metrics.entryPrice).toBe(0);
    expect(metrics.pnlValue).toBe(0);
    expect(metrics.pnlPercentage).toBe(0);
    expect(metrics.collateralRatio).toBe(0);
  });
});

describe("formatNumber", () => {
  it("should format large numbers with 2 decimal places", () => {
    expect(formatNumber(1234.5678)).toBe("1,234.57");
    expect(formatNumber(1000000)).toBe("1,000,000.00");
  });

  it("should format small numbers with significant digits", () => {
    expect(formatNumber(0.001234)).toBe("0.001234");
    expect(formatNumber(0.0001)).toBe("0.0001");
  });
});

describe("formatCurrency", () => {
  it("should format as currency with dollar sign", () => {
    expect(formatCurrency(1234.56)).toBe("$1,234.56");
    expect(formatCurrency(0.001234)).toBe("$0.001234");
  });
});

describe("hasPendingRequest", () => {
  it("should return true for pending request", () => {
    const request = {
      ...mockUserRequest,
      requestType: UserRequestType.DEPOSIT,
      requestCycle: BigInt(3),
    };

    expect(hasPendingRequest(request, 5)).toBe(true);
  });

  it("should return false for no request", () => {
    expect(hasPendingRequest(null, 5)).toBe(false);
  });

  it("should return false for NONE request type", () => {
    const request = {
      ...mockUserRequest,
      requestType: UserRequestType.NONE,
      requestCycle: BigInt(0),
    };

    expect(hasPendingRequest(request, 5)).toBe(false);
  });

  it("should return false for future cycle request", () => {
    const request = {
      ...mockUserRequest,
      requestCycle: BigInt(10),
    };

    expect(hasPendingRequest(request, 5)).toBe(false);
  });
});
