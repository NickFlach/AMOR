// AMOR Token Contracts on Neo X Mainnet
export const NEO_X_CHAIN_ID = 47763;
export const NEO_X_RPC_URL = "https://mainnet-1.rpc.banelabs.org";
export const NEO_X_EXPLORER = "https://xexplorer.neo.org";

export const CONTRACTS = {
  AMOR: "0x7C833fe6b80465F956E2939aD6f03FFaC08f058e",
  ST_AMOR: "0x05fda76aa1e88e83EbB5f155Cd43BE2eb6718eAD",
  STAKING_MANAGER: "0x58390f0883b176c6EbcDddE9527321F4b4E5c565",
  TIMELOCK: "0xae73C3390a145154Ab94935FB06f2Fc31A04E7d6",
  GOVERNOR: "0xaf596B738B57B6Ac939f453Ce2201349F3105146",
} as const;

export function getExplorerLink(address: string, type: "address" | "tx" = "address"): string {
  return `${NEO_X_EXPLORER}/${type}/${address}`;
}

export function truncateAddress(address: string): string {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// ERC20 ABI (minimal for read operations)
export const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
];

// stAMOR (StakedAMOR.sol - ERC20 + ERC20Permit + ERC20Votes + AccessControl + Pausable) ABI
export const ST_AMOR_ABI = [
  ...ERC20_ABI,
  "function delegates(address account) view returns (address)",
  "function getVotes(address account) view returns (uint256)",
  "function getPastVotes(address account, uint256 timepoint) view returns (uint256)",
  "function getPastTotalSupply(uint256 timepoint) view returns (uint256)",
  "function delegate(address delegatee)",
  "function delegateBySig(address delegatee, uint256 nonce, uint256 expiry, uint8 v, bytes32 r, bytes32 s)",
  "function CLOCK_MODE() view returns (string)",
  "function clock() view returns (uint48)",
  "function nonces(address owner) view returns (uint256)",
  "function STAKING_CONTRACT_ROLE() view returns (bytes32)",
  "function PAUSER_ROLE() view returns (bytes32)",
  "function DEFAULT_ADMIN_ROLE() view returns (bytes32)",
  "function hasRole(bytes32 role, address account) view returns (bool)",
  "function paused() view returns (bool)",
  "event DelegateChanged(address indexed delegator, address indexed fromDelegate, address indexed toDelegate)",
  "event DelegateVotesChanged(address indexed delegate, uint256 previousVotes, uint256 newVotes)",
];

// AMORStaking Contract ABI (StakingAMOR.sol)
export const STAKING_MANAGER_ABI = [
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
  "event Staked(address indexed user, uint256 amount)",
  "event UnstakeRequested(address indexed user, uint256 indexed requestId, uint256 amount, uint256 unlockAt)",
  "event UnstakeClaimed(address indexed user, uint256 indexed requestId, uint256 amount)",
  "event UnstakeCancelled(address indexed user, uint256 indexed requestId, uint256 amount)",
];

// Governor ABI
export const GOVERNOR_ABI = [
  "function name() view returns (string)",
  "function version() view returns (string)",
  "function proposalThreshold() view returns (uint256)",
  "function votingDelay() view returns (uint256)",
  "function votingPeriod() view returns (uint256)",
  "function quorum(uint256 timepoint) view returns (uint256)",
  "function quorumNumerator() view returns (uint256)",
  "function quorumDenominator() view returns (uint256)",
  "function state(uint256 proposalId) view returns (uint8)",
  "function proposalSnapshot(uint256 proposalId) view returns (uint256)",
  "function proposalDeadline(uint256 proposalId) view returns (uint256)",
  "function proposalProposer(uint256 proposalId) view returns (address)",
  "function proposalEta(uint256 proposalId) view returns (uint256)",
  "function hasVoted(uint256 proposalId, address account) view returns (bool)",
  "function getVotes(address account, uint256 timepoint) view returns (uint256)",
  "function proposalVotes(uint256 proposalId) view returns (uint256 againstVotes, uint256 forVotes, uint256 abstainVotes)",
  "function castVote(uint256 proposalId, uint8 support) returns (uint256)",
  "function castVoteWithReason(uint256 proposalId, uint8 support, string reason) returns (uint256)",
  "function propose(address[] targets, uint256[] values, bytes[] calldatas, string description) returns (uint256)",
  "function queue(address[] targets, uint256[] values, bytes[] calldatas, bytes32 descriptionHash) returns (uint256)",
  "function execute(address[] targets, uint256[] values, bytes[] calldatas, bytes32 descriptionHash) returns (uint256)",
  "event ProposalCreated(uint256 proposalId, address proposer, address[] targets, uint256[] values, string[] signatures, bytes[] calldatas, uint256 voteStart, uint256 voteEnd, string description)",
  "event VoteCast(address indexed voter, uint256 proposalId, uint8 support, uint256 weight, string reason)",
  "event ProposalExecuted(uint256 proposalId)",
  "event ProposalQueued(uint256 proposalId, uint256 etaSeconds)",
  "event ProposalCanceled(uint256 proposalId)",
];

// Timelock Controller ABI
export const TIMELOCK_ABI = [
  "function getMinDelay() view returns (uint256)",
  "function isOperation(bytes32 id) view returns (bool)",
  "function isOperationPending(bytes32 id) view returns (bool)",
  "function isOperationReady(bytes32 id) view returns (bool)",
  "function isOperationDone(bytes32 id) view returns (bool)",
  "function getOperationState(bytes32 id) view returns (uint8)",
  "function getTimestamp(bytes32 id) view returns (uint256)",
  "event CallScheduled(bytes32 indexed id, uint256 indexed index, address target, uint256 value, bytes data, bytes32 predecessor, uint256 delay)",
  "event CallExecuted(bytes32 indexed id, uint256 indexed index, address target, uint256 value, bytes data)",
  "event Cancelled(bytes32 indexed id)",
];

// Proposal States
export const PROPOSAL_STATES = [
  "Pending",
  "Active",
  "Canceled",
  "Defeated",
  "Succeeded",
  "Queued",
  "Expired",
  "Executed",
] as const;

export type ProposalState = (typeof PROPOSAL_STATES)[number];

export function getProposalStateColor(state: number): string {
  switch (state) {
    case 0: return "bg-muted text-muted-foreground"; // Pending
    case 1: return "bg-chart-3/20 text-chart-3"; // Active
    case 2: return "bg-destructive/20 text-destructive"; // Canceled
    case 3: return "bg-destructive/20 text-destructive"; // Defeated
    case 4: return "bg-chart-1/20 text-chart-1"; // Succeeded
    case 5: return "bg-chart-2/20 text-chart-2"; // Queued
    case 6: return "bg-muted text-muted-foreground"; // Expired
    case 7: return "bg-chart-1/20 text-chart-1"; // Executed
    default: return "bg-muted text-muted-foreground";
  }
}
