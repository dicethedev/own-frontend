"use client";

import { Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function SwapSettings() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition">
          <Settings size={18} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="bg-[#1B2430] border border-gray-700 text-white rounded-lg p-2 w-40"
      >
        <DropdownMenuItem className="text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-md px-3 py-2 cursor-default">
          Coming soon...
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
