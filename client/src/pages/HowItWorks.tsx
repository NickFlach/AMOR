import { Link } from "wouter";
import { ArrowLeft, Wallet, Coins, Vote, Award, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const steps = [
  {
    number: 1,
    icon: Wallet,
    title: "Connect Your Wallet",
    description: "Connect your Web3 wallet to the AMOR DApp",
    details: [
      "Click the 'Connect Wallet' button in the header",
      "Choose your preferred wallet (MetaMask, WalletConnect, etc.)",
      "Approve the connection request in your wallet",
      "Ensure you're connected to the Neo X mainnet"
    ],
    color: "chart-1"
  },
  {
    number: 2,
    icon: Coins,
    title: "Stake Your AMOR",
    description: "Deposit AMOR tokens to participate in governance",
    details: [
      "Navigate to the Staking section on the dashboard",
      "Enter the amount of AMOR you wish to stake",
      "Approve the AMOR spending allowance (first time only)",
      "Confirm the staking transaction in your wallet"
    ],
    color: "chart-2"
  },
  {
    number: 3,
    icon: Award,
    title: "Receive stAMOR",
    description: "Get voting tokens representing your staked position",
    details: [
      "Receive stAMOR 1:1 for your staked AMOR",
      "stAMOR represents your voting power in governance",
      "Your stAMOR balance is non-transferable by default",
      "Delegate your votes to yourself or another address"
    ],
    color: "chart-3"
  },
  {
    number: 4,
    icon: Vote,
    title: "Participate in Governance",
    description: "Vote on proposals and shape the protocol's future",
    details: [
      "Browse active proposals in the Governance section",
      "Review proposal details and community discussion",
      "Cast your vote: For, Against, or Abstain",
      "Create your own proposals if you meet the threshold"
    ],
    color: "chart-4"
  }
];

export default function HowItWorks() {
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
              <Badge variant="secondary" className="mb-4">Getting Started</Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                How It Works
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
                Start staking AMOR and participating in governance in just a few simple steps. Here's everything you need to know.
              </p>
            </div>
          </div>
        </section>

        <section className="py-8 md:py-12">
          <div className="mx-auto max-w-4xl px-4 md:px-6">
            <div className="relative">
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-border hidden md:block" />
              
              <div className="space-y-8 md:space-y-12">
                {steps.map((step, index) => (
                  <div key={step.number} className="relative">
                    <div className="flex gap-6">
                      <div className="relative z-10 flex-shrink-0">
                        <div 
                          className={`flex h-16 w-16 items-center justify-center rounded-full bg-${step.color}/10 border-2 border-${step.color}`}
                          style={{ 
                            backgroundColor: `hsl(var(--${step.color}) / 0.1)`,
                            borderColor: `hsl(var(--${step.color}))`
                          }}
                        >
                          <step.icon 
                            className="h-7 w-7" 
                            style={{ color: `hsl(var(--${step.color}))` }}
                          />
                        </div>
                      </div>
                      
                      <Card className="flex-1">
                        <CardHeader>
                          <div className="flex items-center gap-3 mb-2">
                            <Badge variant="outline">Step {step.number}</Badge>
                          </div>
                          <CardTitle className="text-2xl">{step.title}</CardTitle>
                          <CardDescription className="text-base">
                            {step.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-3">
                            {step.details.map((detail, idx) => (
                              <li key={idx} className="flex items-start gap-3">
                                <CheckCircle2 className="h-5 w-5 text-chart-1 flex-shrink-0 mt-0.5" />
                                <span className="text-muted-foreground">{detail}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    </div>
                    
                    {index < steps.length - 1 && (
                      <div className="hidden md:flex justify-center py-4 pl-8">
                        <ArrowRight className="h-5 w-5 text-muted-foreground rotate-90" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 md:py-16 bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Key Information
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Unstaking Period</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold font-mono mb-2" data-testid="info-unstaking-period">7 Days</p>
                  <p className="text-sm text-muted-foreground">
                    When you request to unstake, there's a 7-day waiting period before you can claim your AMOR tokens.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Voting Power</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold font-mono mb-2" data-testid="info-voting-ratio">1:1 Ratio</p>
                  <p className="text-sm text-muted-foreground">
                    Your stAMOR balance directly represents your voting power. 1 stAMOR = 1 vote on governance proposals.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Proposal Threshold</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold font-mono mb-2" data-testid="info-proposal-threshold">1%</p>
                  <p className="text-sm text-muted-foreground">
                    To create a proposal, you need at least 1% of total stAMOR supply delegated to your address.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-12 md:py-16">
          <div className="mx-auto max-w-7xl px-4 md:px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join the AMOR governance community today and start making your voice heard.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/">
                <Button size="lg" data-testid="button-start-staking">
                  <Coins className="h-5 w-5" />
                  Start Staking
                </Button>
              </Link>
              <Link href="/faq">
                <Button size="lg" variant="outline" data-testid="link-faq">
                  View FAQ
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
