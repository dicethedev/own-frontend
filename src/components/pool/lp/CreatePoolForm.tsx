import React, { useEffect, useState } from "react";
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
import { AlertCircle, CheckCircle2, Loader2, Info } from "lucide-react";
import { useChainId } from "wagmi";
import { useRouter } from "next/navigation";

const FormField = ({
  label,
  error,
  children,
  tooltip,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  tooltip?: string;
}) => (
  <div className="space-y-1.5">
    <div className="flex items-center space-x-2">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
      {tooltip && (
        <div className="group relative">
          <Info className="h-4 w-4 text-gray-400 hover:text-gray-500 cursor-help" />
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-2 bg-gray-900 text-white text-xs rounded shadow-lg">
            {tooltip}
          </div>
        </div>
      )}
    </div>
    {children}
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
);

const CreatePoolForm = () => {
  const chainId = useChainId();
  const router = useRouter();
  const { create, isOwner, isLoading, isSuccess, error, createdPoolAddress } =
    useCreatePool(chainId);

  const [formData, setFormData] = useState({
    depositToken: "",
    assetSymbol: "",
    oracle: "",
    poolStrategy: "",
  });

  const [formErrors, setFormErrors] = useState({
    depositToken: "",
    assetSymbol: "",
    oracle: "",
    poolStrategy: "",
  });

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  useEffect(() => {
    if (isSuccess && createdPoolAddress) {
      router.push("/lp");
    }
  }, [isSuccess, createdPoolAddress, router]);

  const validateForm = () => {
    const errors = {
      depositToken: "",
      assetSymbol: "",
      oracle: "",
      poolStrategy: "",
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

    // Validate asset symbol
    if (!formData.assetSymbol.trim()) {
      errors.assetSymbol = "Asset symbol is required";
      isValid = false;
    }

    if (!formData.poolStrategy) {
      errors.poolStrategy = "Pool Strategy address is required";
      isValid = false;
    } else if (!isAddress(formData.poolStrategy)) {
      errors.poolStrategy = "Invalid address format";
      isValid = false;
    } else if (
      formData.poolStrategy === "0x0000000000000000000000000000000000000000"
    ) {
      errors.poolStrategy = "Cannot use zero address";
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHasAttemptedSubmit(true);
    setSubmitError(null);
    if (!validateForm()) return;

    try {
      await create({
        depositToken: formData.depositToken as Address,
        assetSymbol: formData.assetSymbol,
        oracle: formData.oracle as Address,
        poolStrategy: formData.poolStrategy as Address,
      });
    } catch (err) {
      setSubmitError(error?.message || "Error creating pool");
      console.error("Error creating pool:", err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (hasAttemptedSubmit) {
      setSubmitError(null);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto pt-12 pb-6 sm:py-12 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
      <CardHeader className="space-y-1 p-6">
        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Create New Pool
        </CardTitle>
        <p className="text-sm text-gray-300 dark:text-gray-400">
          Configure your pool parameters below
        </p>
      </CardHeader>

      <CardContent className="p-6 pt-0">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              label="Deposit Token"
              error={formErrors.depositToken}
              tooltip="The token that users will deposit into the pool"
            >
              <Input
                id="depositToken"
                name="depositToken"
                value={formData.depositToken}
                onChange={handleInputChange}
                placeholder="0x..."
                className={`${
                  formErrors.depositToken ? "border-red-500" : ""
                } bg-white/50 dark:bg-gray-800/50 transition-colors focus:ring-2 focus:ring-blue-500`}
              />
            </FormField>

            <FormField
              label="Oracle Address"
              error={formErrors.oracle}
              tooltip="Price feed oracle contract address"
            >
              <Input
                id="oracle"
                name="oracle"
                value={formData.oracle}
                onChange={handleInputChange}
                placeholder="0x..."
                className={`${
                  formErrors.oracle ? "border-red-500" : ""
                } bg-white/50 dark:bg-gray-800/50 transition-colors focus:ring-2 focus:ring-blue-500`}
              />
            </FormField>

            <FormField
              label="Asset Symbol"
              error={formErrors.assetSymbol}
              tooltip="Trading symbol for your asset"
            >
              <Input
                id="assetSymbol"
                name="assetSymbol"
                value={formData.assetSymbol}
                onChange={handleInputChange}
                placeholder="e.g., xTSLA"
                className={`${
                  formErrors.assetSymbol ? "border-red-500" : ""
                } bg-white/50 dark:bg-gray-800/50 transition-colors focus:ring-2 focus:ring-blue-500`}
              />
            </FormField>

            <FormField
              label="Pool Strategy Address"
              error={formErrors.poolStrategy}
              tooltip="Address of the pool strategy contract"
            >
              <Input
                id="poolStrategy"
                name="poolStrategy"
                value={formData.poolStrategy}
                onChange={handleInputChange}
                placeholder="0x..."
                className={`${
                  formErrors.poolStrategy ? "border-red-500" : ""
                } bg-white/50 dark:bg-gray-800/50 transition-colors focus:ring-2 focus:ring-blue-500`}
              />
            </FormField>
          </div>

          <div className="pt-4">
            <Button
              type="submit"
              className={`w-full relative overflow-hidden transition-all duration-300 ${
                !isOwner || isLoading
                  ? "bg-gray-400"
                  : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              }`}
              disabled={!isOwner || isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Pool...
                </div>
              ) : (
                "Create Pool"
              )}
            </Button>
          </div>

          {/* Status Messages */}
          <div className="space-y-2">
            {!isOwner && (
              <div className="flex items-center p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg">
                <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="text-sm">
                  Only authorized addresses can create pools
                </span>
              </div>
            )}

            {hasAttemptedSubmit && submitError && (
              <div className="flex items-center p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg">
                <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="text-sm">{submitError}</span>
              </div>
            )}

            {isSuccess && createdPoolAddress && (
              <div className="flex items-center p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg">
                <CheckCircle2 className="h-4 w-4 mr-2 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium">Pool created successfully!</p>
                  <p className="text-xs mt-1 break-all">
                    Address: {createdPoolAddress}
                  </p>
                </div>
              </div>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreatePoolForm;
