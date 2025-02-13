import React from "react";
import { Button } from "@/components/ui/BaseComponents";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { Wallet } from "lucide-react";

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { address, isConnected } = useAccount();
  const { connect, connectors, status: connectStatus } = useConnect();
  const { disconnect } = useDisconnect();

  const isPending = connectStatus === "pending";

  const isUserActive = pathname === "/user";
  const isLPActive = pathname === "/lp";

  const handleWalletClick = () => {
    if (isConnected) {
      disconnect();
    } else {
      const connector = connectors[0];
      if (connector) {
        connect({ connector });
      }
    }
  };

  const formatAddressFull = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatAddressShort = (addr: string) => {
    return `${addr.slice(0, 6)}`;
  };

  return (
    <header className="fixed w-full z-50 backdrop-blur-xl pt-1 border-b border-gray-900 dark:shadow-[0_2px_8px_0_rgba(0,0,0,0.2)]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center h-14">
          <div className="flex items-center gap-4 sm:gap-8">
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
            <nav className="mr-2">
              <ul className="flex gap-4 sm:gap-8">
                <li>
                  <Link
                    href="/user"
                    className={`px-1 py-2 inline-block hover:text-white ${
                      isUserActive ? "text-white" : "text-white/50"
                    }`}
                  >
                    User
                  </Link>
                </li>
                <li>
                  <Link
                    href="/lp"
                    className={`px-1 py-2 inline-block hover:text-white ${
                      isLPActive ? "text-white" : "text-white/50"
                    }`}
                  >
                    <span className="hidden sm:inline">Liquidity Provider</span>
                    <span className="sm:hidden">LP</span>
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
          <Button
            onClick={handleWalletClick}
            disabled={isPending}
            className="flex items-center gap-2"
          >
            <Wallet size={16} />
            {isPending ? (
              "Connecting..."
            ) : isConnected ? (
              <>
                <span className="hidden sm:inline">
                  {formatAddressFull(address!)}
                </span>
                <span className="sm:hidden">
                  {formatAddressShort(address!)}
                </span>
              </>
            ) : (
              <>
                <span className="hidden sm:inline">Connect Wallet</span>
                <span className="sm:hidden">Connect</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </header>
  );
};
