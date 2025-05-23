import React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export const Navbar: React.FC = () => {
  const pathname = usePathname();

  const isUserActive = pathname === "/user" || pathname.includes("/user");
  const isLPActive = pathname === "/lp" || pathname.includes("/lp");

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
          {/* RainbowKit Connect Button */}
          <ConnectButton.Custom>
            {({
              account,
              chain,
              openAccountModal,
              openChainModal,
              openConnectModal,
              authenticationStatus,
              mounted,
            }) => {
              // Note: If your app doesn't use authentication, you
              // can remove all 'authenticationStatus' checks
              const ready = mounted && authenticationStatus !== "loading";
              const connected =
                ready &&
                account &&
                chain &&
                (!authenticationStatus ||
                  authenticationStatus === "authenticated");

              return (
                <div
                  {...(!ready && {
                    "aria-hidden": true,
                    style: {
                      opacity: 0,
                      pointerEvents: "none",
                      userSelect: "none",
                    },
                  })}
                >
                  {(() => {
                    if (!connected) {
                      return (
                        <button
                          onClick={openConnectModal}
                          type="button"
                          className="flex items-center gap-2 px-4 py-2 bg-black text-white font-medium text-sm rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                            />
                          </svg>
                          <span className="hidden sm:inline">
                            Connect Wallet
                          </span>
                          <span className="sm:hidden">Connect</span>
                        </button>
                      );
                    }

                    if (chain.unsupported) {
                      return (
                        <button
                          onClick={openChainModal}
                          type="button"
                          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white font-medium text-sm rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          Wrong network
                        </button>
                      );
                    }

                    return (
                      <div className="flex gap-2">
                        <button
                          onClick={openChainModal}
                          type="button"
                          className="flex items-center gap-1 px-2 py-2 bg-gray-800 text-white text-sm rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                        >
                          {chain.hasIcon && (
                            <div
                              style={{
                                background: chain.iconBackground,
                                width: 16,
                                height: 16,
                                borderRadius: 999,
                                overflow: "hidden",
                                marginRight: 4,
                              }}
                            >
                              {chain.iconUrl && (
                                <Image
                                  loader={({ src }) => src}
                                  width={16}
                                  height={16}
                                  className="rounded-full"
                                  alt={chain.name ?? "Chain icon"}
                                  src={chain.iconUrl}
                                />
                              )}
                            </div>
                          )}
                          <span className="hidden sm:inline">{chain.name}</span>
                        </button>

                        <button
                          onClick={openAccountModal}
                          type="button"
                          className="flex items-center gap-2 px-4 py-2 bg-black text-white font-medium text-sm rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3 3v8a3 3 0 003 3z"
                            />
                          </svg>
                          <span className="hidden sm:inline">
                            {account.displayName}
                          </span>
                          <span className="sm:hidden">
                            {account.displayName?.length > 6
                              ? account.displayName.slice(0, 6)
                              : account.displayName}
                          </span>
                        </button>
                      </div>
                    );
                  })()}
                </div>
              );
            }}
          </ConnectButton.Custom>
        </div>
      </div>
    </header>
  );
};
