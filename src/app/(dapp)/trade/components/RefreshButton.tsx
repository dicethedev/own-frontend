"use client";

import { RotateCcw } from "lucide-react";
interface RefreshButtonProps {
  onClick: () => void;   // this will be refetchQuote
  loading: boolean;      // this will be isRefetching
}

export default function RefreshButton({ onClick, loading }: RefreshButtonProps) {

  const handleClick = () => {
    onClick();
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition"
    >
      <RotateCcw
        size={18}
        className={`transition-transform duration-500 ${
          loading ? "animate-spin" : ""
        }`}
      />
    </button>
  );
}
