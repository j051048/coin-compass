import { IndicatorValues } from '@/types/trading';
import { Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface IndicatorPanelProps {
  indicators: IndicatorValues | null;
  currentPrice: number;
}

export function IndicatorPanel({ indicators, currentPrice }: IndicatorPanelProps) {
  if (!indicators) {
    return (
      <div className="analysis-section animate-pulse">
        <div className="h-4 bg-muted rounded w-24 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 bg-muted rounded" />
          ))}
        </div>
      </div>
    );
  }

  const formatPrice = (price: number | null) => {
    if (price === null) return '-';
    if (price >= 1000) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (price >= 1) return price.toFixed(4);
    return price.toFixed(6);
  };

  const getMASignal = (ma: number | null) => {
    if (ma === null) return { signal: 'neutral', label: '-' };
    if (currentPrice > ma * 1.02) return { signal: 'bull', label: '看涨' };
    if (currentPrice < ma * 0.98) return { signal: 'bear', label: '看跌' };
    return { signal: 'neutral', label: '中性' };
  };

  const getRSISignal = (rsi: number | null) => {
    if (rsi === null) return { signal: 'neutral', label: '-', desc: '' };
    if (rsi >= 70) return { signal: 'bear', label: '超买', desc: '可能回调' };
    if (rsi <= 30) return { signal: 'bull', label: '超卖', desc: '可能反弹' };
    if (rsi >= 50) return { signal: 'bull', label: '偏强', desc: '多头区域' };
    return { signal: 'bear', label: '偏弱', desc: '空头区域' };
  };

  const getMACDSignal = (macd: typeof indicators.macd) => {
    if (!macd) return { signal: 'neutral', label: '-' };
    if (macd.histogram === null) return { signal: 'neutral', label: '-' };
    if (macd.histogram > 0 && macd.macd! > 0) return { signal: 'bull', label: '多头强势' };
    if (macd.histogram > 0 && macd.macd! < 0) return { signal: 'bull', label: '底部背离' };
    if (macd.histogram < 0 && macd.macd! < 0) return { signal: 'bear', label: '空头强势' };
    return { signal: 'bear', label: '顶部背离' };
  };

  const getBBSignal = (bb: typeof indicators.bollingerBands) => {
    if (!bb || bb.upper === null) return { signal: 'neutral', label: '-', position: '' };
    const bandwidth = ((bb.upper - bb.lower) / bb.middle!) * 100;
    
    if (currentPrice >= bb.upper) return { signal: 'bear', label: '触及上轨', position: '可能回调' };
    if (currentPrice <= bb.lower) return { signal: 'bull', label: '触及下轨', position: '可能反弹' };
    if (bandwidth < 5) return { signal: 'neutral', label: '收窄', position: '即将变盘' };
    return { signal: 'neutral', label: '通道内', position: '正常运行' };
  };

  const rsiSignal = getRSISignal(indicators.rsi);
  const macdSignal = getMACDSignal(indicators.macd);
  const bbSignal = getBBSignal(indicators.bollingerBands);

  const SignalIcon = ({ signal }: { signal: string }) => {
    if (signal === 'bull') return <TrendingUp className="w-4 h-4 text-bull" />;
    if (signal === 'bear') return <TrendingDown className="w-4 h-4 text-bear" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  return (
    <div className="analysis-section">
      <h3 className="section-title">
        <Activity className="w-4 h-4" />
        技术指标
      </h3>

      <div className="space-y-3">
        {/* Moving Averages */}
        <div className="p-3 rounded-lg bg-secondary/30">
          <p className="text-xs text-muted-foreground mb-2">均线系统</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              { label: 'MA7', value: indicators.ma7 },
              { label: 'MA21', value: indicators.ma21 },
              { label: 'MA50', value: indicators.ma50 },
              { label: 'MA200', value: indicators.ma200 },
            ].map(({ label, value }) => {
              const signal = getMASignal(value);
              return (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-muted-foreground">{label}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono">{formatPrice(value)}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                      signal.signal === 'bull' ? 'bg-bull/10 text-bull' :
                      signal.signal === 'bear' ? 'bg-bear/10 text-bear' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {signal.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RSI */}
        <div className="p-3 rounded-lg bg-secondary/30">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground">RSI (14)</p>
            <div className="flex items-center gap-2">
              <SignalIcon signal={rsiSignal.signal} />
              <span className={`text-xs font-medium ${
                rsiSignal.signal === 'bull' ? 'text-bull' :
                rsiSignal.signal === 'bear' ? 'text-bear' :
                'text-muted-foreground'
              }`}>
                {rsiSignal.label}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-lg font-mono font-bold">
              {indicators.rsi?.toFixed(1) ?? '-'}
            </span>
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  (indicators.rsi ?? 50) >= 70 ? 'bg-bear' :
                  (indicators.rsi ?? 50) <= 30 ? 'bg-bull' :
                  'bg-primary'
                }`}
                style={{ width: `${indicators.rsi ?? 50}%` }}
              />
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">{rsiSignal.desc}</p>
        </div>

        {/* MACD */}
        <div className="p-3 rounded-lg bg-secondary/30">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground">MACD</p>
            <div className="flex items-center gap-2">
              <SignalIcon signal={macdSignal.signal} />
              <span className={`text-xs font-medium ${
                macdSignal.signal === 'bull' ? 'text-bull' :
                macdSignal.signal === 'bear' ? 'text-bear' :
                'text-muted-foreground'
              }`}>
                {macdSignal.label}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <span className="text-muted-foreground block">DIF</span>
              <span className="font-mono">{indicators.macd?.macd?.toFixed(2) ?? '-'}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">DEA</span>
              <span className="font-mono">{indicators.macd?.signal?.toFixed(2) ?? '-'}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">柱状</span>
              <span className={`font-mono ${
                (indicators.macd?.histogram ?? 0) > 0 ? 'text-bull' : 'text-bear'
              }`}>
                {indicators.macd?.histogram?.toFixed(2) ?? '-'}
              </span>
            </div>
          </div>
        </div>

        {/* Bollinger Bands */}
        <div className="p-3 rounded-lg bg-secondary/30">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground">布林带 (20, 2)</p>
            <div className="flex items-center gap-2">
              <SignalIcon signal={bbSignal.signal} />
              <span className={`text-xs font-medium ${
                bbSignal.signal === 'bull' ? 'text-bull' :
                bbSignal.signal === 'bear' ? 'text-bear' :
                'text-muted-foreground'
              }`}>
                {bbSignal.label}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <span className="text-muted-foreground block">上轨</span>
              <span className="font-mono text-bear">{formatPrice(indicators.bollingerBands?.upper ?? null)}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">中轨</span>
              <span className="font-mono">{formatPrice(indicators.bollingerBands?.middle ?? null)}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">下轨</span>
              <span className="font-mono text-bull">{formatPrice(indicators.bollingerBands?.lower ?? null)}</span>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">{bbSignal.position}</p>
        </div>
      </div>
    </div>
  );
}
