"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Input, Button, Card, CardContent, CardHeader, CardTitle } from "@/components/ui/BaseComponents";
import { FormField } from "@/components/FormField";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Abi, Address, formatUnits, parseUnits } from "viem";
import { getTokenDetailsFromAddress, TOKEN_PAIRS } from "./utils";
import { config } from "@/config/wagmi";
import { CreatePoolConfig } from "@/types/uniswap";
import { useUniswapContract } from "@/hooks/useUniswapContract";
import { Pool, Position } from "@uniswap/v4-sdk";
import { MintOptions, nearestUsableTick } from "@uniswap/v3-sdk";
import { getPoolId } from "./utils";
import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useChainId, useBlock, useAccount } from "wagmi";
import { readContract } from "wagmi/actions";
import { StateViewABIBase } from "@/config/abis/StateViewABIBase";
import PoolManagerABI from "@/config/abis/uniswap/PoolManager.json";
import PositionManagerABI from "@/config/abis/uniswap/PositionManager.json";
import { Token, Percent } from "@uniswap/sdk-core";
import { V4PositionManager } from "@uniswap/v4-sdk";
import { Permit2ABIBase } from "@/config/abis/Permit2ABIBase";
import { erc20ABI } from "@/config/abis/erc20";
import toast from "react-hot-toast";
import { getTxnExplorerUrl } from "@/utils/explorer";

