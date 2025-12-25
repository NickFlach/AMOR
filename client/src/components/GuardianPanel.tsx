import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Bot, Send, Trash2, Loader2, Sparkles, Wallet } from "lucide-react";
import { useWeb3 } from "@/lib/web3";
import type { GuardianMessage } from "@shared/schema";

function MessageBubble({ message }: { message: GuardianMessage }) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
      data-testid={`message-${message.id}`}
    >
      <div
        className={`max-w-[80%] rounded-lg p-3 ${
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted"
        }`}
      >
        {!isUser && (
          <div className="flex items-center gap-2 mb-2">
            <Bot className="h-4 w-4" />
            <span className="text-xs font-medium">AMOR Guardian</span>
          </div>
        )}
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        <p className="text-xs opacity-60 mt-1">
          {new Date(message.timestamp).toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}

export function GuardianPanel() {
  const { isConnected, address, amorBalance, stAmorBalance, votingPower } = useWeb3();
  const [messages, setMessages] = useState<GuardianMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [sessionId] = useState(() => crypto.randomUUID());
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, scrollToBottom]);

  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: GuardianMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setStreamingContent("");

    try {
      const walletContext = isConnected && address
        ? {
            address,
            amorBalance,
            stAmorBalance,
            votingPower,
          }
        : undefined;

      const response = await fetch("/api/guardian/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          message: userMessage.content,
          walletContext,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader available");

      const decoder = new TextDecoder();
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                fullContent += data.content;
                setStreamingContent(fullContent);
              }
              if (data.done) {
                const assistantMessage: GuardianMessage = {
                  id: crypto.randomUUID(),
                  role: "assistant",
                  content: fullContent,
                  timestamp: Date.now(),
                };
                setMessages((prev) => [...prev, assistantMessage]);
                setStreamingContent("");
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      console.error("Guardian chat error:", error);
      const errorMessage: GuardianMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "I apologize, but I encountered an error processing your request. Please try again.",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setStreamingContent("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleClearChat = async () => {
    try {
      await fetch(`/api/guardian/session/${sessionId}`, { method: "DELETE" });
      setMessages([]);
    } catch (error) {
      console.error("Failed to clear session:", error);
    }
  };

  return (
    <section id="guardian" className="py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold md:text-3xl">AMOR Guardian</h2>
              <p className="text-muted-foreground">
                AI-powered assistant for the Consciousness Nexus
              </p>
            </div>
          </div>
        </div>

        <Card className="overflow-visible">
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-4">
            <div className="flex items-center gap-3">
              <CardTitle className="text-lg">Chat with Guardian</CardTitle>
              {isConnected ? (
                <Badge variant="outline" className="text-xs">
                  <Wallet className="mr-1 h-3 w-3" />
                  Wallet Connected
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-xs">
                  Connect wallet for personalized help
                </Badge>
              )}
            </div>
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClearChat}
                data-testid="button-clear-chat"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              ref={scrollRef}
              className="h-[400px] overflow-y-auto rounded-md border p-4"
            >
              {messages.length === 0 && !streamingContent ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <Bot className="mb-4 h-12 w-12 text-muted-foreground/50" />
                  <h3 className="font-medium text-muted-foreground">
                    Welcome to AMOR Guardian
                  </h3>
                  <p className="mt-2 max-w-sm text-sm text-muted-foreground/80">
                    Ask me about staking AMOR, governance voting, or how to participate in the Consciousness Nexus ecosystem.
                  </p>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    {[
                      "How do I stake AMOR?",
                      "What is stAMOR?",
                      "How does voting work?",
                    ].map((suggestion) => (
                      <Button
                        key={suggestion}
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setInput(suggestion);
                          textareaRef.current?.focus();
                        }}
                        data-testid={`button-suggestion-${suggestion.slice(0, 10)}`}
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <MessageBubble key={msg.id} message={msg} />
                  ))}
                  {streamingContent && (
                    <div className="flex justify-start">
                      <div className="max-w-[80%] rounded-lg bg-muted p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Bot className="h-4 w-4" />
                          <span className="text-xs font-medium">AMOR Guardian</span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{streamingContent}</p>
                      </div>
                    </div>
                  )}
                  {isLoading && !streamingContent && (
                    <div className="flex justify-start">
                      <div className="rounded-lg bg-muted p-3">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm text-muted-foreground">
                            Thinking...
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about staking, governance, or the AMOR ecosystem..."
                className="min-h-[44px] max-h-32 resize-none"
                disabled={isLoading}
                data-testid="input-guardian-message"
              />
              <Button
                onClick={handleSubmit}
                disabled={!input.trim() || isLoading}
                size="icon"
                className="shrink-0"
                data-testid="button-send-message"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
