import { MarketSnapshot } from '@/types/trading';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface MarketHeaderProps {
  snapshot: MarketSnapshot | null;
  isLoading: boolean;
}

export function MarketHeader({ snapshot, isLoading }: MarketHeaderProps) {
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
      <div className="flex items-start justify-between">
        <div>
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

        <div className="live-indicator">
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
