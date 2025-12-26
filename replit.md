# AMOR DApp - Consciousness Nexus on Neo X

## Overview
A Web3 decentralized application for the AMOR token ecosystem on Neo X blockchain. Users can stake AMOR tokens to receive stAMOR voting power and participate in on-chain governance decisions.

## Project Structure
```
├── client/                    # Frontend React application
│   ├── src/
│   │   ├── components/        # UI components
│   │   │   ├── Header.tsx     # Navigation header with wallet connection & Learn dropdown
│   │   │   ├── Hero.tsx       # Landing hero with animated stats & CTAs
│   │   │   ├── StakingPanel.tsx # Stake/unstake interface
│   │   │   ├── GovernanceSection.tsx # Proposals and voting
│   │   │   ├── Footer.tsx     # Contract addresses, quick links, social icons
│   │   │   ├── ThemeToggle.tsx # Dark/light mode toggle
│   │   │   ├── GuardianPanel.tsx # AI chat interface
│   │   │   ├── SocialProof.tsx # Community stats & trust indicators
│   │   │   ├── Newsletter.tsx  # Newsletter signup & social links
│   │   │   └── SocialShare.tsx # Social sharing buttons (Twitter, Telegram)
│   │   ├── lib/
│   │   │   ├── appkit.ts      # Reown AppKit / WalletConnect configuration
│   │   │   ├── contracts.ts   # Contract addresses, ABIs, utilities
│   │   │   ├── web3.tsx       # Web3 context provider (uses AppKit)
│   │   │   └── theme.tsx      # Theme context provider
│   │   ├── pages/
│   │   │   ├── Home.tsx       # Main page with staking, governance, guardian
│   │   │   ├── About.tsx      # Mission, vision, and AMOR story
│   │   │   ├── HowItWorks.tsx # Step-by-step staking/governance guide
│   │   │   ├── Tokenomics.tsx # Token distribution and utility
│   │   │   ├── Roadmap.tsx    # Development phases and milestones
│   │   │   └── FAQ.tsx        # Common questions with accordion
│   │   └── App.tsx            # App root with providers & routing
├── server/                    # Express backend
│   ├── routes.ts              # API routes including /api/config
│   ├── guardian.ts            # AMOR Guardian AI chat service with SpoonOS tools
│   ├── transactions.ts        # Transaction builder for SpoonOS pattern
│   └── onchain.ts             # On-chain data queries (balances, proposals, etc.)
├── shared/                    # Shared types and schemas
└── design_guidelines.md       # UI/UX design guidelines
```

## Smart Contracts (Neo X Mainnet)
- **AMOR Token**: `0x7C833fe6b80465F956E2939aD6f03FFaC08f058e`
- **stAMOR Token**: `0x05fda76aa1e88e83EbB5f155Cd43BE2eb6718eAD`
- **Staking Manager**: `0x58390f0883b176c6EbcDddE9527321F4b4E5c565`
- **Timelock**: `0xae73C3390a145154Ab94935FB06f2Fc31A04E7d6`
- **Governor**: `0xaf596B738B57B6Ac939f453Ce2201349F3105146`

## Network Configuration
- **Chain ID**: 47763
- **RPC URL**: https://mainnet-1.rpc.banelabs.org
- **Explorer**: https://xexplorer.neo.org

## Features
1. **Wallet Connection**: WalletConnect v2 via Reown AppKit - works in embedded iframes
2. **Token Staking**: Stake AMOR to receive stAMOR voting tokens
3. **Unstaking**: Request unstake with cooldown period, claim after unlock
4. **Governance**: View proposals, cast votes (For/Against/Abstain)
5. **Self-Delegation**: Activate voting power by delegating to self
6. **Dark/Light Mode**: Theme toggle with system preference detection
7. **AMOR Guardian Agent**: Autonomous AI agent with direct wallet access
   - **Agentic Behavior**: Proactively fetches and uses wallet data without being asked
   - **Direct Wallet Access**: Automatically queries connected wallet for balances, voting power, delegation status
   - **Auto-Address Population**: Tools like get_user_data, analyze_voting_power auto-use connected wallet address
   - Real-time on-chain data queries via tool-calling
   - Wallet-aware personalized responses
   - Live blockchain statistics (staking, governance parameters)
   - **Transaction Preparation** (SpoonOS Pattern): AI prepares transaction data, users execute
   - **Transaction Execution UI**: Execute prepared transactions directly from chat
   - **Contract Whitelist**: Only verified AMOR contracts can be executed for security

## Marketing Pages
8. **About**: Mission, vision, core values, and community highlights
9. **How It Works**: Step-by-step guide with visual timeline (Connect → Stake → Receive → Govern)
10. **Tokenomics**: Dual-token system explanation, distribution charts, contract addresses
11. **Roadmap**: Four development phases with milestone tracking
12. **FAQ**: Accordion-style Q&A organized by category (General, Staking, Governance, Technical)

## SEO & Social
- Comprehensive meta tags (Open Graph, Twitter Cards)
- Social sharing buttons (Twitter, Telegram, copy link)
- Newsletter signup form
- Community links (Twitter, Discord, Telegram, GitHub)

## SpoonOS Integration
The Guardian AI follows SpoonOS principles for Web3 AI agent development:

### Transaction Preparation Tools
- `prepare_stake_transaction` - Generate 2-step stake transaction (approve + stake)
- `prepare_unstake_transaction` - Generate unstake request transaction
- `prepare_claim_unstake_transaction` - Generate claim transaction for ready unstakes
- `prepare_delegate_transaction` - Generate delegation transaction
- `prepare_vote_transaction` - Generate governance vote transaction

### Query Tools
- `get_chain_stats` - Protocol parameters (total staked, thresholds, delays)
- `get_user_data` - User balances, voting power, unstake requests
- `get_gas_price` - Current Neo X gas price
- `get_token_price` - Token prices (mock data, extensible)
- `get_proposal_details` - Proposal state, votes, timing
- `check_voting_status` - User voting status on proposals
- `analyze_voting_power` - Voting power analysis with recommendations

### Utility Tools
- `simulate_transaction` - Simulate transactions before execution

### Security Features
- Contract whitelist validation (only AMOR ecosystem contracts)
- Calldata hex format validation
- Address validation before execution
- Visual indicators for verified vs unverified contracts
- User prompts to review transaction details before execution

### Future Enhancements
- ABI decoding to verify calldata matches claimed action
- Structured JSON payloads from Guardian for safer parsing
- Transaction simulation preview before execution

## Tech Stack
- **Frontend**: React, TypeScript, Vite, TailwindCSS, shadcn/ui
- **Web3**: ethers.js v6, @reown/appkit, @reown/appkit-adapter-ethers
- **Wallet**: WalletConnect v2 via Reown AppKit
- **Backend**: Express.js
- **Styling**: TailwindCSS with custom design tokens

## Environment Variables
- `WALLETCONNECT_PROJECT_ID` (secret): Required for WalletConnect - get from https://cloud.walletconnect.com

## Running the Project
The project runs on `npm run dev` which starts both the Express server and Vite dev server on port 5000.

## Development Notes
- WalletConnect enables reliable wallet connection in Replit's embedded preview
- The /api/config endpoint exposes WALLETCONNECT_PROJECT_ID to the frontend
- RPC calls may fail in development environment due to CORS/network restrictions
- Fallback values are used when RPC calls fail to ensure UI remains functional
