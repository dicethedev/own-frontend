import React, { useState } from "react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
} from "@/components/ui/BaseComponents";
import { useCreatePool } from "@/hooks/poolFactory";
import { Address, isAddress } from "viem";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useChainId } from "wagmi";

const CreatePoolForm = () => {
  const chainId = useChainId();

  const { create, isOwner, isLoading, isSuccess, error, createdPoolAddress } =
    useCreatePool(chainId);

  const [formData, setFormData] = useState({
    depositToken: "",
    assetName: "",
    assetSymbol: "",
    oracle: "",
    cycleLength: "",
    rebalanceLength: "",
  });

  const [formErrors, setFormErrors] = useState({
    depositToken: "",
    assetName: "",
    assetSymbol: "",
    oracle: "",
    cycleLength: "",
    rebalanceLength: "",
  });

  const validateForm = () => {
    const errors = {
      depositToken: "",
      assetName: "",
      assetSymbol: "",
      oracle: "",
      cycleLength: "",
      rebalanceLength: "",
    };
    let isValid = true;

    // Validate deposit token address
    if (!formData.depositToken) {
      errors.depositToken = "Deposit token address is required";
      isValid = false;
    } else if (!isAddress(formData.depositToken)) {
      errors.depositToken = "Invalid address format";
      isValid = false;
    } else if (
      formData.depositToken === "0x0000000000000000000000000000000000000000"
    ) {
      errors.depositToken = "Cannot use zero address";
      isValid = false;
    }

    // Validate oracle address
    if (!formData.oracle) {
      errors.oracle = "Oracle address is required";
      isValid = false;
    } else if (!isAddress(formData.oracle)) {
      errors.oracle = "Invalid address format";
      isValid = false;
    } else if (
      formData.oracle === "0x0000000000000000000000000000000000000000"
    ) {
      errors.oracle = "Cannot use zero address";
      isValid = false;
    }

    // Validate asset name
    if (!formData.assetName.trim()) {
      errors.assetName = "Asset name is required";
      isValid = false;
    }

    // Validate asset symbol
    if (!formData.assetSymbol.trim()) {
      errors.assetSymbol = "Asset symbol is required";
      isValid = false;
    }

    // Validate cycle length
    if (!formData.cycleLength) {
      errors.cycleLength = "Cycle length is required";
      isValid = false;
    } else if (Number(formData.cycleLength) <= 0) {
      errors.cycleLength = "Cycle length must be greater than 0";
      isValid = false;
    }

    // Validate rebalance length
    if (!formData.rebalanceLength) {
      errors.rebalanceLength = "Rebalance length is required";
      isValid = false;
    } else if (Number(formData.rebalanceLength) <= 0) {
      errors.rebalanceLength = "Rebalance length must be greater than 0";
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      await create({
        depositToken: formData.depositToken as Address,
        assetName: formData.assetName,
        assetSymbol: formData.assetSymbol,
        oracle: formData.oracle as Address,
        cycleLength: BigInt(formData.cycleLength),
        rebalanceLength: BigInt(formData.rebalanceLength),
      });
    } catch (err) {
      console.error("Error creating pool:", err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto pt-20 pb-6 sm:py-24 space-y-4 sm:space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold">
        <CardTitle>Create New Pool</CardTitle>
      </h1>
      <h3>Enter the details to create a new pool</h3>
      <CardContent className="p-2">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="text-sm font-medium">Deposit Token Address </div>
            <Input
              id="depositToken"
              name="depositToken"
              value={formData.depositToken}
              onChange={handleInputChange}
              placeholder="0x..."
              className={formErrors.depositToken ? "border-red-500" : ""}
            />
            {formErrors.depositToken && (
              <p className="text-sm text-red-500">{formErrors.depositToken}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">Asset Name</div>
            <Input
              id="assetName"
              name="assetName"
              value={formData.assetName}
              onChange={handleInputChange}
              placeholder="e.g., xTSLA."
              className={formErrors.assetName ? "border-red-500" : ""}
            />
            {formErrors.assetName && (
              <p className="text-sm text-red-500">{formErrors.assetName}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">Asset Symbol</div>
            <Input
              id="assetSymbol"
              name="assetSymbol"
              value={formData.assetSymbol}
              onChange={handleInputChange}
              placeholder="e.g., xTSLA"
              className={formErrors.assetSymbol ? "border-red-500" : ""}
            />
            {formErrors.assetSymbol && (
              <p className="text-sm text-red-500">{formErrors.assetSymbol}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">Oracle Address</div>
            <Input
              id="oracle"
              name="oracle"
              value={formData.oracle}
              onChange={handleInputChange}
              placeholder="0x..."
              className={formErrors.oracle ? "border-red-500" : ""}
            />
            {formErrors.oracle && (
              <p className="text-sm text-red-500">{formErrors.oracle}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">Cycle Length (in seconds)</div>
            <Input
              id="cycleLength"
              name="cycleLength"
              type="number"
              value={formData.cycleLength}
              onChange={handleInputChange}
              placeholder="Enter cycle length"
              className={formErrors.cycleLength ? "border-red-500" : ""}
            />
            {formErrors.cycleLength && (
              <p className="text-sm text-red-500">{formErrors.cycleLength}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">
              Rebalance Length (in seconds)
            </div>
            <Input
              id="rebalanceLength"
              name="rebalanceLength"
              type="number"
              value={formData.rebalanceLength}
              onChange={handleInputChange}
              placeholder="Enter rebalance length"
              className={formErrors.rebalanceLength ? "border-red-500" : ""}
            />
            {formErrors.rebalanceLength && (
              <p className="text-sm text-red-500">
                {formErrors.rebalanceLength}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={!isOwner || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Pool...
              </>
            ) : (
              "Create Pool"
            )}
          </Button>

          {!isOwner && (
            <div className="mt-2 flex items-center text-red-500 text-sm">
              <AlertCircle className="h-4 w-4 mr-2" />
              Only authorized addresses can create pools
            </div>
          )}
          {isOwner && error && (
            <div className="mt-2 flex items-center text-red-500 text-sm">
              <AlertCircle className="h-4 w-4 mr-2" />
              {error.message || "Error creating pool"}
            </div>
          )}

          {isSuccess && createdPoolAddress && (
            <div className="mt-2 flex items-center text-green-500 text-sm">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Pool created successfully at: {createdPoolAddress}
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
};

export default CreatePoolForm;
