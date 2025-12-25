import { Shield, Zap, Award } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function SocialProof() {
  const features = [
    {
      icon: Shield,
      title: "Secure & Audited",
      description: "Smart contracts designed with security-first principles"
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
            Why Choose AMOR?
          </h2>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
            Built on Neo X with a focus on security, speed, and true decentralization
          </p>
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
