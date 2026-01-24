import { useChainId, useSwitchChain } from "wagmi";
import { defaultChain, supportedChains } from "@/lib/chains.config";

export function useValidChain() {
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  
  const isSupported = supportedChains.some(chain => chain.id === chainId);
  const activeChainId = isSupported ? chainId : defaultChain.id;
  
  const switchToDefaultChain = () => {
    if (switchChain) {
      switchChain({ chainId: defaultChain.id });
    }
  };
  
  return {
    chainId: activeChainId,
    connectedChainId: chainId,
    isSupported,
    isMismatch: !isSupported,
    switchToDefaultChain,
  };
}