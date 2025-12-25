import OpenAI from "openai";
import type { GuardianMessage, GuardianResponse } from "@shared/schema";
import { getChainStats, getUserChainData, formatChainStatsForAI, formatUserDataForAI } from "./onchain";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const NEO_X_CHAIN_ID = 47763;

const CONTRACTS = {
  AMOR: "0x7C833fe6b80465F956E2939aD6f03FFaC08f058e",
  TIMELOCK: "0x05fda76aa1e88e83EbB5f155Cd43BE2eb6718eAD",
  GOVERNOR: "0xaf596B738B57B6Ac939f453Ce2201349F3105146",
  ST_AMOR: "0x58390f0883b176c6EbcDddE9527321F4b4E5c565",
  STAKING_MANAGER: "0xae73C3390a145154Ab94935FB06f2Fc31A04E7d6",
};

const SYSTEM_PROMPT = `You are AMOR Guardian, an AI assistant for the AMOR Consciousness Nexus on Neo X blockchain. You have access to real-time on-chain data through tools.

Your purpose is to help users:
1. Understand staking AMOR tokens to receive stAMOR voting power
2. Navigate governance proposals and voting
3. Explain how delegation works to activate voting power
4. Provide information about the AMOR ecosystem
5. Query live blockchain data to give personalized advice

Key information:
- Network: Neo X Mainnet (Chain ID: ${NEO_X_CHAIN_ID})
- AMOR Token: ${CONTRACTS.AMOR}
- stAMOR Token: ${CONTRACTS.ST_AMOR}
- Staking Manager: ${CONTRACTS.STAKING_MANAGER}
- Governor: ${CONTRACTS.GOVERNOR}
- Timelock: ${CONTRACTS.TIMELOCK}

Staking Flow:
1. Users stake AMOR tokens to receive stAMOR (1:1 ratio)
2. stAMOR represents voting power in governance
3. Users must delegate to themselves (self-delegate) to activate voting power
4. Unstaking has a cooldown period (check on-chain for exact duration)

Governance Flow:
1. Users with stAMOR can vote on proposals (For/Against/Abstain)
2. Proposals go through: Pending -> Active -> Succeeded/Defeated -> Queued -> Executed
3. Meeting the proposal threshold (stAMOR) is required to create proposals

IMPORTANT: You have access to tools to query real-time blockchain data. Use them when users ask about:
- Their balances, voting power, or stake status
- Current staking/governance parameters
- Unstake request status

Be helpful, concise, and technically accurate. When discussing blockchain data, remind users that you can provide information but cannot execute transactions directly - they must use their connected wallet.`;

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
];

async function executeToolCall(toolName: string, args: Record<string, unknown>): Promise<string> {
  try {
    switch (toolName) {
      case "get_chain_stats": {
        const stats = await getChainStats();
        return formatChainStatsForAI(stats);
      }
      case "get_user_data": {
        const address = args.address as string;
        if (!address) {
          return "Error: No wallet address provided. Please ensure the user has connected their wallet.";
        }
        const userData = await getUserChainData(address);
        return formatUserDataForAI(userData);
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
        
        if (toolCall.function.name === "get_user_data" && !args.address && session.walletContext?.address) {
          args.address = session.walletContext.address;
        }
        
        const result = await executeToolCall(toolCall.function.name, args);
        
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

    const assistantContent = responseMessage?.content || "I apologize, but I could not generate a response.";

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

    onChunk?.("[Querying blockchain data...]\n");

    for (const toolCall of toolCalls) {
      if (toolCall.type !== "function") continue;
      
      const args = JSON.parse(toolCall.function.arguments || "{}");
      
      if (toolCall.function.name === "get_user_data" && !args.address && session.walletContext?.address) {
        args.address = session.walletContext.address;
      }
      
      const result = await executeToolCall(toolCall.function.name, args);
      
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
      ...(responseMessage?.content ? [{ role: "assistant" as const, content: responseMessage.content }] : []),
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
