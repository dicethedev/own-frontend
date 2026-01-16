"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Footer } from "@/components/Footer";

// Custom keyframes
const notFoundAnimation = `
@keyframes spinBounce {
  0% { transform: rotate(0deg) translateY(0); }
  25% { transform: rotate(15deg) translateY(-20px); }
  50% { transform: rotate(-15deg) translateY(20px); }
  75% { transform: rotate(15deg) translateY(-10px); }
  100% { transform: rotate(0deg) translateY(0); }
}
@keyframes flicker {
  0%, 19%, 21%, 23%, 25%, 54%, 56%, 100% { opacity: 1; }
  20%, 22%, 24%, 55% { opacity: 0.4; }
}
`;

// Inject keyframes dynamically
if (typeof window !== "undefined") {
  const style = document.createElement("style");
  style.innerHTML = notFoundAnimation;
  document.head.appendChild(style);
}

export default function NotFound() {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimate(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <div className="flex flex-col items-center justify-center min-h-screen px-4 text-white bg-gradient-to-b from-[#060606] to-[#080909] overflow-hidden relative">
        {/* Floating particles */}
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white/30 rounded-full animate-[float_5s_linear_infinite]"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}

        <div className="w-full max-w-md text-center z-10">
          {/* Large 404 Number */}
          <div
            className={`mb-6 ${
              animate
                ? "animate-[spinBounce_2s_ease-in-out_infinite]"
                : "scale-50 opacity-0"
            }`}
          >
            <h1 className="text-9xl font-black text-red-500 select-none animate-[flicker_1.5s_infinite]">
              404
            </h1>
          </div>

          {/* Main Heading */}
          <h2
            className={`text-3xl font-bold mb-2 transition-opacity duration-1000 ${
              animate ? "opacity-100" : "opacity-0"
            }`}
          >
            Page Not Found
          </h2>

          {/* Subtitle */}
          <p
            className={`text-sm text-gray-300 mb-8 transition-opacity duration-1000 delay-200 ${
              animate ? "opacity-100" : "opacity-0"
            }`}
          >
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>

          {/* Action Buttons */}
          <div
            className={`space-y-3 transition-opacity duration-1000 delay-400 ${
              animate ? "opacity-100" : "opacity-0"
            }`}
          >
            <Link
              href="/"
              className="inline-block w-full max-w-xs py-3 px-2 bg-white/10 border border-gray-600 text-white text-sm font-medium rounded-md hover:bg-white/20 transition-all"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
