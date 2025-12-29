import { Kline, MarketSnapshot, TimeFrame } from '@/types/trading';

// API endpoints
const OKX_BASE_URL = 'https://www.okx.com/api/v5';
const BINANCE_BASE_URL = 'https://api.binance.com/api/v3';
const GATE_BASE_URL = 'https://api.gateio.ws/api/v4';

// Data source type
export type DataSource = 'OKX' | 'Gate' | 'Binance';

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

// ============= OKX API =============
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

// ============= Gate.io API =============
async function fetchKlinesFromGate(
  symbol: string,
  interval: TimeFrame,
  limit: number
): Promise<Kline[]> {
  const gateSymbol = toGateSymbol(symbol);
  const gateInterval = toGateInterval(interval);
  
  const response = await fetch(
    `${GATE_BASE_URL}/spot/candlesticks?currency_pair=${gateSymbol}&interval=${gateInterval}&limit=${limit}`
  );
  
  if (!response.ok) {
    throw new Error('Gate.io API request failed');
  }
  
  const data = await response.json();
  
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('Gate.io data error or no data');
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
  
  const response = await fetch(
    `${GATE_BASE_URL}/spot/tickers?currency_pair=${gateSymbol}`
  );
  
  if (!response.ok) {
    throw new Error('Gate.io API request failed');
  }
  
  const data = await response.json();
  
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('Gate.io data error');
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

// ============= Binance API =============
async function fetchKlinesFromBinance(
  symbol: string,
  interval: TimeFrame,
  limit: number
): Promise<Kline[]> {
  const response = await fetch(
    `${BINANCE_BASE_URL}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
  );
  
  if (!response.ok) {
    throw new Error('Binance API request failed');
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

async function fetchMarketSnapshotFromBinance(symbol: string): Promise<MarketSnapshot> {
  const [tickerResponse, priceResponse] = await Promise.all([
    fetch(`${BINANCE_BASE_URL}/ticker/24hr?symbol=${symbol}`),
    fetch(`${BINANCE_BASE_URL}/ticker/price?symbol=${symbol}`),
  ]);
  
  if (!tickerResponse.ok || !priceResponse.ok) {
    throw new Error('Binance API request failed');
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

// ============= Unified API with fallback (OKX -> Gate.io -> Binance) =============
export async function fetchKlines(
  symbol: string,
  interval: TimeFrame,
  limit: number = 200
): Promise<Kline[]> {
  // Try OKX first
  try {
    return await fetchKlinesFromOkx(symbol, interval, limit);
  } catch (okxError) {
    console.log('OKX failed, trying Gate.io...', okxError);
  }
  
  // Try Gate.io second (good for meme coins)
  try {
    return await fetchKlinesFromGate(symbol, interval, limit);
  } catch (gateError) {
    console.log('Gate.io failed, trying Binance...', gateError);
  }
  
  // Try Binance last
  try {
    return await fetchKlinesFromBinance(symbol, interval, limit);
  } catch (binanceError) {
    console.error('All APIs failed:', binanceError);
    throw new Error('无法获取K线数据，请检查交易对是否正确（已尝试OKX/Gate.io/Binance）');
  }
}

export async function fetchMarketSnapshot(symbol: string): Promise<MarketSnapshotWithSource> {
  // Try OKX first
  try {
    const data = await fetchMarketSnapshotFromOkx(symbol);
    return { ...data, dataSource: 'OKX' };
  } catch (okxError) {
    console.log('OKX failed, trying Gate.io...', okxError);
  }
  
  // Try Gate.io second (good for meme coins)
  try {
    const data = await fetchMarketSnapshotFromGate(symbol);
    return { ...data, dataSource: 'Gate' };
  } catch (gateError) {
    console.log('Gate.io failed, trying Binance...', gateError);
  }
  
  // Try Binance last
  try {
    const data = await fetchMarketSnapshotFromBinance(symbol);
    return { ...data, dataSource: 'Binance' };
  } catch (binanceError) {
    console.error('All APIs failed:', binanceError);
    throw new Error('无法获取行情数据，请检查交易对是否正确（已尝试OKX/Gate.io/Binance）');
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
let binanceSymbolsCache: string[] = [];
let gateSymbolsCache: string[] = [];
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

async function fetchBinanceSymbols(): Promise<string[]> {
  const response = await fetch(`${BINANCE_BASE_URL}/exchangeInfo`);
  if (!response.ok) throw new Error('Failed to fetch Binance symbols');
  
  const data = await response.json();
  return data.symbols
    .filter((s: any) => s.status === 'TRADING' && s.quoteAsset === 'USDT')
    .map((s: any) => s.symbol);
}

async function fetchGateSymbols(): Promise<string[]> {
  // Gate.io API has CORS restrictions, so we maintain a curated list of popular meme coins
  // that are available on Gate.io but not on other exchanges
  const GATE_MEME_COINS = [
    'PIPPINUSDT', 'GOATUSDT', 'ACTUSDT', 'PNUTUSDT', 'NEIROUSDT',
    'MOGUSDT', 'SPXUSDT', 'GLOWYUSDT', 'TOSHIUSDT', 'BRETTUSDT',
    'POPCATUSDT', 'GIGAUSDT', 'MIKIUSDT', 'SUNWUKONGUSDT', 'RETARDUSDT',
    'LOCKINUSDT', 'GRIFFAINUSDT', 'AI16ZUSDT', 'FARTCOINUSDT', 'ZEREBRUSDT',
  ];
  return GATE_MEME_COINS;
}

async function fetchAllSymbols(): Promise<string[]> {
  // Return cache if valid
  if (okxSymbolsCache.length > 0 && Date.now() - cacheTime < CACHE_DURATION) {
    return [...new Set([...okxSymbolsCache, ...gateSymbolsCache, ...binanceSymbolsCache])];
  }

  // Fetch from all exchanges in parallel
  const [okxResult, gateResult, binanceResult] = await Promise.allSettled([
    fetchOkxSymbols(),
    fetchGateSymbols(),
    fetchBinanceSymbols(),
  ]);

  if (okxResult.status === 'fulfilled') {
    okxSymbolsCache = okxResult.value;
  }
  if (gateResult.status === 'fulfilled') {
    gateSymbolsCache = gateResult.value;
  }
  if (binanceResult.status === 'fulfilled') {
    binanceSymbolsCache = binanceResult.value;
  }

  cacheTime = Date.now();

  // Merge and dedupe
  const allSymbols = [...new Set([...okxSymbolsCache, ...gateSymbolsCache, ...binanceSymbolsCache])];
  
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
  try {
    const allSymbols = await fetchAllSymbols();
    
    if (!query) {
      return allSymbols.slice(0, 30);
    }
    
    return allSymbols
      .filter((s) => s.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 30);
  } catch (error) {
    console.error('Failed to fetch symbols:', error);
    if (!query) return POPULAR_SYMBOLS;
    return POPULAR_SYMBOLS.filter((s) => 
      s.toLowerCase().includes(query.toLowerCase())
    );
  }
}
