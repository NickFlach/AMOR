import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, ArrowRight, Check, Loader2 } from "lucide-react";
import { SiX, SiDiscord, SiGithub } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    
    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setIsSubscribed(true);
        setEmail("");
        toast({
          title: "Subscribed!",
          description: "You'll receive updates about AMOR governance and developments.",
        });
      } else {
        toast({
          title: data.message || "Already subscribed",
          description: "This email is already on our list.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to subscribe. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const socialLinks = [
    { icon: SiX, href: "https://x.com/CometMessa70661", label: "X", testId: "link-social-x" },
    { icon: SiDiscord, href: "https://discord.com/channels/1435135541061353615/1435135542038888531", label: "Discord", testId: "link-social-discord" },
    { icon: SiGithub, href: "https://github.com/NickFlach/AMOR", label: "GitHub", testId: "link-social-github" },
  ];

  return (
    <section className="py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <Card className="overflow-visible bg-gradient-to-br from-primary/5 via-transparent to-transparent">
          <CardContent className="p-8 md:p-12">
            <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                  Stay Updated
                </h2>
                <p className="mt-4 text-muted-foreground text-lg">
                  Get the latest updates on governance proposals, staking rewards, 
                  and ecosystem developments delivered to your inbox.
                </p>
                
                <div className="mt-8">
                  <p className="text-sm font-medium mb-4">Join the community</p>
                  <div className="flex flex-wrap gap-3">
                    {socialLinks.map((link) => (
                      <Button
                        key={link.label}
                        variant="outline"
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
                          <link.icon className="h-5 w-5" />
                        </a>
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <Card className="overflow-visible">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <Mail className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">Newsletter</p>
                        <p className="text-sm text-muted-foreground">Weekly governance updates</p>
                      </div>
                    </div>

                    {isSubscribed ? (
                      <div className="flex items-center gap-3 p-4 bg-green-500/10 rounded-md">
                        <Check className="h-5 w-5 text-green-600" />
                        <p className="text-sm font-medium text-green-600">
                          You're subscribed! Check your inbox for confirmation.
                        </p>
                      </div>
                    ) : (
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                          <Input
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="h-12"
                            data-testid="input-newsletter-email"
                          />
                        </div>
                        <Button 
                          type="submit" 
                          className="w-full h-12"
                          disabled={isSubmitting}
                          data-testid="button-newsletter-subscribe"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>Subscribing...</span>
                            </>
                          ) : (
                            <>
                              <span>Subscribe</span>
                              <ArrowRight className="h-4 w-4" />
                            </>
                          )}
                        </Button>
                        <p className="text-xs text-muted-foreground text-center">
                          No spam, unsubscribe anytime. We respect your privacy.
                        </p>
                      </form>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
