# AMOR Neo X DApp Design Guidelines

## Design Approach
**System**: Material Design with Web3/DeFi adaptations, drawing inspiration from Uniswap's clarity and Aave's data-rich interfaces. Prioritizing trust, transparency, and functional efficiency for financial operations.

**Core Principles**: 
- Clarity in financial data presentation
- Trustworthy, professional aesthetics
- Efficient user flows for staking/governance
- Web3-native patterns (wallet connection prominence)

## Typography

**Font Families**:
- Primary: Inter (via Google Fonts CDN) - Interface, data, buttons
- Mono: JetBrains Mono (via Google Fonts CDN) - Addresses, token amounts, technical data

**Hierarchy**:
- Hero/H1: text-5xl md:text-6xl, font-bold
- Section Headers/H2: text-3xl md:text-4xl, font-bold
- Card Headers/H3: text-xl md:text-2xl, font-semibold
- Body: text-base md:text-lg
- Data/Stats: text-2xl md:text-3xl, font-bold (mono for numbers)
- Labels: text-sm, font-medium, uppercase tracking-wide
- Technical (addresses): text-sm, font-mono

## Layout System

**Spacing Primitives**: Tailwind units of 4, 6, 8, 12, 16 (p-4, gap-6, mt-8, py-12, mb-16)

**Grid Structure**:
- Container: max-w-7xl mx-auto px-4 md:px-6
- Dashboard: 2-column on desktop (lg:grid-cols-2), single column mobile
- Stats Grid: 3-column (md:grid-cols-3)
- Governance List: Single column with generous spacing

**Viewport Strategy**: Natural content height, no forced 100vh constraints

## Component Library

### Navigation
- Fixed header with wallet connection CTA (prominent)
- Logo + Navigation links + Connect Wallet button
- Mobile: Hamburger menu
- Wallet status indicator when connected (address truncated, balance shown)

### Hero Section
**No large hero image** - Functional landing focused on immediate value:
- Compact header (h-auto, py-16 md:py-24)
- Bold headline about AMOR staking/governance
- Key stats row (Total Staked, APY, Active Proposals) - 3-column grid
- Primary CTA: "Connect Wallet" or "View Dashboard" if connected
- Secondary: Link to explorer

### Dashboard Cards
- Elevated cards with subtle shadows (shadow-lg)
- Rounded corners (rounded-xl)
- Padding: p-6 md:p-8
- Clear section headers
- Data presented in rows with labels and values aligned
- Action buttons at card bottom

### Staking Interface
**Two-panel layout** (side-by-side on desktop):
- Left: Stake panel (input, balance display, stake button)
- Right: Unstake panel (amount, unlock timer, request/claim buttons)
- Active stakes list below (table format)
- Real-time balance updates

### Governance Section
- Proposal cards in vertical list
- Each card shows: Title, Status badge, Vote tallies (progress bars), Time remaining
- Expandable details (description, on-chain data)
- Vote buttons (For/Against/Abstain) for active proposals
- Filters: Active/Passed/Defeated

### Data Displays
- Token amounts: Large, bold, monospace
- Addresses: Truncated with copy button (0x7C83...058e format)
- Timestamps: Relative ("2 days ago") + absolute on hover
- Status badges: Rounded pills with icons
- Progress bars: For voting, unlocking periods

### Buttons & CTAs
- Primary (Wallet connect, Stake, Vote): Large, prominent
- Secondary (Cancel, Details): Outlined
- Tertiary (Copy, External links): Ghost/text style
- Disabled states clearly indicated
- Loading states with spinners

### Contract Integration Elements
- Contract address display with explorer link
- Transaction status toasts (pending, success, error)
- Gas estimation displays
- Network indicator (Neo X)
- Confirmation modals before transactions

### Tables/Lists
- Responsive: Cards on mobile, table on desktop
- Sortable columns for transaction history
- Pagination for long lists
- Empty states with helpful messaging

### Footer
- Contract addresses (all 5 provided) with explorer links
- Social links
- Documentation link
- Network status indicator
- Compact, informational

## Images
**Minimal image strategy** - DApp focuses on functionality over visuals:
- Optional: Small abstract geometric pattern as subtle header background
- Icons only (Heroicons CDN): Wallet, charts, governance icons
- No photography or large illustrative images

## Animations
**Extremely minimal**:
- Smooth transitions on hover (0.2s ease)
- Skeleton loaders for data fetching
- Success/error state animations (check/x icons)
- NO scroll-triggered or decorative animations

## Web3-Specific Patterns
- Wallet connection modal (MetaMask, WalletConnect options)
- Network switch prompts
- Transaction confirmation flow
- Block explorer integration (links open in new tabs)
- Real-time blockchain data updates (polling or websockets)
- Error handling for wallet rejections

## Trust Elements
- Verified contract badges
- Audit report link (if available)
- Total Value Locked (TVL) prominently displayed
- Community stats (holders, voters)
- Transparent on-chain data references