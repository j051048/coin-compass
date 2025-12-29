import { Kline, MarketSnapshot, TimeFrame } from '@/types/trading';

// OKX API (better CORS support)
const OKX_BASE_URL = 'https://www.okx.com/api/v5';

// Convert symbol format: BTCUSDT -> BTC-USDT
function toOkxSymbol(symbol: string): string {
  // Handle common patterns
  if (symbol.endsWith('USDT')) {
    return symbol.replace('USDT', '-USDT');
  }
  if (symbol.endsWith('USD')) {
    return symbol.replace('USD', '-USD');
  }
  return symbol;
}

// Convert timeframe format for OKX
function toOkxInterval(interval: TimeFrame): string {
  const map: Record<TimeFrame, string> = {
    '1m': '1m',
    '5m': '5m',
    '15m': '15m',
    '1h': '1H',
    '4h': '4H',
    '1d': '1D',
    '1w': '1W',
  };
  return map[interval] || '1H';
}

export async function fetchKlines(
  symbol: string,
  interval: TimeFrame,
  limit: number = 200
): Promise<Kline[]> {
  const okxSymbol = toOkxSymbol(symbol);
  const okxInterval = toOkxInterval(interval);
  
  const response = await fetch(
    `${OKX_BASE_URL}/market/candles?instId=${okxSymbol}&bar=${okxInterval}&limit=${limit}`
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch klines');
  }
  
  const result = await response.json();
  
  if (result.code !== '0' || !result.data) {
    throw new Error(result.msg || 'Failed to fetch klines');
  }
  
  // OKX returns: [ts, o, h, l, c, vol, volCcy, volCcyQuote, confirm]
  // Data is in reverse order (newest first), so we reverse it
  return result.data
    .map((k: string[]) => ({
      time: parseInt(k[0]) / 1000,
      open: parseFloat(k[1]),
      high: parseFloat(k[2]),
      low: parseFloat(k[3]),
      close: parseFloat(k[4]),
      volume: parseFloat(k[5]),
    }))
    .reverse();
}

export async function fetchMarketSnapshot(symbol: string): Promise<MarketSnapshot> {
  const okxSymbol = toOkxSymbol(symbol);
  
  const response = await fetch(
    `${OKX_BASE_URL}/market/ticker?instId=${okxSymbol}`
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch market data');
  }
  
  const result = await response.json();
  
  if (result.code !== '0' || !result.data?.[0]) {
    throw new Error(result.msg || 'Failed to fetch market data');
  }
  
  const ticker = result.data[0];
  const price = parseFloat(ticker.last);
  const open24h = parseFloat(ticker.open24h);
  const change24h = price - open24h;
  const changePercent24h = (change24h / open24h) * 100;
  
  return {
    symbol,
    price,
    change24h,
    changePercent24h,
    high24h: parseFloat(ticker.high24h),
    low24h: parseFloat(ticker.low24h),
    volume24h: parseFloat(ticker.vol24h),
  };
}

// Popular trading pairs for quick access
const POPULAR_SYMBOLS = [
  'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT',
  'ADAUSDT', 'DOGEUSDT', 'AVAXUSDT', 'DOTUSDT', 'MATICUSDT',
];

// Cache for symbols list
let symbolsCache: string[] | null = null;
let cacheTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function fetchAllSymbols(): Promise<string[]> {
  // Return cache if valid
  if (symbolsCache && Date.now() - cacheTime < CACHE_DURATION) {
    return symbolsCache;
  }

  const response = await fetch(
    `${OKX_BASE_URL}/public/instruments?instType=SPOT`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch symbols');
  }

  const result = await response.json();

  if (result.code !== '0' || !result.data) {
    throw new Error(result.msg || 'Failed to fetch symbols');
  }

  // Convert OKX format (BTC-USDT) to standard format (BTCUSDT)
  // Filter only USDT pairs for simplicity
  symbolsCache = result.data
    .filter((s: any) => s.quoteCcy === 'USDT' && s.state === 'live')
    .map((s: any) => s.instId.replace('-', ''))
    .sort((a: string, b: string) => {
      // Sort popular symbols first
      const aPopular = POPULAR_SYMBOLS.indexOf(a);
      const bPopular = POPULAR_SYMBOLS.indexOf(b);
      if (aPopular !== -1 && bPopular !== -1) return aPopular - bPopular;
      if (aPopular !== -1) return -1;
      if (bPopular !== -1) return 1;
      return a.localeCompare(b);
    });
  
  cacheTime = Date.now();
  return symbolsCache;
}

export async function searchSymbols(query: string): Promise<string[]> {
  try {
    const allSymbols = await fetchAllSymbols();
    
    if (!query) {
      return allSymbols.slice(0, 20);
    }
    
    return allSymbols
      .filter((s: string) => s.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 20);
  } catch (error) {
    // Fallback to popular symbols if API fails
    console.error('Failed to fetch symbols:', error);
    if (!query) {
      return POPULAR_SYMBOLS;
    }
    return POPULAR_SYMBOLS.filter((s: string) => 
      s.toLowerCase().includes(query.toLowerCase())
    );
  }
}
