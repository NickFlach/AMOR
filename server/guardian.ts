import OpenAI from "openai";
import type { GuardianMessage, GuardianResponse } from "@shared/schema";
import {
  getChainStats,
  getUserChainData,
  formatChainStatsForAI,
  formatUserDataForAI,
  getTokenPrice,
  getProposalDetails,
  checkHasVoted,
  analyzeVotingPower,
  formatTokenPriceForAI,
  formatProposalDetailsForAI,
  formatVotingStatusForAI,
  formatVotingPowerAnalysisForAI,
} from "./onchain";
import {
  buildStakeTransaction,
  buildUnstakeTransaction,
  buildClaimUnstakeTransaction,
  buildDelegateTransaction,
  buildVoteTransaction,
  getGasPrice,
  simulateTransaction,
  formatTransactionForResponse,
  formatMultiStepTransactionForResponse,
  CONTRACTS,
} from "./transactions";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const NEO_X_CHAIN_ID = 47763;

const SYSTEM_PROMPT = `You are AMOR Guardian, an AI assistant for the AMOR Consciousness Nexus on Neo X blockchain. You operate following SpoonOS principles - you can prepare and simulate transactions, but users must approve and sign them in their wallet.

## Core Capabilities

**Query Capabilities:**
- Fetch real-time on-chain statistics (total staked, governance parameters)
- Query user wallet data (balances, voting power, delegate status, unstake requests)
- Check current gas prices on Neo X
- Get token prices for AMOR, GAS, NEO, and stAMOR

**DeFi & Governance Tools:**
- Get detailed proposal information including vote counts, status, and proposer
- Check if a user has voted on specific proposals
- Analyze voting power and provide recommendations for improving governance participation
- Monitor delegation status and voting power activation

**Transaction Preparation (SpoonOS Pattern):**
You can prepare transaction data for users to execute, including:
- Stake AMOR tokens (2-step: approve + stake)
- Request unstaking of stAMOR
- Claim unstaked AMOR after cooldown
- Delegate voting power (self-delegate to activate, or delegate to another address)
- Vote on governance proposals (For/Against/Abstain with optional reason)

**Transaction Simulation:**
Before users execute, you can simulate transactions to check if they would succeed and estimate gas costs.

## Key Information

**Network:** Neo X Mainnet (Chain ID: ${NEO_X_CHAIN_ID})
**RPC:** https://mainnet-1.rpc.banelabs.org

**Contract Addresses:**
- AMOR Token: ${CONTRACTS.AMOR}
- stAMOR Token: ${CONTRACTS.ST_AMOR}
- Staking Manager: ${CONTRACTS.STAKING_MANAGER}
- Governor: ${CONTRACTS.GOVERNOR}

## Staking Flow
1. Users stake AMOR tokens to receive stAMOR (1:1 ratio)
2. stAMOR represents voting power in governance
3. Users MUST delegate to themselves (self-delegate) to activate voting power
4. Unstaking has a cooldown period (typically 7 days)

## Governance Flow
1. Users with stAMOR can vote on proposals (For=1, Against=0, Abstain=2)
2. Proposals go through: Pending -> Active -> Succeeded/Defeated -> Queued -> Executed
3. Meeting the proposal threshold (stAMOR) is required to create proposals

## Important Guidelines

1. **Always use tools** when users ask about balances, parameters, or want to perform actions
2. **Prepare transactions** when users want to stake, unstake, delegate, or vote - provide the encoded data
3. **Remind users** that they must sign and execute transactions in their wallet - you cannot execute for them
4. **Simulate first** when possible to catch potential errors before users attempt execution
5. **Be precise** with amounts - always confirm the exact amount the user wants to transact
6. For staking: Explain the 2-step process (approve then stake)
7. For delegation: Explain that self-delegation is required to activate voting power

When providing transaction data, format it clearly so users understand what they're signing. Include the contract address, encoded data, and a human-readable description.`;

