import React, { useState } from "react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
} from "@/components/ui/BaseComponents";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/TabsComponents";
import { TradingViewWidget } from "./TradingViewComponent";
import { ArrowUpDown, Info, Wallet } from "lucide-react";
import { Pool } from "@/types/pool";

interface PoolDetailsProps {
  pool: Pool;
}

const PoolDetails: React.FC<PoolDetailsProps> = ({ pool }) => {
  const [depositAmount, setDepositAmount] = useState("");
  const [redeemAmount, setRedeemAmount] = useState("");

  const formatPriceChange = (change: number) => {
    const sign = change >= 0 ? "+" : "";
    const color = change >= 0 ? "text-green-500" : "text-red-500";
    return (
      <span className={color}>
        {sign}
        {change}%
      </span>
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 py-24 space-y-6">
      {/* Header Section */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">
            {pool.name} ({pool.symbol})
          </h1>
          <p className="text-xl">
            ${pool.price.toLocaleString()} {formatPriceChange(pool.priceChange)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Pool Status</p>
          <p className="text-lg font-medium text-green-500">ACTIVE</p>
          <p className="text-sm text-gray-500">Cycle #12</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
        {/* Trading View Card */}
        <Card className="lg:col-span-4 h-96 rounded-lg border border-gray-800 shadow-sm col-span-2">
          <TradingViewWidget symbol={`NASDAQ:${pool.symbol}`} />
        </Card>

        {/* Actions Card */}
        <Card className="lg:col-span-2 bg-white/10 border-gray-800 rounded-lg p-2">
          <Tabs defaultValue="deposit" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-slate-800/50 p-1">
              <TabsTrigger
                value="deposit"
                className="data-[state=active]:bg-slate-700 data-[state=active]:text-slate-100 text-slate-300"
              >
                Deposit
              </TabsTrigger>
              <TabsTrigger
                value="redeem"
                className="data-[state=active]:bg-slate-700 data-[state=active]:text-slate-100 text-slate-300"
              >
                Redeem
              </TabsTrigger>
            </TabsList>

            <TabsContent value="deposit" className="mt-4 space-y-4">
              <div className="space-y-3">
                <Input
                  type="number"
                  placeholder="Amount to deposit"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="px-2 h-12 bg-slate-600/50 border-slate-700 text-gray-400 placeholder:text-gray-400"
                />
                <Button className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white">
                  <Wallet className="w-4 h-4 mr-2" />
                  Deposit {pool.depositToken}
                </Button>
              </div>
              <p className="text-sm text-slate-400 flex items-center">
                <Info className="w-4 h-4 mr-1" />
                Deposits are processed at the end of each cycle
              </p>
            </TabsContent>

            <TabsContent value="redeem" className="mt-4 space-y-4">
              <div className="space-y-3">
                <Input
                  type="number"
                  placeholder="Amount to redeem"
                  value={redeemAmount}
                  onChange={(e) => setRedeemAmount(e.target.value)}
                  className="px-2 h-12 bg-slate-600/50 border-slate-700 text-gray-400 placeholder:text-gray-400"
                />
                <Button
                  variant="secondary"
                  className="w-full h-12 bg-slate-700 hover:bg-slate-600 text-slate-100"
                >
                  <ArrowUpDown className="w-4 h-4 mr-2" />
                  Redeem x{pool.symbol}
                </Button>
              </div>
              <p className="text-sm text-slate-400 flex items-center">
                <Info className="w-4 h-4 mr-1" />
                Redemptions are processed at the end of each cycle
              </p>
            </TabsContent>
          </Tabs>
        </Card>

        {/* Pool Info Card */}
        <Card className="lg:col-span-6 bg-white/10 border-gray-800 rounded-lg">
          <CardHeader className="p-4 border-b border-gray-800">
            <CardTitle className="text-xl font-semibold text-white">
              Pool Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-gray-400">Deposit Token</p>
                <p className="text-white font-medium">{pool.depositToken}</p>
              </div>
              <div>
                <p className="text-gray-400">24h Volume</p>
                <p className="text-white font-medium">{pool.volume24h}</p>
              </div>
              <div>
                <p className="text-gray-400">Cycle Status</p>
                <p className="text-white font-medium">12h remaining</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Positions */}
        <Card className="lg:col-span-6 bg-white/10 border-gray-800 rounded-lg">
          <CardHeader className="p-4 border-b border-gray-800">
            <CardTitle className="text-xl font-semibold text-white">
              User Positions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-400">No positions available</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PoolDetails;
