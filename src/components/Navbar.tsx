import React from "react";
import { Button } from "@/components/ui/BaseComponents";
import Image from "next/image";
import Link from "next/link";

export const Navbar: React.FC = () => {
  return (
    <header className="fixed w-full z-50 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-8">
            <Link href="/" className="block">
              <Image src="/own.svg" alt="OwnLogo" width={96} height={96} />
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
