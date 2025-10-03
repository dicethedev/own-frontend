import { Address } from "viem";

export type CreatePoolConfig = {
    poolKey: {
        currency0: Address;
        currency1: Address;
        fee: number;
        tickSpacing: string;
        hooks: Address;
        startingPrice: string;
    }
}
