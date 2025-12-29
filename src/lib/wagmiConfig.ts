import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { 
  mainnet, 
  polygon, 
  optimism, 
  arbitrum, 
  base,
  bsc,
  avalanche,
  fantom,
  gnosis,
  zkSync,
  linea,
  scroll,
  mantle,
  blast,
  xLayer
} from 'wagmi/chains';
import { type Chain } from 'viem';

// Define additional chains that may not be in wagmi/chains
const okxXLayer: Chain = {
  id: 196,
  name: 'X Layer',
  nativeCurrency: {
    decimals: 18,
    name: 'OKB',
    symbol: 'OKB',
  },
  rpcUrls: {
    default: { http: ['https://rpc.xlayer.tech'] },
  },
  blockExplorers: {
    default: { name: 'OKLink', url: 'https://www.oklink.com/xlayer' },
  },
};

export const config = getDefaultConfig({
  appName: 'K线分析大师',
  projectId: 'YOUR_PROJECT_ID', // WalletConnect project ID - works for demo
  chains: [
    okxXLayer, // Default chain - X Layer mainnet
    mainnet,
    polygon,
    optimism,
    arbitrum,
    base,
    bsc,
    avalanche,
    fantom,
    gnosis,
    zkSync,
    linea,
    scroll,
    mantle,
    blast,
  ],
  ssr: false,
});
