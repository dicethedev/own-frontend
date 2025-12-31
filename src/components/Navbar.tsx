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

  const showProtocolNav =
    pathname === "/protocol" || pathname.startsWith("/protocol/");

  const isBuySideActive =
    pathname === "/protocol/lp/buy-side" ||
    pathname.includes("/protocol/lp/buy-side");
  const isSellSideActive =
    pathname === "/protocol/lp/sell-side" ||
    pathname.includes("/protocol/lp/sell-side");

  return (
    <header className="fixed w-full z-50 bg-[#19191B]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-6 z-10">
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
          </div>

          {/* Navigation */}
          {showProtocolNav && (
            <div className="absolute left-1/2 transform -translate-x-1/2">
              <NavigationMenu>
                <NavigationMenuList>
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
                        Protocol
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
                            href="/protocol/lp/buy-side"
                            className={`w-full block px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                              isBuySideActive
                                ? "text-white bg-gray-800"
                                : "text-white/50 hover:text-black hover:bg-white/90"
                            }`}
                          >
                            Buy Side (User)
                          </Link>
                        </DropdownMenuItem>

                        <DropdownMenuItem asChild>
                          <Link
                            href="/protocol/lp/sell-side"
                            className={`w-full block px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                              isSellSideActive
                                ? "text-white bg-gray-800"
                                : "text-white/50 hover:text-black hover:bg-white/90"
                            }`}
                          >
                            Sell Side (LP)
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>
            </div>
          )}

          {/* RainbowKit Connect Button */}
          <div className="z-10">
            <CustomConnectButton />
          </div>
        </div>
      </div>
    </header>
  );
};
