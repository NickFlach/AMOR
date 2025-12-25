import { Wallet, ExternalLink, LogOut, AlertTriangle, Loader2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "./ThemeToggle";
import { useWeb3 } from "@/lib/web3";
import { truncateAddress, getExplorerLink, NEO_X_CHAIN_ID } from "@/lib/contracts";

export function Header() {
  const { 
    address, 
    isConnecting, 
    isConnected, 
    isCorrectNetwork, 
    connect, 
    disconnect, 
    switchNetwork,
    amorBalance,
    stAmorBalance 
  } = useWeb3();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">AMOR</h1>
              <p className="text-xs text-muted-foreground">Consciousness Nexus</p>
            </div>
          </div>

          {/* Nav Links - Desktop */}
          <nav className="hidden md:flex items-center gap-6">
            <a 
              href="#staking" 
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              data-testid="link-staking"
            >
              Staking
            </a>
            <a 
              href="#governance" 
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              data-testid="link-governance"
            >
              Governance
            </a>
            <a 
              href="#contracts" 
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              data-testid="link-contracts"
            >
              Contracts
            </a>
          </nav>

          {/* Right Side */}
          <div className="flex items-center gap-2">
            {isConnected && isCorrectNetwork && (
              <div className="hidden sm:flex items-center gap-2">
                <Badge variant="secondary" className="font-mono text-xs">
                  {parseFloat(amorBalance).toLocaleString(undefined, { maximumFractionDigits: 2 })} AMOR
                </Badge>
                <Badge variant="outline" className="font-mono text-xs">
                  {parseFloat(stAmorBalance).toLocaleString(undefined, { maximumFractionDigits: 2 })} stAMOR
                </Badge>
              </div>
            )}

            {!isConnected ? (
              <div className="flex flex-col items-end gap-1">
                <Button
                  onClick={connect}
                  disabled={isConnecting}
                  data-testid="button-connect-wallet"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Connecting...</span>
                    </>
                  ) : (
                    <>
                      <Wallet className="h-4 w-4" />
                      <span>Connect Wallet</span>
                    </>
                  )}
                </Button>
                {typeof window !== "undefined" && !window.ethereum && (
                  <span className="text-[10px] text-destructive animate-pulse px-1">
                    MetaMask not detected
                  </span>
                )}
              </div>
            ) : !isCorrectNetwork ? (
              <Button
                onClick={switchNetwork}
                variant="destructive"
                data-testid="button-switch-network"
              >
                <AlertTriangle className="h-4 w-4" />
                <span>Switch to Neo X</span>
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <a
                  href={getExplorerLink(address!)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-md bg-card px-3 py-2 text-sm font-mono transition-colors hover:bg-accent"
                  data-testid="link-wallet-address"
                >
                  <span>{truncateAddress(address!)}</span>
                  <ExternalLink className="h-3 w-3 text-muted-foreground" />
                </a>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={disconnect}
                  data-testid="button-disconnect"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            )}

            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
