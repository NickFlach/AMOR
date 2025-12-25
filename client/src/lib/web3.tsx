import { createContext, useContext, useState, useCallback, useEffect, useMemo, type ReactNode } from "react";
import { ethers } from "ethers";
import { NEO_X_CHAIN_ID, NEO_X_RPC_URL, CONTRACTS, ERC20_ABI, ST_AMOR_ABI, STAKING_MANAGER_ABI, GOVERNOR_ABI } from "./contracts";
import { getAppKit } from "./appkit";

let readProviderInstance: ethers.JsonRpcProvider | null = null;

function getReadProvider(): ethers.JsonRpcProvider {
  if (!readProviderInstance) {
    readProviderInstance = new ethers.JsonRpcProvider(NEO_X_RPC_URL, {
      chainId: NEO_X_CHAIN_ID,
      name: "Neo X Mainnet"
    }, {
      staticNetwork: true
    });
  }
  return readProviderInstance;
}

interface Web3ContextType {
  address: string | null;
  isConnecting: boolean;
  isConnected: boolean;
  chainId: number | null;
  isCorrectNetwork: boolean;
  provider: ethers.BrowserProvider | null;
  signer: ethers.Signer | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchNetwork: () => Promise<void>;
  amorBalance: string;
  stAmorBalance: string;
  votingPower: string;
  activeStake: string;
  refreshBalances: () => Promise<void>;
  readProvider: ethers.JsonRpcProvider;
}

const Web3Context = createContext<Web3ContextType | null>(null);

export function useWeb3() {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error("useWeb3 must be used within a Web3Provider");
  }
  return context;
}

interface Web3ProviderProps {
  children: ReactNode;
}

