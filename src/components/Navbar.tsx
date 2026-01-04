"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CustomConnectButton } from "./ConnectButton";
import { Menu, X } from "lucide-react";

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const [isPoolHovered, setIsPoolHovered] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isMint = pathname === "/mint" || pathname.startsWith("/mint/");
  const isUnderwrite =
    pathname === "/underwrite" || pathname.startsWith("/underwrite/");

  // Handle hover with delay for better UX
  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setIsPoolHovered(true);
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setIsPoolHovered(false);
    }, 150);
  };

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      <header className="fixed w-full z-50 bg-[#19191B]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            {/* Logo + Pool Navigation */}
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

              {/* Pool Dropdown - Desktop */}
              <div
                className="relative hidden md:block"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                <button
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    isMint || isUnderwrite
                      ? "text-white"
                      : "text-white/50 hover:text-white"
                  }`}
                >
                  Pool
                </button>

                {/* Dropdown Menu */}
                {isPoolHovered && (
                  <div className="absolute top-full left-0 pt-1">
                    <div className="bg-[#222325] rounded-lg shadow-xl border border-[#303136] p-2 min-w-[160px]">
                      <Link
                        href="/mint/ai7"
                        className={`block px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                          isMint
                            ? "text-white bg-[#303136]"
                            : "text-white/70 hover:text-white hover:bg-[#303136]"
                        }`}
                      >
                        Mint AI7
                      </Link>
                      <Link
                        href="/underwrite/ai7"
                        className={`block mt-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                          isUnderwrite
                            ? "text-white bg-[#303136]"
                            : "text-white/70 hover:text-white hover:bg-[#303136]"
                        }`}
                      >
                        Underwrite AI7
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Docs Link - Desktop */}
              <Link
                href="https://own-protocol.gitbook.io/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden md:block px-3 py-2 text-sm font-medium text-white/50 hover:text-white transition-colors"
              >
                Docs
              </Link>
            </div>

            {/* Right Side - Connect Button + Mobile Menu */}
            <div className="flex items-center gap-4 z-10">
              <CustomConnectButton />

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="md:hidden p-2 text-white/70 hover:text-white transition-colors"
                aria-label="Open menu"
              >
                <Menu size={24} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Side Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-50 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Side Menu */}
      <div
        className={`fixed top-0 right-0 h-full w-72 bg-[#19191B] z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Menu Header */}
        <div className="flex items-center justify-between px-6 h-16 border-b border-[#303136]">
          <span className="text-white font-medium">App</span>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 text-white/70 hover:text-white transition-colors"
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
        </div>

        {/* Menu Items */}
        <nav className="px-4 py-6 flex flex-col gap-2">
          <Link
            href="/mint/ai7"
            className={`px-4 py-3 text-base font-medium rounded-lg transition-colors ${
              isMint
                ? "text-white bg-[#303136]"
                : "text-white/70 hover:text-white hover:bg-[#222325]"
            }`}
          >
            Mint AI7
          </Link>
          <Link
            href="/underwrite/ai7"
            className={`px-4 py-3 text-base font-medium rounded-lg transition-colors ${
              isUnderwrite
                ? "text-white bg-[#303136]"
                : "text-white/70 hover:text-white hover:bg-[#222325]"
            }`}
          >
            Underwrite AI7
          </Link>
          <Link
            href="https://own-protocol.gitbook.io/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-3 text-base font-medium text-white/70 hover:text-white hover:bg-[#222325] rounded-lg transition-colors"
          >
            Docs
          </Link>
        </nav>
      </div>
    </>
  );
};
