import { MarketSnapshot } from '@/types/trading';
import { TrendingUp, TrendingDown, Activity, Info } from 'lucide-react';

interface MarketHeaderProps {
  snapshot: MarketSnapshot | null;
  isLoading: boolean;
  symbol?: string;
}

// 币种简介信息
const COIN_INFO: Record<string, { name: string; description: string }> = {
  BTC: {
    name: 'Bitcoin',
    description: '比特币是第一个去中心化的加密货币，由中本聪于2009年创建。作为数字黄金，它是市值最大的加密货币，采用工作量证明共识机制。'
  },
  ETH: {
    name: 'Ethereum',
    description: '以太坊是一个开源的区块链平台，支持智能合约和去中心化应用(DApp)。由Vitalik Buterin创建，是DeFi和NFT生态的基础。'
  },
  BNB: {
    name: 'BNB',
    description: 'BNB是币安交易所的原生代币，用于支付交易手续费、参与IEO等。同时也是BNB Chain的原生代币，支持智能合约生态。'
  },
  SOL: {
    name: 'Solana',
    description: 'Solana是一个高性能区块链平台，以极快的交易速度和低手续费著称。采用独特的历史证明(PoH)共识机制，适合高频交易应用。'
  },
  XRP: {
    name: 'Ripple',
    description: 'XRP是Ripple网络的原生代币，专注于跨境支付和银行结算。以极低的交易费用和快速确认时间著称。'
  },
  DOGE: {
    name: 'Dogecoin',
    description: '狗狗币最初作为玩笑创建，现已成为最知名的模因币。拥有活跃的社区支持，常用于小额支付和打赏。'
  },
  ADA: {
    name: 'Cardano',
    description: 'Cardano是一个研究驱动的区块链平台，采用权益证明共识机制。注重可扩展性、可持续性和互操作性。'
  },
  AVAX: {
    name: 'Avalanche',
    description: 'Avalanche是一个高性能智能合约平台，以亚秒级确认时间著称。支持创建自定义区块链和去中心化应用。'
  },
  MATIC: {
    name: 'Polygon',
    description: 'Polygon是以太坊的Layer 2扩展解决方案，提供更快、更便宜的交易。广泛用于游戏、NFT和DeFi应用。'
  },
  POL: {
    name: 'Polygon',
    description: 'Polygon是以太坊的Layer 2扩展解决方案，提供更快、更便宜的交易。广泛用于游戏、NFT和DeFi应用。'
  },
  LINK: {
    name: 'Chainlink',
    description: 'Chainlink是去中心化预言机网络，为智能合约提供可靠的链下数据。是DeFi生态的关键基础设施。'
  },
  DOT: {
    name: 'Polkadot',
    description: 'Polkadot是一个多链互操作协议，允许不同区块链之间传递消息和价值。采用独特的平行链架构。'
  },
  UNI: {
    name: 'Uniswap',
    description: 'Uniswap是以太坊上最大的去中心化交易所(DEX)的治理代币。采用自动做市商(AMM)模式进行代币交换。'
  },
  PEPE: {
    name: 'Pepe',
    description: 'PEPE是以青蛙Pepe为主题的模因币，2023年迅速走红。代表了加密货币市场的模因文化和社区驱动特性。'
  },
  SHIB: {
    name: 'Shiba Inu',
    description: '柴犬币是一个去中心化的模因代币，被称为"狗狗币杀手"。拥有庞大的社区和自己的去中心化交易所ShibaSwap。'
  },
  LTC: {
    name: 'Litecoin',
    description: '莱特币是比特币的分叉币，被称为"数字白银"。提供更快的区块确认时间和不同的哈希算法。'
  },
  ATOM: {
    name: 'Cosmos',
    description: 'Cosmos是一个区块链互联网，允许独立区块链通过IBC协议相互通信。采用Tendermint共识引擎。'
  },
  ARB: {
    name: 'Arbitrum',
    description: 'Arbitrum是以太坊的Layer 2扩展方案，使用Optimistic Rollup技术。提供更低的gas费用和更高的吞吐量。'
  },
  OP: {
    name: 'Optimism',
    description: 'Optimism是以太坊Layer 2解决方案，采用Optimistic Rollup技术。致力于扩展以太坊并降低交易成本。'
  },
  APT: {
    name: 'Aptos',
    description: 'Aptos是一个新一代Layer 1区块链，由前Meta员工创建。采用Move编程语言，注重安全性和可扩展性。'
  },
  SUI: {
    name: 'Sui',
    description: 'Sui是一个高性能Layer 1区块链，专注于低延迟和高吞吐量。采用Move语言和独特的对象中心数据模型。'
  },
  TRX: {
    name: 'TRON',
    description: 'TRON是一个去中心化的内容分享平台，专注于数字娱乐。提供高吞吐量和低交易成本。'
  },
  NEAR: {
    name: 'NEAR Protocol',
    description: 'NEAR是一个用户友好的高性能区块链平台，采用分片技术实现可扩展性。注重开发者和用户体验。'
  },
  FIL: {
    name: 'Filecoin',
    description: 'Filecoin是一个去中心化存储网络，允许用户出租闲置硬盘空间。是Web3存储基础设施的重要组成部分。'
  },
  ICP: {
    name: 'Internet Computer',
    description: 'Internet Computer是一个区块链计算平台，旨在将区块链功能扩展到互联网规模。支持运行完整的Web应用。'
  },
  AAVE: {
    name: 'Aave',
    description: 'Aave是一个去中心化借贷协议，允许用户存款赚取利息或借入加密资产。是DeFi领域的领先协议之一。'
  },
};

