import { ethers } from "ethers";

const NEO_X_RPC_URL = "https://mainnet-1.rpc.banelabs.org";

const CONTRACTS = {
  AMOR: "0x7C833fe6b80465F956E2939aD6f03FFaC08f058e",
  ST_AMOR: "0x05fda76aa1e88e83EbB5f155Cd43BE2eb6718eAD",
  STAKING_MANAGER: "0x58390f0883b176c6EbcDddE9527321F4b4E5c565",
  TIMELOCK: "0xae73C3390a145154Ab94935FB06f2Fc31A04E7d6",
  GOVERNOR: "0xaf596B738B57B6Ac939f453Ce2201349F3105146",
} as const;

const ERC20_ABI = [
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
];

const ST_AMOR_ABI = [
  ...ERC20_ABI,
  "function delegates(address account) view returns (address)",
  "function getVotes(address account) view returns (uint256)",
];

const STAKING_MANAGER_ABI = [
  "function WITHDRAWAL_DELAY() view returns (uint256)",
  "function amor() view returns (address)",
  "function stAmor() view returns (address)",
  "function totalStaked() view returns (uint256)",
  "function stakedBalance(address user) view returns (uint256)",
  "function getActiveStake(address user) view returns (uint256)",
  "function requestCount(address user) view returns (uint256)",
  "function getRequest(address user, uint256 requestId) view returns (uint256 amount, uint256 requestedAt, uint256 unlockAt, bool claimed, bool cancelled)",
  "function stake(uint256 amount)",
  "function requestUnstake(uint256 amount) returns (uint256 requestId)",
  "function cancelUnstake(uint256 requestId)",
  "function claimUnstake(uint256 requestId)",
  "function paused() view returns (bool)",
  "function pause()",
  "function unpause()",
];

const GOVERNOR_ABI = [
  "function proposalThreshold() view returns (uint256)",
  "function votingDelay() view returns (uint256)",
  "function votingPeriod() view returns (uint256)",
  "function quorumNumerator() view returns (uint256)",
  "function state(uint256 proposalId) view returns (uint8)",
  "function proposalVotes(uint256 proposalId) view returns (uint256 againstVotes, uint256 forVotes, uint256 abstainVotes)",
  "function hasVoted(uint256 proposalId, address account) view returns (bool)",
  "function proposalSnapshot(uint256 proposalId) view returns (uint256)",
  "function proposalDeadline(uint256 proposalId) view returns (uint256)",
  "function proposalProposer(uint256 proposalId) view returns (address)",
];

const PROPOSAL_STATE_NAMES = [
  "Pending",
  "Active", 
  "Canceled",
  "Defeated",
  "Succeeded",
  "Queued",
  "Expired",
  "Executed",
] as const;

let provider: ethers.JsonRpcProvider | null = null;

function getProvider(): ethers.JsonRpcProvider {
  if (!provider) {
    provider = new ethers.JsonRpcProvider(NEO_X_RPC_URL);
  }
  return provider;
}

function formatTokenAmount(amount: bigint, decimals: number = 18): string {
  return ethers.formatUnits(amount, decimals);
}

export interface ChainStats {
  totalStakedAmor: string;
  proposalThreshold: string;
  votingDelay: number;
  votingPeriod: number;
  withdrawalDelay: number;
  quorumNumerator: number;
  stakingPaused: boolean;
  timestamp: number;
}

export interface UserChainData {
  address: string;
  amorBalance: string;
  stAmorBalance: string;
  votingPower: string;
  activeStake: string;
  delegate: string;
  unstakeRequests: UnstakeRequest[];
  timestamp: number;
}

export interface UnstakeRequest {
  id: number;
  amount: string;
  requestedAt: number;
  unlockAt: number;
  claimed: boolean;
  cancelled: boolean;
}

