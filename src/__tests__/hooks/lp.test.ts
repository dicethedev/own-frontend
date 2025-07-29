import { renderHook, waitFor } from "@testing-library/react";
import { useLPData } from "@/hooks/lp";
import { useAccount } from "wagmi";
import { querySubgraph } from "@/hooks/subgraph";
import { useRefreshContext } from "@/context/RefreshContext";
import "@testing-library/jest-dom";

jest.mock("wagmi", () => ({
  useAccount: jest.fn(() => ({ address: "0x123", isConnected: true })),
  useChainId: jest.fn(() => 1),
  useConfig: jest.fn(() => ({})),
  createConfig: jest.fn(),
  http: jest.fn(),
}));

jest.mock("@/hooks/subgraph", () => ({
  querySubgraph: jest.fn(),
}));

jest.mock("@/context/RefreshContext", () => ({
  useRefreshContext: jest.fn(),
}));

const mockUseAccount = useAccount as jest.MockedFunction<typeof useAccount>;
const mockQuerySubgraph = querySubgraph as jest.MockedFunction<
  typeof querySubgraph
>;
const mockUseRefreshContext = useRefreshContext as jest.MockedFunction<
  typeof useRefreshContext
>;

describe("useLPData", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRefreshContext.mockReturnValue({
      refreshTrigger: 0,
      triggerRefresh: jest.fn(),
    });
  });

  it("returns loading state when no address", async () => {
    mockUseAccount.mockReturnValue({ address: undefined } as ReturnType<
      typeof useAccount
    >);

    const { result } = renderHook(() => useLPData("0x123"));

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isLP).toBe(false);
    expect(result.current.lpPosition).toBe(null);
    expect(result.current.lpRequest).toBe(null);
  });

  it("fetches and returns LP data successfully", async () => {
    mockUseAccount.mockReturnValue({
      address: "0x456",
      addresses: ["0x456"],
      chain: undefined,
      chainId: undefined,
      connector: undefined,
      isConnected: true,
      isConnecting: false,
      isDisconnected: false,
      isReconnecting: false,
      status: "connected",
    } as unknown as ReturnType<typeof useAccount>);

    mockQuerySubgraph.mockResolvedValue({
      lpposition: {
        id: "0x456-0x123",
        lp: "0x456",
        liquidityCommitment: "1000000000",
        collateralAmount: "300000000",
      },
      lprequest: {
        id: "0x456-0x123-5",
        requestType: "ADD_LIQUIDITY",
        requestAmount: "500000000",
        requestCycle: "5",
      },
    });

    const { result } = renderHook(() => useLPData("0x123"));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.lpPosition).toEqual({
      id: "0x456-0x123",
      lp: "0x456",
      liquidityCommitment: "1000000000",
      collateralAmount: "300000000",
    });

    expect(result.current.lpRequest).toEqual({
      id: "0x456-0x123-5",
      requestType: "ADD_LIQUIDITY",
      requestAmount: "500000000",
      requestCycle: "5",
    });

    expect(result.current.isLP).toBe(true);
    expect(result.current.error).toBe(null);
  });

  it("handles subgraph fetch error", async () => {
    mockUseAccount.mockReturnValue({
      address: "0x789",
      addresses: ["0x789"],
      chain: undefined,
      chainId: undefined,
      connector: undefined,
      isConnected: true,
      isConnecting: false,
      isDisconnected: false,
      isReconnecting: false,
      status: "connected",
    } as unknown as ReturnType<typeof useAccount>);
    mockQuerySubgraph.mockRejectedValue(new Error("Subgraph error"));

    const { result } = renderHook(() => useLPData("0xabc"));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.isLP).toBe(false);
    expect(result.current.lpPosition).toBe(null);
    expect(result.current.lpRequest).toBe(null);
  });
});
