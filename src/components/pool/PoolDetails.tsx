import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/BaseComponents";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/BaseComponents";
import { Input } from "@/components/ui/BaseComponents";
import { ArrowUpDown, Wallet } from "lucide-react";
import { TradingViewWidget } from "./TradingViewComponent";

const PoolDetails = () => {
  const [depositAmount, setDepositAmount] = useState("");
  const [redeemAmount, setRedeemAmount] = useState("");

  return (
    <div className="w-full max-w-6xl mx-auto p-6 py-24 space-y-6">
      {/* Header Section */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Tesla, Inc. (TSLA)</h1>
          <p className="text-xl">
            $650.75 <span className="text-green-500">+2.5%</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Pool Status</p>
          <p className="text-lg font-medium text-green-500">ACTIVE</p>
          <p className="text-sm text-gray-500">Cycle #12</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Pool Stats */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Price History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <TradingViewWidget symbol="NASDAQ:TSLA" />
            </div>
          </CardContent>
        </Card>

        {/* Right Column - Pool Info */}
        <Card>
          <CardHeader>
            <CardTitle>Pool Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-500">Deposit Token</span>
              <span className="font-medium">USDC</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">24h Volume</span>
              <span className="font-medium">$1.2B</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Cycle Status</span>
              <span className="font-medium">12h remaining</span>
            </div>
          </CardContent>
        </Card>

        {/* Actions Section */}
        <Card className="col-span-1 lg:col-span-3">
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold">Deposit</h3>
                    <p className="text-sm text-gray-500">
                      Deposit USDC to earn TSLA
                    </p>
                  </div>
                  <Wallet size={24} />
                </div>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                />
                <div className="flex justify-between">
                  <Button variant="outline" className="flex-1">
                    Max
                  </Button>
                  <Button className="flex-1">Deposit</Button>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold">Redeem</h3>
                    <p className="text-sm text-gray-500">
                      Redeem TSLA to withdraw USDC
                    </p>
                  </div>
                  <ArrowUpDown size={24} />
                </div>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={redeemAmount}
                  onChange={(e) => setRedeemAmount(e.target.value)}
                />
                <div className="flex justify-between">
                  <Button variant="outline" className="flex-1">
                    Max
                  </Button>
                  <Button className="flex-1">Redeem</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PoolDetails;
