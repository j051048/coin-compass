import { useState, useEffect } from 'react';
import { MarketSnapshot } from '@/types/trading';
import { DataSource } from '@/lib/binanceApi';
import { TrendingUp, TrendingDown, Activity, Info, Search, Loader2 } from 'lucide-react';

interface MarketHeaderProps {
  snapshot: (MarketSnapshot & { dataSource?: DataSource }) | null;
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
  FLOW: {
    name: 'Flow',
    description: 'Flow是专为NFT和游戏设计的区块链，由Dapper Labs创建。NBA Top Shot等知名项目基于Flow构建。'
  },
  FLOKI: {
    name: 'Floki',
    description: 'Floki是以埃隆·马斯克的柴犬命名的模因币，结合了模因文化和实用性，致力于构建元宇宙和DeFi生态。'
  },
  BONK: {
    name: 'Bonk',
    description: 'Bonk是Solana生态的社区驱动模因币，作为"人民的狗币"，旨在重振Solana社区的信心和活力。'
  },
  WIF: {
    name: 'Dogwifhat',
    description: 'WIF是Solana上的模因币，以戴帽子的柴犬为主题。凭借其独特的社区文化快速走红。'
  },
  PIPPIN: {
    name: 'Pippin',
    description: 'Pippin是一个社区驱动的模因代币，以可爱的角色形象闻名，在社交媒体上拥有活跃的粉丝群体。'
  },
};

// 代币信息缓存
const tokenInfoCache: Record<string, { name: string; description: string; timestamp: number }> = {};
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

const getSymbolBase = (symbol: string): string => {
  return symbol.replace(/USDT$|BUSD$|USDC$|BTC$|ETH$/i, '').toUpperCase();
};

// 从网上搜索代币信息的函数
async function searchTokenInfo(symbol: string): Promise<{ name: string; description: string } | null> {
  // Check cache first
  const cached = tokenInfoCache[symbol];
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return { name: cached.name, description: cached.description };
  }

  try {
    // Use CoinGecko API to get token info (free, no API key needed)
    const searchResponse = await fetch(
      `https://api.coingecko.com/api/v3/search?query=${symbol}`
    );
    
    if (!searchResponse.ok) return null;
    
    const searchData = await searchResponse.json();
    const coin = searchData.coins?.[0];
    
    if (!coin) return null;

    // Get more details from coin info
    const detailResponse = await fetch(
      `https://api.coingecko.com/api/v3/coins/${coin.id}?localization=false&tickers=false&market_data=false&community_data=false&developer_data=false`
    );
    
    if (!detailResponse.ok) {
      // Fallback to basic info
      const result = {
        name: coin.name,
        description: `${coin.name}是一个加密货币项目。市值排名#${coin.market_cap_rank || 'N/A'}。`
      };
      tokenInfoCache[symbol] = { ...result, timestamp: Date.now() };
      return result;
    }
    
    const detailData = await detailResponse.json();
    
    // Extract and shorten description
    let description = detailData.description?.en || detailData.description?.zh || '';
    // Remove HTML tags
    description = description.replace(/<[^>]*>/g, '');
    // Shorten to ~80 characters
    if (description.length > 80) {
      description = description.substring(0, 77) + '...';
    }
    
    if (!description) {
      description = `${coin.name}是一个加密货币项目${detailData.categories?.length ? '，类别：' + detailData.categories.slice(0, 2).join('、') : ''}。`;
    }
    
    const result = { name: coin.name, description };
    tokenInfoCache[symbol] = { ...result, timestamp: Date.now() };
    return result;
  } catch (error) {
    console.error('Failed to fetch token info:', error);
    return null;
  }
}

