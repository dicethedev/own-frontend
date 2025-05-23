"use client";

import Image from "next/image";
import Link from "next/link";

export function HomeNavbar() {
  return (
    <nav className="fixed w-full z-50 backdrop-blur-xl pt-1 border-b border-gray-400/20 shadow-[0_2px_8px_0_rgba(0,0,0,0.05)]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center h-14">
          <Link href="/" className="flex items-center">
            <div className="relative w-28 h-8">
              <Image
                src="./own.svg"
                alt="OwnLogo"
                fill
                className="object-contain"
                priority
              />
            </div>
          </Link>
          <div className="flex items-center ml-8 sm:gap-4">
            <Link
              href="/user"
              className="px-4 py-2 rounded-full transition-colors hover:underline"
            >
              <span className="hidden sm:inline">Launch App →</span>
              <span className="sm:hidden">App →</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
