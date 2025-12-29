import { Kline, IndicatorValues } from '@/types/trading';

export function calculateSMA(data: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else {
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      result.push(sum / period);
    }
  }
  
  return result;
}

export function calculateEMA(data: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  const multiplier = 2 / (period + 1);
  
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else if (i === period - 1) {
      const sum = data.slice(0, period).reduce((a, b) => a + b, 0);
      result.push(sum / period);
    } else {
      const prevEma = result[i - 1]!;
      result.push((data[i] - prevEma) * multiplier + prevEma);
    }
  }
  
  return result;
}

export function calculateRSI(data: number[], period: number = 14): (number | null)[] {
  const result: (number | null)[] = [];
  const gains: number[] = [];
  const losses: number[] = [];
  
  for (let i = 0; i < data.length; i++) {
    if (i === 0) {
      result.push(null);
      continue;
    }
    
    const change = data[i] - data[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
    
    if (i < period) {
      result.push(null);
    } else if (i === period) {
      const avgGain = gains.reduce((a, b) => a + b, 0) / period;
      const avgLoss = losses.reduce((a, b) => a + b, 0) / period;
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      result.push(100 - 100 / (1 + rs));
    } else {
      const prevRsi = result[i - 1]!;
      const prevAvgGain = gains.slice(-period - 1, -1).reduce((a, b) => a + b, 0) / period;
      const prevAvgLoss = losses.slice(-period - 1, -1).reduce((a, b) => a + b, 0) / period;
      
      const currentGain = gains[gains.length - 1];
      const currentLoss = losses[losses.length - 1];
      
      const avgGain = (prevAvgGain * (period - 1) + currentGain) / period;
      const avgLoss = (prevAvgLoss * (period - 1) + currentLoss) / period;
      
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      result.push(100 - 100 / (1 + rs));
    }
  }
  
  return result;
}

export function calculateMACD(
  data: number[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): { macd: number | null; signal: number | null; histogram: number | null }[] {
  const fastEMA = calculateEMA(data, fastPeriod);
  const slowEMA = calculateEMA(data, slowPeriod);
  
  const macdLine: (number | null)[] = fastEMA.map((fast, i) => {
    const slow = slowEMA[i];
    if (fast === null || slow === null) return null;
    return fast - slow;
  });
  
  const validMacd = macdLine.filter((v): v is number => v !== null);
  const signalLine = calculateEMA(validMacd, signalPeriod);
  
  let signalIndex = 0;
  return macdLine.map((macd) => {
    if (macd === null) {
      return { macd: null, signal: null, histogram: null };
    }
    
    const signal = signalLine[signalIndex++] ?? null;
    const histogram = signal !== null ? macd - signal : null;
    
    return { macd, signal, histogram };
  });
}

export function calculateBollingerBands(
  data: number[],
  period: number = 20,
  stdDev: number = 2
): { upper: number | null; middle: number | null; lower: number | null }[] {
  const sma = calculateSMA(data, period);
  
  return sma.map((middle, i) => {
    if (middle === null || i < period - 1) {
      return { upper: null, middle: null, lower: null };
    }
    
    const slice = data.slice(i - period + 1, i + 1);
    const variance = slice.reduce((sum, val) => sum + Math.pow(val - middle, 2), 0) / period;
    const std = Math.sqrt(variance);
    
    return {
      upper: middle + stdDev * std,
      middle,
      lower: middle - stdDev * std,
    };
  });
}

export function calculateIndicators(klines: Kline[]): IndicatorValues {
  const closes = klines.map((k) => k.close);
  const lastIndex = closes.length - 1;
  
  const ma7 = calculateSMA(closes, 7);
  const ma21 = calculateSMA(closes, 21);
  const ma50 = calculateSMA(closes, 50);
  const ma200 = calculateSMA(closes, 200);
  const rsi = calculateRSI(closes, 14);
  const macd = calculateMACD(closes);
  const bb = calculateBollingerBands(closes, 20, 2);
  
  return {
    ma7: ma7[lastIndex],
    ma21: ma21[lastIndex],
    ma50: ma50[lastIndex],
    ma200: ma200[lastIndex],
    rsi: rsi[lastIndex],
    macd: macd[lastIndex],
    bollingerBands: bb[lastIndex],
  };
}

export function getIndicatorSeries(klines: Kline[]) {
  const closes = klines.map((k) => k.close);
  
  return {
    ma7: calculateSMA(closes, 7),
    ma21: calculateSMA(closes, 21),
    ma50: calculateSMA(closes, 50),
    ma200: calculateSMA(closes, 200),
    rsi: calculateRSI(closes, 14),
    macd: calculateMACD(closes),
    bollingerBands: calculateBollingerBands(closes, 20, 2),
  };
}
