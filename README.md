# AMOR Protocol - Consciousness Nexus

<div align="center">

![AMOR Protocol](https://img.shields.io/badge/AMOR-Consciousness%20Nexus-6366f1?style=for-the-badge)
![Neo X](https://img.shields.io/badge/Network-Neo%20X%20Mainnet-00e599?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

**Decentralized Staking & Governance on Neo X Blockchain**

[Live App](https://amor.network) | [Documentation](#features) | [Community](#community)

</div>

---

## Overview

AMOR Protocol is a Web3 decentralized application enabling token staking and on-chain governance on the Neo X blockchain. Stake AMOR tokens to receive stAMOR voting power and participate in shaping the protocol's future through decentralized governance.

### Key Features

- **Token Staking**: Stake AMOR tokens to receive stAMOR voting tokens
- **Governance Voting**: Cast votes on proposals (For/Against/Abstain)
- **Self-Delegation**: Activate your voting power by delegating to yourself
- **AI Guardian Agent**: Autonomous assistant with direct wallet access and protocol knowledge
- **Real-time Data**: Live on-chain statistics and proposal tracking

---

## Architecture

```
├── client/                    # React Frontend (Vite + TypeScript)
│   ├── src/
│   │   ├── components/        # UI Components (shadcn/ui)
│   │   ├── lib/               # Web3 utilities, AppKit config
│   │   └── pages/             # Application pages
├── server/                    # Express Backend
│   ├── guardian.ts            # AI Agent with SpoonOS pattern
│   ├── onchain.ts             # Blockchain data queries
│   ├── mailer.ts              # Newsletter email service
│   └── newsletter.ts          # Auto-generated content
├── shared/                    # Shared types and schemas
└── migrations/                # Database migrations
```

---

## Smart Contracts

All contracts are deployed on **Neo X Mainnet** (Chain ID: 47763)

| Contract | Address |
|----------|---------|
| AMOR Token | `0x7C833fe6b80465F956E2939aD6f03FFaC08f058e` |
| stAMOR Token | `0x05fda76aa1e88e83EbB5f155Cd43BE2eb6718eAD` |
| Staking Manager | `0x58390f0883b176c6EbcDddE9527321F4b4E5c565` |
| Governor | `0xaf596B738B57B6Ac939f453Ce2201349F3105146` |
| Timelock | `0xae73C3390a145154Ab94935FB06f2Fc31A04E7d6` |

---

## AMOR Guardian Agent

The Guardian is an autonomous AI agent that follows the **SpoonOS pattern** for Web3 AI development:

### Capabilities

- **Direct Wallet Access**: Automatically queries connected wallet for balances, voting power, and delegation status
- **Transaction Preparation**: Prepares transaction data for user approval and execution
- **Protocol Knowledge**: Deep understanding of AMOR contracts, governance flows, and security guardrails
- **Real-time Queries**: Fetches live on-chain data including staking stats and proposal details

### Available Tools

| Tool | Description |
|------|-------------|
| `get_chain_stats` | Protocol parameters (total staked, thresholds, delays) |
| `get_user_data` | User balances, voting power, unstake requests |
| `prepare_stake_transaction` | Generate stake transaction (approve + stake) |
| `prepare_unstake_transaction` | Generate unstake request transaction |
| `prepare_vote_transaction` | Generate governance vote transaction |
| `analyze_voting_power` | Voting power analysis with recommendations |

### Security Model

- Contract whitelist validation (only AMOR ecosystem contracts)
- Calldata hex format validation
- User must approve and sign all transactions
- Visual indicators for verified contracts

---

## Tech Stack

| Layer | Technologies |
|-------|--------------|
| Frontend | React, TypeScript, Vite, TailwindCSS, shadcn/ui |
| Web3 | ethers.js v6, Reown AppKit, WalletConnect v2 |
| Backend | Express.js, Node.js |
| Database | PostgreSQL (Drizzle ORM) |
| AI | OpenAI GPT-4 with function calling |

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- WalletConnect Project ID ([Get one here](https://cloud.walletconnect.com))
- OpenAI API Key

### Installation

```bash
# Clone the repository
git clone https://github.com/NickFlach/AMOR.git
cd AMOR

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials

# Push database schema
npm run db:push

# Start development server
npm run dev
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `WALLETCONNECT_PROJECT_ID` | WalletConnect project ID |
| `OPENAI_API_KEY` | OpenAI API key for Guardian |
| `SMTP_HOST` | SMTP server for newsletters |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password |
| `SMTP_PORT` | SMTP port (587 or 465) |

---

## API Endpoints

### Guardian Agent
- `POST /api/guardian` - Send message to Guardian
- `POST /api/guardian/stream` - Stream Guardian response
- `DELETE /api/guardian/session/:sessionId` - Clear session

### Chain Data
- `GET /api/chain/stats` - Protocol statistics
- `GET /api/chain/user/:address` - User-specific data

### Newsletter
- `POST /api/newsletter/subscribe` - Subscribe to updates
- `POST /api/newsletter/unsubscribe` - Unsubscribe
- `GET /api/newsletter/status` - Subscriber count
- `POST /api/newsletter/send` - Send weekly newsletter

---

## How It Works

### Staking Flow

1. **Connect Wallet** - Use WalletConnect to connect your Neo X wallet
2. **Approve AMOR** - Approve the Staking Manager to spend your tokens
3. **Stake AMOR** - Deposit tokens to receive stAMOR
4. **Self-Delegate** - Activate voting power by delegating to yourself
5. **Vote** - Participate in governance proposals

### Unstaking Flow

1. **Request Unstake** - Initiate withdrawal (starts cooldown)
2. **Wait for Cooldown** - Security delay period
3. **Claim Tokens** - Withdraw AMOR after unlock time

---

## Governance

AMOR Protocol uses OpenZeppelin's Governor pattern with Timelock:

| Parameter | Value |
|-----------|-------|
| Voting Delay | Configurable blocks before voting starts |
| Voting Period | Duration of voting window |
| Proposal Threshold | Minimum stAMOR to create proposals |
| Quorum | Minimum participation required |

### Proposal States

`Pending` → `Active` → `Succeeded/Defeated` → `Queued` → `Executed`

---

## Community

<div align="center">

[![X (Twitter)](https://img.shields.io/badge/X-@CometMessa70661-1DA1F2?style=for-the-badge&logo=x)](https://x.com/CometMessa70661)
[![Discord](https://img.shields.io/badge/Discord-Join%20Us-5865F2?style=for-the-badge&logo=discord)](https://discord.com/channels/1435135541061353615/1435135542038888531)
[![GitHub](https://img.shields.io/badge/GitHub-NickFlach%2FAMOR-181717?style=for-the-badge&logo=github)](https://github.com/NickFlach/AMOR)

</div>

---

## Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with consciousness on Neo X**

</div>
