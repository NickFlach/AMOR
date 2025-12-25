import { Link } from "wouter";
import { ArrowLeft, MessageCircle, Zap } from "lucide-react";
import { SiDiscord, SiX, SiGithub } from "react-icons/si";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQCategory {
  title: string;
  items: FAQItem[];
}

const faqCategories: FAQCategory[] = [
  {
    title: "General",
    items: [
      {
        question: "What is AMOR?",
        answer: "AMOR is a decentralized governance token built on the Neo X blockchain. It enables community-driven decision making through on-chain proposals and voting, creating a transparent and democratic ecosystem for protocol governance."
      },
      {
        question: "What blockchain is AMOR built on?",
        answer: "AMOR is deployed on Neo X Mainnet (Chain ID: 47763), a high-performance EVM-compatible blockchain that offers fast transaction finality and low gas costs."
      },
      {
        question: "Is AMOR audited?",
        answer: "AMOR's smart contracts are built using battle-tested OpenZeppelin libraries including Governor, ERC20Votes, and TimelockController. We recommend users always do their own research and only stake what they can afford to lose."
      },
      {
        question: "Where can I buy AMOR tokens?",
        answer: "AMOR tokens can be acquired through supported decentralized exchanges on Neo X. Check our official channels for the latest information on where to trade AMOR."
      }
    ]
  },
  {
    title: "Staking",
    items: [
      {
        question: "How do I stake AMOR?",
        answer: "To stake AMOR: 1) Connect your wallet to the DApp, 2) Navigate to the Staking section, 3) Enter the amount you wish to stake, 4) Approve the spending allowance (first time only), 5) Confirm the stake transaction. You'll receive stAMOR 1:1 for your staked AMOR."
      },
      {
        question: "What is the unstaking period?",
        answer: "When you request to unstake, there's a mandatory 7-day waiting period before you can claim your AMOR tokens. This delay helps ensure protocol stability and prevents governance attacks."
      },
      {
        question: "Can I cancel an unstake request?",
        answer: "Yes, you can cancel a pending unstake request at any time before the 7-day period ends. Your stAMOR will be returned and you can continue participating in governance."
      },
      {
        question: "What is stAMOR?",
        answer: "stAMOR is a governance token you receive when staking AMOR. It represents your voting power in the protocol and is minted 1:1 when staking. stAMOR is burned when you claim your unstaked AMOR."
      }
    ]
  },
  {
    title: "Governance",
    items: [
      {
        question: "How do I vote on proposals?",
        answer: "To vote: 1) Ensure you have stAMOR (staked AMOR), 2) Navigate to the Governance section, 3) Find an active proposal, 4) Click on 'For', 'Against', or 'Abstain', 5) Confirm the transaction in your wallet."
      },
      {
        question: "What is the proposal threshold?",
        answer: "To create a proposal, you need to have at least 1% of the total stAMOR supply delegated to your address. This threshold prevents spam and ensures proposers have meaningful stake in the protocol."
      },
      {
        question: "How long do votes last?",
        answer: "The voting period for proposals is determined by the Governor contract parameters. After voting ends, successful proposals enter a timelock period before execution to allow for any necessary response time."
      },
      {
        question: "What is vote delegation?",
        answer: "Vote delegation allows you to assign your voting power to another address while keeping your staked tokens. You can delegate to yourself (to vote directly) or to a representative who votes on your behalf."
      }
    ]
  },
  {
    title: "Technical",
    items: [
      {
        question: "Which wallets are supported?",
        answer: "AMOR DApp supports any Web3 wallet compatible with WalletConnect, including MetaMask, Trust Wallet, Coinbase Wallet, and many others. Simply click 'Connect Wallet' and choose your preferred option."
      },
      {
        question: "What are the contract addresses?",
        answer: "All AMOR contracts are deployed on Neo X Mainnet. The main contracts are: AMOR Token (0x7C83...058e), stAMOR (0x5839...c565), Staking Manager (0xae73...E7d6), Governor (0xaf59...5146), and Timelock (0x05fd...8eAD). Full addresses are available in the Tokenomics section."
      },
      {
        question: "How do I add Neo X to my wallet?",
        answer: "The DApp will automatically prompt you to add Neo X network when you connect. Alternatively, you can manually add it: Network Name: Neo X, RPC URL: https://mainnet-1.rpc.banelabs.org, Chain ID: 47763, Symbol: GAS."
      },
      {
        question: "What is the Guardian AI?",
        answer: "The Guardian AI is an intelligent assistant that analyzes governance proposals, provides insights on potential impacts, and helps users make informed voting decisions. It's designed to enhance governance participation without replacing human judgment."
      }
    ]
  }
];

const socialLinks = [
  { name: "Discord", icon: SiDiscord, href: "#", color: "hover:text-[#5865F2]" },
  { name: "X (Twitter)", icon: SiX, href: "#", color: "hover:text-foreground" },
  { name: "GitHub", icon: SiGithub, href: "#", color: "hover:text-foreground" }
];

export default function FAQ() {
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
              <Badge variant="secondary" className="mb-4">FAQ</Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                Frequently Asked Questions
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
                Find answers to common questions about AMOR staking, governance, and the ecosystem.
              </p>
            </div>
          </div>
        </section>

        <section className="py-8 md:py-12">
          <div className="mx-auto max-w-4xl px-4 md:px-6">
            <div className="space-y-8">
              {faqCategories.map((category) => (
                <Card key={category.title}>
                  <CardHeader>
                    <CardTitle className="text-xl">{category.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      {category.items.map((item, idx) => (
                        <AccordionItem 
                          key={idx} 
                          value={`${category.title}-${idx}`}
                          data-testid={`faq-${category.title.toLowerCase()}-${idx}`}
                        >
                          <AccordionTrigger 
                            className="text-left"
                            data-testid={`faq-trigger-${category.title.toLowerCase()}-${idx}`}
                          >
                            {item.question}
                          </AccordionTrigger>
                          <AccordionContent className="text-muted-foreground">
                            {item.answer}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-12 md:py-16 bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <div className="text-center mb-12">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Still Have Questions?
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Join our community channels to get help from the team and other community members.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-4">
              {socialLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid={`link-${link.name.toLowerCase().replace(/\s/g, '-')}`}
                >
                  <Button variant="outline" size="lg" className={link.color}>
                    <link.icon className="h-5 w-5" />
                    {link.name}
                  </Button>
                </a>
              ))}
            </div>
          </div>
        </section>

        <section className="py-12 md:py-16">
          <div className="mx-auto max-w-7xl px-4 md:px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Start staking AMOR and participate in shaping the future of decentralized governance.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/">
                <Button size="lg" data-testid="button-start-staking">
                  <Zap className="h-5 w-5" />
                  Start Staking
                </Button>
              </Link>
              <Link href="/how-it-works">
                <Button size="lg" variant="outline" data-testid="link-how-it-works">
                  Learn How It Works
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
