import { Button } from "@/components/ui/button";
import { SiX, SiTelegram, SiDiscord } from "react-icons/si";
import { Link2, Check } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface SocialShareProps {
  title?: string;
  description?: string;
  url?: string;
  showLabel?: boolean;
  size?: "sm" | "default";
}

export function SocialShare({ 
  title = "AMOR - Consciousness Nexus on Neo X", 
  description = "Stake AMOR tokens to earn stAMOR voting power and participate in decentralized governance.",
  url = typeof window !== 'undefined' ? window.location.href : 'https://amor.network',
  showLabel = false,
  size = "default"
}: SocialShareProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  
  const encodedTitle = encodeURIComponent(title);
  const encodedDescription = encodeURIComponent(description);
  const encodedUrl = encodeURIComponent(url);
  
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`;
  const telegramUrl = `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`;
  const discordText = `${title}\n${url}`;
  
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({
        title: "Link copied",
        description: "The link has been copied to your clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy link to clipboard.",
        variant: "destructive",
      });
    }
  };

  const buttonSize = size === "sm" ? "icon" : "icon";
  const iconSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {showLabel && (
        <span className="text-sm text-muted-foreground mr-1">Share:</span>
      )}
      <Button
        variant="outline"
        size={buttonSize}
        asChild
        data-testid="button-share-twitter"
      >
        <a 
          href={twitterUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          aria-label="Share on X (Twitter)"
        >
          <SiX className={iconSize} />
        </a>
      </Button>
      <Button
        variant="outline"
        size={buttonSize}
        asChild
        data-testid="button-share-telegram"
      >
        <a 
          href={telegramUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          aria-label="Share on Telegram"
        >
          <SiTelegram className={iconSize} />
        </a>
      </Button>
      <Button
        variant="outline"
        size={buttonSize}
        onClick={handleCopyLink}
        data-testid="button-copy-link"
        aria-label="Copy link"
      >
        {copied ? (
          <Check className={iconSize} />
        ) : (
          <Link2 className={iconSize} />
        )}
      </Button>
    </div>
  );
}

export function ShareBanner() {
  return (
    <div className="bg-muted/50 rounded-md p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div>
        <p className="font-medium">Spread the word</p>
        <p className="text-sm text-muted-foreground">
          Help grow the AMOR community by sharing with others.
        </p>
      </div>
      <SocialShare showLabel size="default" />
    </div>
  );
}
