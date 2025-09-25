"use client";

export default function QuoteSkeleton() {
  return (
    <div className="rounded-xl flex flex-col bg-white/5 p-4 mb-3 space-y-4">
      {/* Exchange Rate */}
      <div className="flex items-center justify-between">
        <div className="h-4 bg-gray-600 rounded w-24" /> {/* Label */}
        <div className="h-4 bg-gray-600 rounded w-20" /> {/* Value */}
      </div>

      {/* Slippage Tolerance */}
      <div className="flex items-center justify-between">
        <div className="h-4 bg-gray-600 rounded w-28" />
        <div className="h-4 bg-gray-600 rounded w-16" />
      </div>

      {/* Minimum Received */}
      <div className="flex items-center justify-between">
        <div className="h-4 bg-gray-600 rounded w-32" />
        <div className="h-4 bg-gray-600 rounded w-24" />
      </div>
    </div>
  );
}
