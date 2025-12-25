import { Link } from "wouter";
import { ArrowLeft, CheckCircle2, Circle, Clock, Rocket, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

type PhaseStatus = "completed" | "current" | "upcoming" | "future";

interface Milestone {
  title: string;
  description: string;
  completed: boolean;
}

interface Phase {
  number: number;
  title: string;
  subtitle: string;
  status: PhaseStatus;
  milestones: Milestone[];
}

const phases: Phase[] = [
  {
    number: 1,
    title: "Foundation",
    subtitle: "Core Infrastructure",
    status: "completed",
    milestones: [
      { title: "AMOR Token Launch", description: "ERC-20 token deployed on Neo X mainnet", completed: true },
      { title: "stAMOR Implementation", description: "ERC20Votes governance token created", completed: true },
      { title: "Staking Manager", description: "Stake/unstake functionality with 7-day unlock", completed: true },
      { title: "Governor Contract", description: "OpenZeppelin Governor implementation deployed", completed: true }
    ]
  },
  {
    number: 2,
    title: "Growth",
    subtitle: "Ecosystem Expansion",
    status: "current",
    milestones: [
      { title: "DApp Launch", description: "User-friendly web interface for staking and governance", completed: true },
      { title: "Guardian AI Integration", description: "AI-powered proposal analysis and recommendations", completed: true },
      { title: "Multi-wallet Support", description: "Integration with major wallet providers", completed: false },
      { title: "Mobile Optimization", description: "Responsive design for mobile users", completed: false }
    ]
  },
  {
    number: 3,
    title: "Expansion",
    subtitle: "Advanced Features",
    status: "upcoming",
    milestones: [
      { title: "Delegation Dashboard", description: "Advanced delegation management and analytics", completed: false },
      { title: "Proposal Templates", description: "Standardized templates for common proposal types", completed: false },
      { title: "Treasury Management", description: "Community-controlled treasury with transparent allocation", completed: false },
      { title: "Cross-chain Bridges", description: "Bridge AMOR to other supported networks", completed: false }
    ]
  },
  {
    number: 4,
    title: "Ecosystem",
    subtitle: "Future Vision",
    status: "future",
    milestones: [
      { title: "DAO Partnerships", description: "Collaborate with other DAOs for shared governance", completed: false },
      { title: "Governance SDK", description: "Tools for developers to build on AMOR", completed: false },
      { title: "Advanced Analytics", description: "Comprehensive on-chain data visualization", completed: false },
      { title: "Governance Mining", description: "Incentives for active governance participation", completed: false }
    ]
  }
];

function getStatusColor(status: PhaseStatus): string {
  switch (status) {
    case "completed": return "bg-chart-1 text-primary-foreground";
    case "current": return "bg-chart-2 text-primary-foreground";
    case "upcoming": return "bg-chart-3/20 text-chart-3";
    case "future": return "bg-muted text-muted-foreground";
  }
}

function getStatusLabel(status: PhaseStatus): string {
  switch (status) {
    case "completed": return "Completed";
    case "current": return "In Progress";
    case "upcoming": return "Upcoming";
    case "future": return "Future";
  }
}

function getPhaseIcon(status: PhaseStatus) {
  switch (status) {
    case "completed": return CheckCircle2;
    case "current": return Clock;
    case "upcoming": return Circle;
    case "future": return Rocket;
  }
}

export default function Roadmap() {
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
              <Badge variant="secondary" className="mb-4">Roadmap</Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                Building the Future
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
                Our development journey toward a fully decentralized governance ecosystem on Neo X.
              </p>
            </div>
          </div>
        </section>

        <section className="py-8 md:py-12">
          <div className="mx-auto max-w-5xl px-4 md:px-6">
            <div className="relative">
              <div className="absolute left-4 md:left-1/2 md:-translate-x-px top-0 bottom-0 w-0.5 bg-border" />
              
              <div className="space-y-12 md:space-y-16">
                {phases.map((phase, phaseIndex) => {
                  const PhaseIcon = getPhaseIcon(phase.status);
                  const isEven = phaseIndex % 2 === 0;
                  
                  return (
                    <div 
                      key={phase.number} 
                      className={`relative flex flex-col md:flex-row gap-6 ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'}`}
                    >
                      <div className="absolute left-4 md:left-1/2 -translate-x-1/2 z-10">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-full ${getStatusColor(phase.status)}`}>
                          <PhaseIcon className="h-4 w-4" />
                        </div>
                      </div>

                      <div className={`flex-1 pl-12 md:pl-0 ${isEven ? 'md:pr-12 md:text-right' : 'md:pl-12'}`}>
                        <div className="hidden md:block" />
                      </div>

                      <div className={`flex-1 pl-12 md:pl-0 ${isEven ? 'md:pl-12' : 'md:pr-12'}`}>
                        <Card data-testid={`phase-${phase.number}`}>
                          <CardHeader>
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <Badge variant="outline">Phase {phase.number}</Badge>
                              <Badge className={getStatusColor(phase.status)}>
                                {getStatusLabel(phase.status)}
                              </Badge>
                            </div>
                            <CardTitle className="text-2xl">{phase.title}</CardTitle>
                            <CardDescription className="text-base">{phase.subtitle}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <ul className="space-y-4">
                              {phase.milestones.map((milestone, idx) => (
                                <li 
                                  key={idx} 
                                  className="flex items-start gap-3"
                                  data-testid={`milestone-${phase.number}-${idx}`}
                                >
                                  {milestone.completed ? (
                                    <CheckCircle2 className="h-5 w-5 text-chart-1 flex-shrink-0 mt-0.5" />
                                  ) : (
                                    <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                                  )}
                                  <div>
                                    <p className={`font-medium ${milestone.completed ? '' : 'text-muted-foreground'}`}>
                                      {milestone.title}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      {milestone.description}
                                    </p>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 md:py-16 bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Progress Overview
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {phases.map((phase) => {
                const completedCount = phase.milestones.filter(m => m.completed).length;
                const totalCount = phase.milestones.length;
                const percentage = Math.round((completedCount / totalCount) * 100);
                
                return (
                  <Card key={phase.number} className="text-center">
                    <CardContent className="pt-6">
                      <Badge className={`${getStatusColor(phase.status)} mb-4`}>
                        {getStatusLabel(phase.status)}
                      </Badge>
                      <p className="font-semibold text-lg mb-1">Phase {phase.number}: {phase.title}</p>
                      <p className="text-3xl font-bold font-mono mb-1" data-testid={`progress-phase-${phase.number}`}>
                        {percentage}%
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {completedCount} of {totalCount} milestones
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        <section className="py-12 md:py-16">
          <div className="mx-auto max-w-7xl px-4 md:px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Be Part of the Journey
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join the AMOR community and help shape the future of decentralized governance.
            </p>
            <Link href="/">
              <Button size="lg" data-testid="button-get-started">
                <Zap className="h-5 w-5" />
                Get Started
              </Button>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
