import React from "react";
import { Button } from "@/components/ui/BaseComponents";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAccount, useConnect, useDisconnect } from "wagmi";
// import { SUPPORTED_CHAINS } from "@/lib/wagmi";
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
      // Connect with the first available connector (usually injected/MetaMask)
      const connector = connectors[0];
      if (connector) {
        connect({ connector });
      }
    }
  };

  // Format address for display
  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

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
              <ul className="flex gap-8">
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
                    Liquidity Provider
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
            {isPending
              ? "Connecting..."
              : isConnected
              ? formatAddress(address!)
              : "Connect Wallet"}
          </Button>
        </div>
      </div>
    </header>
  );
};
