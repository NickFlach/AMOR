import { ExternalLink, Copy, Check, Zap } from "lucide-react";
import { SiX, SiDiscord, SiTelegram, SiGithub } from "react-icons/si";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CONTRACTS, getExplorerLink } from "@/lib/contracts";
import { Link } from "wouter";

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

  const quickLinks = [
    { name: "About", href: "/about" },
    { name: "How It Works", href: "/how-it-works" },
    { name: "Tokenomics", href: "/tokenomics" },
    { name: "Roadmap", href: "/roadmap" },
    { name: "FAQ", href: "/faq" },
  ];

  const socialLinks = [
    { icon: SiX, href: "https://twitter.com/AMORProtocol", label: "X", testId: "footer-link-twitter" },
    { icon: SiDiscord, href: "https://discord.gg/amor", label: "Discord", testId: "footer-link-discord" },
    { icon: SiTelegram, href: "https://t.me/AMORProtocol", label: "Telegram", testId: "footer-link-telegram" },
    { icon: SiGithub, href: "https://github.com/amor-protocol", label: "GitHub", testId: "footer-link-github" },
  ];

  return (
    <footer id="contracts" className="border-t border-border bg-card/50 py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary">
                <Zap className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-bold">AMOR</h3>
                <p className="text-xs text-muted-foreground">Consciousness Nexus</p>
              </div>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Stake AMOR tokens to receive stAMOR voting power 
              and participate in decentralized governance.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500/20">
                <div className="h-2 w-2 rounded-full bg-green-500" />
              </div>
              <span className="text-sm text-muted-foreground">Neo X Mainnet</span>
            </div>
            
            <div className="mt-6 flex items-center gap-2">
              {socialLinks.map((link) => (
                <Button
                  key={link.label}
                  variant="ghost"
                  size="icon"
                  asChild
                  data-testid={link.testId}
                >
                  <a 
                    href={link.href} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    aria-label={link.label}
                  >
                    <link.icon className="h-4 w-4" />
                  </a>
                </Button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    data-testid={`footer-link-${link.name.toLowerCase().replace(/\s/g, "-")}`}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h4 className="font-semibold mb-4">Smart Contracts</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Verified on Neo X Explorer
            </p>
            <div className="grid gap-1 sm:grid-cols-2">
              {contracts.map((contract) => (
                <ContractLink key={contract.address} {...contract} />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground">
            {new Date().getFullYear()} AMOR Protocol - Consciousness Nexus v1.0
          </p>
          <div className="flex flex-wrap items-center gap-4">
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
            <Link
              href="/faq"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              data-testid="link-faq-footer"
            >
              FAQ
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
