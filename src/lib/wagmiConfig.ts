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
  blast
} from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'K线分析大师',
  projectId: 'YOUR_PROJECT_ID', // WalletConnect project ID - works for demo
  chains: [
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
    blast
  ],
  ssr: false,
});
