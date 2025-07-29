import React from "react";
import { render, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";
import { TradingViewWidget } from "@/components/pool/TradingViewComponent";

describe("TradingViewWidget", () => {
  let originalCreateElement: typeof document.createElement;

  beforeEach(() => {
    originalCreateElement = document.createElement;

    // Mock script creation to prevent appendChild issues
    jest
      .spyOn(document, "createElement")
      .mockImplementation((tagName: string) => {
        if (tagName === "script") {
          const script = originalCreateElement.call(document, "script");
          script.setAttribute = jest.fn();
          return script;
        }
        return originalCreateElement.call(document, tagName);
      });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    cleanup();
  });

  it("renders container elements", () => {
    const { container } = render(<TradingViewWidget symbol="NYSE:TSLA" />);
    expect(
      container.querySelector(".tradingview-widget-container")
    ).toBeInTheDocument();
    expect(
      container.querySelector(".tradingview-widget-container__widget")
    ).toBeInTheDocument();
  });

  it("handles case where containerRef.current is null", () => {
    jest.spyOn(React, "useRef").mockReturnValueOnce({ current: null });
    expect(() =>
      render(<TradingViewWidget symbol="NASDAQ:AAPL" />)
    ).not.toThrow();
  });

  it("does not throw if script not found during cleanup", () => {
    const mockContainer = {
      querySelector: jest.fn(() => null),
    };
    jest.spyOn(React, "useRef").mockReturnValueOnce({ current: mockContainer });

    const { unmount } = render(<TradingViewWidget symbol="NASDAQ:AAPL" />);
    expect(() => unmount()).not.toThrow();
  });
});
