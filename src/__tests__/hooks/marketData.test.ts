import { renderHook } from '@testing-library/react';
import '@testing-library/react';
import { fetchMarketData, useMarketData, fetchBatchMarketData } from '@/hooks/marketData';

// Mock fetch globally
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock console.error to avoid noise in tests
const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

describe('fetchMarketData', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    consoleSpy.mockClear();
  });

  afterAll(() => {
    consoleSpy.mockRestore();
  });

  it('should fetch and transform market data successfully', async () => {
    const mockResponse = {
      chart: {
        result: [{
          meta: {
            shortName: 'Apple Inc.',
            regularMarketPrice: 150.25,
            previousClose: 148.50,
          },
          indicators: {
            quote: [{
              volume: [1000000, 1200000, 1100000]
            }]
          }
        }]
      }
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const result = await fetchMarketData('AAPL');

    expect(mockFetch).toHaveBeenCalledWith('/api/yahoo-finance?symbols=AAPL');
    expect(result).toEqual({
      name: 'Apple Inc.',
      price: 150.25,
      priceChange: 1.18, // ((150.25 - 148.50) / 148.50) * 100
      volume: '1.1M', // Formatted compact notation
    });
  });

  it('should use chartPreviousClose when previousClose is not available', async () => {
    const mockResponse = {
      chart: {
        result: [{
          meta: {
            shortName: 'Tesla Inc.',
            regularMarketPrice: 200.00,
            chartPreviousClose: 190.00,
          },
          indicators: {
            quote: [{
              volume: [500000]
            }]
          }
        }]
      }
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const result = await fetchMarketData('TSLA');

    expect(result.priceChange).toBe(5.26); // ((200 - 190) / 190) * 100
  });

  it('should handle negative price changes', async () => {
    const mockResponse = {
      chart: {
        result: [{
          meta: {
            shortName: 'Down Stock',
            regularMarketPrice: 90.00,
            previousClose: 100.00,
          },
          indicators: {
            quote: [{
              volume: [750000]
            }]
          }
        }]
      }
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const result = await fetchMarketData('DOWN');

    expect(result.priceChange).toBe(-10.00); // ((90 - 100) / 100) * 100
  });

  it('should handle large volume numbers with compact formatting', async () => {
    const mockResponse = {
      chart: {
        result: [{
          meta: {
            shortName: 'High Volume Stock',
            regularMarketPrice: 50.00,
            previousClose: 49.00,
          },
          indicators: {
            quote: [{
              volume: [1500000000] // 1.5 billion
            }]
          }
        }]
      }
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const result = await fetchMarketData('HVS');

    expect(result.volume).toBe('1.5B');
  });

it('should handle zero previousClose to avoid division by zero', async () => {
  const mockResponse = {
    chart: {
      result: [{
        meta: {
          shortName: 'Zero Previous',
          regularMarketPrice: 10.00,
          previousClose: 0,
        },
        indicators: {
          quote: [{
            volume: [100000]
          }]
        }
      }]
    }
  };

  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => mockResponse,
  } as Response);

  const result = await fetchMarketData('ZERO');

   // Handle NaN as "Infinity" scenario
  const isInfinityLike = result.priceChange === Infinity || Number.isNaN(result.priceChange);

  expect(isInfinityLike).toBe(true);
});
});

describe('useMarketData', () => {
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


  it('should clean up interval on unmount', async () => {
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
    
    const mockResponse = {
      chart: {
        result: [{
          meta: {
            shortName: 'Apple Inc.',
            regularMarketPrice: 150.25,
            previousClose: 148.50,
          },
          indicators: {
            quote: [{
              volume: [1000000]
            }]
          }
        }]
      }
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const { unmount } = renderHook(() => useMarketData('AAPL'));

    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
    clearIntervalSpy.mockRestore();
  });

it('should not fetch data for empty symbol', () => {
  renderHook(() => useMarketData(''));

  // Ensure fetch was never called
  expect(mockFetch).not.toHaveBeenCalled();
});

});

describe('fetchBatchMarketData', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    consoleSpy.mockClear();
  });

  it('should fetch batch market data successfully', async () => {
    const symbols = ['AAPL', 'GOOGL', 'MSFT'];
    const mockResponse = {
      AAPL: { name: 'Apple Inc.', price: 150.25, priceChange: 1.18, volume: '1M' },
      GOOGL: { name: 'Alphabet Inc.', price: 2500.00, priceChange: -0.5, volume: '500K' },
      MSFT: { name: 'Microsoft Corp.', price: 300.00, priceChange: 2.1, volume: '2M' },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const result = await fetchBatchMarketData(symbols);

    expect(mockFetch).toHaveBeenCalledWith('/api/yahoo-finance?symbols=AAPL,GOOGL,MSFT');
    expect(result).toEqual(mockResponse);
  });

  it('should handle empty symbols array', async () => {
    const mockResponse = {};

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const result = await fetchBatchMarketData([]);

    expect(mockFetch).toHaveBeenCalledWith('/api/yahoo-finance?symbols=');
    expect(result).toEqual({});
  });

  it('should handle single symbol', async () => {
    const symbols = ['AAPL'];
    const mockResponse = {
      AAPL: { name: 'Apple Inc.', price: 150.25, priceChange: 1.18, volume: '1M' },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const result = await fetchBatchMarketData(symbols);

    expect(mockFetch).toHaveBeenCalledWith('/api/yahoo-finance?symbols=AAPL');
    expect(result).toEqual(mockResponse);
  });

  it('should handle symbols with special characters', async () => {
    const symbols = ['BRK.A', 'BRK.B'];
    const mockResponse = {
      'BRK.A': { name: 'Berkshire Hathaway A', price: 500000, priceChange: 0.1, volume: '100' },
      'BRK.B': { name: 'Berkshire Hathaway B', price: 300, priceChange: 0.1, volume: '1K' },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const result = await fetchBatchMarketData(symbols);

    expect(mockFetch).toHaveBeenCalledWith('/api/yahoo-finance?symbols=BRK.A,BRK.B');
    expect(result).toEqual(mockResponse);
  });
});