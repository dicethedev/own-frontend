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
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-6 sm:py-24 space-y-4 sm:space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">
            {pool.name} ({pool.symbol})
          </h1>
          <p className="text-lg sm:text-xl">
            ${pool.price.toLocaleString()} {formatPriceChange(pool.priceChange)}
          </p>
        </div>
        <div className="flex sm:flex-col justify-between sm:text-right">
          <div>
            <p className="text-sm text-gray-500">Pool Status</p>
            <p className="text-base sm:text-lg font-medium text-green-500">
              ACTIVE
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Cycle #12</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-4">
        {/* Chart and Actions Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Trading View Card */}
          <Card className="h-72 sm:h-96 lg:col-span-2 rounded-lg border border-gray-800 shadow-sm">
            <TradingViewWidget symbol={`NASDAQ:${pool.symbol}`} />
          </Card>

          {/* Actions Card */}
          <Card className="bg-white/10 border-gray-800 rounded-lg p-2">
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
        </div>

        {/* Pool Info Card */}
        <Card className="bg-white/10 border-gray-800 rounded-lg">
          <CardHeader className="p-4 border-b border-gray-800">
            <CardTitle className="text-xl font-semibold text-white">
              Pool Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-gray-400">Deposit Token</p>
                <p className="text-white font-medium truncate">
                  {pool.depositToken}
                </p>
              </div>
              <div>
                <p className="text-gray-400">24h Volume</p>
                <p className="text-white font-medium">{pool.volume24h}</p>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <p className="text-gray-400">Cycle Status</p>
                <p className="text-white font-medium">12h remaining</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Positions */}
        <Card className="bg-white/10 border-gray-800 rounded-lg">
          <CardHeader className="p-4 border-b border-gray-800">
            <CardTitle className="text-xl font-semibold text-white">
              User Positions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <p className="text-gray-400">No positions available</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PoolDetails;