const tools: OpenAI.Chat.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "get_chain_stats",
      description: "Get current on-chain statistics including total staked AMOR, proposal threshold, voting parameters, and withdrawal delay. Use this when users ask about protocol parameters or current state.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_user_data",
      description: "Get on-chain data for a specific wallet address including AMOR balance, stAMOR balance, voting power, delegate status, and pending unstake requests. Use this when users ask about their wallet, balances, or status.",
      parameters: {
        type: "object",
        properties: {
          address: {
            type: "string",
            description: "The Ethereum wallet address to query (0x...)",
          },
        },
        required: ["address"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "prepare_stake_transaction",
      description: "Generate transaction data for staking AMOR tokens. This creates a 2-step transaction: first approve the staking contract, then stake. Use when user wants to stake their AMOR tokens.",
      parameters: {
        type: "object",
        properties: {
          amount: {
            type: "string",
            description: "Amount of AMOR to stake (in human-readable format, e.g., '100' for 100 AMOR)",
          },
        },
        required: ["amount"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "prepare_unstake_transaction",
      description: "Generate transaction data for requesting to unstake stAMOR tokens. After the withdrawal delay period, the user can claim their AMOR. Use when user wants to unstake.",
      parameters: {
        type: "object",
        properties: {
          amount: {
            type: "string",
            description: "Amount of stAMOR to unstake (in human-readable format, e.g., '50' for 50 stAMOR)",
          },
        },
        required: ["amount"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "prepare_claim_unstake_transaction",
      description: "Generate transaction data for claiming unstaked AMOR tokens after the cooldown period. Use when user has a ready-to-claim unstake request.",
      parameters: {
        type: "object",
        properties: {
          requestId: {
            type: "number",
            description: "The unstake request ID to claim",
          },
        },
        required: ["requestId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "prepare_delegate_transaction",
      description: "Generate transaction data for delegating voting power. To self-delegate and activate voting power, use the user's own address. Can also delegate to another address.",
      parameters: {
        type: "object",
        properties: {
          delegatee: {
            type: "string",
            description: "The address to delegate voting power to. Use the user's own address for self-delegation.",
          },
        },
        required: ["delegatee"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "prepare_vote_transaction",
      description: "Generate transaction data for voting on a governance proposal. Support values: 0 = Against, 1 = For, 2 = Abstain.",
      parameters: {
        type: "object",
        properties: {
          proposalId: {
            type: "string",
            description: "The proposal ID to vote on",
          },
          support: {
            type: "number",
            description: "Vote type: 0 = Against, 1 = For, 2 = Abstain",
          },
          reason: {
            type: "string",
            description: "Optional reason for the vote",
          },
        },
        required: ["proposalId", "support"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_gas_price",
      description: "Get the current gas price on Neo X network. Use this to inform users about current transaction costs.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "simulate_transaction",
      description: "Simulate a transaction to check if it would succeed and estimate gas. Use this before users execute to catch potential errors.",
      parameters: {
        type: "object",
        properties: {
          from: {
            type: "string",
            description: "The sender address (user's wallet)",
          },
          to: {
            type: "string",
            description: "The target contract address",
          },
          data: {
            type: "string",
            description: "The encoded transaction data",
          },
        },
        required: ["from", "to", "data"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_token_price",
      description: "Get the current price for tokens like AMOR, GAS, NEO, or stAMOR. Use this when users ask about token prices or want to calculate values.",
      parameters: {
        type: "object",
        properties: {
          symbol: {
            type: "string",
            description: "The token symbol (e.g., 'AMOR', 'GAS', 'NEO', 'stAMOR')",
          },
        },
        required: ["symbol"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_proposal_details",
      description: "Get detailed information about a specific governance proposal including its status, vote counts, proposer, and timing. Use when users ask about a specific proposal.",
      parameters: {
        type: "object",
        properties: {
          proposalId: {
            type: "string",
            description: "The proposal ID to query",
          },
        },
        required: ["proposalId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "check_voting_status",
      description: "Check if a specific address has voted on a governance proposal. Use when users want to know if they or someone else has voted.",
      parameters: {
        type: "object",
        properties: {
          proposalId: {
            type: "string",
            description: "The proposal ID to check",
          },
          address: {
            type: "string",
            description: "The wallet address to check (0x...)",
          },
        },
        required: ["proposalId", "address"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "analyze_voting_power",
      description: "Analyze a user's voting power, delegation status, and provide recommendations for improving governance participation. Use when users ask about their voting power or how to participate in governance.",
      parameters: {
        type: "object",
        properties: {
          address: {
            type: "string",
            description: "The wallet address to analyze (0x...)",
          },
        },
        required: ["address"],
      },
    },
  },
];

async function executeToolCall(
  toolName: string,
  args: Record<string, unknown>,
  sessionContext?: { address?: string }
): Promise<string> {
  try {
    switch (toolName) {
      case "get_chain_stats": {
        const stats = await getChainStats();
        return formatChainStatsForAI(stats);
      }

      case "get_user_data": {
        const address = (args.address as string) || sessionContext?.address;
        if (!address) {
          return "Error: No wallet address provided. Please ensure the user has connected their wallet.";
        }
        const userData = await getUserChainData(address);
        return formatUserDataForAI(userData);
      }

      case "prepare_stake_transaction": {
        const amount = args.amount as string;
        if (!amount || isNaN(parseFloat(amount))) {
          return "Error: Invalid amount provided. Please specify a valid number.";
        }
        const tx = buildStakeTransaction(amount);
        return formatMultiStepTransactionForResponse(tx);
      }

      case "prepare_unstake_transaction": {
        const amount = args.amount as string;
        if (!amount || isNaN(parseFloat(amount))) {
          return "Error: Invalid amount provided. Please specify a valid number.";
        }
        const tx = buildUnstakeTransaction(amount);
        return formatTransactionForResponse(tx);
      }

      case "prepare_claim_unstake_transaction": {
        const requestId = args.requestId as number;
        if (requestId === undefined || requestId < 0) {
          return "Error: Invalid request ID provided.";
        }
        const tx = buildClaimUnstakeTransaction(requestId);
        return formatTransactionForResponse(tx);
      }

      case "prepare_delegate_transaction": {
        const delegatee = args.delegatee as string;
        if (!delegatee) {
          return "Error: No delegatee address provided.";
        }
        try {
          const tx = buildDelegateTransaction(delegatee);
          return formatTransactionForResponse(tx);
        } catch (error) {
          return `Error: ${error instanceof Error ? error.message : "Invalid address"}`;
        }
      }

      case "prepare_vote_transaction": {
        const proposalId = args.proposalId as string;
        const support = args.support as number;
        const reason = args.reason as string | undefined;

        if (!proposalId) {
          return "Error: No proposal ID provided.";
        }
        if (support === undefined || support < 0 || support > 2) {
          return "Error: Invalid support value. Use 0 (Against), 1 (For), or 2 (Abstain).";
        }

        const tx = buildVoteTransaction(proposalId, support, reason);
        return formatTransactionForResponse(tx);
      }

      case "get_gas_price": {
        const gasData = await getGasPrice();
        return `Current Gas Price on Neo X:
- Gas Price: ${gasData.gasPriceGwei} Gwei
- Raw: ${gasData.gasPrice} wei
- Timestamp: ${new Date(gasData.timestamp).toISOString()}

Note: Gas prices can fluctuate. The actual gas used will depend on the transaction complexity.`;
      }

      case "simulate_transaction": {
        const from = args.from as string;
        const to = args.to as string;
        const data = args.data as string;

        if (!from || !to || !data) {
          return "Error: Missing required parameters (from, to, data).";
        }

        const result = await simulateTransaction(from, to, data);
        if (result.success) {
          return `Transaction Simulation Successful:
- Estimated Gas: ${result.gasEstimate} units
- The transaction should execute successfully.

Note: This is an estimate. Actual gas usage may vary slightly.`;
        } else {
          return `Transaction Simulation Failed:
- Error: ${result.error}

The transaction would likely fail if executed. Please check:
1. Sufficient token balance
2. Token approvals are in place
3. The contract is not paused
4. You meet any required thresholds`;
        }
      }

      case "get_token_price": {
        const symbol = args.symbol as string;
        if (!symbol) {
          return "Error: No token symbol provided. Please specify a token like AMOR, GAS, or NEO.";
        }
        const price = getTokenPrice(symbol);
        return formatTokenPriceForAI(price);
      }

      case "get_proposal_details": {
        const proposalId = args.proposalId as string;
        if (!proposalId) {
          return "Error: No proposal ID provided.";
        }
        const details = await getProposalDetails(proposalId);
        return formatProposalDetailsForAI(details);
      }

      case "check_voting_status": {
        const proposalId = args.proposalId as string;
        const address = (args.address as string) || sessionContext?.address;
        
        if (!proposalId) {
          return "Error: No proposal ID provided.";
        }
        if (!address) {
          return "Error: No wallet address provided. Please ensure the user has connected their wallet.";
        }
        
        const status = await checkHasVoted(proposalId, address);
        return formatVotingStatusForAI(status);
      }

      case "analyze_voting_power": {
        const address = (args.address as string) || sessionContext?.address;
        if (!address) {
          return "Error: No wallet address provided. Please ensure the user has connected their wallet.";
        }
        const analysis = await analyzeVotingPower(address);
        return formatVotingPowerAnalysisForAI(analysis);
      }

      default:
        return `Unknown tool: ${toolName}`;
    }
  } catch (error) {
    console.error(`Tool execution error (${toolName}):`, error);
    return `Error executing ${toolName}: ${error instanceof Error ? error.message : "Unknown error"}`;
  }
}

interface ChatSession {
  messages: GuardianMessage[];
  walletContext?: {
    address: string;
    amorBalance: string;
    stAmorBalance: string;
    votingPower: string;
  };
}

const sessions = new Map<string, ChatSession>();

export function getOrCreateSession(sessionId: string): ChatSession {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, { messages: [] });
  }
  return sessions.get(sessionId)!;
}

export function clearSession(sessionId: string): void {
  sessions.delete(sessionId);
}

export async function processGuardianMessage(
  sessionId: string,
  userMessage: string,
  walletContext?: ChatSession["walletContext"]
): Promise<GuardianResponse> {
  const session = getOrCreateSession(sessionId);

  if (walletContext) {
    session.walletContext = walletContext;
  }

  const userMsg: GuardianMessage = {
    id: crypto.randomUUID(),
    role: "user",
    content: userMessage,
    timestamp: Date.now(),
  };
  session.messages.push(userMsg);

  const contextMessage = session.walletContext
    ? `\n\nUser's connected wallet: ${session.walletContext.address}`
    : "\n\nUser is not connected to a wallet.";

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT + contextMessage },
    ...session.messages.slice(-10).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  ];

  try {
    let completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      tools,
      tool_choice: "auto",
      max_tokens: 1024,
      temperature: 0.7,
    });

    let responseMessage = completion.choices[0]?.message;

    while (responseMessage?.tool_calls && responseMessage.tool_calls.length > 0) {
      const toolCalls = responseMessage.tool_calls;

      messages.push({
        role: "assistant",
        content: responseMessage.content,
        tool_calls: toolCalls,
      });

      for (const toolCall of toolCalls) {
        if (toolCall.type !== "function") continue;

        const args = JSON.parse(toolCall.function.arguments || "{}");

        if (
          toolCall.function.name === "get_user_data" &&
          !args.address &&
          session.walletContext?.address
        ) {
          args.address = session.walletContext.address;
        }

        const result = await executeToolCall(toolCall.function.name, args, {
          address: session.walletContext?.address,
        });

        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: result,
        });
      }

      completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages,
        tools,
        tool_choice: "auto",
        max_tokens: 1024,
        temperature: 0.7,
      });

      responseMessage = completion.choices[0]?.message;
    }

    const assistantContent =
      responseMessage?.content || "I apologize, but I could not generate a response.";

    const assistantMsg: GuardianMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: assistantContent,
      timestamp: Date.now(),
    };
    session.messages.push(assistantMsg);

    return {
      message: assistantContent,
    };
  } catch (error) {
    console.error("Guardian AI error:", error);
    throw new Error("Failed to process message with AI");
  }
}

export async function streamGuardianMessage(
  sessionId: string,
  userMessage: string,
  walletContext?: ChatSession["walletContext"],
  onChunk?: (chunk: string) => void
): Promise<string> {
  const session = getOrCreateSession(sessionId);

  if (walletContext) {
    session.walletContext = walletContext;
  }

  const userMsg: GuardianMessage = {
    id: crypto.randomUUID(),
    role: "user",
    content: userMessage,
    timestamp: Date.now(),
  };
  session.messages.push(userMsg);

  const contextMessage = session.walletContext
    ? `\n\nUser's connected wallet: ${session.walletContext.address}`
    : "\n\nUser is not connected to a wallet.";

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT + contextMessage },
    ...session.messages.slice(-10).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  ];

  let completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages,
    tools,
    tool_choice: "auto",
    max_tokens: 1024,
    temperature: 0.7,
  });

  let responseMessage = completion.choices[0]?.message;

  while (responseMessage?.tool_calls && responseMessage.tool_calls.length > 0) {
    const toolCalls = responseMessage.tool_calls;

    messages.push({
      role: "assistant",
      content: responseMessage.content,
      tool_calls: toolCalls,
    });

    onChunk?.("[Preparing transaction data...]\n");

    for (const toolCall of toolCalls) {
      if (toolCall.type !== "function") continue;

      const args = JSON.parse(toolCall.function.arguments || "{}");

      if (
        toolCall.function.name === "get_user_data" &&
        !args.address &&
        session.walletContext?.address
      ) {
        args.address = session.walletContext.address;
      }

      const result = await executeToolCall(toolCall.function.name, args, {
        address: session.walletContext?.address,
      });

      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: result,
      });
    }

    completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      tools,
      tool_choice: "auto",
      max_tokens: 1024,
      temperature: 0.7,
    });

    responseMessage = completion.choices[0]?.message;
  }

  const stream = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      ...messages,
      ...(responseMessage?.content
        ? [{ role: "assistant" as const, content: responseMessage.content }]
        : []),
    ],
    max_tokens: 1024,
    temperature: 0.7,
    stream: true,
  });

  let fullResponse = "";

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || "";
    if (content) {
      fullResponse += content;
      onChunk?.(content);
    }
  }

  const assistantMsg: GuardianMessage = {
    id: crypto.randomUUID(),
    role: "assistant",
    content: fullResponse,
    timestamp: Date.now(),
  };
  session.messages.push(assistantMsg);

  return fullResponse;
}

export function getSessionMessages(sessionId: string): GuardianMessage[] {
  return getOrCreateSession(sessionId).messages;
}
