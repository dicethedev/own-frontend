"use client";

import { Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SwapSettingsProps {
  slippage: number;
  setSlippage: (value: number) => void;
}

export default function SwapSettings({ slippage, setSlippage }: SwapSettingsProps) {
  const presetSlippage = [0.1, 0.5, 1]; // preset options

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition">
          <Settings size={18} />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="bg-[#1B2430]/60 border border-gray-700 text-white rounded-xl p-4 w-max"
      >
        <p className="text-gray-400 text-sm mb-2">Slippage Tolerance</p>

        <div className="flex items-center gap-2">
          {presetSlippage.map((value) => (
            <button
              key={value}
              onClick={() => setSlippage(value)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition ${
                slippage === value
                  ? "bg-gray-700/50 text-white"
                  : "bg-gray-800/40 text-gray-400 hover:bg-gray-700/50 hover:text-white"
              }`}
            >
              {value}%
            </button>
          ))}

          <input
            type="number"
            value={slippage}
            onChange={(e) => setSlippage(Number(e.target.value))}
            className="w-16 text-black rounded-md px-2 py-1 text-sm"
            min={0}
            step={0.1}
            placeholder="Custom"
          />
        </div>

        <p className="text-gray-400 text-xs mt-4 cursor-default">
          Transaction Deadline (coming soon)
        </p>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
