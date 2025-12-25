import { Wallet, ExternalLink, AlertTriangle, Loader2, Zap, Menu, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "./ThemeToggle";
import { useWeb3 } from "@/lib/web3";
import { truncateAddress } from "@/lib/contracts";
import { Link, useLocation } from "wouter";
import { useState, useRef, useEffect } from "react";

export function Header() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [learnMenuOpen, setLearnMenuOpen] = useState(false);
  const learnMenuRef = useRef<HTMLDivElement>(null);
  
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

  const isHome = location === "/";

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (learnMenuRef.current && !learnMenuRef.current.contains(event.target as Node)) {
        setLearnMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const mainNavLinks = isHome ? [
    { name: "Staking", href: "#staking", isAnchor: true },
    { name: "Governance", href: "#governance", isAnchor: true },
    { name: "Guardian", href: "#guardian", isAnchor: true },
  ] : [];

  const pageLinks = [
    { name: "About", href: "/about" },
    { name: "How It Works", href: "/how-it-works" },
    { name: "Tokenomics", href: "/tokenomics" },
    { name: "Roadmap", href: "/roadmap" },
    { name: "FAQ", href: "/faq" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3" data-testid="link-home">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-lg font-bold tracking-tight">AMOR</p>
              <p className="text-xs text-muted-foreground">Consciousness Nexus</p>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-6">
            {mainNavLinks.map((link) => (
              <a 
                key={link.name}
                href={link.href} 
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                data-testid={`link-${link.name.toLowerCase()}`}
              >
                {link.name}
              </a>
            ))}
            
            <div className="relative" ref={learnMenuRef}>
              <Button 
                variant="ghost" 
                size="sm" 
                className="gap-1" 
                onClick={() => setLearnMenuOpen(!learnMenuOpen)}
                data-testid="button-learn-dropdown"
              >
                <span>Learn</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${learnMenuOpen ? 'rotate-180' : ''}`} />
              </Button>
              
              {learnMenuOpen && (
                <div className="absolute top-full right-0 mt-2 w-48 rounded-md border border-border bg-popover p-1 shadow-lg z-50">
                  {pageLinks.map((link) => (
                    <Link 
                      key={link.name}
                      href={link.href}
                      className="block px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors"
                      onClick={() => setLearnMenuOpen(false)}
                      data-testid={`link-nav-${link.name.toLowerCase().replace(/\s/g, "-")}`}
                    >
                      {link.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </nav>

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
              <Button
                onClick={connect}
                disabled={isConnecting}
                data-testid="button-connect-wallet"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="hidden sm:inline">Connecting...</span>
                  </>
                ) : (
                  <>
                    <Wallet className="h-4 w-4" />
                    <span className="hidden sm:inline">Connect Wallet</span>
                  </>
                )}
              </Button>
            ) : !isCorrectNetwork ? (
              <Button
                onClick={switchNetwork}
                variant="destructive"
                data-testid="button-switch-network"
              >
                <AlertTriangle className="h-4 w-4" />
                <span className="hidden sm:inline">Switch to Neo X</span>
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={disconnect}
                data-testid="button-wallet-address"
                className="font-mono"
              >
                <span>{truncateAddress(address!)}</span>
                <ExternalLink className="h-3 w-3 text-muted-foreground" />
              </Button>
            )}

            <ThemeToggle />

            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {mobileMenuOpen && (
          <nav className="lg:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-2">
              {mainNavLinks.map((link) => (
                <a 
                  key={link.name}
                  href={link.href}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                  data-testid={`link-mobile-${link.name.toLowerCase()}`}
                >
                  {link.name}
                </a>
              ))}
              <div className="border-t border-border my-2" />
              <p className="px-4 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Learn</p>
              {pageLinks.map((link) => (
                <Link 
                  key={link.name}
                  href={link.href}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                  data-testid={`link-mobile-${link.name.toLowerCase().replace(/\s/g, "-")}`}
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
