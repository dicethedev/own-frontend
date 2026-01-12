"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

interface Partner {
  name: string;
  logo: string;
  url: string;
  invert?: boolean;
}

const PARTNERS: Partner[] = [
  {
    name: "Base",
    logo: "/icons/base-logo.svg",
    url: "https://base.org",
  },
  {
    name: "Coins.me",
    logo: "/icons/coinsme-logo.svg",
    url: "https://coins.me",
  },
  {
    name: "P2P.me",
    logo: "/icons/p2p-logo.svg",
    url: "https://p2p.me",
  },
  {
    name: "Noice",
    logo: "/icons/noice-logo.svg",
    url: "https://noice.so",
    invert: true,
  },
];

export const PartnersSection: React.FC = () => {
  return (
    <section className="mt-12 py-8 border-t border-[#303136]">
      <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10">
        {/* Label */}
        <span className="text-gray-400 text-lg font-medium whitespace-nowrap">
          Partners:
        </span>

        {/* Logos */}
        <div className="flex items-center gap-8 sm:gap-10">
          {PARTNERS.map((partner) => (
            <Link
              key={partner.name}
              href={partner.url}
              target="_blank"
              rel="noopener noreferrer"
              className="relative w-16 h-12 opacity-60 hover:opacity-100 transition-opacity duration-300"
              title={partner.name}
            >
              <Image
                src={partner.logo}
                alt={partner.name}
                fill
                className={`object-contain ${
                  partner.invert ? "brightness-0 invert" : ""
                }`}
              />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PartnersSection;
