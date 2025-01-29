import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/BaseComponents";
import { Button } from "@/components/ui/BaseComponents";
import { Input } from "@/components/ui/BaseComponents";

// Define the pool interface
interface Pool {
  assetSymbol: string;
  depositToken: string;
  cycleLength: number;
  cycleState: string;
  xTokenSupply: string | number;
}

// Define prop types for components
interface PoolCardProps {
  pool: Pool;
}

interface DepositFormProps {
  onDeposit: (amount: string) => void;
}

interface RedemptionFormProps {
  onRedeem: (amount: string) => void;
}

interface LPRegistrationFormProps {
  onRegister: (amount: string) => void;
}

const trimAddress = (address: string): string => {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

// Base Pool Card component for displaying pool information
const PoolCard: React.FC<PoolCardProps> = ({ pool }) => {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Pool: {pool.assetSymbol}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Deposit Token:</span>
            <span className="font-mono">{trimAddress(pool.depositToken)}</span>
          </div>
          <div className="flex justify-between">
            <span>Cycle Length:</span>
            <span>{pool.cycleLength} seconds</span>
          </div>
          <div className="flex justify-between">
            <span>Current State:</span>
            <span>{pool.cycleState}</span>
          </div>
          <div className="flex justify-between">
            <span>Total Supply:</span>
            <span>{pool.xTokenSupply}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Component for handling deposits
const DepositForm: React.FC<DepositFormProps> = ({ onDeposit }) => {
  const [amount, setAmount] = React.useState<string>("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onDeposit(amount);
    setAmount("");
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Deposit</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Input
              type="number"
              value={amount}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setAmount(e.target.value)
              }
              placeholder="Amount to deposit"
              min="0"
              step="any"
              className="w-full"
            />
          </div>
          <Button type="submit" className="w-full">
            Submit Deposit
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

// Component for handling redemptions
const RedemptionForm: React.FC<RedemptionFormProps> = ({ onRedeem }) => {
  const [amount, setAmount] = React.useState<string>("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRedeem(amount);
    setAmount("");
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Redeem</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Input
              type="number"
              value={amount}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setAmount(e.target.value)
              }
              placeholder="Amount to redeem"
              min="0"
              step="any"
              className="w-full"
            />
          </div>
          <Button type="submit" className="w-full">
            Submit Redemption
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

// LP Registration component
const LPRegistrationForm: React.FC<LPRegistrationFormProps> = ({
  onRegister,
}) => {
  const [liquidityAmount, setLiquidityAmount] = React.useState<string>("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRegister(liquidityAmount);
    setLiquidityAmount("");
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Register as LP</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Input
              type="number"
              value={liquidityAmount}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setLiquidityAmount(e.target.value)
              }
              placeholder="Initial liquidity amount"
              min="0"
              step="any"
              className="w-full"
            />
          </div>
          <Button type="submit" className="w-full">
            Register
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export { PoolCard, DepositForm, RedemptionForm, LPRegistrationForm };
export type {
  Pool,
  PoolCardProps,
  DepositFormProps,
  RedemptionFormProps,
  LPRegistrationFormProps,
};