export async function getChainStats(): Promise<ChainStats> {
  const defaultStats: ChainStats = {
    totalStakedAmor: "0",
    proposalThreshold: "0",
    votingDelay: 0,
    votingPeriod: 0,
    withdrawalDelay: 604800,
    quorumNumerator: 0,
    stakingPaused: false,
    timestamp: Date.now(),
  };

  try {
    const rpcProvider = getProvider();
    
    const stAmor = new ethers.Contract(CONTRACTS.ST_AMOR, ERC20_ABI, rpcProvider);
    const governor = new ethers.Contract(CONTRACTS.GOVERNOR, GOVERNOR_ABI, rpcProvider);
    const stakingManager = new ethers.Contract(CONTRACTS.STAKING_MANAGER, STAKING_MANAGER_ABI, rpcProvider);

    const [
      totalSupply,
      proposalThreshold,
      votingDelay,
      votingPeriod,
      withdrawalDelay,
      quorumNumerator,
      paused,
    ] = await Promise.all([
      stAmor.totalSupply().catch(() => BigInt(0)),
      governor.proposalThreshold().catch(() => BigInt(0)),
      governor.votingDelay().catch(() => BigInt(0)),
      governor.votingPeriod().catch(() => BigInt(0)),
      stakingManager.WITHDRAWAL_DELAY().catch(() => BigInt(604800)),
      governor.quorumNumerator().catch(() => BigInt(0)),
      stakingManager.paused().catch(() => false),
    ]);

    return {
      totalStakedAmor: formatTokenAmount(totalSupply),
      proposalThreshold: formatTokenAmount(proposalThreshold),
      votingDelay: Number(votingDelay),
      votingPeriod: Number(votingPeriod),
      withdrawalDelay: Number(withdrawalDelay),
      quorumNumerator: Number(quorumNumerator),
      stakingPaused: paused,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error("Error fetching chain stats:", error);
    return defaultStats;
  }
}

export async function getUserChainData(address: string): Promise<UserChainData> {
  const defaultData: UserChainData = {
    address,
    amorBalance: "0",
    stAmorBalance: "0",
    votingPower: "0",
    activeStake: "0",
    delegate: ethers.ZeroAddress,
    unstakeRequests: [],
    timestamp: Date.now(),
  };

  if (!ethers.isAddress(address)) {
    return defaultData;
  }

  try {
    const rpcProvider = getProvider();
    
    const amor = new ethers.Contract(CONTRACTS.AMOR, ERC20_ABI, rpcProvider);
    const stAmor = new ethers.Contract(CONTRACTS.ST_AMOR, ST_AMOR_ABI, rpcProvider);
    const stakingManager = new ethers.Contract(CONTRACTS.STAKING_MANAGER, STAKING_MANAGER_ABI, rpcProvider);

    const [amorBalance, stAmorBalance, votingPower, activeStake, delegate] = await Promise.all([
      amor.balanceOf(address).catch(() => BigInt(0)),
      stAmor.balanceOf(address).catch(() => BigInt(0)),
      stAmor.getVotes(address).catch(() => BigInt(0)),
      stakingManager.getActiveStake(address).catch(() => BigInt(0)),
      stAmor.delegates(address).catch(() => ethers.ZeroAddress),
    ]);

    const unstakeRequests = await getUnstakeRequests(address, stakingManager);

    return {
      address,
      amorBalance: formatTokenAmount(amorBalance),
      stAmorBalance: formatTokenAmount(stAmorBalance),
      votingPower: formatTokenAmount(votingPower),
      activeStake: formatTokenAmount(activeStake),
      delegate: delegate,
      unstakeRequests,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error("Error fetching user chain data:", error);
    return defaultData;
  }
}

async function getUnstakeRequests(
  address: string,
  stakingManager: ethers.Contract
): Promise<UnstakeRequest[]> {
  const requests: UnstakeRequest[] = [];
  
  try {
    const count = await stakingManager.requestCount(address).catch(() => BigInt(0));
    const requestCount = Number(count);
    
    for (let i = 0; i < requestCount; i++) {
      try {
        const request = await stakingManager.getRequest(address, i);
        const [amount, requestedAt, unlockAt, claimed, cancelled] = request;
        
        requests.push({
          id: i,
          amount: formatTokenAmount(amount),
          requestedAt: Number(requestedAt),
          unlockAt: Number(unlockAt),
          claimed,
          cancelled,
        });
      } catch {
        break;
      }
    }
  } catch (error) {
    console.error("Error fetching unstake requests:", error);
  }
  
  return requests;
}

export function formatChainStatsForAI(stats: ChainStats): string {
  const votingDelayHours = Math.floor(stats.votingDelay / 3600);
  const votingPeriodDays = Math.floor(stats.votingPeriod / 86400);
  const withdrawalDelayDays = Math.floor(stats.withdrawalDelay / 86400);

  return `On-Chain Statistics:
- Total Staked AMOR: ${stats.totalStakedAmor} stAMOR
- Proposal Threshold: ${stats.proposalThreshold} stAMOR required to create proposals
- Voting Delay: ${votingDelayHours} hours after proposal creation before voting starts
- Voting Period: ${votingPeriodDays} days for voting on proposals
- Unstaking Withdrawal Delay: ${withdrawalDelayDays} days cooldown after requesting unstake
- Quorum: ${stats.quorumNumerator}% of total voting power required
- Staking Contract Paused: ${stats.stakingPaused ? "Yes" : "No"}`;
}

export function formatUserDataForAI(data: UserChainData): string {
  const activeRequests = data.unstakeRequests.filter(r => !r.claimed && !r.cancelled);
  const pendingUnstake = activeRequests.reduce((sum, r) => sum + parseFloat(r.amount), 0);

  let output = `User Wallet Data (${data.address}):
- AMOR Balance: ${data.amorBalance} AMOR (available to stake)
- stAMOR Balance: ${data.stAmorBalance} stAMOR (staked tokens)
- Voting Power: ${data.votingPower} votes
- Active Stake: ${data.activeStake} stAMOR
- Delegate: ${data.delegate === ethers.ZeroAddress ? "Not delegated" : data.delegate}`;

  if (activeRequests.length > 0) {
    output += `\n- Pending Unstake Requests: ${activeRequests.length} (${pendingUnstake.toFixed(4)} AMOR total)`;
    activeRequests.forEach(r => {
      const unlockDate = new Date(r.unlockAt * 1000).toLocaleString();
      const isReady = Date.now() >= r.unlockAt * 1000;
      output += `\n  - Request #${r.id}: ${r.amount} AMOR, ${isReady ? "Ready to claim" : `Unlocks: ${unlockDate}`}`;
    });
  }

  return output;
}

export interface TokenPrice {
  symbol: string;
  priceUsd: string;
  change24h: string;
  lastUpdated: number;
}

export interface ProposalDetails {
  proposalId: string;
  state: number;
  stateName: string;
  proposer: string;
  forVotes: string;
  againstVotes: string;
  abstainVotes: string;
  snapshotBlock: number;
  deadlineBlock: number;
  timestamp: number;
}

export interface VotingStatus {
  proposalId: string;
  address: string;
  hasVoted: boolean;
  timestamp: number;
}

export interface VotingPowerAnalysis {
  address: string;
  stAmorBalance: string;
  votingPower: string;
  delegate: string;
  isSelfDelegated: boolean;
  votingPowerActive: boolean;
  recommendations: string[];
  timestamp: number;
}

export function getTokenPrice(symbol: string): TokenPrice {
  const mockPrices: Record<string, { price: string; change: string }> = {
    AMOR: { price: "0.0234", change: "+5.2" },
    GAS: { price: "4.87", change: "-1.3" },
    NEO: { price: "12.45", change: "+2.1" },
    STAMOR: { price: "0.0234", change: "+5.2" },
  };

  const upperSymbol = symbol.toUpperCase();
  const data = mockPrices[upperSymbol];

  if (!data) {
    return {
      symbol: upperSymbol,
      priceUsd: "0",
      change24h: "0",
      lastUpdated: Date.now(),
    };
  }

  return {
    symbol: upperSymbol,
    priceUsd: data.price,
    change24h: data.change,
    lastUpdated: Date.now(),
  };
}

export async function getProposalDetails(proposalId: string): Promise<ProposalDetails> {
  const defaultDetails: ProposalDetails = {
    proposalId,
    state: 0,
    stateName: "Unknown",
    proposer: ethers.ZeroAddress,
    forVotes: "0",
    againstVotes: "0",
    abstainVotes: "0",
    snapshotBlock: 0,
    deadlineBlock: 0,
    timestamp: Date.now(),
  };

  try {
    const rpcProvider = getProvider();
    const governor = new ethers.Contract(CONTRACTS.GOVERNOR, GOVERNOR_ABI, rpcProvider);

    const [state, votes, proposer, snapshot, deadline] = await Promise.all([
      governor.state(proposalId).catch(() => 0),
      governor.proposalVotes(proposalId).catch(() => [BigInt(0), BigInt(0), BigInt(0)]),
      governor.proposalProposer(proposalId).catch(() => ethers.ZeroAddress),
      governor.proposalSnapshot(proposalId).catch(() => BigInt(0)),
      governor.proposalDeadline(proposalId).catch(() => BigInt(0)),
    ]);

    const [againstVotes, forVotes, abstainVotes] = votes;

    return {
      proposalId,
      state: Number(state),
      stateName: PROPOSAL_STATE_NAMES[Number(state)] || "Unknown",
      proposer,
      forVotes: formatTokenAmount(forVotes),
      againstVotes: formatTokenAmount(againstVotes),
      abstainVotes: formatTokenAmount(abstainVotes),
      snapshotBlock: Number(snapshot),
      deadlineBlock: Number(deadline),
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error("Error fetching proposal details:", error);
    return defaultDetails;
  }
}

export async function checkHasVoted(proposalId: string, address: string): Promise<VotingStatus> {
  const defaultStatus: VotingStatus = {
    proposalId,
    address,
    hasVoted: false,
    timestamp: Date.now(),
  };

  if (!ethers.isAddress(address)) {
    return defaultStatus;
  }

  try {
    const rpcProvider = getProvider();
    const governor = new ethers.Contract(CONTRACTS.GOVERNOR, GOVERNOR_ABI, rpcProvider);

    const hasVoted = await governor.hasVoted(proposalId, address).catch(() => false);

    return {
      proposalId,
      address,
      hasVoted,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error("Error checking voting status:", error);
    return defaultStatus;
  }
}

export async function analyzeVotingPower(address: string): Promise<VotingPowerAnalysis> {
  const defaultAnalysis: VotingPowerAnalysis = {
    address,
    stAmorBalance: "0",
    votingPower: "0",
    delegate: ethers.ZeroAddress,
    isSelfDelegated: false,
    votingPowerActive: false,
    recommendations: [],
    timestamp: Date.now(),
  };

  if (!ethers.isAddress(address)) {
    return { ...defaultAnalysis, recommendations: ["Invalid address provided."] };
  }

  try {
    const rpcProvider = getProvider();
    const stAmor = new ethers.Contract(CONTRACTS.ST_AMOR, ST_AMOR_ABI, rpcProvider);

    const [balance, votes, delegate] = await Promise.all([
      stAmor.balanceOf(address).catch(() => BigInt(0)),
      stAmor.getVotes(address).catch(() => BigInt(0)),
      stAmor.delegates(address).catch(() => ethers.ZeroAddress),
    ]);

    const stAmorBalance = formatTokenAmount(balance);
    const votingPower = formatTokenAmount(votes);
    const isSelfDelegated = delegate.toLowerCase() === address.toLowerCase();
    const hasBalance = balance > BigInt(0);
    const hasVotingPower = votes > BigInt(0);
    const votingPowerActive = hasVotingPower;

    const recommendations: string[] = [];

    if (!hasBalance) {
      recommendations.push("You have no stAMOR tokens. Stake AMOR to receive stAMOR and participate in governance.");
    } else if (delegate === ethers.ZeroAddress) {
      recommendations.push("Your voting power is not activated. Delegate to yourself (self-delegate) to activate your voting power.");
    } else if (!isSelfDelegated && !hasVotingPower) {
      recommendations.push(`Your voting power is delegated to ${delegate}. To vote directly, self-delegate to activate your own voting power.`);
    } else if (isSelfDelegated && hasVotingPower) {
      recommendations.push("Your voting power is active and ready to vote on proposals.");
    }

    if (hasBalance && parseFloat(stAmorBalance) < 100) {
      recommendations.push("Consider staking more AMOR to increase your voting power and influence in governance.");
    }

    return {
      address,
      stAmorBalance,
      votingPower,
      delegate,
      isSelfDelegated,
      votingPowerActive,
      recommendations,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error("Error analyzing voting power:", error);
    return { ...defaultAnalysis, recommendations: ["Error analyzing voting power. Please try again."] };
  }
}

export function formatTokenPriceForAI(price: TokenPrice): string {
  return `Token Price (${price.symbol}):
- Price: $${price.priceUsd} USD
- 24h Change: ${price.change24h}%
- Last Updated: ${new Date(price.lastUpdated).toISOString()}

Note: Prices are indicative and may vary across exchanges.`;
}

export function formatProposalDetailsForAI(details: ProposalDetails): string {
  const totalVotes = parseFloat(details.forVotes) + parseFloat(details.againstVotes) + parseFloat(details.abstainVotes);
  const forPercentage = totalVotes > 0 ? ((parseFloat(details.forVotes) / totalVotes) * 100).toFixed(1) : "0";
  const againstPercentage = totalVotes > 0 ? ((parseFloat(details.againstVotes) / totalVotes) * 100).toFixed(1) : "0";
  const abstainPercentage = totalVotes > 0 ? ((parseFloat(details.abstainVotes) / totalVotes) * 100).toFixed(1) : "0";

  return `Proposal Details (ID: ${details.proposalId}):
- Status: ${details.stateName}
- Proposer: ${details.proposer}
- Snapshot Block: ${details.snapshotBlock}
- Deadline Block: ${details.deadlineBlock}

Vote Tally:
- For: ${details.forVotes} votes (${forPercentage}%)
- Against: ${details.againstVotes} votes (${againstPercentage}%)
- Abstain: ${details.abstainVotes} votes (${abstainPercentage}%)
- Total Votes: ${totalVotes.toFixed(4)} votes`;
}

export function formatVotingStatusForAI(status: VotingStatus): string {
  return `Voting Status:
- Proposal ID: ${status.proposalId}
- Address: ${status.address}
- Has Voted: ${status.hasVoted ? "Yes" : "No"}`;
}

export function formatVotingPowerAnalysisForAI(analysis: VotingPowerAnalysis): string {
  let output = `Voting Power Analysis (${analysis.address}):
- stAMOR Balance: ${analysis.stAmorBalance} stAMOR
- Active Voting Power: ${analysis.votingPower} votes
- Delegate: ${analysis.delegate === ethers.ZeroAddress ? "Not set" : analysis.delegate}
- Self-Delegated: ${analysis.isSelfDelegated ? "Yes" : "No"}
- Voting Power Active: ${analysis.votingPowerActive ? "Yes" : "No"}`;

  if (analysis.recommendations.length > 0) {
    output += "\n\nRecommendations:";
    analysis.recommendations.forEach((rec, i) => {
      output += `\n${i + 1}. ${rec}`;
    });
  }

  return output;
}
