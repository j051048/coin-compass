import { Kline, MarketSnapshot, TimeFrame } from '@/types/trading';

// API endpoints (fallback for direct OKX calls which support CORS)
const OKX_BASE_URL = 'https://www.okx.com/api/v5';

// Data source type
export type DataSource = 'OKX' | 'MEXC' | 'Gate' | 'Binance';

// Extended market snapshot with data source
export interface MarketSnapshotWithSource extends MarketSnapshot {
  dataSource: DataSource;
}

// Convert symbol format: BTCUSDT -> BTC-USDT
function toOkxSymbol(symbol: string): string {
  if (symbol.endsWith('USDT')) {
    return symbol.replace('USDT', '-USDT');
  }
  if (symbol.endsWith('USD')) {
    return symbol.replace('USD', '-USD');
  }
  return symbol;
}

// Convert symbol format: BTCUSDT -> BTC_USDT (Gate.io format)
function toGateSymbol(symbol: string): string {
  if (symbol.endsWith('USDT')) {
    return symbol.replace('USDT', '_USDT');
  }
  if (symbol.endsWith('USD')) {
    return symbol.replace('USD', '_USD');
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

// Convert timeframe format for Gate.io
function toGateInterval(interval: TimeFrame): string {
  const map: Record<TimeFrame, string> = {
    '1m': '1m',
    '5m': '5m',
    '15m': '15m',
    '1h': '1h',
    '4h': '4h',
    '1d': '1d',
    '1w': '7d',
  };
  return map[interval] || '1h';
}

// Convert timeframe format for MEXC
function toMexcInterval(interval: TimeFrame): string {
  const map: Record<TimeFrame, string> = {
    '1m': '1m',
    '5m': '5m',
    '15m': '15m',
    '1h': '1h',
    '4h': '4h',
    '1d': '1d',
    '1w': '1w',
  };
  return map[interval] || '1h';
}

// ============= OKX API (Direct - supports CORS) =============
async function fetchKlinesFromOkx(
  symbol: string,
  interval: TimeFrame,
  limit: number
): Promise<Kline[]> {
  const okxSymbol = toOkxSymbol(symbol);
  const okxInterval = toOkxInterval(interval);
  
  const response = await fetch(
    `${OKX_BASE_URL}/market/candles?instId=${okxSymbol}&bar=${okxInterval}&limit=${limit}`
  );
  
  if (!response.ok) {
    throw new Error('OKX API request failed');
  }
  
  const result = await response.json();
  
  if (result.code !== '0' || !result.data || result.data.length === 0) {
    throw new Error(result.msg || 'OKX data error');
  }
  
  // OKX returns: [ts, o, h, l, c, vol, volCcy, volCcyQuote, confirm]
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

async function fetchMarketSnapshotFromOkx(symbol: string): Promise<MarketSnapshot> {
  const okxSymbol = toOkxSymbol(symbol);
  
  const response = await fetch(
    `${OKX_BASE_URL}/market/ticker?instId=${okxSymbol}`
  );
  
  if (!response.ok) {
    throw new Error('OKX API request failed');
  }
  
  const result = await response.json();
  
  if (result.code !== '0' || !result.data?.[0]) {
    throw new Error(result.msg || 'OKX data error');
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

// ============= MEXC API (via Edge Function Proxy) =============
async function fetchKlinesFromMexc(
  symbol: string,
  interval: TimeFrame,
  limit: number
): Promise<Kline[]> {
  const mexcInterval = toMexcInterval(interval);
  const endpoint = `/api/v3/klines?symbol=${symbol}&interval=${mexcInterval}&limit=${limit}`;
  
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/kline-proxy?exchange=mexc&endpoint=${encodeURIComponent(endpoint)}`,
    {
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
    }
  );
  
  if (!response.ok) {
    throw new Error('MEXC API request failed via proxy');
  }
  
  const result = await response.json();
  
  if (result.error || !Array.isArray(result) || result.length === 0) {
    throw new Error(result.error || 'MEXC data error or no data');
  }
  
  // MEXC returns same format as Binance: [openTime, open, high, low, close, volume, ...]
  return result.map((k: any[]) => ({
    time: k[0] / 1000,
    open: parseFloat(k[1]),
    high: parseFloat(k[2]),
    low: parseFloat(k[3]),
    close: parseFloat(k[4]),
    volume: parseFloat(k[5]),
  }));
}

async function fetchMarketSnapshotFromMexc(symbol: string): Promise<MarketSnapshot> {
  const endpoint = `/api/v3/ticker/24hr?symbol=${symbol}`;
  
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/kline-proxy?exchange=mexc&endpoint=${encodeURIComponent(endpoint)}`,
    {
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
    }
  );
  
  if (!response.ok) {
    throw new Error('MEXC API request failed via proxy');
  }
  
  const ticker = await response.json();
  
  if (ticker.error || !ticker || ticker.code) {
    throw new Error(ticker?.error || ticker?.msg || 'MEXC data error');
  }
  
  return {
    symbol,
    price: parseFloat(ticker.lastPrice),
    change24h: parseFloat(ticker.priceChange),
    changePercent24h: parseFloat(ticker.priceChangePercent),
    high24h: parseFloat(ticker.highPrice),
    low24h: parseFloat(ticker.lowPrice),
    volume24h: parseFloat(ticker.volume),
  };
}

// ============= Gate.io API (via Edge Function Proxy) =============
async function fetchKlinesFromGate(
  symbol: string,
  interval: TimeFrame,
  limit: number
): Promise<Kline[]> {
  const gateSymbol = toGateSymbol(symbol);
  const gateInterval = toGateInterval(interval);
  const endpoint = `/api/v4/spot/candlesticks?currency_pair=${gateSymbol}&interval=${gateInterval}&limit=${limit}`;
  
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/kline-proxy?exchange=gate&endpoint=${encodeURIComponent(endpoint)}`,
    {
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
    }
  );
  
  if (!response.ok) {
    throw new Error('Gate.io API request failed via proxy');
  }
  
  const data = await response.json();
  
  if (data.error || !Array.isArray(data) || data.length === 0) {
    throw new Error(data.error || 'Gate.io data error or no data');
  }
  
  // Gate.io returns: [timestamp, volume, close, high, low, open, amount]
  return data.map((k: any[]) => ({
    time: parseInt(k[0]),
    open: parseFloat(k[5]),
    high: parseFloat(k[3]),
    low: parseFloat(k[4]),
    close: parseFloat(k[2]),
    volume: parseFloat(k[1]),
  }));
}

async function fetchMarketSnapshotFromGate(symbol: string): Promise<MarketSnapshot> {
  const gateSymbol = toGateSymbol(symbol);
  const endpoint = `/api/v4/spot/tickers?currency_pair=${gateSymbol}`;
  
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/kline-proxy?exchange=gate&endpoint=${encodeURIComponent(endpoint)}`,
    {
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
    }
  );
  
  if (!response.ok) {
    throw new Error('Gate.io API request failed via proxy');
  }
  
  const data = await response.json();
  
  if (data.error || !Array.isArray(data) || data.length === 0) {
    throw new Error(data.error || 'Gate.io data error');
  }
  
  const ticker = data[0];
  const price = parseFloat(ticker.last);
  const changePercent24h = parseFloat(ticker.change_percentage);
  const high24h = parseFloat(ticker.high_24h);
  const low24h = parseFloat(ticker.low_24h);
  const open24h = price / (1 + changePercent24h / 100);
  const change24h = price - open24h;
  
  return {
    symbol,
    price,
    change24h,
    changePercent24h,
    high24h,
    low24h,
    volume24h: parseFloat(ticker.base_volume),
  };
}

// ============= Unified API with fallback (OKX -> MEXC -> Gate.io) =============
// Note: Binance is removed due to geo-restrictions on the edge function server
export async function fetchKlines(
  symbol: string,
  interval: TimeFrame,
  limit: number = 200
): Promise<Kline[]> {
  // Try OKX first (supports CORS directly)
  try {
    return await fetchKlinesFromOkx(symbol, interval, limit);
  } catch (okxError) {
    console.log('OKX failed, trying MEXC...', okxError);
  }
  
  // Try MEXC second via proxy (good for meme coins)
  try {
    return await fetchKlinesFromMexc(symbol, interval, limit);
  } catch (mexcError) {
    console.log('MEXC failed, trying Gate.io...', mexcError);
  }
  
  // Try Gate.io last via proxy
  try {
    return await fetchKlinesFromGate(symbol, interval, limit);
  } catch (gateError) {
    console.error('All APIs failed:', gateError);
    throw new Error('无法获取K线数据，请检查交易对是否正确（已尝试OKX/MEXC/Gate.io）');
  }
}

export async function fetchMarketSnapshot(symbol: string): Promise<MarketSnapshotWithSource> {
  // Try OKX first (supports CORS directly)
  try {
    const data = await fetchMarketSnapshotFromOkx(symbol);
    return { ...data, dataSource: 'OKX' };
  } catch (okxError) {
    console.log('OKX failed, trying MEXC...', okxError);
  }
  
  // Try MEXC second via proxy (good for meme coins)
  try {
    const data = await fetchMarketSnapshotFromMexc(symbol);
    return { ...data, dataSource: 'MEXC' };
  } catch (mexcError) {
    console.log('MEXC failed, trying Gate.io...', mexcError);
  }
  
  // Try Gate.io last via proxy
  try {
    const data = await fetchMarketSnapshotFromGate(symbol);
    return { ...data, dataSource: 'Gate' };
  } catch (gateError) {
    console.error('All APIs failed:', gateError);
    throw new Error('无法获取行情数据，请检查交易对是否正确（已尝试OKX/MEXC/Gate.io）');
  }
}

// ============= Symbol Search =============
const POPULAR_SYMBOLS = [
  'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT',
  'ADAUSDT', 'DOGEUSDT', 'AVAXUSDT', 'DOTUSDT', 'MATICUSDT',
  'PEPEUSDT', 'SHIBUSDT', 'FLOKIUSDT', 'BONKUSDT', 'WIFUSDT', // Popular meme coins
];

// Caches
let okxSymbolsCache: string[] = [];
let gateSymbolsCache: string[] = [];
let mexcSymbolsCache: string[] = [];
let cacheTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function fetchOkxSymbols(): Promise<string[]> {
  const response = await fetch(`${OKX_BASE_URL}/public/instruments?instType=SPOT`);
  if (!response.ok) throw new Error('Failed to fetch OKX symbols');
  
  const result = await response.json();
  if (result.code !== '0' || !result.data) throw new Error('OKX symbols error');
  
  return result.data
    .filter((s: any) => s.quoteCcy === 'USDT' && s.state === 'live')
    .map((s: any) => s.instId.replace('-', ''));
}

async function fetchMexcSymbols(): Promise<string[]> {
  try {
    const endpoint = '/api/v3/exchangeInfo';
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/kline-proxy?exchange=mexc&endpoint=${encodeURIComponent(endpoint)}`,
      {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
      }
    );
    
    if (!response.ok) throw new Error('Failed to fetch MEXC symbols');
    
    const data = await response.json();
    if (data.error || !data.symbols) throw new Error('MEXC symbols error');
    
    return data.symbols
      .filter((s: any) => s.status === 'ENABLED' && s.quoteAsset === 'USDT')
      .map((s: any) => s.symbol);
  } catch (error) {
    console.log('MEXC symbols fetch failed:', error);
    return [];
  }
}

async function fetchGateSymbols(): Promise<string[]> {
  // Gate.io - we can now fetch via proxy
  try {
    const endpoint = '/api/v4/spot/currency_pairs';
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/kline-proxy?exchange=gate&endpoint=${encodeURIComponent(endpoint)}`,
      {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
      }
    );
    
    if (!response.ok) throw new Error('Failed to fetch Gate symbols');
    
    const data = await response.json();
    if (data.error || !Array.isArray(data)) throw new Error('Gate symbols error');
    
    return data
      .filter((s: any) => s.quote === 'USDT' && s.trade_status === 'tradable')
      .map((s: any) => s.id.replace('_', ''));
  } catch (error) {
    console.log('Gate symbols fetch failed, using fallback:', error);
    // Fallback list of popular meme coins on Gate.io
    const GATE_MEME_COINS = [
      'PIPPINUSDT', 'GOATUSDT', 'ACTUSDT', 'PNUTUSDT', 'NEIROUSDT',
      'MOGUSDT', 'SPXUSDT', 'GLOWYUSDT', 'TOSHIUSDT', 'BRETTUSDT',
      'POPCATUSDT', 'GIGAUSDT', 'MIKIUSDT', 'SUNWUKONGUSDT', 'RETARDUSDT',
      'LOCKINUSDT', 'GRIFFAINUSDT', 'AI16ZUSDT', 'FARTCOINUSDT', 'ZEREBRUSDT',
    ];
    return GATE_MEME_COINS;
  }
}

async function fetchAllSymbols(): Promise<string[]> {
  // Return cache if valid
  if (okxSymbolsCache.length > 0 && Date.now() - cacheTime < CACHE_DURATION) {
    return [...new Set([...okxSymbolsCache, ...mexcSymbolsCache, ...gateSymbolsCache])];
  }

  // Fetch from OKX, MEXC, Gate.io in parallel (Binance removed due to geo-restrictions)
  const [okxResult, mexcResult, gateResult] = await Promise.allSettled([
    fetchOkxSymbols(),
    fetchMexcSymbols(),
    fetchGateSymbols(),
  ]);

  if (okxResult.status === 'fulfilled') {
    okxSymbolsCache = okxResult.value;
  }
  if (mexcResult.status === 'fulfilled') {
    mexcSymbolsCache = mexcResult.value;
  }
  if (gateResult.status === 'fulfilled') {
    gateSymbolsCache = gateResult.value;
  }

  cacheTime = Date.now();

  // Merge and dedupe
  const allSymbols = [...new Set([...okxSymbolsCache, ...mexcSymbolsCache, ...gateSymbolsCache])];
  
  // Sort with popular symbols first
  return allSymbols.sort((a, b) => {
    const aPopular = POPULAR_SYMBOLS.indexOf(a);
    const bPopular = POPULAR_SYMBOLS.indexOf(b);
    if (aPopular !== -1 && bPopular !== -1) return aPopular - bPopular;
    if (aPopular !== -1) return -1;
    if (bPopular !== -1) return 1;
    return a.localeCompare(b);
  });
}

export async function searchSymbols(query: string): Promise<string[]> {
  if (!query || query.length < 1) {
    return POPULAR_SYMBOLS;
  }
  
  const upperQuery = query.toUpperCase();
  
  try {
    const allSymbols = await fetchAllSymbols();
    const matches = allSymbols.filter(s => s.includes(upperQuery));
    return matches.slice(0, 20);
  } catch (error) {
    console.error('Symbol search failed:', error);
    return POPULAR_SYMBOLS.filter(s => s.includes(upperQuery));
  }
}
