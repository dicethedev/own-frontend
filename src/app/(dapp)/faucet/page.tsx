"use client";

import React, { useState } from "react";
import { BackgroundEffects } from "@/components/BackgroundEffects";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
} from "@/components/ui/BaseComponents";
import { useAccount, useChainId } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useFaucet, FAUCET_TOKENS } from "@/hooks/faucet";
import { getExplorerUrl } from "@/utils/explorer";
import { ExternalLink, Loader2, Coins, AlertCircle } from "lucide-react";

const FaucetPage: React.FC = () => {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const [selectedToken, setSelectedToken] =
    useState<keyof typeof FAUCET_TOKENS>("USDC");

  const {
    isLoading,
    isLoadingBalance,
    error,
    balance,
    remainingMintAmount,
    mint,
    canMint,
    token,
  } = useFaucet(selectedToken);

  const TokenCard: React.FC<{
    tokenKey: keyof typeof FAUCET_TOKENS;
    isSelected: boolean;
    onClick: () => void;
  }> = ({ tokenKey, isSelected, onClick }) => {
    const tokenConfig = FAUCET_TOKENS[tokenKey];

    return (
      <div
        onClick={onClick}
        className={`p-4 rounded-lg border cursor-pointer transition-all ${
          isSelected
            ? "border-blue-500 bg-blue-500/20"
            : "border-gray-700 bg-gray-800/50 hover:border-gray-600"
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-white">{tokenConfig.name}</h3>
            <p className="text-gray-400 text-sm">{tokenConfig.symbol}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400">Mint Amount</p>
            <p className="font-medium text-white">
              {tokenConfig.mintAmount} {tokenConfig.symbol}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const canMintToken =
    canMint && Number(remainingMintAmount) >= Number(token.mintAmount);

  return (
    <div className="min-h-screen bg-gray-900 text-white relative">
      <BackgroundEffects />
      <Navbar />

      <div className="min-h-screen flex flex-col">
        <div className="flex-1">
          <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 pt-20 pb-6 sm:py-24 space-y-6">
            {/* Header */}
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="p-3 bg-blue-500/20 rounded-full">
                  <Coins className="w-8 h-8 text-blue-400" />
                </div>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold">Testnet Faucet</h1>
              <p className="text-gray-400 max-w-2xl mx-auto">
                Get testnet tokens for development and testing. Each wallet can
                mint up to 10,000 tokens per token.
              </p>
            </div>

            {/* Main Content */}
            {!isConnected ? (
              <Card className="bg-white/10 border-gray-800 rounded-lg max-w-md mx-auto">
                <CardContent className="p-6 text-center space-y-4">
                  <h2 className="text-xl font-semibold">Connect Your Wallet</h2>
                  <p className="text-gray-400">
                    Connect your wallet to start minting testnet tokens
                  </p>
                  <ConnectButton.Custom>
                    {({ openConnectModal }) => (
                      <Button
                        onClick={openConnectModal}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        Connect Wallet
                      </Button>
                    )}
                  </ConnectButton.Custom>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Token Selection */}
                <Card className="bg-white/10 border-gray-800 rounded-lg">
                  <CardHeader className="p-4 border-b border-gray-800">
                    <CardTitle className="text-xl font-semibold text-white">
                      Select Token
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {Object.keys(FAUCET_TOKENS).map((tokenKey) => (
                        <TokenCard
                          key={tokenKey}
                          tokenKey={tokenKey as keyof typeof FAUCET_TOKENS}
                          isSelected={selectedToken === tokenKey}
                          onClick={() =>
                            setSelectedToken(
                              tokenKey as keyof typeof FAUCET_TOKENS
                            )
                          }
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Selected Token Info */}
                <Card className="bg-white/10 border-gray-800 rounded-lg">
                  <CardHeader className="p-4 border-b border-gray-800">
                    <CardTitle className="text-xl font-semibold text-white flex items-center justify-between">
                      <span>
                        {token.name} ({token.symbol})
                      </span>
                      <a
                        href={getExplorerUrl(token.address, chainId)}
                        target="_blank"
                        className="text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        <ExternalLink className="w-5 h-5" />
                      </a>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    {/* Mint Button */}
                    <Button
                      onClick={mint}
                      disabled={!canMintToken || isLoading}
                      className={`w-full h-12 ${
                        canMintToken
                          ? "bg-blue-600 hover:bg-blue-700"
                          : "bg-gray-600 cursor-not-allowed"
                      }`}
                    >
                      {isLoading && (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      )}
                      <Coins className="w-4 h-4 mr-2" />
                      {!canMintToken && Number(remainingMintAmount) === 0
                        ? `Limit Reached`
                        : isLoading
                        ? "Minting..."
                        : `Mint ${token.mintAmount} ${token.symbol}`}
                    </Button>

                    {/* Current Balance */}
                    <div className="flex justify-end p-4">
                      <div className="text-right">
                        <span className="text-gray-400 px-2">
                          Your Balance:
                        </span>
                        <span className="text-gray-400 font-medium">
                          {isLoadingBalance ? (
                            <Loader2 className="w-4 h-4 animate-spin inline" />
                          ) : (
                            `${Number(balance).toLocaleString()} ${
                              token.symbol
                            }`
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Error Display */}
                    {error && (
                      <div className="flex items-center gap-2 text-red-400 bg-red-500/10 p-3 rounded-lg">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm">{error.message}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
};

export default FaucetPage;
