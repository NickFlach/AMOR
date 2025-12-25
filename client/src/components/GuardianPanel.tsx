import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Bot, Send, Trash2, Loader2, Sparkles, Wallet, Play, ChevronDown, ChevronRight, ExternalLink, Copy, Check, AlertCircle, ShieldCheck } from "lucide-react";
import { useWeb3 } from "@/lib/web3";
import { useToast } from "@/hooks/use-toast";
import { truncateAddress, getExplorerLink, CONTRACTS } from "@/lib/contracts";
import { ethers } from "ethers";
import type { GuardianMessage, TransactionSuggestion } from "@shared/schema";

const WHITELISTED_CONTRACTS = new Set([
  CONTRACTS.AMOR.toLowerCase(),
  CONTRACTS.ST_AMOR.toLowerCase(),
  CONTRACTS.STAKING_MANAGER.toLowerCase(),
  CONTRACTS.GOVERNOR.toLowerCase(),
  CONTRACTS.TIMELOCK.toLowerCase(),
]);

function isValidHexData(data: string): boolean {
  if (!data.startsWith("0x")) return false;
  const hexPart = data.slice(2).trim();
  if (hexPart.length === 0 || hexPart.length % 2 !== 0) return false;
  return /^[a-fA-F0-9]+$/.test(hexPart);
}

function isWhitelistedContract(address: string): boolean {
  return WHITELISTED_CONTRACTS.has(address.toLowerCase());
}

function inferTransactionType(description: string, contractAddress: string): TransactionSuggestion["type"] {
  const lowerDesc = description.toLowerCase();
  const contractLower = contractAddress.toLowerCase();
  
  if (contractLower === CONTRACTS.STAKING_MANAGER.toLowerCase()) {
    if (lowerDesc.includes("claim")) return "claim";
    if (lowerDesc.includes("unstake") || lowerDesc.includes("request unstake")) return "unstake";
    if (lowerDesc.includes("stake")) return "stake";
  }
  
  if (contractLower === CONTRACTS.AMOR.toLowerCase()) {
    if (lowerDesc.includes("approve")) return "approve";
  }
  
  if (contractLower === CONTRACTS.ST_AMOR.toLowerCase()) {
    if (lowerDesc.includes("delegate")) return "delegate";
  }
  
  if (contractLower === CONTRACTS.GOVERNOR.toLowerCase()) {
    if (lowerDesc.includes("vote")) return "vote";
  }
  
  return "approve";
}

interface ParsedTransaction {
  type: TransactionSuggestion["type"];
  to: string;
  data: string;
  description: string;
  amount?: string;
  isVerified: boolean;
}

function parseTransactionsFromMessage(content: string): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = [];
  
  const stepBlocks = content.split(/(?=---\s*Step\s+\d+|Transaction Ready:)/i);
  
  for (const block of stepBlocks) {
    const contractMatch = block.match(/Contract:\s*(0x[a-fA-F0-9]{40})/i);
    const dataMatch = block.match(/Encoded Data:\s*(0x[a-fA-F0-9]+)/i);
    const descMatch = block.match(/Description:\s*([^\n]+)/i);
    const amountMatch = block.match(/(\d+(?:\.\d+)?)\s*(?:AMOR|stAMOR)/i);
    
    if (!contractMatch || !dataMatch) continue;
    
    const contractAddress = contractMatch[1];
    const encodedData = dataMatch[1].trim().replace(/[^a-fA-F0-9x]/g, '');
    const description = descMatch?.[1]?.trim() || "Execute transaction";
    const amount = amountMatch?.[1];
    
    if (!isValidHexData(encodedData)) continue;
    
    const isVerified = isWhitelistedContract(contractAddress);
    const txType = inferTransactionType(description, contractAddress);
    
    transactions.push({
      type: txType,
      to: contractAddress,
      data: encodedData,
      description,
      amount,
      isVerified,
    });
  }
  
  return transactions;
}

