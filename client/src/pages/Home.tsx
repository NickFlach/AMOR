import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { StakingPanel } from "@/components/StakingPanel";
import { GovernanceSection } from "@/components/GovernanceSection";
import { GuardianPanel } from "@/components/GuardianPanel";
import { SocialProof } from "@/components/SocialProof";
import { Newsletter } from "@/components/Newsletter";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <SocialProof />
        <StakingPanel />
        <GovernanceSection />
        <GuardianPanel />
        <Newsletter />
      </main>
      <Footer />
    </div>
  );
}
