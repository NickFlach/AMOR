import OpenAI from "openai";
import type { GuardianMessage, GuardianResponse } from "@shared/schema";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const NEO_X_CHAIN_ID = 47763;
const NEO_X_RPC_URL = "https://mainnet-1.rpc.banelabs.org";

const CONTRACTS = {
  AMOR: "0x7C833fe6b80465F956E2939aD6f03FFaC08f058e",
  TIMELOCK: "0x05fda76aa1e88e83EbB5f155Cd43BE2eb6718eAD",
  GOVERNOR: "0xaf596B738B57B6Ac939f453Ce2201349F3105146",
  ST_AMOR: "0x58390f0883b176c6EbcDddE9527321F4b4E5c565",
  STAKING_MANAGER: "0xae73C3390a145154Ab94935FB06f2Fc31A04E7d6",
};

const SYSTEM_PROMPT = `You are AMOR Guardian, an AI assistant for the AMOR Consciousness Nexus on Neo X blockchain.

Your purpose is to help users:
1. Understand staking AMOR tokens to receive stAMOR voting power
2. Navigate governance proposals and voting
3. Explain how delegation works to activate voting power
4. Provide information about the AMOR ecosystem

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
4. Unstaking has a 7-day cooldown period

Governance Flow:
1. Users with stAMOR can vote on proposals (For/Against/Abstain)
2. Proposals go through: Pending -> Active -> Succeeded/Defeated -> Queued -> Executed
3. Meeting the proposal threshold (stAMOR) is required to create proposals

Be helpful, concise, and technically accurate. If users ask about specific transactions or actions, guide them to use the appropriate interface sections (Staking Panel for staking, Governance Section for voting).

When discussing blockchain data, remind users that you can provide information but cannot execute transactions directly - they must use their connected wallet.`;

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
    ? `\n\nUser's wallet context:\n- Address: ${session.walletContext.address}\n- AMOR Balance: ${session.walletContext.amorBalance}\n- stAMOR Balance: ${session.walletContext.stAmorBalance}\n- Voting Power: ${session.walletContext.votingPower}`
    : "\n\nUser is not connected to a wallet.";

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT + contextMessage },
    ...session.messages.slice(-10).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  ];

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      max_tokens: 1024,
      temperature: 0.7,
    });

    const assistantContent = completion.choices[0]?.message?.content || "I apologize, but I could not generate a response.";

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
    ? `\n\nUser's wallet context:\n- Address: ${session.walletContext.address}\n- AMOR Balance: ${session.walletContext.amorBalance}\n- stAMOR Balance: ${session.walletContext.stAmorBalance}\n- Voting Power: ${session.walletContext.votingPower}`
    : "\n\nUser is not connected to a wallet.";

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT + contextMessage },
    ...session.messages.slice(-10).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  ];

  const stream = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages,
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
