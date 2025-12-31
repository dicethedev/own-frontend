import { renderHook } from "@testing-library/react";
import "@testing-library/react";
import { useMarketData, fetchBatchMarketData } from "@/hooks/marketData";

// Mock fetch globally
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock console.error to avoid noise in tests
const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

describe("useMarketData", () => {
  beforeEach(() => {
    mockFetch.mockClear();
    consoleSpy.mockClear();
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("should clean up interval on unmount", async () => {
    const clearIntervalSpy = jest.spyOn(global, "clearInterval");

    const mockResponse = {
      chart: {
        result: [
          {
            meta: {
              shortName: "Apple Inc.",
              regularMarketPrice: 150.25,
              previousClose: 148.5,
            },
            indicators: {
              quote: [
                {
                  volume: [1000000],
                },
              ],
            },
          },
        ],
      },
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const { unmount } = renderHook(() => useMarketData("AAPL"));

    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
    clearIntervalSpy.mockRestore();
  });

  it("should not fetch data for empty symbol", () => {
    renderHook(() => useMarketData(""));

    // Ensure fetch was never called
    expect(mockFetch).not.toHaveBeenCalled();
  });
});

describe("fetchBatchMarketData", () => {
  beforeEach(() => {
    mockFetch.mockClear();
    consoleSpy.mockClear();
  });

  it("should fetch batch market data successfully", async () => {
    const symbols = ["AAPL", "GOOGL", "MSFT"];
    const mockResponse = {
      AAPL: {
        name: "Apple Inc.",
        price: 150.25,
        priceChange: 1.18,
        volume: "1M",
      },
      GOOGL: {
        name: "Alphabet Inc.",
        price: 2500.0,
        priceChange: -0.5,
        volume: "500K",
      },
      MSFT: {
        name: "Microsoft Corp.",
        price: 300.0,
        priceChange: 2.1,
        volume: "2M",
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const result = await fetchBatchMarketData(symbols);

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/yahoo-finance?symbols=AAPL,GOOGL,MSFT"
    );
    expect(result).toEqual(mockResponse);
  });

  it("should handle empty symbols array", async () => {
    const mockResponse = {};

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const result = await fetchBatchMarketData([]);

    expect(mockFetch).toHaveBeenCalledWith("/api/yahoo-finance?symbols=");
    expect(result).toEqual({});
  });

  it("should handle single symbol", async () => {
    const symbols = ["AAPL"];
    const mockResponse = {
      AAPL: {
        name: "Apple Inc.",
        price: 150.25,
        priceChange: 1.18,
        volume: "1M",
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const result = await fetchBatchMarketData(symbols);

    expect(mockFetch).toHaveBeenCalledWith("/api/yahoo-finance?symbols=AAPL");
    expect(result).toEqual(mockResponse);
  });

  it("should handle symbols with special characters", async () => {
    const symbols = ["BRK.A", "BRK.B"];
    const mockResponse = {
      "BRK.A": {
        name: "Berkshire Hathaway A",
        price: 500000,
        priceChange: 0.1,
        volume: "100",
      },
      "BRK.B": {
        name: "Berkshire Hathaway B",
        price: 300,
        priceChange: 0.1,
        volume: "1K",
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const result = await fetchBatchMarketData(symbols);

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/yahoo-finance?symbols=BRK.A,BRK.B"
    );
    expect(result).toEqual(mockResponse);
  });
});
