export interface Kline {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface IndicatorValues {
  ma7: number | null;
  ma21: number | null;
  ma50: number | null;
  ma200: number | null;
  rsi: number | null;
  macd: {
    macd: number;
    signal: number;
    histogram: number;
  } | null;
  bollingerBands: {
    upper: number;
    middle: number;
    lower: number;
  } | null;
}

export interface MarketSnapshot {
  symbol: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
}

export interface AnalysisScenario {
  type: 'bull' | 'bear' | 'neutral';
  probability: number;
  trigger: string;
  target: number;
  stopLoss: number;
  rrr?: string;
  description: string;
}

export interface ResonanceRating {
  rating: string;
  strongestSignal: string;
}

export interface TechnicalAnalysis {
  snapshot: string;
  patterns?: string;
  indicators: string;
  timeframes: string;
  resonance?: ResonanceRating;
  scenarios: AnalysisScenario[];
  invalidSignal?: string;
  risks: string[];
  summary: {
    stance: 'aggressive' | 'stable' | 'wait';
    position: number;
    advice: string;
  };
}

export type TimeFrame = '1m' | '5m' | '15m' | '1h' | '4h' | '1d' | '1w';

export const TIME_FRAME_OPTIONS: { value: TimeFrame; label: string }[] = [
  { value: '1m', label: '1分' },
  { value: '5m', label: '5分' },
  { value: '15m', label: '15分' },
  { value: '1h', label: '1时' },
  { value: '4h', label: '4时' },
  { value: '1d', label: '日线' },
  { value: '1w', label: '周线' },
];

export const POPULAR_SYMBOLS = [
  'BTCUSDT',
  'ETHUSDT',
  'SOLUSDT',
  'BNBUSDT',
  'XRPUSDT',
  'ADAUSDT',
  'DOGEUSDT',
  'AVAXUSDT',
];
