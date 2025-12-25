import { createContext, useContext, useState, useCallback, useEffect, useMemo, type ReactNode } from "react";
import { ethers } from "ethers";
import { NEO_X_CHAIN_ID, NEO_X_RPC_URL, CONTRACTS, ERC20_ABI, ST_AMOR_ABI, STAKING_MANAGER_ABI, GOVERNOR_ABI } from "./contracts";

// Singleton read-only provider for RPC calls
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
      // AMOR balance
      const amorContract = new ethers.Contract(CONTRACTS.AMOR, ERC20_ABI, readProvider);
      const amorBal = await amorContract.balanceOf(address);
      setAmorBalance(ethers.formatEther(amorBal));
      
      // stAMOR balance
      const stAmorContract = new ethers.Contract(CONTRACTS.ST_AMOR, ST_AMOR_ABI, readProvider);
      const stAmorBal = await stAmorContract.balanceOf(address);
      setStAmorBalance(ethers.formatEther(stAmorBal));
      
      // Voting power
      const votes = await stAmorContract.getVotes(address);
      setVotingPower(ethers.formatEther(votes));
      
      // Active stake
      const stakingContract = new ethers.Contract(CONTRACTS.STAKING_MANAGER, STAKING_MANAGER_ABI, readProvider);
      const stake = await stakingContract.getActiveStake(address);
      setActiveStake(ethers.formatEther(stake));
    } catch (error) {
      // Silently fail - balances will show 0 until RPC is accessible
      console.debug("Could not fetch balances from RPC:", error);
    }
  }, [address, readProvider]);

  const connect = useCallback(async () => {
    console.log("Connect requested. Checking for window.ethereum...", !!window.ethereum);
    
    if (typeof window === "undefined" || !window.ethereum) {
      // Direct check for MetaMask-specific property if ethereum is missing or being masked
      const isMetaMaskAvailable = window.ethereum || (window as any).metamask;
      if (!isMetaMaskAvailable) {
        alert("MetaMask not detected. Please ensure it is installed and enabled in your browser extensions.");
        return;
      }
    }

    setIsConnecting(true);
    try {
      // Use the standard provider initialization
      const browserProvider = new ethers.BrowserProvider(window.ethereum!);
      
      // Some browsers/extensions might delay initialization
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const accounts = await browserProvider.send("eth_requestAccounts", []);
      console.log("Connected accounts:", accounts);
      
      const network = await browserProvider.getNetwork();
      const signerInstance = await browserProvider.getSigner();
      
      setProvider(browserProvider);
      setSigner(signerInstance);
      setAddress(accounts[0]);
      setChainId(Number(network.chainId));
    } catch (error) {
      console.error("Connection error details:", error);
      alert("Failed to connect to wallet. See console for details.");
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
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
    if (!window.ethereum) return;
    
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${NEO_X_CHAIN_ID.toString(16)}` }],
      });
    } catch (switchError: unknown) {
      // Chain not added, add it
      if ((switchError as { code?: number })?.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [{
              chainId: `0x${NEO_X_CHAIN_ID.toString(16)}`,
              chainName: "Neo X Mainnet",
              nativeCurrency: { name: "GAS", symbol: "GAS", decimals: 18 },
              rpcUrls: [NEO_X_RPC_URL],
              blockExplorerUrls: ["https://xexplorer.neo.org"],
            }],
          });
        } catch (addError) {
          console.error("Error adding network:", addError);
        }
      }
    }
  }, []);

  // Listen for account and chain changes
  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) return;

    const handleAccountsChanged = (accounts: any) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        setAddress(accounts[0]);
      }
    };

    const handleChainChanged = (newChainId: any) => {
      setChainId(parseInt(newChainId as string, 16));
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum?.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum?.removeListener("chainChanged", handleChainChanged);
    };
  }, [disconnect]);

  // Refresh balances when connected
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

// Hook to get contract instances - uses signer from context when available
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

// Extend Window type for ethereum
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, callback: (...args: unknown[]) => void) => void;
      removeListener: (event: string, callback: (...args: unknown[]) => void) => void;
    };
  }
}
