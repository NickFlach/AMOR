import { Link } from "wouter";
import { ArrowLeft, Heart, Shield, Users, Eye, Zap, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const coreValues = [
  {
    icon: Shield,
    title: "Decentralization",
    description: "True decentralization through on-chain governance. No central authority controls the protocol - power resides with the community of stakers."
  },
  {
    icon: Eye,
    title: "Transparency",
    description: "Every action, proposal, and vote is recorded on-chain. Full auditability ensures trust and accountability at every level."
  },
  {
    icon: Users,
    title: "Community",
    description: "Built by the community, for the community. AMOR thrives through collective participation and shared decision-making."
  }
];

export default function About() {
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
              <Badge variant="secondary" className="mb-4">About AMOR</Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                Building the Future of
                <span className="block text-primary">Decentralized Governance</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
                AMOR is more than a token - it's a movement toward conscious, community-driven decision making on the Neo X blockchain.
              </p>
            </div>
          </div>
        </section>

        <section className="py-12 md:py-16 bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <Badge variant="outline" className="mb-4">Our Mission</Badge>
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                  Empowering Communities Through Decentralized Governance
                </h2>
                <p className="text-muted-foreground text-lg mb-4">
                  Our mission is to create a truly decentralized governance framework that enables communities to make collective decisions transparently and efficiently.
                </p>
                <p className="text-muted-foreground text-lg">
                  Through the AMOR staking mechanism, we align incentives between stakeholders and create a sustainable ecosystem where every voice matters.
                </p>
              </div>
              <Card>
                <CardContent className="p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary">
                      <Heart className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Core Principle</p>
                      <p className="font-semibold">Community First</p>
                    </div>
                  </div>
                  <p className="text-muted-foreground">
                    Every protocol upgrade, treasury allocation, and strategic decision is made by the community through on-chain proposals and voting.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-12 md:py-16">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4">Our Vision</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                A World of Conscious Collaboration
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                We envision a future where decentralized organizations operate seamlessly, making decisions that benefit all stakeholders through transparent, on-chain governance.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <Card className="text-center">
                <CardContent className="pt-8">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-chart-1/10 mx-auto mb-4">
                    <Zap className="h-7 w-7 text-chart-1" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Instant Finality</h3>
                  <p className="text-muted-foreground text-sm">
                    Leveraging Neo X's high-performance blockchain for fast, reliable governance operations.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="pt-8">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-chart-2/10 mx-auto mb-4">
                    <Shield className="h-7 w-7 text-chart-2" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Battle-Tested Security</h3>
                  <p className="text-muted-foreground text-sm">
                    Built on OpenZeppelin's Governor framework with time-locked execution for maximum safety.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="pt-8">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-chart-3/10 mx-auto mb-4">
                    <Globe className="h-7 w-7 text-chart-3" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Global Access</h3>
                  <p className="text-muted-foreground text-sm">
                    Permissionless participation - anyone can stake, vote, and contribute to governance.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-12 md:py-16 bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4">Core Values</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                What We Stand For
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {coreValues.map((value) => (
                <Card key={value.title}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                        <value.icon className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle className="text-xl">{value.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{value.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-12 md:py-16">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4">Early Access</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Be an Early Pioneer
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                AMOR is in its early stages on Neo X Mainnet. Join now to help shape the future of decentralized governance from the ground up.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              <Card className="text-center">
                <CardContent className="pt-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-chart-1/10 mx-auto mb-3">
                    <Users className="h-6 w-6 text-chart-1" />
                  </div>
                  <p className="font-semibold mb-1">Founding Community</p>
                  <p className="text-sm text-muted-foreground">Be among the first to stake and gain voting power</p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="pt-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-chart-2/10 mx-auto mb-3">
                    <Shield className="h-6 w-6 text-chart-2" />
                  </div>
                  <p className="font-semibold mb-1">Shape Governance</p>
                  <p className="text-sm text-muted-foreground">Your early participation influences protocol direction</p>
                </CardContent>
              </Card>
              <Card className="text-center sm:col-span-2 lg:col-span-1">
                <CardContent className="pt-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-chart-3/10 mx-auto mb-3">
                    <Heart className="h-6 w-6 text-chart-3" />
                  </div>
                  <p className="font-semibold mb-1">Community Driven</p>
                  <p className="text-sm text-muted-foreground">Every decision made together, on-chain</p>
                </CardContent>
              </Card>
            </div>

            <div className="text-center">
              <Link href="/">
                <Button size="lg" data-testid="button-start-staking">
                  <Zap className="h-5 w-5" />
                  Start Staking Now
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
