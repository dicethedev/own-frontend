"use client";

import React, { useState } from "react";
import { Input, Button, Card, CardContent, CardHeader, CardTitle } from "@/components/ui/BaseComponents";
import { FormField } from "@/components/FormField";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Address, formatUnits, parseUnits } from "viem";
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

const CreatePool: React.FC = () => {
    const [formData, setFormData] = useState({
        selectedPair: "",
        fee: "",
        tickSpacing: "",
        startingPrice: "1",
        hooks: "",
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
    
    // Stepper state
    const [currentStep, setCurrentStep] = useState(1);
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

    const { writeContract, data: hash } = useWriteContract();

    const { data: receipt, isPending: isReceiptPending } = useWaitForTransactionReceipt({
        hash: hash,
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
            console.log("fee", fee, "type:", typeof fee);
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
            
            console.log("Original price:", startingPrice);
            console.log("Clamped price:", clampedPrice);
            console.log("SqrtPriceX96:", boundedSqrtPriceX96.toString());
            
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
            console.log("ERC20 approval tx hash:", txHash);
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
            console.log("Permit2 approval tx hash:", txHash);
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

            console.log("erc20Allowance", formatUnits(erc20Allowance, parseInt(tokenDecimals)));

            // Check Permit2 allowance for PositionManager
            const permit2Allowance = await readContract(config, {
                address: permit2Address as `0x${string}`,
                abi: Permit2ABIBase,
                functionName: "allowance",
                args: [address!, tokenAddress, positionManagerAddress],
            });

            console.log("permit2Allowance", formatUnits(permit2Allowance as bigint, parseInt(tokenDecimals)));

            return {
                erc20Approved: formatUnits(erc20Allowance, parseInt(tokenDecimals)),
                erc20AllowanceRaw: erc20Allowance,
                permit2Approved: (permit2Allowance as { amount: bigint, expiration: bigint }).amount > 0n && (permit2Allowance as { amount: bigint, expiration: bigint }).expiration > BigInt(Math.floor(Date.now() / 1000)),
            };
        } catch (error) {
            console.error("Error checking token approvals:", error);
            return { erc20Approved: "0", erc20AllowanceRaw: 0n, permit2Approved: false };
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError(null);

        if (!validateForm()) return;

        setIsLoading(true);
        try {
            // Get selected pair details
            const selectedPair = TOKEN_PAIRS[parseInt(formData.selectedPair)];
            if (!selectedPair) {
                setSubmitError("Invalid token pair selected");
                return;
            }

            // TODO: Implement actual Uniswap v4 pool creation logic
            const poolConfig: CreatePoolConfig = {
                poolKey: {
                    currency0: selectedPair.currency0 as Address,
                    currency1: selectedPair.currency1 as Address,
                    fee: parseInt(formData.fee),
                    tickSpacing: formData.tickSpacing,
                    hooks: formData.hooks as Address || "0x0000000000000000000000000000000000000000",
                    startingPrice: calculateSqrtPriceX96(parseFloat(formData.startingPrice)),
                },
            };
            console.log("poolConfig", poolConfig);

            // sort tokens
            const sortedConfig = BigInt(poolConfig.poolKey.currency0) < BigInt(poolConfig.poolKey.currency1) ? {
                currency0: poolConfig.poolKey.currency0,
                currency1: poolConfig.poolKey.currency1,
                depositAmounts0: depositAmounts.currency0,
                depositAmounts1: depositAmounts.currency1,
                decimals0: tokenDecimals.currency0,
                decimals1: tokenDecimals.currency1,
                tokenSymbols0: tokenSymbols.currency0,
                tokenSymbols1: tokenSymbols.currency1,
                tokenNames0: tokenNames.currency0,
                tokenNames1: tokenNames.currency1,
            } : {
                currency0: poolConfig.poolKey.currency1,
                currency1: poolConfig.poolKey.currency0,
                depositAmounts0: depositAmounts.currency1,
                depositAmounts1: depositAmounts.currency0,
                decimals0: tokenDecimals.currency1,
                decimals1: tokenDecimals.currency0,
                tokenSymbols0: tokenSymbols.currency1,
                tokenSymbols1: tokenSymbols.currency0,
                tokenNames0: tokenNames.currency1,
                tokenNames1: tokenNames.currency0,
            };

            poolConfig.poolKey.currency0 = sortedConfig.currency0;
            poolConfig.poolKey.currency1 = sortedConfig.currency1;
            depositAmounts.currency0 = sortedConfig.depositAmounts0;
            depositAmounts.currency1 = sortedConfig.depositAmounts1;
            tokenDecimals.currency0 = sortedConfig.decimals0;
            tokenDecimals.currency1 = sortedConfig.decimals1;
            tokenSymbols.currency0 = sortedConfig.tokenSymbols0;
            tokenSymbols.currency1 = sortedConfig.tokenSymbols1;
            tokenNames.currency0 = sortedConfig.tokenNames0;
            tokenNames.currency1 = sortedConfig.tokenNames1;
            console.log("sorted poolConfig", poolConfig);

            validatePoolKey(poolConfig.poolKey);

            const calculatedPoolId = getPoolId({
                currency0: poolConfig.poolKey.currency0,
                currency1: poolConfig.poolKey.currency1,
                fee: poolConfig.poolKey.fee,
                tickSpacing: parseInt(poolConfig.poolKey.tickSpacing),
                hooks: poolConfig.poolKey.hooks
            });

            console.log("poolId", calculatedPoolId);
            setPoolId(calculatedPoolId);

            // Refetch the slot0 data and wait for the result
            const { data: refetchedSlot0 } = await refetchSlot0();
            console.log("refetchedSlot0", refetchedSlot0);

            const { data: refetchedLiquidity } = await refetchLiquidity();
            console.log("refetchedLiquidity", refetchedLiquidity);

            // Check if pool already exists using the refetched data
            if (refetchedSlot0 && Array.isArray(refetchedSlot0) && refetchedSlot0[0] !== 0n || refetchedLiquidity !== 0n) {
                console.log("Pool already exists - proceeding to add liquidity");
                
                // Check and handle token approvals for both currencies (for adding liquidity)
                const currency0Approvals = await checkTokenApprovals(poolConfig.poolKey.currency0, tokenDecimals.currency0);
                const currency1Approvals = await checkTokenApprovals(poolConfig.poolKey.currency1, tokenDecimals.currency1);

                console.log("Currency0 approvals:", currency0Approvals);
                console.log("Currency1 approvals:", currency1Approvals);

                console.log("depositAmounts.currency0", depositAmounts.currency0);
                console.log("depositAmounts.currency1", depositAmounts.currency1);

                // Approve ERC20 for Permit2 if needed
                const amount0ForApproval = parseUnits(depositAmounts.currency0, parseInt(tokenDecimals.currency0));
                if (currency0Approvals.erc20AllowanceRaw < amount0ForApproval) {
                    console.log("Approving currency0 for Permit2...");
                    await approveERC20ForPermit2(poolConfig.poolKey.currency0);
                }
                const amount1ForApproval = parseUnits(depositAmounts.currency1, parseInt(tokenDecimals.currency1));
                if (currency1Approvals.erc20AllowanceRaw < amount1ForApproval) {
                    console.log("Approving currency1 for Permit2...");
                    await approveERC20ForPermit2(poolConfig.poolKey.currency1);
                }

                // Approve Permit2 for PositionManager if needed
                if (!currency0Approvals.permit2Approved) {
                    console.log("Approving currency0 on Permit2 for PositionManager...");
                    await approvePermit2ForPositionManager(poolConfig.poolKey.currency0);
                }
                if (!currency1Approvals.permit2Approved) {
                    console.log("Approving currency1 on Permit2 for PositionManager...");
                    await approvePermit2ForPositionManager(poolConfig.poolKey.currency1);
                }

                // // TODO: Add liquidity to existing pool instead of creating new one
                // setSubmitError("Pool already exists. Adding liquidity to existing pool is not yet implemented.");
                // return;
            } else {
                console.log("Pool creation would proceed here...");

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

                console.log("Token balances:", {
                    currency0: balance0.toString(),
                    currency1: balance1.toString()
                });

                // Check if user has sufficient balance
                const amount0 = parseUnits(depositAmounts.currency0, parseInt(tokenDecimals.currency0));
                const amount1 = parseUnits(depositAmounts.currency1, parseInt(tokenDecimals.currency1));


                console.log("amount0", amount0);
                console.log("amount1", amount1);
                console.log("balance0", balance0);
                console.log("balance1", balance1);

                console.log("Formatted balances:", {
                    balance0Formatted: formatBalance(balance0, tokenDecimals.currency0),
                    balance1Formatted: formatBalance(balance1, tokenDecimals.currency1),
                    amount0Formatted: formatBalance(amount0, tokenDecimals.currency0),
                    amount1Formatted: formatBalance(amount1, tokenDecimals.currency1)
                });

                if (balance0 < amount0) {
                    setSubmitError(`Insufficient ${tokenSymbols.currency0} balance. Required: ${formatBalance(amount0, tokenDecimals.currency0)}, Available: ${formatBalance(balance0, tokenDecimals.currency0)}`);
                    return;
                }
                if (balance1 < amount1) {
                    setSubmitError(`Insufficient ${tokenSymbols.currency1} balance. Required: ${formatBalance(amount1, tokenDecimals.currency1)}, Available: ${formatBalance(balance1, tokenDecimals.currency1)}`);
                    return;
                }

                // Check and handle token approvals for both currencies
                const currency0Approvals = await checkTokenApprovals(poolConfig.poolKey.currency0, tokenDecimals.currency0);
                const currency1Approvals = await checkTokenApprovals(poolConfig.poolKey.currency1, tokenDecimals.currency1);

                console.log("Currency0 approvals:", currency0Approvals);
                console.log("Currency1 approvals:", currency1Approvals);

                console.log("depositAmounts.currency0", depositAmounts.currency0);
                console.log("depositAmounts.currency1", depositAmounts.currency1);

                // Approve ERC20 for Permit2 if needed
                const amount0ForApproval = parseUnits(depositAmounts.currency0, parseInt(tokenDecimals.currency0));
                if (currency0Approvals.erc20AllowanceRaw < amount0ForApproval) {
                    console.log("Approving currency0 for Permit2...");
                    await approveERC20ForPermit2(poolConfig.poolKey.currency0);
                }
                const amount1ForApproval = parseUnits(depositAmounts.currency1, parseInt(tokenDecimals.currency1));
                if (currency1Approvals.erc20AllowanceRaw < amount1ForApproval) {
                    console.log("Approving currency1 for Permit2...");
                    await approveERC20ForPermit2(poolConfig.poolKey.currency1);
                }

                await approveERC20ForPermit2(poolConfig.poolKey.currency0);
                await approveERC20ForPermit2(poolConfig.poolKey.currency1);

                // Approve Permit2 for PositionManager if needed
                if (!currency0Approvals.permit2Approved) {
                    console.log("Approving currency0 on Permit2 for PositionManager...");
                    await approvePermit2ForPositionManager(poolConfig.poolKey.currency0);
                }
                if (!currency1Approvals.permit2Approved) {
                    console.log("Approving currency1 on Permit2 for PositionManager...");
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

                console.log("Creating pool with key:", poolKeyTuple);
                console.log("Starting price:", poolConfig.poolKey.startingPrice);

                const createPoolTx = await writeContractAsync({
                    address: poolManagerContractAddress as `0x${string}`,
                    abi: PoolManagerABI.abi,
                    functionName: "initialize",
                    args: [poolKeyTuple, poolConfig.poolKey.startingPrice],
                });

                console.log("Pool creation tx hash:", createPoolTx);
                console.log("Pool created successfully!");
            }

            // create token details for currency0 and currency1
            const currency0Details = new Token(chainId, poolConfig.poolKey.currency0, parseInt(tokenDecimals.currency0), tokenNames.currency0, tokenSymbols.currency0);
            const currency1Details = new Token(chainId, poolConfig.poolKey.currency1, parseInt(tokenDecimals.currency1), tokenNames.currency1, tokenSymbols.currency1);

            const poolId = Pool.getPoolId(currency0Details, currency1Details, poolConfig.poolKey.fee, parseInt(poolConfig.poolKey.tickSpacing), poolConfig.poolKey.hooks);
            console.log("poolId", poolId);

            // Define position parameters
            // These typically come from user input in your interface
            const fullRange = false // Whether to create a full-range position
            const tickRangePercentage = 5 // 5% range around current price
            
            // Convert user input amounts to proper token units using parseUnits
            const amount0Raw = parseFloat(depositAmounts.currency0) || 0
            const amount1Raw = parseFloat(depositAmounts.currency1) || 0
            
            // Convert to proper token units (e.g., 1 token = 1e18 units for 18 decimals)
            const amount0 = parseUnits(amount0Raw.toString(), currency0Details.decimals)
            const amount1 = parseUnits(amount1Raw.toString(), currency1Details.decimals)
            
            console.log("Amount conversion:", {
                amount0Raw,
                amount1Raw,
                amount0: amount0.toString(),
                amount1: amount1.toString(),
                currency0Decimals: currency0Details.decimals,
                currency1Decimals: currency1Details.decimals
            });

            const sqrtPriceX96Current = (refetchedSlot0 as any)[0] as bigint;
            const currentTick = (refetchedSlot0 as any)[1] as number;
            const currentLiquidity = refetchedLiquidity as bigint;
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
                }
            }

            console.log(`Tick range: ${tickLower} to ${tickUpper} (current: ${currentTick})`)
            console.log(`Tick spacing: ${parseInt(poolConfig.poolKey.tickSpacing)}`)

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
            console.log("userAddress", userAddress);
            console.log("currentBlockTimestamp", currentBlockTimestamp);
            console.log("deadline", deadline);
            console.log("slippagePct", slippagePct);
            console.log("slippageTolerance", slippageTolerance);
            console.log("position", position);
            console.log("pool", pool);
            console.log("poolId", poolId);
            console.log("currency0Details", currency0Details);
            console.log("currency1Details", currency1Details);
            console.log("config", config);

            const mintOptions: MintOptions = {
                recipient: userAddress as `0x${string}`,
                slippageTolerance: slippagePct,
                deadline: deadline
            }

            const { calldata, value } = V4PositionManager.addCallParameters(position, mintOptions)

            console.log("calldata", calldata);
            console.log("value", value);

            writeContract({
                address: positionManagerAddress as `0x${string}`,
                abi: PositionManagerABI.abi,
                functionName: "multicall",
                args: [[calldata]],
                value: BigInt(value)
            });


        } catch (err) {
            setSubmitError("Error creating pool. Please try again.");
            console.error("Error creating pool:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchTokenSymbols = async (pairIndex: string) => {
        if (!pairIndex) {
            setTokenSymbols({ currency0: "", currency1: "" });
            setTokenDecimals({ currency0: "", currency1: "" });
            setTokenNames({ currency0: "", currency1: "" });
            return;
        }

        const selectedPair = TOKEN_PAIRS[parseInt(pairIndex)];
        if (!selectedPair) return;

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
            
            console.log("Token details fetched:", {
                currency0: {
                    address: selectedPair.currency0,
                    symbol: currency0Details.symbol,
                    decimals: currency0Details.decimals,
                    name: currency0Details.name
                },
                currency1: {
                    address: selectedPair.currency1,
                    symbol: currency1Details.symbol,
                    decimals: currency1Details.decimals,
                    name: currency1Details.name
                }
            });
            setTokenNames({
                currency0: currency0Details.name,
                currency1: currency1Details.name
            });
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


    const fetchTokenBalances = async () => {
        if (!formData.selectedPair || !address) return;

        const selectedPair = TOKEN_PAIRS[parseInt(formData.selectedPair)];
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
            
            console.log("Token balances fetched:", {
                currency0: {
                    address: selectedPair.currency0,
                    balance: balance0.toString(),
                    balanceBigInt: balance0
                },
                currency1: {
                    address: selectedPair.currency1,
                    balance: balance1.toString(),
                    balanceBigInt: balance1
                }
            });
        } catch (error) {
            console.error("Error fetching token balances:", error);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));

        if (formErrors[name as keyof typeof formErrors]) {
            setFormErrors((prev) => ({ ...prev, [name]: "" }));
        }
        if (submitError) {
            setSubmitError(null);
        }

        // Fetch token symbols for selected pair
        if (name === 'selectedPair') {
            console.log("fetching token symbols for pair", value);
            fetchTokenSymbols(value);
        }
    };

    const handleDepositAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setDepositAmounts(prev => ({ ...prev, [name]: value }));
    };

    const nextStep = () => {
        if (currentStep === 1) {
            if (validateForm()) {
                fetchTokenBalances();
                setCurrentStep(2);
            }
        } else if (currentStep === 2) {
            // Validate deposit amounts
            const amount0 = parseFloat(depositAmounts.currency0); // convert to parse units
            const amount1 = parseFloat(depositAmounts.currency1);
            
            if (!amount0 || !amount1 || amount0 <= 0 || amount1 <= 0) {
                setSubmitError("Please enter valid deposit amounts for both tokens");
                return;
            }
            
            setCurrentStep(3);
        }
    };

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const formatBalance = (balance: bigint, decimals: string) => {
        if (!balance || !decimals) return "0";
        try {
            const decimalPlaces = parseInt(decimals);
            const formatted = formatUnits(balance, decimalPlaces);
            
            // Add debugging
            console.log("formatBalance debug:", {
                balance: balance.toString(),
                decimals: decimals,
                decimalPlaces,
                formatted
            });
            
            return formatted;
        } catch (error) {
            console.error("Error formatting balance:", error);
            return "0";
        }
    };

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

                {/* Stepper Header */}
                <div className="flex justify-center mb-8">
                    <div className="flex items-center space-x-4">
                        {/* Step 1 */}
                        <div className="flex items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                                currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-600 text-gray-300'
                            }`}>
                                1
                            </div>
                            <span className={`ml-2 text-sm ${currentStep >= 1 ? 'text-white' : 'text-gray-400'}`}>
                                Pool Parameters
                            </span>
                        </div>
                        
                        <div className={`w-16 h-0.5 ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-600'}`}></div>
                        
                        {/* Step 2 */}
                        <div className="flex items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                                currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-600 text-gray-300'
                            }`}>
                                2
                            </div>
                            <span className={`ml-2 text-sm ${currentStep >= 2 ? 'text-white' : 'text-gray-400'}`}>
                                Deposit Tokens
                            </span>
                        </div>
                        
                        <div className={`w-16 h-0.5 ${currentStep >= 3 ? 'bg-blue-600' : 'bg-gray-600'}`}></div>
                        
                        {/* Step 3 */}
                        <div className="flex items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                                currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-600 text-gray-300'
                            }`}>
                                3
                            </div>
                            <span className={`ml-2 text-sm ${currentStep >= 3 ? 'text-white' : 'text-gray-400'}`}>
                                Confirm & Create
                            </span>
                        </div>
                    </div>
                </div>

                <Card className="w-full mx-auto border-gray-800 bg-white/5 dark:bg-gray-900/50 backdrop-blur-sm">
                    {/* Step 1: Pool Parameters */}
                    {currentStep === 1 && (
                        <>
                            <CardHeader className="space-y-1 p-6">
                                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                    Pool Parameters
                                </CardTitle>
                                <p className="text-sm text-gray-300 dark:text-gray-400">
                                    Configure your Uniswap V4 pool settings
                                </p>
                            </CardHeader>

                            <CardContent className="p-6 pt-0">
                                <form onSubmit={(e) => { e.preventDefault(); nextStep(); }} className="space-y-6">
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
                                    label="Fee (basis points)"
                                    error={formErrors.fee}
                                    tooltip="Trading fee in basis points. Valid options: 100 (0.01%), 500 (0.05%), 3000 (0.3%), 10000 (1%)"
                                >
                                    <select
                                        id="fee"
                                        name="fee"
                                        value={formData.fee}
                                        onChange={handleInputChange}
                                        className={`${formErrors.fee ? "border-red-500" : ""
                                            } bg-white/50 dark:bg-gray-800/50 transition-colors focus:ring-2 focus:ring-blue-500
                        text-white rounded-md border-gray-300 shadow-sm h-12 px-2`}
                                    >
                                        <option value="">Select fee tier</option>
                                        <option value="100">100 (0.01%)</option>
                                        <option value="500">500 (0.05%)</option>
                                        <option value="3000">3000 (0.3%)</option>
                                        <option value="10000">10000 (1%)</option>
                                    </select>
                                </FormField>

                                <FormField
                                    label="Tick Spacing"
                                    error={formErrors.tickSpacing}
                                    tooltip="Minimum tick increment for price changes"
                                >
                                    <Input
                                        id="tickSpacing"
                                        name="tickSpacing"
                                        type="number"
                                        value={formData.tickSpacing}
                                        onChange={handleInputChange}
                                        placeholder="60"
                                        min="1"
                                        className={`${formErrors.tickSpacing ? "border-red-500" : ""
                                            } bg-white/50 dark:bg-gray-800/50 transition-colors focus:ring-2 focus:ring-blue-500
                        placeholder:text-gray-500 dark:placeholder:text-gray-400 text-white`}
                                    />
                                </FormField>
                                    <FormField
                                        label="Starting Price"
                                        error={formErrors.startingPrice}
                                        tooltip="Starting price for the pool (must be between 0.000001 and 1,000,000)"
                                    >
                                        <Input
                                            id="startingPrice"
                                            name="startingPrice"
                                            type="number"
                                            value={formData.startingPrice}
                                            onChange={handleInputChange}
                                            placeholder="1"
                                            min="0.000001"
                                            max="1000000"
                                            step="0.000001"
                                            className={`${formErrors.startingPrice ? "border-red-500" : ""
                                                } bg-white/50 dark:bg-gray-800/50 transition-colors focus:ring-2 focus:ring-blue-500
                            placeholder:text-gray-500 dark:placeholder:text-gray-400 text-white`}
                                        />
                                    </FormField>
                                <FormField
                                    label="Hooks"
                                    error={formErrors.hooks}
                                    tooltip="Hooks address for the pool. Can be empty if no hooks are needed."
                                >
                                    <Input
                                        id="hooks"
                                        name="hooks"
                                        value={formData.hooks}
                                        onChange={handleInputChange}
                                        placeholder="0x..."
                                        className={`${formErrors.hooks ? "border-red-500" : ""
                                            } bg-white/50 dark:bg-gray-800/50 transition-colors focus:ring-2 focus:ring-blue-500
                        placeholder:text-gray-500 dark:placeholder:text-gray-400 text-white`}
                                    />
                                </FormField>
                            </div>

                            <div className="pt-4">
                                <Button
                                    type="submit"
                                    className={`w-full relative overflow-hidden transition-all duration-300 ${isLoading
                                        ? "bg-gray-400"
                                        : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                                        }`}
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <div className="flex items-center justify-center">
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Creating Pool...
                                        </div>
                                    ) : (
                                        "Create Uniswap V4 Pool"
                                    )}
                                </Button>
                            </div>

                            {/* Status Messages */}
                            <div className="space-y-2">
                                {submitError && (
                                    <div className="flex items-center p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg">
                                        <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                                        <span className="text-sm">{submitError}</span>
                                    </div>
                                )}

                            </div>

                            {/* Navigation Buttons */}
                            <div className="flex justify-end pt-4">
                                <Button
                                    type="submit"
                                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                                >
                                    Next
                                </Button>
                            </div>
                        </form>
                            </CardContent>
                        </>
                    )}

                    {/* Step 2: Deposit Tokens */}
                    {currentStep === 2 && (
                        <>
                            <CardHeader className="space-y-1 p-6">
                                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                    Deposit Tokens
                                </CardTitle>
                                <p className="text-sm text-gray-300 dark:text-gray-400">
                                    Specify the token amounts for your liquidity contribution
                                </p>
                            </CardHeader>

                            <CardContent className="p-6 pt-0">
                                <form onSubmit={(e) => { e.preventDefault(); nextStep(); }} className="space-y-6">
                                    <div className="space-y-4">
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
                                                    className="flex-1 bg-transparent text-white text-lg placeholder-gray-500 focus:outline-none"
                                                />
                                                <div className="flex items-center space-x-2">
                                                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                                        <span className="text-xs font-bold text-white">
                                                            {tokenSymbols.currency0?.charAt(0) || '?'}
                                                        </span>
                                                    </div>
                                                    <span className="text-white font-medium">{tokenSymbols.currency0}</span>
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
                                                    className="flex-1 bg-transparent text-white text-lg placeholder-gray-500 focus:outline-none"
                                                />
                                                <div className="flex items-center space-x-2">
                                                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                                        <span className="text-xs font-bold text-white">
                                                            {tokenSymbols.currency1?.charAt(0) || '?'}
                                                        </span>
                                                    </div>
                                                    <span className="text-white font-medium">{tokenSymbols.currency1}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Navigation Buttons */}
                                    <div className="flex justify-between pt-4">
                                        <Button
                                            type="button"
                                            onClick={prevStep}
                                            className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white"
                                        >
                                            Back
                                        </Button>
                                        <Button
                                            type="submit"
                                            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                                        >
                                            Next
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </>
                    )}

                    {/* Step 3: Confirmation */}
                    {currentStep === 3 && (
                        <>
                            <CardHeader className="space-y-1 p-6">
                                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                    Confirm & Create Pool
                                </CardTitle>
                                <p className="text-sm text-gray-300 dark:text-gray-400">
                                    Review your pool parameters and deposit amounts
                                </p>
                            </CardHeader>

                            <CardContent className="p-6 pt-0">
                                <div className="space-y-6">
                                    {/* Pool Summary */}
                                    <div className="bg-gray-800/30 rounded-lg p-4">
                                        <h3 className="text-lg font-semibold text-white mb-3">Pool Configuration</h3>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">Token Pair:</span>
                                                <span className="text-white">{tokenSymbols.currency0}/{tokenSymbols.currency1}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">Fee:</span>
                                                <span className="text-white">{formData.fee} basis points</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">Tick Spacing:</span>
                                                <span className="text-white">{formData.tickSpacing}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Deposit Summary */}
                                    <div className="bg-gray-800/30 rounded-lg p-4">
                                        <h3 className="text-lg font-semibold text-white mb-3">Deposit Amounts</h3>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">{tokenSymbols.currency0}:</span>
                                                <span className="text-white">{depositAmounts.currency0 || '0'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">{tokenSymbols.currency1}:</span>
                                                <span className="text-white">{depositAmounts.currency1 || '0'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Navigation Buttons */}
                                    <div className="flex justify-between pt-4">
                                        <Button
                                            type="button"
                                            onClick={prevStep}
                                            className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white"
                                        >
                                            Back
                                        </Button>
                                        <Button
                                            onClick={handleSubmit}
                                            disabled={isLoading}
                                            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white disabled:opacity-50"
                                        >
                                            {isLoading ? (
                                                <div className="flex items-center">
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Creating Pool...
                                                </div>
                                            ) : (
                                                "Create Pool"
                                            )}
                                        </Button>
                                    </div>

                                    {/* Status Messages */}
                                    {submitError && (
                                        <div className="flex items-center p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg">
                                            <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                                            <span className="text-sm">{submitError}</span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </>
                    )}
                </Card>
                {
                    isReceiptPending && isLoading && (
                        <div className="flex items-center p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg">
                            <Loader2 className="h-4 w-4 mr-2 flex-shrink-0 animate-spin" />
                            <span className="text-sm">Creating pool...</span>
                        </div>
                    )
                }
                {
                    receipt && !isLoading && (
                        <div className="flex items-center p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg">
                            <CheckCircle2 className="h-4 w-4 mr-2 flex-shrink-0" />
                            <span className="text-sm">Pool created successfully!</span>
                            <span className="text-sm">Pool ID: {poolId}</span>
                            <span className="text-sm">Hash: {hash}</span>
                        </div>
                    )
                }
                {
                    !isReceiptPending && !receipt && !isLoading && (
                        <div className="flex items-center p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg">
                            <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                            <span className="text-sm">Pool creation failed!</span>
                        </div>
                    )
                }

            </div>
    </div>
  );
};

export default CreatePool;
