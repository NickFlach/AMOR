import { ArrowRight, TrendingUp, Vote, ExternalLink, Wallet, Shield, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useWeb3 } from "@/lib/web3";
import { CONTRACTS, getExplorerLink } from "@/lib/contracts";

interface StatCardProps {
  icon: typeof TrendingUp;
  label: string;
  value: string;
  subValue?: string;
  highlight?: boolean;
}

function StatCard({ icon: Icon, label, value, subValue, highlight }: StatCardProps) {
  return (
    <Card className={`overflow-visible transition-all duration-300 ${highlight ? 'ring-1 ring-primary/20' : ''}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              {label}
            </p>
            <p className="mt-2 text-2xl font-bold md:text-3xl font-mono">{value}</p>
            {subValue && (
              <p className="mt-1 text-sm text-muted-foreground">{subValue}</p>
            )}
          </div>
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${highlight ? 'bg-primary' : 'bg-primary/10'}`}>
            <Icon className={`h-5 w-5 ${highlight ? 'text-primary-foreground' : 'text-primary'}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function Hero() {
  const { isConnected, connect, votingPower, activeStake } = useWeb3();

  const features = [
    { icon: Shield, text: "Secure & Audited" },
    { icon: Zap, text: "Instant Staking" },
    { icon: Vote, text: "On-chain Governance" },
  ];

  return (
    <section className="relative py-16 md:py-24 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
      
      <div className="relative mx-auto max-w-7xl px-4 md:px-6">
        <div className="mx-auto max-w-4xl text-center">
          <Badge variant="secondary" className="mb-6" data-testid="badge-network">
            <span className="relative flex h-2 w-2 mr-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            Live on Neo X Mainnet
          </Badge>
          
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl xl:text-7xl">
            Stake. <span className="text-primary">Govern.</span> Shape the Future.
          </h1>
          
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl leading-relaxed">
            Join the Consciousness Nexus on Neo X. Stake your AMOR tokens to earn stAMOR voting power 
            and actively participate in decentralized governance decisions that shape our ecosystem.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                <feature.icon className="h-4 w-4 text-primary" />
                <span>{feature.text}</span>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            {!isConnected ? (
              <Button size="lg" onClick={connect} data-testid="button-hero-connect" className="min-w-[200px]">
                <Wallet className="h-5 w-5" />
                <span>Connect Wallet</span>
              </Button>
            ) : (
              <Button size="lg" asChild className="min-w-[200px]">
                <a href="#staking" data-testid="link-hero-stake">
                  <Sparkles className="h-5 w-5" />
                  <span>Start Staking</span>
                </a>
              </Button>
            )}
            <Button variant="outline" size="lg" asChild>
              <a href="/how-it-works" data-testid="link-learn-more">
                <span>Learn How It Works</span>
                <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <a 
              href={getExplorerLink(CONTRACTS.AMOR)} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1 transition-colors hover:text-foreground"
              data-testid="link-view-token"
            >
              View AMOR on Explorer
              <ExternalLink className="h-3 w-3" />
            </a>
            <span className="text-border">|</span>
            <a 
              href="/about"
              className="flex items-center gap-1 transition-colors hover:text-foreground"
              data-testid="link-about"
            >
              About AMOR
            </a>
            <span className="text-border">|</span>
            <a 
              href="/tokenomics"
              className="flex items-center gap-1 transition-colors hover:text-foreground"
              data-testid="link-tokenomics"
            >
              Tokenomics
            </a>
          </div>
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            icon={TrendingUp}
            label="Your Active Stake"
            value={isConnected ? `${parseFloat(activeStake).toLocaleString(undefined, { maximumFractionDigits: 2 })} AMOR` : "---"}
            subValue={isConnected ? "Staked in protocol" : "Connect wallet to view"}
            highlight={isConnected && parseFloat(activeStake) > 0}
          />
          <StatCard
            icon={Vote}
            label="Your Voting Power"
            value={isConnected ? `${parseFloat(votingPower).toLocaleString(undefined, { maximumFractionDigits: 2 })} stAMOR` : "---"}
            subValue={isConnected ? "Governance weight" : "Connect wallet to view"}
            highlight={isConnected && parseFloat(votingPower) > 0}
          />
          <StatCard
            icon={Zap}
            label="Network"
            value="Neo X Mainnet"
            subValue="Chain ID: 47763"
          />
        </div>
      </div>
    </section>
  );
}
