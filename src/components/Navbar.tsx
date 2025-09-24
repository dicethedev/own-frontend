"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CustomConnectButton } from "./ConnectButton";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, ChevronUp } from "lucide-react";

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const [open, setOpen] = useState<boolean>(false);

  const isTradeActive = pathname === "/trade" || pathname.includes("/trade");
  const isBuySideActive =
    pathname === "/lp/buy-side" || pathname.includes("/lp/buy-side");
  const isSellSideActive =
    pathname === "/lp/sell-side" || pathname.includes("/lp/sell-side");

  return (
    <header className="fixed w-full z-50 backdrop-blur-xl border-b border-gray-900 shadow-md">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <div className="relative w-28 h-8">
              <Image
                src="/own_white.svg"
                alt="OwnLogo"
                fill
                className="object-contain"
                priority
              />
            </div>
          </Link>

          {/* Navigation */}
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <Link
                  href="/trade"
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    isTradeActive
                      ? "text-white"
                      : "text-white/50 hover:text-white"
                  }`}
                >
                  Trade
                </Link>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <DropdownMenu open={open} onOpenChange={setOpen}>
    
                    <DropdownMenuTrigger
                      className={`flex items-center gap-1 px-3 py-2 text-sm font-medium bg-transparent shadow-none
                    hover:bg-transparent focus:bg-transparent active:bg-transparent focus:outline-none focus:ring-0
                    ${
                      isBuySideActive || isSellSideActive
                        ? "text-white"
                        : "text-white/50 hover:text-white"
                    }`}
                    >
                      LP
                      {open ? (
                        <ChevronUp size={14} strokeWidth={2} />
                      ) : (
                        <ChevronDown size={14} strokeWidth={2} />
                      )}
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                      className="bg-gray-900 p-2 rounded-lg shadow-xl border border-gray-800 w-[200px]"
                      align="start"
                    >
                      <DropdownMenuItem asChild>
                        <Link
                          href="/lp/buy-side"
                          className={`w-full block px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                            isBuySideActive
                              ? "text-white bg-gray-800"
                              : "text-white/50 hover:text-black hover:bg-white/90"
                          }`}
                        >
                          Buy Side
                        </Link>
                      </DropdownMenuItem>

                      <DropdownMenuItem asChild>
                        <Link
                          href="/lp/sell-side"
                          className={`w-full block px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                            isSellSideActive
                              ? "text-white bg-gray-800"
                              : "text-white/50 hover:text-black hover:bg-white/90"
                          }`}
                        >
                          Sell Side
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          {/* RainbowKit Connect Button */}
          <CustomConnectButton />
        </div>
      </div>
    </header>
  );
};
