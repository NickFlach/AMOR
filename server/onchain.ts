import { ethers } from "ethers";

const NEO_X_RPC_URL = "https://mainnet-1.rpc.banelabs.org";

const CONTRACTS = {
  AMOR: "0x7C833fe6b80465F956E2939aD6f03FFaC08f058e",
  ST_AMOR: "0x58390f0883b176c6EbcDddE9527321F4b4E5c565",
  STAKING_MANAGER: "0xae73C3390a145154Ab94935FB06f2Fc31A04E7d6",
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
  "function getActiveStake(address user) view returns (uint256)",
  "function getRequest(address user, uint256 requestId) view returns (uint256 amount, uint256 requestedAt, uint256 unlockAt, bool claimed, bool cancelled)",
  "function paused() view returns (bool)",
];

const GOVERNOR_ABI = [
  "function proposalThreshold() view returns (uint256)",
  "function votingDelay() view returns (uint256)",
  "function votingPeriod() view returns (uint256)",
  "function quorumNumerator() view returns (uint256)",
  "function state(uint256 proposalId) view returns (uint8)",
  "function proposalVotes(uint256 proposalId) view returns (uint256 againstVotes, uint256 forVotes, uint256 abstainVotes)",
  "function hasVoted(uint256 proposalId, address account) view returns (bool)",
];

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
    for (let i = 0; i < 10; i++) {
      try {
        const request = await stakingManager.getRequest(address, i);
        const [amount, requestedAt, unlockAt, claimed, cancelled] = request;
        
        if (amount === BigInt(0) && requestedAt === BigInt(0)) {
          break;
        }
        
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