const CreatePool: React.FC = () => {
    const [formData, setFormData] = useState({
        selectedPair: "",
        fee: "3000",
        tickSpacing: "60",
        startingPrice: "1",
        hooks: "0x0000000000000000000000000000000000000000",
    });

    const [formErrors, setFormErrors] = useState({
        selectedPair: "",
        fee: "",
        tickSpacing: "",
        startingPrice: "",
        hooks: "",
    });

    const [isLoading, setIsLoading] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const [tokenSymbols, setTokenSymbols] = useState({
        currency0: "",
        currency1: "",
    });
    const [tokenDecimals, setTokenDecimals] = useState({
        currency0: "",
        currency1: "",
    });
    const [tokenNames, setTokenNames] = useState({
        currency0: "",
        currency1: "",
    });
    const [isLoadingSymbols, setIsLoadingSymbols] = useState({
        currency0: false,
        currency1: false,
    });

    const [poolId, setPoolId] = useState<string | null>(null);
    const [isCreatingPool, setIsCreatingPool] = useState(false);
    const [isAddingLiquidity, setIsAddingLiquidity] = useState(false);
    const [poolExists, setPoolExists] = useState<boolean | null>(null);
    const [isCheckingPool, setIsCheckingPool] = useState(false);

    // Remove stepper state - everything on one page
    const [depositAmounts, setDepositAmounts] = useState({
        currency0: "",
        currency1: "",
    });
    const [tokenBalances, setTokenBalances] = useState({
        currency0: "0",
        currency1: "0",
    });

    // Move hooks to component level
    const poolManagerContractAddress = useUniswapContract("poolManager");
    const stateViewContractAddress = useUniswapContract("stateView");
    const permit2Address = useUniswapContract("permit2");
    const positionManagerAddress = useUniswapContract("positionManager");

    const { address } = useAccount();
    const chainId = useChainId();
    const { data: currentBlock } = useBlock();
    const { writeContractAsync } = useWriteContract();

    // Check if pool exists when poolId is available
    const { refetch: refetchSlot0 } = useReadContract({
        address: stateViewContractAddress as `0x${string}`,
        abi: StateViewABIBase,
        functionName: "getSlot0",
        args: poolId ? [poolId as `0x${string}`] : undefined,
        query: {
            enabled: !!poolId && !!stateViewContractAddress,
        }
    });


    // get liquidity
    const { refetch: refetchLiquidity } = useReadContract({
        address: stateViewContractAddress as `0x${string}`,
        abi: StateViewABIBase,
        functionName: "getLiquidity",
        args: poolId ? [poolId as `0x${string}`] : undefined,
        query: {
            enabled: !!poolId && !!stateViewContractAddress,
        }
    });

    // Separate writeContract hooks for pool creation and liquidity addition
    const { writeContract: writePoolContract, data: poolHash } = useWriteContract();
    const { writeContract: writeLiquidityContract, data: liquidityHash } = useWriteContract();

    // Track pool creation transaction
    const { data: poolReceipt, isPending: isPoolReceiptPending } = useWaitForTransactionReceipt({
        hash: poolHash,
    });

    // Track liquidity addition transaction
    const { data: liquidityReceipt, isPending: isLiquidityReceiptPending } = useWaitForTransactionReceipt({
        hash: liquidityHash,
    });

    const validateForm = () => {
        const errors = {
            selectedPair: "",
            fee: "",
            tickSpacing: "",
            startingPrice: "",
            hooks: "",
        };
        let isValid = true;

        // Validate selected pair
        if (!formData.selectedPair) {
            errors.selectedPair = "Token pair selection is required";
            isValid = false;
        }

        // Validate fee
        if (!formData.fee) {
            errors.fee = "Fee is required";
            isValid = false;
        } else {
            const fee = parseInt(formData.fee);

            const validFees = [100, 500, 3000, 10000];
            if (isNaN(fee) || fee <= 0) {
                errors.fee = "Fee must be a positive number";
                isValid = false;
            } else if (!validFees.includes(fee)) {
                errors.fee = `Fee must be one of: ${validFees.join(", ")} basis points`;
                isValid = false;
            }
        }

        // Validate tick spacing
        if (!formData.tickSpacing) {
            errors.tickSpacing = "Tick spacing is required";
            isValid = false;
        } else {
            const tickSpacing = parseInt(formData.tickSpacing);
            if (isNaN(tickSpacing) || tickSpacing <= 0) {
                errors.tickSpacing = "Tick spacing must be a positive integer";
                isValid = false;
            }
        }

        // Validate starting price
        if (!formData.startingPrice) {
            errors.startingPrice = "Starting price is required";
            isValid = false;
        } else {
            const price = parseFloat(formData.startingPrice);
            if (isNaN(price) || price <= 0) {
                errors.startingPrice = "Starting price must be a positive number";
                isValid = false;
            } else if (price < 0.000001 || price > 1000000) {
                errors.startingPrice = "Starting price must be between 0.000001 and 1,000,000";
                isValid = false;
            }
        }

        setFormErrors(errors);
        return isValid;
    };

    const calculateSqrtPriceX96 = (startingPrice: number) => {
        if (!startingPrice || startingPrice <= 0) {
            return "79228162514264337593543950336"; // 1:1 price (sqrt(1) * 2^96)
        }

        try {
            // Clamp price to reasonable bounds to avoid PRICE_BOUNDS error
            const minPrice = 0.000001; // 1e-6
            const maxPrice = 1000000; // 1e6
            const clampedPrice = Math.max(minPrice, Math.min(maxPrice, startingPrice));

            // Convert to string to avoid floating point precision issues
            const priceStr = clampedPrice.toString();
            const [integerPart, decimalPart = ''] = priceStr.split('.');

            // Calculate the number of decimal places
            const decimalPlaces = decimalPart.length;

            // Convert to integer by multiplying by 10^decimalPlaces
            const priceInteger = BigInt(integerPart + decimalPart.padEnd(decimalPlaces, '0'));

            // Calculate sqrt(price) * 2^96 using BigInt arithmetic
            const Q96 = BigInt(2) ** BigInt(96);
            const decimalScale = BigInt(10) ** BigInt(decimalPlaces);

            // sqrt(price) = sqrt(priceInteger) / sqrt(decimalScale)
            // sqrt(price) * 2^96 = (sqrt(priceInteger) * 2^96) / sqrt(decimalScale)
            const sqrtPriceInteger = sqrt(priceInteger);
            const sqrtDecimalScale = sqrt(decimalScale);

            const sqrtPriceX96 = (sqrtPriceInteger * Q96) / sqrtDecimalScale;

            // Ensure the result is within valid bounds
            const MIN_SQRT_PRICE = BigInt("4295128739"); // sqrt(1.0001^-887272) * 2^96
            const MAX_SQRT_PRICE = BigInt("1461446703485210103287273052203988822378723970342"); // sqrt(1.0001^887272) * 2^96

            const boundedSqrtPriceX96 = sqrtPriceX96 < MIN_SQRT_PRICE ? MIN_SQRT_PRICE :
                sqrtPriceX96 > MAX_SQRT_PRICE ? MAX_SQRT_PRICE : sqrtPriceX96;
            console.log("boundedSqrtPriceX96", boundedSqrtPriceX96);
            return boundedSqrtPriceX96.toString();
        } catch (error) {
            console.error("Error calculating sqrtPriceX96:", error);
            return "79228162514264337593543950336"; // Fallback to 1:1 price
        }
    };

    // Helper function to calculate square root using BigInt (Newton's method)
    const sqrt = (value: bigint): bigint => {
        if (value < 0n) throw new Error("Square root of negative number");
        if (value < 2n) return value;

        let x = value;
        let y = (x + value / x) / 2n;

        while (y < x) {
            x = y;
            y = (x + value / x) / 2n;
        }

        return x;
    };

    const validatePoolKey = (poolKey: CreatePoolConfig['poolKey']) => {
        // Check if currencies are sorted (currency0 < currency1)
        const currency0BigInt = BigInt(poolKey.currency0);
        const currency1BigInt = BigInt(poolKey.currency1);

        if (currency0BigInt >= currency1BigInt) {
            throw new Error("Currencies must be sorted: currency0 < currency1");
        }

        // Validate fee (should be a valid fee tier)
        const validFees = [100, 500, 3000, 10000]; // Standard Uniswap V4 fee tiers
        if (!validFees.includes(poolKey.fee)) {
            throw new Error(`Invalid fee tier: ${poolKey.fee}. Valid fees are: ${validFees.join(", ")}`);
        }

        // Validate tick spacing
        if (parseInt(poolKey.tickSpacing) <= 0) {
            throw new Error("Tick spacing must be positive");
        }

        return true;
    }

    // Permit2 approval functions
    const approveERC20ForPermit2 = async (tokenAddress: string) => {
        const MAX_UINT256 = (1n << 256n) - 1n; // 2^256 - 1
        try {
            const txHash = await writeContractAsync({
                address: tokenAddress as `0x${string}`,
                abi: erc20ABI,
                functionName: "approve",
                args: [permit2Address as `0x${string}`, MAX_UINT256],
            });
            return txHash;
        } catch (error) {
            console.error("Error approving ERC20 for Permit2:", error);
            throw error;
        }
    };

    const approvePermit2ForPositionManager = async (tokenAddress: string) => {
        const oneYear = 365 * 24 * 60 * 60; // 1 year in seconds
        const deadline = BigInt(Math.floor(Date.now() / 1000) + oneYear);
        const MAX_UINT160 = (1n << 160n) - 1n;

        try {
            const txHash = await writeContractAsync({
                address: permit2Address as `0x${string}`,
                abi: Permit2ABIBase,
                functionName: "approve",
                args: [
                    tokenAddress,
                    positionManagerAddress,
                    MAX_UINT160,
                    deadline,
                ],
            });
            return txHash;
        } catch (error) {
            console.error("Error approving Permit2 for PositionManager:", error);
            throw error;
        }
    };

    const checkTokenApprovals = async (tokenAddress: string, tokenDecimals: string) => {
        try {
            // Check ERC20 allowance for Permit2
            const erc20Allowance = await readContract(config, {
                address: tokenAddress as `0x${string}`,
                abi: erc20ABI,
                functionName: "allowance",
                args: [address!, permit2Address as `0x${string}`],
            });

            // Check Permit2 allowance for PositionManager
            const permit2Allowance = await readContract(config, {
                address: permit2Address as `0x${string}`,
                abi: Permit2ABIBase,
                functionName: "allowance",
                args: [address!, tokenAddress, positionManagerAddress],
            });

            // permit2 expiration is in epoch time - it's an array [amount, expiration, nonce]
            const permit2Expiration = (permit2Allowance as [bigint, bigint, bigint])[1];
            const permit2ExpirationDate = new Date(Number(permit2Expiration) * 1000);

            let permit2Approved = false;
            if (permit2ExpirationDate < new Date()) {
                permit2Approved = false;
            } else {
                permit2Approved = true;
            }

            return {
                erc20Approved: formatUnits(erc20Allowance, parseInt(tokenDecimals)),
                erc20AllowanceRaw: erc20Allowance,
                permit2Approved: permit2Approved,
            };
        } catch (error) {
            console.error("Error checking token approvals:", error);
            return { erc20Approved: "0", erc20AllowanceRaw: 0n, permit2Approved: false };
        }
    };

    const checkIfPoolExists = async (poolId: string) => {
        try {
            const slot0 = await readContract(config, {
                address: stateViewContractAddress as `0x${string}`,
                abi: StateViewABIBase as Abi,
                functionName: "getSlot0",
                args: [poolId as `0x${string}`],
            });
            return slot0;
        } catch (error) {
            console.error("Error checking if pool exists:", error);
            return false;
        }
    }

    // Shared utility function to create pool configuration
    const createPoolConfiguration = () => {
        if (!formData.selectedPair) {
            throw new Error("Please select a token pair first");
        }

        const selectedPair = TOKEN_PAIRS[parseInt(formData.selectedPair)];
        if (!selectedPair) {
            throw new Error("Invalid token pair selected");
        }

        const sortedPoolConfig = {
            currency0: "",
            currency1: "",
            depositAmounts0: "",
            depositAmounts1: "",
            decimals0: "",
            decimals1: "",
            tokenSymbols0: "",
            tokenSymbols1: "",
            tokenNames0: "",
            tokenNames1: "",
            startingPrice: "",
            wasSorted: false
        };

        if (BigInt(selectedPair.currency0) < BigInt(selectedPair.currency1)) {
            sortedPoolConfig.currency0 = selectedPair.currency0;
            sortedPoolConfig.currency1 = selectedPair.currency1;
            sortedPoolConfig.depositAmounts0 = depositAmounts.currency0;
            sortedPoolConfig.depositAmounts1 = depositAmounts.currency1;
            sortedPoolConfig.decimals0 = tokenDecimals.currency0;
            sortedPoolConfig.decimals1 = tokenDecimals.currency1;
            sortedPoolConfig.tokenSymbols0 = tokenSymbols.currency0;
            sortedPoolConfig.tokenSymbols1 = tokenSymbols.currency1;
            sortedPoolConfig.tokenNames0 = tokenNames.currency0;
            sortedPoolConfig.tokenNames1 = tokenNames.currency1;
            sortedPoolConfig.startingPrice = calculateSqrtPriceX96(parseFloat(formData.startingPrice));
            sortedPoolConfig.wasSorted = false;
        } else {
            sortedPoolConfig.currency0 = selectedPair.currency1;
            sortedPoolConfig.currency1 = selectedPair.currency0;
            sortedPoolConfig.depositAmounts0 = depositAmounts.currency1;
            sortedPoolConfig.depositAmounts1 = depositAmounts.currency0;
            sortedPoolConfig.decimals0 = tokenDecimals.currency1;
            sortedPoolConfig.decimals1 = tokenDecimals.currency0;
            sortedPoolConfig.tokenSymbols0 = tokenSymbols.currency1;
            sortedPoolConfig.tokenSymbols1 = tokenSymbols.currency0;
            sortedPoolConfig.tokenNames0 = tokenNames.currency1;
            sortedPoolConfig.tokenNames1 = tokenNames.currency0;
            sortedPoolConfig.startingPrice = calculateSqrtPriceX96(1 / parseFloat(formData.startingPrice));
            sortedPoolConfig.wasSorted = true;
        }

        const poolConfig: CreatePoolConfig = {
            poolKey: {
                currency0: sortedPoolConfig.currency0 as Address,
                currency1: sortedPoolConfig.currency1 as Address,
                fee: parseInt(formData.fee),
                tickSpacing: formData.tickSpacing,
                hooks: formData.hooks as Address || "0x0000000000000000000000000000000000000000",
                startingPrice: sortedPoolConfig.startingPrice,
            },
        };

        const calculatedPoolId = getPoolId({
            currency0: poolConfig.poolKey.currency0,
            currency1: poolConfig.poolKey.currency1,
            fee: poolConfig.poolKey.fee,
            tickSpacing: parseInt(poolConfig.poolKey.tickSpacing),
            hooks: poolConfig.poolKey.hooks
        });

        return {
            selectedPair,
            sortedPoolConfig,
            poolConfig,
            calculatedPoolId
        };
    }

    const handleCheckPool = async () => {
        try {
            const { poolConfig, calculatedPoolId } = createPoolConfiguration();
            validatePoolKey(poolConfig.poolKey);
            setIsCheckingPool(true);

            setPoolId(calculatedPoolId);
            const slot0 = await checkIfPoolExists(calculatedPoolId);
            if (slot0 && Array.isArray(slot0) && slot0[0] !== 0n) {
                setPoolExists(true);
            } else {
                setPoolExists(false);
            }
        } catch (error) {
            setSubmitError(error instanceof Error ? error.message : "Error checking pool");
        } finally {
            setIsCheckingPool(false);
        }
    }
    const handleCreatePool = async () => {
        try {
            const { poolConfig, sortedPoolConfig } = createPoolConfiguration();
            if (!depositAmounts.currency0 || !depositAmounts.currency1) {
                setSubmitError("Please enter deposit amounts for both tokens");
                return;
            }

            if (!formData.startingPrice) {
                setSubmitError("Please enter a starting price");
                return;
            }

            setIsCreatingPool(true);

            // Check token balances first
            const [balance0, balance1] = await Promise.all([
                readContract(config, {
                    address: poolConfig.poolKey.currency0 as `0x${string}`,
                    abi: erc20ABI,
                    functionName: "balanceOf",
                    args: [address!],
                }),
                readContract(config, {
                    address: poolConfig.poolKey.currency1 as `0x${string}`,
                    abi: erc20ABI,
                    functionName: "balanceOf",
                    args: [address!],
                })
            ]);

            // Check if user has sufficient balance
            const amount0 = parseUnits(sortedPoolConfig.depositAmounts0, parseInt(sortedPoolConfig.decimals0));
            const amount1 = parseUnits(sortedPoolConfig.depositAmounts1, parseInt(sortedPoolConfig.decimals1));

            if (balance0 < amount0) {
                setSubmitError(`Insufficient ${sortedPoolConfig.tokenSymbols0} balance. Required: ${formatBalance(amount0, sortedPoolConfig.decimals0)}, Available: ${formatBalance(balance0, sortedPoolConfig.decimals0)}`);
                return;
            }if (balance1 < amount1) {
                setSubmitError(`Insufficient ${sortedPoolConfig.tokenSymbols1} balance. Required: ${formatBalance(amount1, sortedPoolConfig.decimals1)}, Available: ${formatBalance(balance1, sortedPoolConfig.decimals1)}`);
                return;
            }

            // Check and handle token approvals for both currencies
            const currency0Approvals = await checkTokenApprovals(poolConfig.poolKey.currency0, sortedPoolConfig.decimals0);
            const currency1Approvals = await checkTokenApprovals(poolConfig.poolKey.currency1, sortedPoolConfig.decimals1);

            // Approve ERC20 for Permit2 if needed
            const amount0ForApproval = parseUnits(sortedPoolConfig.depositAmounts0, parseInt(sortedPoolConfig.decimals0));
            if (currency0Approvals.erc20AllowanceRaw < amount0ForApproval) {
                await approveERC20ForPermit2(poolConfig.poolKey.currency0);
            }const amount1ForApproval = parseUnits(sortedPoolConfig.depositAmounts1, parseInt(sortedPoolConfig.decimals1));
            if (currency1Approvals.erc20AllowanceRaw < amount1ForApproval) {
                await approveERC20ForPermit2(poolConfig.poolKey.currency1);
            }

            await approveERC20ForPermit2(poolConfig.poolKey.currency0);
            await approveERC20ForPermit2(poolConfig.poolKey.currency1);

            // Approve Permit2 for PositionManager if needed
            if (!currency0Approvals.permit2Approved) {
                await approvePermit2ForPositionManager(poolConfig.poolKey.currency0);
            }if (!currency1Approvals.permit2Approved) {
                await approvePermit2ForPositionManager(poolConfig.poolKey.currency1);
            }

            // Now create the pool
            const poolKeyTuple = [
                poolConfig.poolKey.currency0,
                poolConfig.poolKey.currency1,
                poolConfig.poolKey.fee,
                poolConfig.poolKey.tickSpacing,
                poolConfig.poolKey.hooks,
            ];

            console.log("poolKeyTuple", poolKeyTuple);
            console.log("poolConfig.poolKey.startingPrice", poolConfig.poolKey.startingPrice);

            const createPoolTx = writePoolContract({
                address: poolManagerContractAddress as `0x${string}`,
                abi: PoolManagerABI.abi,
                functionName: "initialize",
                args: [poolKeyTuple, poolConfig.poolKey.startingPrice],
            });
            console.log("createPoolTx", createPoolTx);

        } catch (error) {
            setSubmitError(error instanceof Error ? error.message : "Error creating pool");
            setIsCreatingPool(false);
        }
    }

    const handleAddLiquidity = async () => {
        try {
            const { poolConfig, sortedPoolConfig } = createPoolConfiguration();
            if (!validateForm()) {
                return;
            }

            setIsAddingLiquidity(true);

            const calculatedPoolId = getPoolId({
                currency0: poolConfig.poolKey.currency0,
                currency1: poolConfig.poolKey.currency1,
                fee: poolConfig.poolKey.fee,
                tickSpacing: parseInt(poolConfig.poolKey.tickSpacing),
                hooks: poolConfig.poolKey.hooks
            });

            setPoolId(calculatedPoolId);

            // wait for 10 seconds
            await new Promise(resolve => setTimeout(resolve, 5000));

            // Refetch the slot0 data and wait for the result
            const { data: refetchedSlot0 } = await refetchSlot0();
            const { data: refetchedLiquidity } = await refetchLiquidity();

            console.log("Calculated Pool ID", calculatedPoolId);
            console.log("calculatedPoolId", calculatedPoolId);
            console.log("refetchedSlot0", refetchedSlot0);
            console.log("refetchedLiquidity", refetchedLiquidity);
            // Check if pool already exists using the refetched data
            if (refetchedSlot0 && Array.isArray(refetchedSlot0) && refetchedSlot0[0] !== 0n || refetchedLiquidity !== 0n) {
                setIsAddingLiquidity(true);
                console.log("refetchedSlot0", refetchedSlot0);
                console.log("refetchedLiquidity", refetchedLiquidity);    console.log("Pool already exists - proceeding to add liquidity");

                // Check and handle token approvals for both currencies (for adding liquidity)
                const currency0Approvals = await checkTokenApprovals(poolConfig.poolKey.currency0, sortedPoolConfig.decimals0);
                const currency1Approvals = await checkTokenApprovals(poolConfig.poolKey.currency1, sortedPoolConfig.decimals1);

                // Approve ERC20 for Permit2 if needed
                const amount0ForApproval = parseUnits(sortedPoolConfig.depositAmounts0, parseInt(sortedPoolConfig.decimals0));
                if (currency0Approvals.erc20AllowanceRaw < amount0ForApproval) {
                    await approveERC20ForPermit2(poolConfig.poolKey.currency0);
                }    const amount1ForApproval = parseUnits(sortedPoolConfig.depositAmounts1, parseInt(sortedPoolConfig.decimals1));
                if (currency1Approvals.erc20AllowanceRaw < amount1ForApproval) {
                    await approveERC20ForPermit2(poolConfig.poolKey.currency1);
                }

                // Approve Permit2 for PositionManager if needed
                if (!currency0Approvals.permit2Approved) {
                    await approvePermit2ForPositionManager(poolConfig.poolKey.currency0);
                }    if (!currency1Approvals.permit2Approved) {
                    await approvePermit2ForPositionManager(poolConfig.poolKey.currency1);
                }}

            if (!isAddingLiquidity) {
                setIsAddingLiquidity(true);
            }
            // create token details for currency0 and currency1
            const currency0Details = new Token(chainId, poolConfig.poolKey.currency0, parseInt(sortedPoolConfig.decimals0), sortedPoolConfig.tokenNames0, sortedPoolConfig.tokenSymbols0);
            const currency1Details = new Token(chainId, poolConfig.poolKey.currency1, parseInt(sortedPoolConfig.decimals1), sortedPoolConfig.tokenNames1, sortedPoolConfig.tokenSymbols1);

            const poolId = Pool.getPoolId(currency0Details, currency1Details, poolConfig.poolKey.fee, parseInt(poolConfig.poolKey.tickSpacing), poolConfig.poolKey.hooks);
            console.log("poolId", poolId);

            // Define position parameters
            // These typically come from user input in your interface
            const fullRange = true // Whether to create a full-range position
            const tickRangePercentage = 5 // 5% range around current price

            // Convert user input amounts to proper token units using parseUnits
            const amount0Raw = parseFloat(sortedPoolConfig.depositAmounts0) || 0
            const amount1Raw = parseFloat(sortedPoolConfig.depositAmounts1) || 0

            // Convert to proper token units (e.g., 1 token = 1e18 units for 18 decimals)
            const amount0 = parseUnits(amount0Raw.toString(), currency0Details.decimals)
            const amount1 = parseUnits(amount1Raw.toString(), currency1Details.decimals)

            const { data: refreshedSlot0 } = await refetchSlot0();
            const { data: refreshedLiquidity } = await refetchLiquidity();

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const sqrtPriceX96Current = (refreshedSlot0 as any)[0] as bigint;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const currentTick = (refreshedSlot0 as any)[1] as number;
            const currentLiquidity = refreshedLiquidity as bigint;

            const price = Number(sqrtPriceX96Current) / 2 ** 96
            const priceSquared = price ** 2
            setFormData({
                ...formData,
                startingPrice: priceSquared.toString(),
            });

            const pool = new Pool(
                currency0Details,
                currency1Details,
                poolConfig.poolKey.fee,
                parseInt(poolConfig.poolKey.tickSpacing),
                poolConfig.poolKey.hooks,
                sqrtPriceX96Current.toString(),
                currentLiquidity.toString(),
                currentTick
            );

            // Calculate tick boundaries based on user preferences
            let tickLower: number
            let tickUpper: number

            if (fullRange) {
                // For full-range positions, use Uniswap's minimum and maximum allowed ticks
                const MIN_TICK = -887272
                const MAX_TICK = 887272

                // Get tick spacing from the pool (already fetched from blockchain)
                const poolTickSpacing = pool.tickSpacing

                // Round tickLower up (closer to the center)
                // The nearestUsableTick ensures the tick is aligned with tick spacing
                tickLower = nearestUsableTick(MIN_TICK, poolTickSpacing)

                // Round tickUpper down (closer to the center)
                tickUpper = nearestUsableTick(MAX_TICK, poolTickSpacing)
            } else {
                // Calculate tick range based on percentage
                // For a 5% range, we need to calculate the appropriate tick range
                // 1 tick ≈ 0.01% price change, so 5% ≈ 500 ticks
                const tickRangeAmount = Math.max(100, Math.floor(500 * tickRangePercentage / 100)); // 5% = 25 ticks

                // Calculate lower and upper ticks, ensuring they align with tick spacing
                tickLower = nearestUsableTick(currentTick - tickRangeAmount, parseInt(poolConfig.poolKey.tickSpacing))
                tickUpper = nearestUsableTick(currentTick + tickRangeAmount, parseInt(poolConfig.poolKey.tickSpacing))

                // Ensure tickLower < tickUpper
                if (tickLower >= tickUpper) {
                    tickLower = nearestUsableTick(currentTick - 100, parseInt(poolConfig.poolKey.tickSpacing))
                    tickUpper = nearestUsableTick(currentTick + 100, parseInt(poolConfig.poolKey.tickSpacing))
                }}

            const position = Position.fromAmounts({
                pool: pool,
                tickLower: tickLower,
                tickUpper: tickUpper,
                amount0: amount0.toString(),
                amount1: amount1.toString(),
                useFullPrecision: true
            })

            // 1. slippageTolerance (required): Maximum allowed price movement
            // Convert from a percentage (e.g., 0.5%) to a Percent object
            // Here, 50 out of 10000 = 0.5%
            const slippageTolerance = 0.5 // 0.5% slippage tolerance
            const slippagePct = new Percent(Math.floor(slippageTolerance * 100), 10_000)

            // 2. deadline (required): Transaction expiry timestamp in seconds
            // Usually current time + some buffer (e.g., 20 minutes)
            const deadlineSeconds = 20 * 60 // 20 minutes

            const currentBlockTimestamp = Number(currentBlock?.timestamp)
            const deadline = currentBlockTimestamp + deadlineSeconds

            const userAddress = address;

            const mintOptions: MintOptions = {
                recipient: userAddress as `0x${string}`,
                slippageTolerance: slippagePct,
                deadline: deadline
            }

            const { calldata, value } = V4PositionManager.addCallParameters(position, mintOptions)
            console.log("calldata", calldata);
            console.log("Position Manager Address", positionManagerAddress);
            const addLiquidityTx = writeLiquidityContract({
                address: positionManagerAddress as `0x${string}`,
                abi: PositionManagerABI.abi,
                functionName: "multicall",
                args: [[calldata]],
                value: BigInt(value)
            });

            console.log("addLiquidityTx", addLiquidityTx);

        } catch (err) {
            setSubmitError("Error adding liquidity. Please try again.");
            console.error("Error adding liquidity:", err);
            setIsAddingLiquidity(false);
        }
    }

const fetchTokenSymbols = async (pairIndex: string) => {
    console.log("fetchTokenSymbols called with pairIndex:", pairIndex);
    if (!pairIndex) {
        setTokenSymbols({ currency0: "", currency1: "" });
        setTokenDecimals({ currency0: "", currency1: "" });
        setTokenNames({ currency0: "", currency1: "" });
        return;
    }

    const selectedPair = TOKEN_PAIRS[parseInt(pairIndex)];
    if (!selectedPair) return;

    console.log("Selected pair:", selectedPair);
    setIsLoadingSymbols({ currency0: true, currency1: true });
    try {
        const [currency0Details, currency1Details] = await Promise.all([
            getTokenDetailsFromAddress(selectedPair.currency0, config),
            getTokenDetailsFromAddress(selectedPair.currency1, config)
        ]);

        setTokenSymbols({
            currency0: currency0Details.symbol,
            currency1: currency1Details.symbol
        });
        setTokenDecimals({
            currency0: currency0Details.decimals.toString(),
            currency1: currency1Details.decimals.toString()
        });

        setTokenNames({
            currency0: currency0Details.name,
            currency1: currency1Details.name
        });

        // fetch token balances
        fetchTokenBalances(pairIndex);
    } catch (error) {
        console.error("Error fetching token symbols:", error);
        setTokenSymbols({ currency0: "", currency1: "" });
        setTokenDecimals({ currency0: "", currency1: "" });
        setTokenNames({ currency0: "", currency1: "" });
        setSubmitError("Error fetching token details. Please try again.");
    } finally {
        setIsLoadingSymbols({ currency0: false, currency1: false });
    }
};


const fetchTokenBalances = useCallback(async (pairIndex?: string) => {
    console.log("fetchTokenBalances called with pairIndex:", pairIndex, "formData.selectedPair:", formData.selectedPair);
    const pairToUse = pairIndex || formData.selectedPair;
    if (!pairToUse || !address) {
        console.log("Early return: pairToUse:", pairToUse, "address:", address);
        return;
    }

    const selectedPair = TOKEN_PAIRS[parseInt(pairToUse)];
    if (!selectedPair) return;

    try {
        const [balance0, balance1] = await Promise.all([
            readContract(config, {
                address: selectedPair.currency0 as `0x${string}`,
                abi: erc20ABI,
                functionName: "balanceOf",
                args: [address],
            }),
            readContract(config, {
                address: selectedPair.currency1 as `0x${string}`,
                abi: erc20ABI,
                functionName: "balanceOf",
                args: [address],
            })
        ]);

        setTokenBalances({
            currency0: balance0.toString(),
            currency1: balance1.toString()
        });

    } catch (error) {
        console.error("Error fetching token balances:", error);
    }
}, [address, formData.selectedPair]);

// Fetch token balances when address or selected pair changes
useEffect(() => {
    if (address && formData.selectedPair) {
        fetchTokenBalances();
    }
}, [address, formData.selectedPair, fetchTokenBalances]);

const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    console.log("handleInputChange called with name:", name, "value:", value);
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (formErrors[name as keyof typeof formErrors]) {
        setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (submitError) {
        setSubmitError(null);
    }

    // Fetch token symbols for selected pair
    if (name === 'selectedPair') {
        console.log("Calling fetchTokenSymbols with value:", value);
        fetchTokenSymbols(value);
        setPoolExists(null);
    }
};

const handleDepositAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDepositAmounts(prev => ({ ...prev, [name]: value }));
};

