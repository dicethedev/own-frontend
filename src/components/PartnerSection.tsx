"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

interface Partner {
  name: string;
  logo: string;
  url: string;
}

const PARTNERS: Partner[] = [
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
];

export const PartnersSection: React.FC = () => {
  return (
    <section className="py-16 mt-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h2 className="text-2xl lg:text-4xl font-bold text-white mb-3">
            Ecosystem
          </h2>
          <p className="text-xl text-gray-400 max-w-lg mx-auto">
            Partnering with the best to bring you seamless access to tokenized
            assets
          </p>
        </div>

        {/* Partners Grid */}
        <div className="flex flex-wrap justify-center items-center gap-6 lg:gap-10">
          {PARTNERS.map((partner) => (
            <Link
              key={partner.name}
              href={partner.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative"
            >
              {/* Glow effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-cyan-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              {/* Card */}
              <div className="relative px-8 py-6 rounded-2xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10 group-hover:border-white/20 transition-all duration-300 group-hover:scale-105">
                <div className="relative w-32 h-12 grayscale group-hover:grayscale-0 opacity-70 group-hover:opacity-100 transition-all duration-300">
                  <Image
                    src={partner.logo}
                    alt={partner.name}
                    fill
                    className="object-contain"
                  />
                </div>

                {/* Subtle label on hover */}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 group-hover:-bottom-6 transition-all duration-300">
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    Visit {partner.name} ↗
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PartnersSection;
