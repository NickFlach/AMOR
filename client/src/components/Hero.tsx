import { ArrowRight, TrendingUp, Users, Vote, ExternalLink, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useWeb3 } from "@/lib/web3";
import { CONTRACTS, getExplorerLink } from "@/lib/contracts";

interface StatCardProps {
  icon: typeof TrendingUp;
  label: string;
  value: string;
  subValue?: string;
}

function StatCard({ icon: Icon, label, value, subValue }: StatCardProps) {
  return (
    <Card className="overflow-visible">
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
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function Hero() {
  const { isConnected, connect, votingPower, activeStake } = useWeb3();

  return (
    <section className="py-12 md:py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        {/* Hero Text */}
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
            The <span className="text-primary">Consciousness Nexus</span>
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
            Stake AMOR to earn stAMOR voting power and participate in on-chain governance. 
            Shape the future of the decentralized ecosystem on Neo X.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            {!isConnected ? (
              <Button size="lg" onClick={connect} data-testid="button-hero-connect">
                <Wallet className="h-5 w-5" />
                <span>Connect Wallet</span>
              </Button>
            ) : (
              <Button size="lg" asChild>
                <a href="#staking" data-testid="link-hero-stake">
                  <ArrowRight className="h-5 w-5" />
                  <span>Start Staking</span>
                </a>
              </Button>
            )}
            <Button variant="outline" size="lg" asChild>
              <a 
                href={getExplorerLink(CONTRACTS.AMOR)} 
                target="_blank" 
                rel="noopener noreferrer"
                data-testid="link-view-token"
              >
                <span>View on Explorer</span>
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            icon={TrendingUp}
            label="Your Active Stake"
            value={isConnected ? `${parseFloat(activeStake).toLocaleString(undefined, { maximumFractionDigits: 2 })} AMOR` : "---"}
            subValue={isConnected ? "Staked in protocol" : "Connect wallet to view"}
          />
          <StatCard
            icon={Vote}
            label="Your Voting Power"
            value={isConnected ? `${parseFloat(votingPower).toLocaleString(undefined, { maximumFractionDigits: 2 })} stAMOR` : "---"}
            subValue={isConnected ? "Governance weight" : "Connect wallet to view"}
          />
          <StatCard
            icon={Users}
            label="Network"
            value="Neo X"
            subValue="Chain ID: 47763"
          />
        </div>
      </div>
    </section>
  );
}