// Remove stepper navigation functions

const formatBalance = (balance: bigint, decimals: string) => {
    if (!balance || !decimals) return "0";
    try {
        const decimalPlaces = parseInt(decimals);
        const formatted = formatUnits(balance, decimalPlaces);

        return formatted;
    } catch (error) {
        console.error("Error formatting balance:", error);
        return "0";
    }
};

// Handle pool creation success
useEffect(() => {
    if (poolReceipt && poolReceipt.status === "success") {
        setIsCreatingPool(false);
        setIsLoading(false);
        toast.success("Pool created successfully");
    }
}, [poolReceipt]);

// Handle liquidity addition success
useEffect(() => {
    if (liquidityReceipt && liquidityReceipt.status === "success") {
        setIsAddingLiquidity(false);
        setIsLoading(false);
        toast.success("Liquidity added successfully");
    }
}, [liquidityReceipt]);

return (
    <div className="flex-1 flex items-center justify-center px-4 py-8 w-full">
        <div className="w-full px-4 py-8">
            <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-white mb-4">
                    Create Uniswap V4 Pool
                </h1>
                <p className="text-gray-300 text-lg">
                    Create a new liquidity pool on Uniswap V4
                </p>
            </div>

            {/* Removed stepper header */}

            <Card className="w-full mx-auto border-gray-800 bg-white/5 dark:bg-gray-900/50 backdrop-blur-sm">
                <CardHeader className="space-y-1 p-6">
                    <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        Create Uniswap V4 Pool
                    </CardTitle>
                    <p className="text-sm text-gray-300 dark:text-gray-400">
                        Select your token pair, set the starting price, and specify deposit amounts
                    </p>
                </CardHeader>

                <CardContent className="p-6 pt-0">
                    <form className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                label="Token Pair"
                                error={formErrors.selectedPair}
                                tooltip="Select a token pair for the pool"
                            >
                                <div className="relative">
                                    <select
                                        id="selectedPair"
                                        name="selectedPair"
                                        value={formData.selectedPair}
                                        onChange={handleInputChange}
                                        className={`${formErrors.selectedPair ? "border-red-500" : ""
                                            } bg-white/50 dark:bg-gray-800/50 transition-colors focus:ring-2 focus:ring-blue-500
                        text-white rounded-md border-gray-300 shadow-sm h-12 px-2 w-full`}
                                    >
                                        <option value="">Select a token pair</option>
                                        {TOKEN_PAIRS.map((pair, index) => (
                                            <option key={index} value={index.toString()}>
                                                {pair.name} - {pair.description}
                                            </option>
                                        ))}
                                    </select>
                                    {(tokenSymbols.currency0 || tokenSymbols.currency1 || isLoadingSymbols.currency0 || isLoadingSymbols.currency1) && (
                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex space-x-2">
                                            {isLoadingSymbols.currency0 || isLoadingSymbols.currency1 ? (
                                                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                                            ) : (
                                                <>
                                                    <span className="text-sm text-green-600 font-medium">
                                                        {tokenSymbols.currency0}
                                                    </span>
                                                    <span className="text-sm text-gray-400">/</span>
                                                    <span className="text-sm text-green-600 font-medium">
                                                        {tokenSymbols.currency1}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </FormField>

                            <FormField
                                label="Starting Price"
                                error={formErrors.startingPrice}
                                tooltip="Starting price for the pool"
                            >
                                <Input
                                    id="startingPrice"
                                    name="startingPrice"
                                    type="number"
                                    value={formData.startingPrice}
                                    onChange={handleInputChange}
                                    placeholder="1"
                                    step="0.000001"
                                    className={`${formErrors.startingPrice ? "border-red-500" : ""
                                        } bg-white/50 dark:bg-gray-800/50 transition-colors focus:ring-2 focus:ring-blue-500
                        placeholder:text-gray-500 dark:placeholder:text-gray-400 text-white`}
                                />
                            </FormField>
                        </div>

                        {/* Deposit Amounts Section */}

                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-white">Deposit Amounts</h3>

                            {/* Currency 0 Input */}
                            <div className="bg-gray-800/50 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-sm text-gray-300">Amount</label>
                                    <span className="text-xs text-gray-400">
                                        Balance: {formatBalance(BigInt(tokenBalances.currency0), tokenDecimals.currency0)} {tokenSymbols.currency0}
                                    </span>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <input
                                        type="number"
                                        name="currency0"
                                        value={depositAmounts.currency0}
                                        onChange={handleDepositAmountChange}
                                        placeholder="0.0"
                                        step="0.000001"
                                        min="0"
                                        className="flex-1 bg-gray-700/50 text-white rounded-md px-3 py-2 border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    />
                                    <div className="flex items-center space-x-2">
                                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                            <span className="text-xs font-bold text-white">
                                                {tokenSymbols.currency0 ? tokenSymbols.currency0[0] : '?'}
                                            </span>
                                        </div>
                                        <span className="text-sm text-gray-300">{tokenSymbols.currency0 || 'Token'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Currency 1 Input */}
                            <div className="bg-gray-800/50 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-sm text-gray-300">Amount</label>
                                    <span className="text-xs text-gray-400">
                                        Balance: {formatBalance(BigInt(tokenBalances.currency1), tokenDecimals.currency1)} {tokenSymbols.currency1}
                                    </span>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <input
                                        type="number"
                                        name="currency1"
                                        value={depositAmounts.currency1}
                                        onChange={handleDepositAmountChange}
                                        placeholder="0.0"
                                        step="0.000001"
                                        min="0"
                                        className="flex-1 bg-gray-700/50 text-white rounded-md px-3 py-2 border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    />
                                    <div className="flex items-center space-x-2">
                                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                            <span className="text-xs font-bold text-white">
                                                {tokenSymbols.currency1 ? tokenSymbols.currency1[0] : '?'}
                                            </span>
                                        </div>
                                        <span className="text-sm text-gray-300">{tokenSymbols.currency1 || 'Token'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Pool Configuration Summary */}
                        {formData.selectedPair && (
                            <div className="bg-gray-800/30 rounded-lg p-4">
                                <h3 className="text-lg font-semibold text-white mb-3">Pool Configuration</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Token Pair:</span>
                                        <span className="text-white">{tokenSymbols.currency0}/{tokenSymbols.currency1}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Starting Price:</span>
                                        <span className="text-white">{formData.startingPrice}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Fee:</span>
                                        <span className="text-white">{formData.fee} basis points (0.3%)</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Tick Spacing:</span>
                                        <span className="text-white">{formData.tickSpacing}</span>
                                    </div>
                                    {poolExists !== null && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Pool Status:</span>
                                            <span className={`font-medium ${poolExists ? 'text-green-400' : 'text-yellow-400'}`}>
                                                {poolExists ? 'Pool Exists' : 'Pool Does Not Exist'}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Status Messages */}
                        <div className="space-y-2">
                            {submitError && (
                                <div className="flex items-center p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg">
                                    <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                                    <span className="text-sm">{submitError}</span>
                                </div>
                            )}
                        </div>

                        {/* Check Pool and Submit Buttons */}
                        <div className="flex justify-center gap-4 pt-4">
                            <Button
                                type="button"
                                onClick={handleCheckPool}
                                disabled={isCheckingPool || !formData.selectedPair}
                                className={`px-6 py-3 text-lg font-medium relative overflow-hidden transition-all duration-300 ${isCheckingPool || !formData.selectedPair
                                    ? "bg-gray-400"
                                    : "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                                    }`}
                            >
                                {isCheckingPool ? (
                                    <div className="flex items-center">
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Checking...
                                    </div>
                                ) : (
                                    "Check Pool"
                                )}
                            </Button>

                            <Button
                                type="button"
                                onClick={poolExists === false ? handleCreatePool : handleAddLiquidity}
                                disabled={isLoading || poolExists === null || isCreatingPool || isAddingLiquidity}
                                className={`px-8 py-3 text-lg font-medium relative overflow-hidden transition-all duration-300 ${isLoading || poolExists === null || isCreatingPool || isAddingLiquidity
                                    ? "bg-gray-400"
                                    : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                                    }`}
                            >
                                {isLoading || isCreatingPool || isAddingLiquidity ? (
                                    <div className="flex items-center">
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        {isCreatingPool ? "Creating Pool..." : "Adding Liquidity..."}
                                    </div>
                                ) : (
                                    poolExists === true ? "Add Liquidity" : poolExists === false ? "Create Pool" : "Add Liquidity"
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
            {/* Pool Creation Status */}
            {
                isPoolReceiptPending && isCreatingPool && isLoading && (
                    <div className="flex items-center p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg">
                        <Loader2 className="h-4 w-4 mr-2 flex-shrink-0 animate-spin" />
                        <span className="text-sm">Creating pool...</span>
                    </div>
                )
            }{
                poolReceipt && poolReceipt.status === "success" && (
                    <div className="flex items-center p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg">
                        <CheckCircle2 className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="text-sm">Pool created successfully!</span>
                        <span className="text-sm">Pool ID: {poolId}</span>
                        <span className="text-sm">
                            <a href={getTxnExplorerUrl(poolReceipt.transactionHash, chainId)} target="_blank" rel="noopener noreferrer">
                                View on Explorer
                            </a>
                        </span>
                    </div>
                )
            }

            {/* Liquidity Addition Status */}
            {
                isLiquidityReceiptPending && isAddingLiquidity && isLoading && (
                    <div className="flex items-center p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg">
                        <Loader2 className="h-4 w-4 mr-2 flex-shrink-0 animate-spin" />
                        <span className="text-sm">Adding liquidity...</span>
                    </div>
                )
            }{
                liquidityReceipt && liquidityReceipt.status === "success" && (
                    <div className="flex items-center p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg">
                        <CheckCircle2 className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="text-sm">Liquidity added successfully!</span>
                        <span className="text-sm">
                            <a href={getTxnExplorerUrl(liquidityReceipt.transactionHash, chainId)} target="_blank" rel="noopener noreferrer">
                                View on Explorer
                            </a>
                        </span>
                    </div>
                )
            }

            {/* Error Status */}
            {
                !isPoolReceiptPending && !isLiquidityReceiptPending && !isCreatingPool && !isAddingLiquidity && !poolReceipt && !liquidityReceipt && !isLoading && (
                    <div className="flex items-center p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg">
                        <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="text-sm">Transaction failed!</span>
                    </div>
                )
            }

        </div>
    </div>
);
};

export default CreatePool;
