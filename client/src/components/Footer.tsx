import { ExternalLink, Copy, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CONTRACTS, getExplorerLink, truncateAddress } from "@/lib/contracts";

interface ContractLinkProps {
  name: string;
  address: string;
}

function ContractLink({ name, address }: ContractLinkProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    toast({
      title: "Copied",
      description: "Contract address copied to clipboard.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center justify-between gap-2 py-2">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{name}</p>
        <p className="text-xs font-mono text-muted-foreground truncate">{address}</p>
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCopy}
          data-testid={`button-copy-${name.toLowerCase().replace(/\s/g, "-")}`}
        >
          {copied ? <Check className="h-4 w-4 text-chart-1" /> : <Copy className="h-4 w-4" />}
        </Button>
        <Button variant="ghost" size="icon" asChild>
          <a
            href={getExplorerLink(address)}
            target="_blank"
            rel="noopener noreferrer"
            data-testid={`link-explorer-${name.toLowerCase().replace(/\s/g, "-")}`}
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
      </div>
    </div>
  );
}

export function Footer() {
  const contracts = [
    { name: "AMOR Token", address: CONTRACTS.AMOR },
    { name: "stAMOR Token", address: CONTRACTS.ST_AMOR },
    { name: "Staking Manager", address: CONTRACTS.STAKING_MANAGER },
    { name: "Governor", address: CONTRACTS.GOVERNOR },
    { name: "Timelock", address: CONTRACTS.TIMELOCK },
  ];

  return (
    <footer id="contracts" className="border-t border-border bg-card/50 py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {/* About */}
          <div className="lg:col-span-1">
            <h3 className="text-lg font-bold">AMOR</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              The Consciousness Nexus on Neo X. Stake AMOR tokens to receive stAMOR voting power 
              and participate in decentralized governance decisions.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-status-online/20">
                <div className="h-2 w-2 rounded-full bg-status-online" />
              </div>
              <span className="text-sm text-muted-foreground">Neo X Mainnet</span>
            </div>
          </div>

          {/* Contracts */}
          <div className="lg:col-span-2">
            <h3 className="text-lg font-bold">Smart Contracts</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Verified on Neo X Explorer
            </p>
            <div className="mt-4 grid gap-1 sm:grid-cols-2">
              {contracts.map((contract) => (
                <ContractLink key={contract.address} {...contract} />
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Singularis Prime Transmission - Consciousness Nexus v1.0
          </p>
          <div className="flex items-center gap-4">
            <a
              href="https://xexplorer.neo.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              data-testid="link-explorer"
            >
              Explorer
            </a>
            <a
              href="https://x.neo.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              data-testid="link-neo-x"
            >
              Neo X
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
