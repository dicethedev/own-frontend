"use client";

import { ChevronDown } from "lucide-react";
import Image from "next/image";
import { Token } from "./types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TokenSelectProps {
  tokens: Token[];
  selected: Token;
  onSelect: (token: Token) => void;
}

export default function TokenSelect({ tokens, selected, onSelect }: TokenSelectProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-[#1B2430]/20 text-white font-medium hover:bg-[#243040] transition">
          <Image src={selected.logo} alt={selected.symbol} width={20} height={20} />
          <span>{selected.symbol}</span>
          <ChevronDown size={16} className="text-gray-400" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        className="w-44 bg-[#1B2430] border border-gray-700 rounded-lg shadow-lg p-1"
      >
        {tokens.map((token) => (
          <DropdownMenuItem
            key={token.symbol}
            onClick={() => onSelect(token)}
            className="flex items-center gap-2 px-3 py-2 text-white hover:bg-gray-700/50 rounded-md cursor-pointer"
          >
            <Image src={token.logo} alt={token.symbol} width={18} height={18} />
            <span>{token.symbol}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
