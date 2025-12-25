import { Link } from "wouter";
import { ArrowLeft, Coins, Vote, Gift, Lock, ExternalLink, Copy, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CONTRACTS, getExplorerLink, truncateAddress } from "@/lib/contracts";

const tokenDistribution = [
  { label: "Community & Staking", percentage: 40, color: "bg-chart-1" },
  { label: "Development Fund", percentage: 25, color: "bg-chart-2" },
  { label: "Treasury", percentage: 20, color: "bg-chart-3" },
  { label: "Team (Vested)", percentage: 10, color: "bg-chart-4" },
  { label: "Ecosystem Grants", percentage: 5, color: "bg-primary" }
];

const tokenUtilities = [
  {
    icon: Coins,
    title: "Staking",
    description: "Stake AMOR to receive stAMOR and participate in protocol governance. Your staked tokens are locked but can be unstaked after a 7-day waiting period."
  },
  {
    icon: Vote,
    title: "Governance",
    description: "Use your stAMOR voting power to vote on proposals, delegate to representatives, and help shape the future of the protocol."
  },
  {
    icon: Gift,
    title: "Rewards",
    description: "Earn protocol rewards through active participation in governance. Voters and proposal creators may receive additional incentives."
  },
  {
    icon: Lock,
    title: "Security",
    description: "Staked AMOR helps secure the protocol by ensuring long-term alignment between token holders and the protocol's success."
  }
];

const contracts = [
  { name: "AMOR Token", address: CONTRACTS.AMOR, description: "Main ERC-20 token contract" },
  { name: "stAMOR Token", address: CONTRACTS.ST_AMOR, description: "ERC-20Votes staking receipt token" },
  { name: "Staking Manager", address: CONTRACTS.STAKING_MANAGER, description: "Handles staking and unstaking" },
  { name: "Governor", address: CONTRACTS.GOVERNOR, description: "On-chain governance contract" },
  { name: "Timelock", address: CONTRACTS.TIMELOCK, description: "Time-delayed execution controller" }
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button 
      size="icon" 
      variant="ghost" 
      onClick={handleCopy}
      data-testid={`button-copy-${text.slice(0, 8)}`}
    >
      {copied ? (
        <Check className="h-4 w-4 text-chart-1" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </Button>
  );
}

export default function Tokenomics() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <section className="py-12 md:py-20">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <Link href="/">
              <Button variant="ghost" className="mb-8" data-testid="link-back-home">
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Button>
            </Link>

            <div className="text-center mb-16">
              <Badge variant="secondary" className="mb-4">Tokenomics</Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                AMOR Token Economy
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
                Understanding the AMOR and stAMOR token system that powers decentralized governance on Neo X.
              </p>
            </div>
          </div>
        </section>

        <section className="py-12 md:py-16 bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4">Token Overview</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Two-Token System
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                AMOR uses a dual-token model for staking and governance.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary">
                      <Coins className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div>
                      <CardTitle>AMOR</CardTitle>
                      <CardDescription>Base Token</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    AMOR is the native ERC-20 token of the ecosystem. It can be freely transferred, traded, and staked to participate in governance.
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Type</span>
                      <span className="font-mono">ERC-20</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Decimals</span>
                      <span className="font-mono">18</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Transferable</span>
                      <Badge variant="secondary">Yes</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-md bg-chart-2">
                      <Vote className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div>
                      <CardTitle>stAMOR</CardTitle>
                      <CardDescription>Governance Token</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    stAMOR represents staked AMOR and carries voting power. It's minted 1:1 when staking and burned when unstaking is claimed.
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Type</span>
                      <span className="font-mono">ERC20Votes</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Decimals</span>
                      <span className="font-mono">18</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Voting Power</span>
                      <Badge variant="secondary">1:1</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-12 md:py-16">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4">Utility</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Token Utility
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {tokenUtilities.map((utility) => (
                <Card key={utility.title}>
                  <CardContent className="pt-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 mb-4">
                      <utility.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{utility.title}</h3>
                    <p className="text-sm text-muted-foreground">{utility.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-12 md:py-16 bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4">Distribution</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Token Distribution
              </h2>
            </div>

            <Card className="max-w-2xl mx-auto">
              <CardContent className="pt-6 space-y-6">
                {tokenDistribution.map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">{item.label}</span>
                      <span className="font-mono text-muted-foreground">{item.percentage}%</span>
                    </div>
                    <Progress 
                      value={item.percentage} 
                      className="h-3"
                      data-testid={`progress-${item.label.toLowerCase().replace(/\s/g, '-')}`}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="py-12 md:py-16">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4">Smart Contracts</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Contract Addresses
              </h2>
              <p className="text-muted-foreground">
                All contracts are deployed on Neo X Mainnet
              </p>
            </div>

            <div className="space-y-4 max-w-3xl mx-auto">
              {contracts.map((contract) => (
                <Card key={contract.name}>
                  <CardContent className="py-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold">{contract.name}</p>
                        <p className="text-sm text-muted-foreground">{contract.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="text-xs sm:text-sm font-mono bg-muted px-2 py-1 rounded" data-testid={`address-${contract.name.toLowerCase().replace(/\s/g, '-')}`}>
                          {truncateAddress(contract.address)}
                        </code>
                        <CopyButton text={contract.address} />
                        <a
                          href={getExplorerLink(contract.address)}
                          target="_blank"
                          rel="noopener noreferrer"
                          data-testid={`link-explorer-${contract.name.toLowerCase().replace(/\s/g, '-')}`}
                        >
                          <Button size="icon" variant="ghost">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-12 md:py-16 bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 md:px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Start Earning with AMOR
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Stake your AMOR tokens and begin participating in protocol governance today.
            </p>
            <Link href="/">
              <Button size="lg" data-testid="button-start-staking">
                <Coins className="h-5 w-5" />
                Start Staking
              </Button>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