export function Web3Provider({ children }: Web3ProviderProps) {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [chainId, setChainId] = useState<number | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [amorBalance, setAmorBalance] = useState("0");
  const [stAmorBalance, setStAmorBalance] = useState("0");
  const [votingPower, setVotingPower] = useState("0");
  const [activeStake, setActiveStake] = useState("0");

  const readProvider = useMemo(() => getReadProvider(), []);
  const isConnected = !!address;
  const isCorrectNetwork = chainId === NEO_X_CHAIN_ID;

  const refreshBalances = useCallback(async () => {
    if (!address) return;
    
    try {
      const amorContract = new ethers.Contract(CONTRACTS.AMOR, ERC20_ABI, readProvider);
      const amorBal = await amorContract.balanceOf(address);
      setAmorBalance(ethers.formatEther(amorBal));
      
      const stAmorContract = new ethers.Contract(CONTRACTS.ST_AMOR, ST_AMOR_ABI, readProvider);
      const stAmorBal = await stAmorContract.balanceOf(address);
      setStAmorBalance(ethers.formatEther(stAmorBal));
      
      const votes = await stAmorContract.getVotes(address);
      setVotingPower(ethers.formatEther(votes));
      
      const stakingContract = new ethers.Contract(CONTRACTS.STAKING_MANAGER, STAKING_MANAGER_ABI, readProvider);
      const stake = await stakingContract.getActiveStake(address);
      setActiveStake(ethers.formatEther(stake));
    } catch (error) {
      console.debug("Could not fetch balances from RPC:", error);
    }
  }, [address, readProvider]);

  const connect = useCallback(async () => {
    const appKit = getAppKit();
    if (!appKit) {
      console.error("AppKit not initialized");
      return;
    }
    
    setIsConnecting(true);
    try {
      await appKit.open();
    } catch (error) {
      console.error("Connection error:", error);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    const appKit = getAppKit();
    if (!appKit) return;
    
    try {
      await appKit.disconnect();
    } catch (error) {
      console.debug("Disconnect error:", error);
    }
    setAddress(null);
    setProvider(null);
    setSigner(null);
    setChainId(null);
    setAmorBalance("0");
    setStAmorBalance("0");
    setVotingPower("0");
    setActiveStake("0");
  }, []);

  const switchNetwork = useCallback(async () => {
    const appKit = getAppKit();
    if (!appKit) return;
    
    try {
      await appKit.open({ view: 'Networks' });
    } catch (error) {
      console.error("Network switch error:", error);
    }
  }, []);

  useEffect(() => {
    const appKit = getAppKit();
    if (!appKit) return;

    const unsubscribeState = appKit.subscribeState((state) => {
      if (!state.open) {
        const caipAddress = appKit.getCaipAddress();
        if (caipAddress) {
          const addressPart = caipAddress.split(':').pop();
          if (addressPart) {
            setAddress(addressPart);
          }
        } else {
          setAddress(null);
        }

        const networkId = state.selectedNetworkId;
        if (networkId && typeof networkId === 'string') {
          const chainIdPart = networkId.split(':').pop();
          if (chainIdPart) {
            setChainId(Number(chainIdPart));
          }
        }
      }
    });

    const unsubscribeProviders = appKit.subscribeProviders((providers: Record<string, unknown>) => {
      const eip155Provider = providers["eip155"];
      if (eip155Provider) {
        const browserProvider = new ethers.BrowserProvider(eip155Provider as ethers.Eip1193Provider);
        browserProvider.getSigner().then((signerInstance) => {
          setProvider(browserProvider);
          setSigner(signerInstance);
          browserProvider.getNetwork().then((network) => {
            setChainId(Number(network.chainId));
          });
        }).catch((error) => {
          console.debug("Error getting signer:", error);
        });
      } else {
        setProvider(null);
        setSigner(null);
      }
    });

    const caipAddress = appKit.getCaipAddress();
    if (caipAddress) {
      const addressPart = caipAddress.split(':').pop();
      if (addressPart) {
        setAddress(addressPart);
      }
    }

    return () => {
      unsubscribeState?.();
      unsubscribeProviders?.();
    };
  }, []);

  useEffect(() => {
    if (isConnected && isCorrectNetwork) {
      refreshBalances();
    }
  }, [isConnected, isCorrectNetwork, refreshBalances]);

  const contextValue = useMemo(() => ({
    address,
    isConnecting,
    isConnected,
    chainId,
    isCorrectNetwork,
    provider,
    signer,
    connect,
    disconnect,
    switchNetwork,
    amorBalance,
    stAmorBalance,
    votingPower,
    activeStake,
    refreshBalances,
    readProvider,
  }), [
    address,
    isConnecting,
    isConnected,
    chainId,
    isCorrectNetwork,
    provider,
    signer,
    connect,
    disconnect,
    switchNetwork,
    amorBalance,
    stAmorBalance,
    votingPower,
    activeStake,
    refreshBalances,
    readProvider,
  ]);

  return (
    <Web3Context.Provider value={contextValue}>
      {children}
    </Web3Context.Provider>
  );
}

export function useContracts() {
  const { signer, readProvider } = useWeb3();
  
  const getAmorContract = useCallback((writable = false) => {
    return new ethers.Contract(CONTRACTS.AMOR, ERC20_ABI, writable && signer ? signer : readProvider);
  }, [signer, readProvider]);
  
  const getStAmorContract = useCallback((writable = false) => {
    return new ethers.Contract(CONTRACTS.ST_AMOR, ST_AMOR_ABI, writable && signer ? signer : readProvider);
  }, [signer, readProvider]);
  
  const getStakingContract = useCallback((writable = false) => {
    return new ethers.Contract(CONTRACTS.STAKING_MANAGER, STAKING_MANAGER_ABI, writable && signer ? signer : readProvider);
  }, [signer, readProvider]);
  
  const getGovernorContract = useCallback((writable = false) => {
    return new ethers.Contract(CONTRACTS.GOVERNOR, GOVERNOR_ABI, writable && signer ? signer : readProvider);
  }, [signer, readProvider]);
  
  return { getAmorContract, getStAmorContract, getStakingContract, getGovernorContract };
}
