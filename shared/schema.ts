import { sql } from "drizzle-orm";
import { pgTable, text, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Contract Types for AMOR DApp
export interface TokenBalance {
  amor: string;
  stAmor: string;
  votingPower: string;
  activeStake: string;
}

export interface UnstakeRequest {
  id: number;
  amount: string;
  requestedAt: number;
  unlockAt: number;
  claimed: boolean;
  cancelled: boolean;
}

export interface Proposal {
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

export interface GovernorInfo {
  name: string;
  proposalThreshold: string;
  votingDelay: number;
  votingPeriod: number;
  quorumNumerator: number;
}

export interface StakingInfo {
  withdrawalDelay: number;
  isPaused: boolean;
}

// Proposal state enum matching Solidity
export const ProposalState = {
  Pending: 0,
  Active: 1,
  Canceled: 2,
  Defeated: 3,
  Succeeded: 4,
  Queued: 5,
  Expired: 6,
  Executed: 7,
} as const;

export type ProposalStateType = (typeof ProposalState)[keyof typeof ProposalState];

// Guardian AI Types
export interface GuardianMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
}

export interface GuardianState {
  walletAddress: string | null;
  chainId: number;
  isConnected: boolean;
  nativeBalance: string;
  gasPrice: string;
}

export interface GuardianAction {
  type: "stake" | "unstake" | "vote" | "delegate" | "propose" | "query";
  params: Record<string, unknown>;
  simulated: boolean;
}

export interface GuardianResponse {
  message: string;
  suggestedAction?: GuardianAction;
  state?: Partial<GuardianState>;
}

export interface TransactionSuggestion {
  type: "stake" | "unstake" | "claim" | "delegate" | "vote" | "approve";
  to: string;
  data: string;
  description: string;
  amount?: string;
}

export interface GuardianResponseWithAction {
  message: string;
  suggestedAction?: GuardianAction;
  transactions?: TransactionSuggestion[];
}
