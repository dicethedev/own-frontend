import { useChainId } from "wagmi";
import { UNISWAP_CONTRACTS } from "../../config/contracts";

export function useUniswapContract(
  name: keyof (typeof UNISWAP_CONTRACTS)[number]
) {
  const chainId = useChainId();
  return UNISWAP_CONTRACTS[chainId]?.[name];
}
