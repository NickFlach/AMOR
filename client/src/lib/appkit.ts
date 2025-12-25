import { createAppKit } from '@reown/appkit'
import { EthersAdapter } from '@reown/appkit-adapter-ethers'
import type { AppKitNetwork } from '@reown/appkit/networks'

const neoXMainnet: AppKitNetwork = {
  id: 47763,
  name: 'Neo X Mainnet',
  nativeCurrency: {
    name: 'GAS',
    symbol: 'GAS',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://mainnet-1.rpc.banelabs.org'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Neo X Explorer',
      url: 'https://xexplorer.neo.org',
    },
  },
}

const networks: [AppKitNetwork, ...AppKitNetwork[]] = [neoXMainnet]

let appKitInstance: ReturnType<typeof createAppKit> | null = null

export async function initializeAppKit(): Promise<ReturnType<typeof createAppKit>> {
  if (appKitInstance) return appKitInstance

  try {
    const response = await fetch('/api/config')
    const config = await response.json()
    const projectId = config.walletConnectProjectId || ''

    if (!projectId) {
      console.warn('WalletConnect project ID not configured')
    }

    const ethersAdapter = new EthersAdapter()

    appKitInstance = createAppKit({
      adapters: [ethersAdapter],
      networks,
      projectId,
      metadata: {
        name: 'AMOR DApp',
        description: 'Stake AMOR tokens and participate in governance on Neo X',
        url: typeof window !== 'undefined' ? window.location.origin : 'https://amor.app',
        icons: ['https://avatars.githubusercontent.com/u/37784886'],
      },
      featuredWalletIds: [
        'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
      ],
      features: {
        analytics: false,
      },
      themeMode: 'dark',
    })

    return appKitInstance
  } catch (error) {
    console.error('Failed to initialize AppKit:', error)
    throw error
  }
}

export function getAppKit() {
  return appKitInstance
}

export { neoXMainnet }
