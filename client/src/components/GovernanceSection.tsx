import { useState, useEffect } from "react";
import { FileText, Vote, ThumbsUp, ThumbsDown, Minus, ExternalLink, Clock, Users, Loader2 } from "lucide-react";
import { ethers } from "ethers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useWeb3, useContracts } from "@/lib/web3";
import { CONTRACTS, GOVERNOR_ABI, PROPOSAL_STATES, getProposalStateColor, getExplorerLink } from "@/lib/contracts";

interface Proposal {
  id: string;
  proposalId: string;
  title: string;
  description: string;
  proposer: string;
  state: number;
  forVotes: string;
  againstVotes: string;
  abstainVotes: string;
  startBlock: number;
  endBlock: number;
  eta?: number;
}

export function GovernanceSection() {
  const { isConnected, isCorrectNetwork, address, votingPower, readProvider } = useWeb3();
  const { getGovernorContract } = useContracts();
  const { toast } = useToast();

  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [votingOnId, setVotingOnId] = useState<string | null>(null);
  const [governorInfo, setGovernorInfo] = useState({
    name: "",
    proposalThreshold: "0",
    votingDelay: 0,
    votingPeriod: 0,
    quorumNumerator: 0,
  });

  // Fetch governor info
  useEffect(() => {
    async function fetchGovernorInfo() {
      try {
        const governorContract = new ethers.Contract(CONTRACTS.GOVERNOR, GOVERNOR_ABI, readProvider);
        const [name, threshold, delay, period, quorum] = await Promise.all([
          governorContract.name(),
          governorContract.proposalThreshold(),
          governorContract.votingDelay(),
          governorContract.votingPeriod(),
          governorContract.quorumNumerator(),
        ]);
        setGovernorInfo({
          name,
          proposalThreshold: ethers.formatEther(threshold),
          votingDelay: Number(delay),
          votingPeriod: Number(period),
          quorumNumerator: Number(quorum),
        });
      } catch (error) {
        // Use defaults if RPC fails
        setGovernorInfo({
          name: "AMOR Governor",
          proposalThreshold: "1000",
          votingDelay: 7200,
          votingPeriod: 50400,
          quorumNumerator: 4,
        });
      }
    }
    fetchGovernorInfo();
  }, [readProvider]);

  // Fetch proposals from events
  useEffect(() => {
    async function fetchProposals() {
      setIsLoading(true);
      try {
        const governorContract = new ethers.Contract(CONTRACTS.GOVERNOR, GOVERNOR_ABI, readProvider);
        
        // Get proposal created events
        const filter = governorContract.filters.ProposalCreated();
        const events = await governorContract.queryFilter(filter, -100000);
        
        const proposalData: Proposal[] = [];
        
        for (const event of events.slice(-10)) { // Last 10 proposals
          try {
            const args = (event as ethers.EventLog).args;
            if (!args) continue;
            
            const proposalId = args[0].toString();
            const proposer = args[1];
            const voteStart = Number(args[6]);
            const voteEnd = Number(args[7]);
            const description = args[8] || "";
            
            // Get proposal state and votes
            const [state, votes] = await Promise.all([
              governorContract.state(proposalId),
              governorContract.proposalVotes(proposalId),
            ]);
            
            // Parse description for title
            const lines = description.split("\n");
            const title = lines[0]?.replace(/^#\s*/, "") || `Proposal ${proposalId.slice(0, 8)}...`;
            
            proposalData.push({
              id: proposalId,
              proposalId,
              title,
              description,
              proposer,
              state: Number(state),
              forVotes: ethers.formatEther(votes[1]),
              againstVotes: ethers.formatEther(votes[0]),
              abstainVotes: ethers.formatEther(votes[2]),
              startBlock: voteStart,
              endBlock: voteEnd,
            });
          } catch (e) {
            console.error("Error processing proposal:", e);
          }
        }
        
        setProposals(proposalData.reverse());
      } catch (error) {
        // If RPC fails, just show empty state
        setProposals([]);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchProposals();
  }, [readProvider]);

  async function handleVote(proposalId: string, support: number) {
    if (!isConnected || !isCorrectNetwork) return;
    
    setVotingOnId(proposalId);
    try {
      const governorContract = getGovernorContract(true);
      const tx = await governorContract.castVote(proposalId, support);
      
      toast({
        title: "Vote Pending",
        description: "Waiting for transaction confirmation...",
      });
      
      await tx.wait();
      
      const voteType = support === 1 ? "For" : support === 0 ? "Against" : "Abstain";
      toast({
        title: "Vote Cast",
        description: `You voted ${voteType} on this proposal.`,
      });
    } catch (error: unknown) {
      toast({
        title: "Vote Failed",
        description: (error as Error).message || "Transaction was rejected.",
        variant: "destructive",
      });
    } finally {
      setVotingOnId(null);
    }
  }

  const getTotalVotes = (proposal: Proposal) => {
    return parseFloat(proposal.forVotes) + parseFloat(proposal.againstVotes) + parseFloat(proposal.abstainVotes);
  };

  const getVotePercentage = (votes: string, total: number) => {
    if (total === 0) return 0;
    return (parseFloat(votes) / total) * 100;
  };

  return (
    <section id="governance" className="py-12 md:py-16 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Governance</h2>
            <p className="mt-2 text-muted-foreground">
              Vote on proposals and shape the future of the AMOR ecosystem.
            </p>
          </div>
          {isConnected && parseFloat(votingPower) > 0 && (
            <Badge variant="secondary" className="text-sm font-mono self-start">
              <Vote className="h-3 w-3 mr-1" />
              {parseFloat(votingPower).toLocaleString(undefined, { maximumFractionDigits: 2 })} Voting Power
            </Badge>
          )}
        </div>

        {/* Governor Info */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Governor</p>
              <p className="font-semibold mt-1">{governorInfo.name || "AMOR Governor"}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Proposal Threshold</p>
              <p className="font-mono font-semibold mt-1">
                {parseFloat(governorInfo.proposalThreshold).toLocaleString()} stAMOR
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Voting Period</p>
              <p className="font-mono font-semibold mt-1">{governorInfo.votingPeriod} blocks</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Quorum</p>
              <p className="font-mono font-semibold mt-1">{governorInfo.quorumNumerator}%</p>
            </CardContent>
          </Card>
        </div>

        {/* Proposals List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Proposals
            </CardTitle>
            <CardDescription>
              Recent governance proposals from the AMOR DAO.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="mt-4 text-muted-foreground">Loading proposals...</p>
              </div>
            ) : proposals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No Proposals Yet</h3>
                <p className="mt-2 max-w-md text-muted-foreground">
                  There are no governance proposals at this time. Check back later or create one if you have enough voting power.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {proposals.map((proposal) => {
                  const totalVotes = getTotalVotes(proposal);
                  const forPct = getVotePercentage(proposal.forVotes, totalVotes);
                  const againstPct = getVotePercentage(proposal.againstVotes, totalVotes);
                  const isActive = proposal.state === 1;
                  const isVoting = votingOnId === proposal.proposalId;

                  return (
                    <Card key={proposal.id} className="overflow-visible">
                      <CardContent className="p-6">
                        <div className="flex flex-col gap-4">
                          {/* Header */}
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge 
                                  variant="secondary" 
                                  className={getProposalStateColor(proposal.state)}
                                >
                                  {PROPOSAL_STATES[proposal.state] || "Unknown"}
                                </Badge>
                                <span className="text-xs text-muted-foreground font-mono">
                                  #{proposal.proposalId.slice(0, 8)}...
                                </span>
                              </div>
                              <h4 className="mt-2 font-semibold text-lg">{proposal.title}</h4>
                            </div>
                            <a
                              href={getExplorerLink(CONTRACTS.GOVERNOR)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </div>

                          {/* Vote Progress */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <ThumbsUp className="h-4 w-4 text-chart-1" />
                                <span>For: {parseFloat(proposal.forVotes).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                              </div>
                              <span className="font-mono text-chart-1">{forPct.toFixed(1)}%</span>
                            </div>
                            <Progress value={forPct} className="h-2" />
                            
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <ThumbsDown className="h-4 w-4 text-destructive" />
                                <span>Against: {parseFloat(proposal.againstVotes).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                              </div>
                              <span className="font-mono text-destructive">{againstPct.toFixed(1)}%</span>
                            </div>
                            <Progress value={againstPct} className="h-2 [&>div]:bg-destructive" />
                          </div>

                          {/* Vote Buttons */}
                          {isActive && isConnected && isCorrectNetwork && parseFloat(votingPower) > 0 && (
                            <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                              <Button
                                size="sm"
                                onClick={() => handleVote(proposal.proposalId, 1)}
                                disabled={isVoting}
                                data-testid={`button-vote-for-${proposal.id}`}
                              >
                                {isVoting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ThumbsUp className="h-4 w-4" />}
                                <span>Vote For</span>
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleVote(proposal.proposalId, 0)}
                                disabled={isVoting}
                                data-testid={`button-vote-against-${proposal.id}`}
                              >
                                {isVoting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ThumbsDown className="h-4 w-4" />}
                                <span>Vote Against</span>
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleVote(proposal.proposalId, 2)}
                                disabled={isVoting}
                                data-testid={`button-vote-abstain-${proposal.id}`}
                              >
                                {isVoting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Minus className="h-4 w-4" />}
                                <span>Abstain</span>
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
