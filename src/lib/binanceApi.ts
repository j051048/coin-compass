import { Kline, MarketSnapshot, TimeFrame } from '@/types/trading';

const BASE_URL = 'https://api.binance.com/api/v3';

export async function fetchKlines(
  symbol: string,
  interval: TimeFrame,
  limit: number = 200
): Promise<Kline[]> {
  const response = await fetch(
    `${BASE_URL}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch klines');
  }
  
  const data = await response.json();
  
  return data.map((k: any[]) => ({
    time: k[0] / 1000,
    open: parseFloat(k[1]),
    high: parseFloat(k[2]),
    low: parseFloat(k[3]),
    close: parseFloat(k[4]),
    volume: parseFloat(k[5]),
  }));
}

export async function fetchMarketSnapshot(symbol: string): Promise<MarketSnapshot> {
  const [tickerResponse, priceResponse] = await Promise.all([
    fetch(`${BASE_URL}/ticker/24hr?symbol=${symbol}`),
    fetch(`${BASE_URL}/ticker/price?symbol=${symbol}`),
  ]);
  
  if (!tickerResponse.ok || !priceResponse.ok) {
    throw new Error('Failed to fetch market data');
  }
  
  const ticker = await tickerResponse.json();
  const price = await priceResponse.json();
  
  return {
    symbol,
    price: parseFloat(price.price),
    change24h: parseFloat(ticker.priceChange),
    changePercent24h: parseFloat(ticker.priceChangePercent),
    high24h: parseFloat(ticker.highPrice),
    low24h: parseFloat(ticker.lowPrice),
    volume24h: parseFloat(ticker.volume),
  };
}

export async function searchSymbols(query: string): Promise<string[]> {
  const response = await fetch(`${BASE_URL}/exchangeInfo`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch symbols');
  }
  
  const data = await response.json();
  const symbols: string[] = data.symbols
    .filter((s: any) => s.status === 'TRADING' && s.quoteAsset === 'USDT')
    .map((s: any) => s.symbol);
  
  if (!query) {
    return symbols.slice(0, 20);
  }
  
  return symbols
    .filter((s: string) => s.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 20);
}
