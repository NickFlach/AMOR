# AMOR DApp - Consciousness Nexus on Neo X

## Overview
A Web3 decentralized application for the AMOR token ecosystem on Neo X blockchain. Users can stake AMOR tokens to receive stAMOR voting power and participate in on-chain governance decisions.

## Project Structure
```
├── client/                    # Frontend React application
│   ├── src/
│   │   ├── components/        # UI components
│   │   │   ├── Header.tsx     # Navigation header with wallet connection
│   │   │   ├── Hero.tsx       # Landing hero section with stats
│   │   │   ├── StakingPanel.tsx # Stake/unstake interface
│   │   │   ├── GovernanceSection.tsx # Proposals and voting
│   │   │   ├── Footer.tsx     # Contract addresses and links
│   │   │   └── ThemeToggle.tsx # Dark/light mode toggle
│   │   ├── lib/
│   │   │   ├── contracts.ts   # Contract addresses, ABIs, utilities
│   │   │   ├── web3.tsx       # Web3 context provider (ethers.js)
│   │   │   └── theme.tsx      # Theme context provider
│   │   ├── pages/
│   │   │   └── Home.tsx       # Main page layout
│   │   └── App.tsx            # App root with providers
├── server/                    # Express backend
├── shared/                    # Shared types and schemas
└── design_guidelines.md       # UI/UX design guidelines
```

## Smart Contracts (Neo X Mainnet)
- **AMOR Token**: `0x7C833fe6b80465F956E2939aD6f03FFaC08f058e`
- **stAMOR Token**: `0x58390f0883b176c6EbcDddE9527321F4b4E5c565`
- **Staking Manager**: `0xae73C3390a145154Ab94935FB06f2Fc31A04E7d6`
- **Governor**: `0xaf596B738B57B6Ac939f453Ce2201349F3105146`
- **Timelock**: `0x05fda76aa1e88e83EbB5f155Cd43BE2eb6718eAD`

## Network Configuration
- **Chain ID**: 47763
- **RPC URL**: https://mainnet-1.rpc.banelabs.org
- **Explorer**: https://xexplorer.neo.org

## Features
1. **Wallet Connection**: MetaMask integration with Neo X network switching
2. **Token Staking**: Stake AMOR to receive stAMOR voting tokens
3. **Unstaking**: Request unstake with cooldown period, claim after unlock
4. **Governance**: View proposals, cast votes (For/Against/Abstain)
5. **Self-Delegation**: Activate voting power by delegating to self
6. **Dark/Light Mode**: Theme toggle with system preference detection

## Tech Stack
- **Frontend**: React, TypeScript, Vite, TailwindCSS, shadcn/ui
- **Web3**: ethers.js v6
- **Backend**: Express.js
- **Styling**: TailwindCSS with custom design tokens

## Running the Project
The project runs on `npm run dev` which starts both the Express server and Vite dev server on port 5000.

## Development Notes
- RPC calls may fail in development environment due to CORS/network restrictions
- Full functionality available when connected to Neo X via MetaMask
- Fallback values are used when RPC calls fail to ensure UI remains functional
