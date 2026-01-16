"use client";

import Link from "next/link";
import { useChainId } from "wagmi";

const BASE_SEPOLIA_CHAIN_ID = 84532;

export function Footer() {
  const chainId = useChainId();
  const isBaseSepolia = chainId === BASE_SEPOLIA_CHAIN_ID;
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-white/10">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="text-sm text-gray-400">© {currentYear} Own Finance</div>
          <div className="flex gap-8">
            <Link
              href="https://own-protocol.gitbook.io/docs"
              target="_blank"
              className="text-sm text-gray-400 hover:underline"
            >
              Docs
            </Link>
            <Link
              href="https://x.com/ownfinanceHQ"
              target="_blank"
              className="text-sm text-gray-400 hover:underline"
            >
              X (Twitter)
            </Link>
            <Link
              href="https://t.me/+EX6VZh6rrPc5YmI9"
              target="_blank"
              className="text-sm text-gray-400 hover:underline"
            >
              Telegram
            </Link>
            <Link
              href="https://github.com/own-protocol/own-contracts"
              target="_blank"
              className="hidden sm:inline text-sm text-gray-400 hover:underline"
            >
              Github
            </Link>
            {isBaseSepolia && (
              <Link
                href="/faucet"
                className="text-sm text-gray-400 hover:underline"
              >
                Faucet
              </Link>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
