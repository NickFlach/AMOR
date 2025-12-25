import { ethers } from "ethers";

const NEO_X_RPC_URL = "https://mainnet-1.rpc.banelabs.org";

export const CONTRACTS = {
  AMOR: "0x7C833fe6b80465F956E2939aD6f03FFaC08f058e",
  ST_AMOR: "0x58390f0883b176c6EbcDddE9527321F4b4E5c565",
  STAKING_MANAGER: "0xae73C3390a145154Ab94935FB06f2Fc31A04E7d6",
  GOVERNOR: "0xaf596B738B57B6Ac939f453Ce2201349F3105146",
} as const;

const ERC20_INTERFACE = new ethers.Interface([
  "function approve(address spender, uint256 amount) returns (bool)",
]);

const STAKING_MANAGER_INTERFACE = new ethers.Interface([
  "function stake(uint256 amount)",
  "function requestUnstake(uint256 amount)",
  "function claimUnstake(uint256 requestId)",
  "function cancelUnstake(uint256 requestId)",
]);

const ST_AMOR_INTERFACE = new ethers.Interface([
  "function delegate(address delegatee)",
]);

const GOVERNOR_INTERFACE = new ethers.Interface([
  "function castVote(uint256 proposalId, uint8 support) returns (uint256)",
  "function castVoteWithReason(uint256 proposalId, uint8 support, string reason) returns (uint256)",
]);

export interface TransactionData {
  to: string;
  data: string;
  description: string;
}

export interface MultiStepTransaction {
  steps: TransactionData[];
  totalSteps: number;
  description: string;
}

export function buildApproveTransaction(
  tokenAddress: string,
  spenderAddress: string,
  amount: string
): TransactionData {
  const amountWei = ethers.parseEther(amount);
  const data = ERC20_INTERFACE.encodeFunctionData("approve", [
    spenderAddress,
    amountWei,
  ]);

  return {
    to: tokenAddress,
    data,
    description: `Approve ${amount} AMOR for staking`,
  };
}

export function buildStakeTransaction(amount: string): MultiStepTransaction {
  const amountWei = ethers.parseEther(amount);

  const approveStep: TransactionData = {
    to: CONTRACTS.AMOR,
    data: ERC20_INTERFACE.encodeFunctionData("approve", [
      CONTRACTS.STAKING_MANAGER,
      amountWei,
    ]),
    description: `Step 1: Approve ${amount} AMOR for staking contract`,
  };

  const stakeStep: TransactionData = {
    to: CONTRACTS.STAKING_MANAGER,
    data: STAKING_MANAGER_INTERFACE.encodeFunctionData("stake", [amountWei]),
    description: `Step 2: Stake ${amount} AMOR to receive stAMOR`,
  };

  return {
    steps: [approveStep, stakeStep],
    totalSteps: 2,
    description: `Stake ${amount} AMOR tokens. This requires 2 transactions: first approve the staking contract to spend your AMOR, then execute the stake. You will receive ${amount} stAMOR in return.`,
  };
}

export function buildUnstakeTransaction(amount: string): TransactionData {
  const amountWei = ethers.parseEther(amount);
  const data = STAKING_MANAGER_INTERFACE.encodeFunctionData("requestUnstake", [
    amountWei,
  ]);

  return {
    to: CONTRACTS.STAKING_MANAGER,
    data,
    description: `Request unstake of ${amount} stAMOR. After the withdrawal delay period (typically 7 days), you can claim your AMOR tokens.`,
  };
}

export function buildClaimUnstakeTransaction(requestId: number): TransactionData {
  const data = STAKING_MANAGER_INTERFACE.encodeFunctionData("claimUnstake", [
    requestId,
  ]);

  return {
    to: CONTRACTS.STAKING_MANAGER,
    data,
    description: `Claim unstaked AMOR from request #${requestId}. The AMOR tokens will be transferred to your wallet.`,
  };
}

export function buildCancelUnstakeTransaction(requestId: number): TransactionData {
  const data = STAKING_MANAGER_INTERFACE.encodeFunctionData("cancelUnstake", [
    requestId,
  ]);

  return {
    to: CONTRACTS.STAKING_MANAGER,
    data,
    description: `Cancel unstake request #${requestId}. Your stAMOR will remain staked and retain voting power.`,
  };
}

