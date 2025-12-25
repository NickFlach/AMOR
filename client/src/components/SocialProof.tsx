import { Users, TrendingUp, Vote, Award, Shield, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useState, useEffect } from "react";

interface StatProps {
  value: number;
  suffix?: string;
  label: string;
  icon: typeof Users;
}

function AnimatedStat({ value, suffix = "", label, icon: Icon }: StatProps) {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const elementId = `stat-${label.replace(/\s/g, '-')}`;
    const element = document.getElementById(elementId);
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          let startTime: number;
          const duration = 2000;
          let animationFrame: number;

          const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            setCount(Math.floor(easeOutQuart * value));

            if (progress < 1) {
              animationFrame = requestAnimationFrame(animate);
            }
          };

          animationFrame = requestAnimationFrame(animate);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [value, label, hasAnimated]);

  return (
    <div id={`stat-${label.replace(/\s/g, '-')}`} className="text-center p-6">
      <div className="flex justify-center mb-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Icon className="h-6 w-6 text-primary" />
        </div>
      </div>
      <p className="text-3xl font-bold font-mono md:text-4xl">
        {count.toLocaleString()}{suffix}
      </p>
      <p className="mt-1 text-sm text-muted-foreground uppercase tracking-wide">{label}</p>
    </div>
  );
}

export function SocialProof() {
  const stats = [
    { value: 1000, suffix: "+", label: "Token Holders", icon: Users },
    { value: 500000, suffix: "+", label: "AMOR Staked", icon: TrendingUp },
    { value: 25, suffix: "+", label: "Proposals", icon: Vote },
    { value: 99, suffix: "%", label: "Uptime", icon: Zap },
  ];

  const features = [
    {
      icon: Shield,
      title: "Secure & Audited",
      description: "Smart contracts audited for maximum security"
    },
    {
      icon: Zap,
      title: "Fast Finality",
      description: "Neo X provides rapid transaction confirmation"
    },
    {
      icon: Award,
      title: "Community Governed",
      description: "All decisions made by token holders"
    },
  ];

  return (
    <section className="py-16 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Trusted by the Community
          </h2>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
            Join thousands of AMOR holders participating in decentralized governance
          </p>
        </div>

        <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-4 mb-16">
          {stats.map((stat) => (
            <Card key={stat.label} className="overflow-visible">
              <AnimatedStat {...stat} />
            </Card>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title} className="overflow-visible">
              <CardContent className="p-6 text-center">
                <div className="flex justify-center mb-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                    <feature.icon className="h-7 w-7 text-primary" />
                  </div>
                </div>
                <h3 className="font-semibold text-lg">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
