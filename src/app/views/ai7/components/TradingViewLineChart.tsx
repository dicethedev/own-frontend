"use client";

import React, { useEffect, useRef } from "react";

interface TradingViewLineChartProps {
  symbol?: string;
  className?: string;
}

export const TradingViewLineChart: React.FC<TradingViewLineChartProps> = ({
  symbol = "CBOE:MAGS",
  className = "",
}) => {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Clear any existing content
    if (container.current) {
      container.current.innerHTML = "";
    }

    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: symbol,
      interval: "W", // Weekly for better 3-year view
      timezone: "Etc/UTC",
      theme: "dark",
      style: "3", // Area chart style (line chart with fill)
      locale: "en",
      enable_publishing: false,
      backgroundColor: "rgba(16, 24, 40, 0.9)",
      gridColor: "rgba(255, 255, 255, 0.05)",
      hide_top_toolbar: true,
      hide_legend: false,
      save_image: false,
      calendar: false,
      hide_volume: true,
      support_host: "https://www.tradingview.com",
      range: "36M", // 3 years
      allow_symbol_change: false,
    });

    const currentContainer = container.current;
    if (currentContainer) {
      currentContainer.appendChild(script);
    }

    return () => {
      if (currentContainer) {
        currentContainer.innerHTML = "";
      }
    };
  }, [symbol]);

  return (
    <div
      className={`tradingview-widget-container rounded-xl overflow-hidden h-full w-full ${className}`}
      ref={container}
    >
      <div
        className="tradingview-widget-container__widget"
        style={{ height: "100%", width: "100%" }}
      />
    </div>
  );
};

export default TradingViewLineChart;
