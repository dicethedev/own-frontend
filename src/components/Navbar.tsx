import React from "react";
import { Button } from "@/components/ui/BaseComponents";
import Image from "next/image";
import Link from "next/link";

export const Navbar: React.FC = () => {
  return (
    <header className="fixed w-full z-50 backdrop-blur-xl pt-1 border-b border-gray-900 dark:shadow-[0_2px_8px_0_rgba(0,0,0,0.2)]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center h-14">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center">
              <div className="relative w-28 h-8">
                <Image
                  src="/own_white.svg"
                  alt="OwnLogo"
                  fill
                  className="object-contain"
                  priority
                  onError={(e) => {
                    console.error("Image failed to load:", e);
                  }}
                />
              </div>
            </Link>
            <nav>
              <ul className="flex gap-4">
                <li>
                  <button className="px-4 py-2 rounded-full hover:bg-white/10">
                    User
                  </button>
                </li>
                <li>
                  <button className="px-4 py-2 rounded-full hover:bg-white/10">
                    Liquidity Provider
                  </button>
                </li>
              </ul>
            </nav>
          </div>
          <Button className="flex items-center gap-2">
            {/* <Wallet size={16} /> */}
            Connect Wallet
          </Button>
        </div>
      </div>
    </header>
  );
};