function TransactionCard({ 
  transaction, 
  index, 
  total,
  onExecute,
  isExecuting,
  isExecuted,
  hasError 
}: { 
  transaction: ParsedTransaction;
  index: number;
  total: number;
  onExecute: () => void;
  isExecuting: boolean;
  isExecuted: boolean;
  hasError: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getTypeColor = (type: TransactionSuggestion["type"]) => {
    switch (type) {
      case "stake": return "bg-chart-1/20 text-chart-1";
      case "unstake": return "bg-chart-2/20 text-chart-2";
      case "claim": return "bg-chart-3/20 text-chart-3";
      case "delegate": return "bg-chart-4/20 text-chart-4";
      case "vote": return "bg-chart-5/20 text-chart-5";
      case "approve": return "bg-muted text-muted-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const canExecute = transaction.isVerified && !isExecuting && !isExecuted;

  return (
    <div 
      className={`rounded-md border bg-background/50 p-3 space-y-2 ${!transaction.isVerified ? 'border-destructive/50' : ''}`}
      data-testid={`transaction-card-${index}`}
    >
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {total > 1 && (
            <Badge variant="outline" className="text-xs">
              Step {index + 1}/{total}
            </Badge>
          )}
          <Badge className={`text-xs capitalize ${getTypeColor(transaction.type)}`}>
            {transaction.type}
          </Badge>
          {transaction.isVerified ? (
            <Badge variant="outline" className="text-xs text-chart-1 border-chart-1/30">
              <ShieldCheck className="mr-1 h-3 w-3" />
              Verified
            </Badge>
          ) : (
            <Badge variant="destructive" className="text-xs">
              <AlertCircle className="mr-1 h-3 w-3" />
              Unknown Contract
            </Badge>
          )}
          {isExecuted && (
            <Badge className="bg-chart-1/20 text-chart-1 text-xs">
              <Check className="mr-1 h-3 w-3" />
              Executed
            </Badge>
          )}
          {hasError && (
            <Badge variant="destructive" className="text-xs">
              <AlertCircle className="mr-1 h-3 w-3" />
              Failed
            </Badge>
          )}
        </div>
        <Button
          size="sm"
          onClick={onExecute}
          disabled={!canExecute}
          variant={transaction.isVerified ? "default" : "outline"}
          data-testid={`button-execute-tx-${index}`}
        >
          {isExecuting ? (
            <>
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              Executing...
            </>
          ) : isExecuted ? (
            <>
              <Check className="mr-1 h-3 w-3" />
              Done
            </>
          ) : !transaction.isVerified ? (
            <>
              <AlertCircle className="mr-1 h-3 w-3" />
              Blocked
            </>
          ) : (
            <>
              <Play className="mr-1 h-3 w-3" />
              Execute
            </>
          )}
        </Button>
      </div>

      <p className="text-sm">{transaction.description}</p>
      
      {transaction.amount && (
        <p className="text-sm text-muted-foreground">
          Amount: <span className="font-mono">{transaction.amount} AMOR</span>
        </p>
      )}

      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="w-full justify-start gap-1">
            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            <span className="text-xs">Transaction Details</span>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2 pt-2">
          <div className="flex items-center justify-between gap-2 rounded bg-muted/50 p-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Contract:</span>
              <span className="font-mono text-xs">{truncateAddress(transaction.to)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => handleCopy(transaction.to)}
                data-testid={`button-copy-address-${index}`}
              >
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              </Button>
              <a
                href={getExplorerLink(transaction.to)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-6 w-6 items-center justify-center rounded-md hover:bg-accent"
                data-testid={`link-explorer-${index}`}
              >
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
          <div className="rounded bg-muted/50 p-2">
            <span className="text-xs text-muted-foreground">Calldata:</span>
            <p className="font-mono text-xs break-all mt-1">
              {transaction.data.length > 66 
                ? `${transaction.data.slice(0, 66)}...` 
                : transaction.data}
            </p>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

function MessageBubble({ 
  message, 
  signer,
  isConnected 
}: { 
  message: GuardianMessage;
  signer: ethers.Signer | null;
  isConnected: boolean;
}) {
  const isUser = message.role === "user";
  const { toast } = useToast();
  const [executingIndex, setExecutingIndex] = useState<number | null>(null);
  const [executedIndices, setExecutedIndices] = useState<Set<number>>(new Set());
  const [errorIndices, setErrorIndices] = useState<Set<number>>(new Set());
  
  const transactions = isUser ? [] : parseTransactionsFromMessage(message.content);

  const handleExecuteTransaction = async (tx: ParsedTransaction, index: number) => {
    if (!signer || !isConnected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to execute transactions.",
        variant: "destructive",
      });
      return;
    }

    if (!tx.isVerified) {
      toast({
        title: "Transaction Blocked",
        description: "This transaction targets an unverified contract and cannot be executed for security reasons.",
        variant: "destructive",
      });
      return;
    }

    if (!isValidHexData(tx.data)) {
      toast({
        title: "Invalid Transaction Data",
        description: "The transaction data format is invalid.",
        variant: "destructive",
      });
      return;
    }

    if (!ethers.isAddress(tx.to)) {
      toast({
        title: "Invalid Contract Address",
        description: "The target contract address is invalid.",
        variant: "destructive",
      });
      return;
    }

    setExecutingIndex(index);
    setErrorIndices(prev => {
      const next = new Set(prev);
      next.delete(index);
      return next;
    });

    try {
      toast({
        title: "Transaction Pending",
        description: "Please confirm the transaction in your wallet...",
      });

      const txRequest = {
        to: tx.to,
        data: tx.data,
      };

      const txResponse = await signer.sendTransaction(txRequest);
      
      toast({
        title: "Transaction Submitted",
        description: `Transaction hash: ${txResponse.hash.slice(0, 10)}...`,
      });

      await txResponse.wait();

      setExecutedIndices(prev => new Set([...prev, index]));
      
      toast({
        title: "Transaction Successful",
        description: tx.description,
      });
    } catch (error) {
      console.error("Transaction error:", error);
      setErrorIndices(prev => new Set([...prev, index]));
      
      const errorMessage = error instanceof Error ? error.message : "Transaction failed";
      toast({
        title: "Transaction Failed",
        description: errorMessage.slice(0, 100),
        variant: "destructive",
      });
    } finally {
      setExecutingIndex(null);
    }
  };

  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
      data-testid={`message-${message.id}`}
    >
      <div
        className={`max-w-[85%] rounded-lg p-3 ${
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
        
        {transactions.length > 0 && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-xs">
                {transactions.length} Transaction{transactions.length > 1 ? 's' : ''} Available
              </Badge>
              <span className="text-xs text-muted-foreground">
                Review details before executing
              </span>
            </div>
            <div className="space-y-2">
              {transactions.map((tx, idx) => (
                <TransactionCard
                  key={`${message.id}-tx-${idx}`}
                  transaction={tx}
                  index={idx}
                  total={transactions.length}
                  onExecute={() => handleExecuteTransaction(tx, idx)}
                  isExecuting={executingIndex === idx}
                  isExecuted={executedIndices.has(idx)}
                  hasError={errorIndices.has(idx)}
                />
              ))}
            </div>
          </div>
        )}
        
        <p className="text-xs opacity-60 mt-2">
          {new Date(message.timestamp).toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}

export function GuardianPanel() {
  const { isConnected, address, amorBalance, stAmorBalance, votingPower, signer } = useWeb3();
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
                    <MessageBubble 
                      key={msg.id} 
                      message={msg} 
                      signer={signer}
                      isConnected={isConnected}
                    />
                  ))}
                  {streamingContent && (
                    <div className="flex justify-start">
                      <div className="max-w-[85%] rounded-lg bg-muted p-3">
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