const getSymbolBase = (symbol: string): string => {
  return symbol.replace(/USDT$|BUSD$|USDC$|BTC$|ETH$/i, '').toUpperCase();
};

export function MarketHeader({ snapshot, isLoading, symbol = 'BTCUSDT' }: MarketHeaderProps) {
  const baseSymbol = getSymbolBase(symbol);
  const coinInfo = COIN_INFO[baseSymbol];

  if (isLoading || !snapshot) {
    return (
      <div className="glass-panel p-4 animate-pulse">
        <div className="h-8 bg-muted rounded w-32 mb-2" />
        <div className="h-4 bg-muted rounded w-48" />
      </div>
    );
  }

  const isPositive = snapshot.changePercent24h >= 0;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;

  const formatPrice = (price: number) => {
    if (price >= 1000) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (price >= 1) return price.toFixed(4);
    return price.toFixed(6);
  };

  const formatVolume = (vol: number) => {
    if (vol >= 1e9) return `${(vol / 1e9).toFixed(2)}B`;
    if (vol >= 1e6) return `${(vol / 1e6).toFixed(2)}M`;
    if (vol >= 1e3) return `${(vol / 1e3).toFixed(2)}K`;
    return vol.toFixed(2);
  };

  return (
    <div className="glass-panel p-4">
      <div className="flex items-start justify-between gap-6">
        <div className="flex-shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold font-mono gold-text">
              {formatPrice(snapshot.price)}
            </h1>
            <div className={`flex items-center gap-1 px-2 py-1 rounded text-sm font-medium ${
              isPositive ? 'bg-bull/10 text-bull' : 'bg-bear/10 text-bear'
            }`}>
              <TrendIcon className="w-4 h-4" />
              {isPositive ? '+' : ''}{snapshot.changePercent24h.toFixed(2)}%
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            24h变动: <span className={isPositive ? 'text-bull' : 'text-bear'}>
              {isPositive ? '+' : ''}{formatPrice(snapshot.change24h)}
            </span>
          </p>
        </div>

        {/* 币种简介 */}
        {coinInfo && (
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Info className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="text-sm font-semibold text-foreground">{coinInfo.name}</span>
              <span className="text-xs text-muted-foreground">({baseSymbol})</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
              {coinInfo.description}
            </p>
          </div>
        )}

        {!coinInfo && (
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Info className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="text-sm font-semibold text-foreground">{baseSymbol}</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              暂无该币种的详细介绍信息
            </p>
          </div>
        )}

        <div className="live-indicator flex-shrink-0">
          <span>实时</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border/50">
        <div>
          <p className="data-label">24H最高</p>
          <p className="data-value text-bull">{formatPrice(snapshot.high24h)}</p>
        </div>
        <div>
          <p className="data-label">24H最低</p>
          <p className="data-value text-bear">{formatPrice(snapshot.low24h)}</p>
        </div>
        <div>
          <p className="data-label flex items-center gap-1">
            <Activity className="w-3 h-3" />
            24H成交量
          </p>
          <p className="data-value">{formatVolume(snapshot.volume24h)}</p>
        </div>
      </div>
    </div>
  );
}