export function buildDelegateTransaction(delegatee: string): TransactionData {
  if (!ethers.isAddress(delegatee)) {
    throw new Error("Invalid delegatee address");
  }

  const data = ST_AMOR_INTERFACE.encodeFunctionData("delegate", [delegatee]);

  return {
    to: CONTRACTS.ST_AMOR,
    data,
    description: `Delegate voting power to ${delegatee}. To self-delegate and activate your own voting power, use your own address.`,
  };
}

export function buildVoteTransaction(
  proposalId: string,
  support: number,
  reason?: string
): TransactionData {
  const supportLabels = ["Against", "For", "Abstain"];
  const supportLabel = supportLabels[support] || `Support(${support})`;

  let data: string;
  if (reason && reason.trim().length > 0) {
    data = GOVERNOR_INTERFACE.encodeFunctionData("castVoteWithReason", [
      proposalId,
      support,
      reason,
    ]);
  } else {
    data = GOVERNOR_INTERFACE.encodeFunctionData("castVote", [
      proposalId,
      support,
    ]);
  }

  const reasonText = reason ? ` with reason: "${reason}"` : "";

  return {
    to: CONTRACTS.GOVERNOR,
    data,
    description: `Vote "${supportLabel}" on proposal #${proposalId}${reasonText}`,
  };
}

let provider: ethers.JsonRpcProvider | null = null;

function getProvider(): ethers.JsonRpcProvider {
  if (!provider) {
    provider = new ethers.JsonRpcProvider(NEO_X_RPC_URL);
  }
  return provider;
}

export async function getGasPrice(): Promise<{
  gasPrice: string;
  gasPriceGwei: string;
  timestamp: number;
}> {
  try {
    const rpcProvider = getProvider();
    const feeData = await rpcProvider.getFeeData();
    const gasPrice = feeData.gasPrice || BigInt(0);

    return {
      gasPrice: gasPrice.toString(),
      gasPriceGwei: ethers.formatUnits(gasPrice, "gwei"),
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error("Error fetching gas price:", error);
    return {
      gasPrice: "0",
      gasPriceGwei: "0",
      timestamp: Date.now(),
    };
  }
}

export async function simulateTransaction(
  from: string,
  to: string,
  data: string
): Promise<{
  success: boolean;
  gasEstimate?: string;
  error?: string;
}> {
  try {
    const rpcProvider = getProvider();

    const gasEstimate = await rpcProvider.estimateGas({
      from,
      to,
      data,
    });

    return {
      success: true,
      gasEstimate: gasEstimate.toString(),
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    let userFriendlyError = errorMessage;
    if (errorMessage.includes("insufficient funds")) {
      userFriendlyError =
        "Insufficient funds for gas. Please ensure you have enough GAS tokens.";
    } else if (errorMessage.includes("execution reverted")) {
      userFriendlyError =
        "Transaction would fail. This could be due to insufficient balance, lack of approval, or contract restrictions.";
    } else if (errorMessage.includes("allowance")) {
      userFriendlyError =
        "Insufficient token allowance. You need to approve the contract first.";
    }

    return {
      success: false,
      error: userFriendlyError,
    };
  }
}

export function formatTransactionForResponse(tx: TransactionData): string {
  return `Transaction Ready:
- Contract: ${tx.to}
- Encoded Data: ${tx.data}
- Description: ${tx.description}

To execute this transaction, use your connected wallet to send a transaction with the above parameters. The "data" field contains the encoded function call.`;
}

export function formatMultiStepTransactionForResponse(
  tx: MultiStepTransaction
): string {
  let response = `Multi-Step Transaction (${tx.totalSteps} steps required):
${tx.description}

`;

  tx.steps.forEach((step, index) => {
    response += `--- Step ${index + 1} of ${tx.totalSteps} ---
Contract: ${step.to}
Encoded Data: ${step.data}
Description: ${step.description}

`;
  });

  response +=
    "Execute these transactions in order using your connected wallet. Wait for each transaction to confirm before proceeding to the next.";

  return response;
}