export function MarketHeader({ snapshot, isLoading, symbol = 'BTCUSDT' }: MarketHeaderProps) {
  const baseSymbol = getSymbolBase(symbol);
  const staticCoinInfo = COIN_INFO[baseSymbol];
  
  const [dynamicInfo, setDynamicInfo] = useState<{ name: string; description: string } | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Auto-search for unknown tokens
  useEffect(() => {
    if (!staticCoinInfo && baseSymbol) {
      setIsSearching(true);
      searchTokenInfo(baseSymbol).then(info => {
        setDynamicInfo(info);
        setIsSearching(false);
      });
    } else {
      setDynamicInfo(null);
    }
  }, [baseSymbol, staticCoinInfo]);

  const coinInfo = staticCoinInfo || dynamicInfo;

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

  const dataSource = (snapshot as any).dataSource as DataSource | undefined;

  return (
    <div className="glass-panel p-3 sm:p-4">
      {/* Top Row: Price and Change */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold font-mono gold-text truncate">
            {formatPrice(snapshot.price)}
          </h1>
          <div className={`flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-xs sm:text-sm font-medium flex-shrink-0 ${
            isPositive ? 'bg-bull/10 text-bull' : 'bg-bear/10 text-bear'
          }`}>
            <TrendIcon className="w-3 h-3 sm:w-4 sm:h-4" />
            {isPositive ? '+' : ''}{snapshot.changePercent24h.toFixed(2)}%
          </div>
        </div>

        <div className="live-indicator flex-shrink-0">
          <span className="text-[10px] sm:text-xs">({dataSource || 'OKX'}) 实时</span>
        </div>
      </div>
      
      {/* 24h Change */}
      <p className="text-xs sm:text-sm text-muted-foreground mt-1">
        24h变动: <span className={isPositive ? 'text-bull' : 'text-bear'}>
          {isPositive ? '+' : ''}{formatPrice(snapshot.change24h)}
        </span>
      </p>

      {/* Coin Info - Collapsible on mobile */}
      {coinInfo && (
        <div className="mt-3 pt-3 border-t border-border/50">
          <div className="flex items-center gap-2 mb-1">
            <Info className="w-3 h-3 sm:w-4 sm:h-4 text-primary flex-shrink-0" />
            <span className="text-xs sm:text-sm font-semibold text-foreground">{coinInfo.name}</span>
            <span className="text-[10px] sm:text-xs text-muted-foreground">({baseSymbol})</span>
          </div>
          <p className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed line-clamp-2">
            {coinInfo.description}
          </p>
        </div>
      )}

      {!coinInfo && isSearching && (
        <div className="mt-3 pt-3 border-t border-border/50">
          <div className="flex items-center gap-2 mb-1">
            <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 text-primary flex-shrink-0 animate-spin" />
            <span className="text-xs sm:text-sm font-semibold text-foreground">{baseSymbol}</span>
          </div>
          <p className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed flex items-center gap-1">
            <Search className="w-3 h-3" />
            正在搜索代币信息...
          </p>
        </div>
      )}

      {!coinInfo && !isSearching && (
        <div className="mt-3 pt-3 border-t border-border/50">
          <div className="flex items-center gap-2 mb-1">
            <Info className="w-3 h-3 sm:w-4 sm:h-4 text-primary flex-shrink-0" />
            <span className="text-xs sm:text-sm font-semibold text-foreground">{baseSymbol}</span>
          </div>
          <p className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed">
            暂无该币种的详细介绍信息
          </p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border/50">
        <div>
          <p className="data-label text-[10px] sm:text-xs">24H最高</p>
          <p className="data-value text-bull text-xs sm:text-sm">{formatPrice(snapshot.high24h)}</p>
        </div>
        <div>
          <p className="data-label text-[10px] sm:text-xs">24H最低</p>
          <p className="data-value text-bear text-xs sm:text-sm">{formatPrice(snapshot.low24h)}</p>
        </div>
        <div>
          <p className="data-label flex items-center gap-1 text-[10px] sm:text-xs">
            <Activity className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            24H成交量
          </p>
          <p className="data-value text-xs sm:text-sm">{formatVolume(snapshot.volume24h)}</p>
        </div>
      </div>
    </div>
  );
}
