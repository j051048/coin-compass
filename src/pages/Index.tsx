import { useState, useEffect, useCallback } from 'react';
import { Zap, Eye, EyeOff, RefreshCw, BarChart3 } from 'lucide-react';
import { Kline, MarketSnapshot, TimeFrame, IndicatorValues, TechnicalAnalysis } from '@/types/trading';
import { fetchKlines, fetchMarketSnapshot } from '@/lib/binanceApi';
import { calculateIndicators } from '@/lib/indicators';
import { generateAnalysisPrompt, parseAnalysisResponse } from '@/lib/analysisPrompt';
import { SymbolSearch } from '@/components/SymbolSearch';
import { TimeFrameSelector } from '@/components/TimeFrameSelector';
import { MarketHeader } from '@/components/MarketHeader';
import { KlineChart } from '@/components/KlineChart';
import { IndicatorPanel } from '@/components/IndicatorPanel';
import { AnalysisReport } from '@/components/AnalysisReport';
import { ApiConfigDialog, getApiConfig } from '@/components/ApiConfigDialog';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

// Helper functions for localStorage - cache by symbol only (not timeframe)
const getAnalysisKey = (symbol: string) => `analysis_${symbol}`;

const saveAnalysis = (symbol: string, analysis: TechnicalAnalysis) => {
  try {
    const key = getAnalysisKey(symbol);
    const data = {
      analysis,
      timestamp: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to save analysis to localStorage:', e);
  }
};

const loadAnalysis = (symbol: string): TechnicalAnalysis | null => {
  try {
    const key = getAnalysisKey(symbol);
    const stored = localStorage.getItem(key);
    if (!stored) return null;
    
    const data = JSON.parse(stored);
    // Check if data is from today (same calendar day)
    const storedDate = new Date(data.timestamp);
    const today = new Date();
    const isSameDay = storedDate.toDateString() === today.toDateString();
    return isSameDay ? data.analysis : null;
  } catch (e) {
    console.warn('Failed to load analysis from localStorage:', e);
    return null;
  }
};

const Index = () => {
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [timeframe, setTimeframe] = useState<TimeFrame>('4h');
  const [klines, setKlines] = useState<Kline[]>([]);
  const [snapshot, setSnapshot] = useState<MarketSnapshot | null>(null);
  const [indicators, setIndicators] = useState<IndicatorValues | null>(null);
  const [analysis, setAnalysis] = useState<TechnicalAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showMA, setShowMA] = useState(true);
  const [showBB, setShowBB] = useState(false);
  const [showMACD, setShowMACD] = useState(false);
  const [showRSI, setShowRSI] = useState(false);
  const [showKDJ, setShowKDJ] = useState(false);
  const [showWR, setShowWR] = useState(false);
  const { toast } = useToast();

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [klinesData, snapshotData] = await Promise.all([
        fetchKlines(symbol, timeframe, 200),
        fetchMarketSnapshot(symbol),
      ]);
      
      setKlines(klinesData);
      setSnapshot(snapshotData);
      setIndicators(calculateIndicators(klinesData));
      
      // Load cached analysis for this symbol (shared across all timeframes)
      const cachedAnalysis = loadAnalysis(symbol);
      setAnalysis(cachedAnalysis);
    } catch (error) {
      toast({
        title: '数据加载失败',
        description: '请检查网络连接或交易对是否正确',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [symbol, timeframe, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleAnalyze = async () => {
    if (!klines.length || !indicators) {
      toast({
        title: '数据不足',
        description: '请等待K线数据加载完成',
        variant: 'destructive',
      });
      return;
    }

    const config = getApiConfig();
    
    if (!config.apiKey) {
      toast({
        title: 'API Key 未配置',
        description: '请点击右上角设置按钮配置 API Key',
        variant: 'destructive',
      });
      return;
    }

    setIsAnalyzing(true);
    
    try {
      const prompt = generateAnalysisPrompt(symbol, timeframe, klines, indicators);
      
      const response = await fetch(`${config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          messages: [
            { 
              role: 'system', 
              content: '你是币圈顶级量化交易员+链上数据分析师+技术派K线大师，经验超过10年。只说干货，不废话，不预测"一定会涨/跌"，只给高概率情景+风险提示。请用JSON格式回复。' 
            },
            { role: 'user', content: prompt }
          ],
          max_tokens: 4096,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API请求失败: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      
      const parsedAnalysis = parseAnalysisResponse(content);
      
      if (parsedAnalysis) {
        setAnalysis(parsedAnalysis);
        saveAnalysis(symbol, parsedAnalysis);
        toast({
          title: 'AI分析完成',
          description: '技术分析报告已生成并缓存',
        });
      } else {
        // Fallback to mock analysis if parsing fails
        const mockAnalysis: TechnicalAnalysis = {
          snapshot: `${symbol} 在过去7天呈现震荡走势，价格在 ${(snapshot?.low24h || 0).toLocaleString()} - ${(snapshot?.high24h || 0).toLocaleString()} 区间运行。24小时成交量${(snapshot?.changePercent24h || 0) > 0 ? '放大' : '萎缩'}，当前价格位于布林带${(indicators?.bollingerBands?.middle || 0) < (snapshot?.price || 0) ? '上半区' : '下半区'}。`,
          indicators: `均线系统：${indicators?.ma7 && indicators?.ma21 && indicators.ma7 > indicators.ma21 ? 'MA7上穿MA21形成金叉，短期偏多' : 'MA7下穿MA21形成死叉，短期偏空'}。\n\nRSI(14)=${indicators?.rsi?.toFixed(1)}，${(indicators?.rsi || 50) > 70 ? '超买区间，注意回调风险' : (indicators?.rsi || 50) < 30 ? '超卖区间，可能存在反弹机会' : '中性区间，等待方向选择'}。\n\nMACD：${(indicators?.macd?.histogram || 0) > 0 ? '红柱放大，多头动能增强' : '绿柱放大，空头动能增强'}。`,
          timeframes: `当前${timeframe}级别${(indicators?.ma7 || 0) > (indicators?.ma21 || 0) ? '多头排列' : '空头排列'}，需结合更高级别确认趋势。建议关注日线级别的支撑阻力位。`,
          scenarios: [
            {
              type: 'bull',
              probability: 45,
              trigger: `突破 ${((snapshot?.high24h || 0) * 1.02).toFixed(2)}`,
              target: (snapshot?.price || 0) * 1.08,
              stopLoss: (snapshot?.low24h || 0) * 0.98,
              description: '若有效突破近期高点伴随放量，上方目标看前高压力位'
            },
            {
              type: 'bear',
              probability: 30,
              trigger: `跌破 ${((snapshot?.low24h || 0) * 0.98).toFixed(2)}`,
              target: (snapshot?.price || 0) * 0.92,
              stopLoss: (snapshot?.high24h || 0) * 1.02,
              description: '若跌破关键支撑，下方看前低支撑区域'
            },
            {
              type: 'neutral',
              probability: 25,
              trigger: '区间震荡',
              target: (snapshot?.price || 0),
              stopLoss: (snapshot?.low24h || 0) * 0.95,
              description: '在当前区间内高抛低吸，等待明确方向选择'
            }
          ],
          risks: [
            '加密市场波动剧烈，需严格控制仓位',
            '注意假突破陷阱，等待K线收盘确认',
            '关注大盘整体走势和宏观消息面',
            '设置止损，严格执行交易纪律'
          ],
          summary: {
            stance: (indicators?.rsi || 50) > 60 && (indicators?.macd?.histogram || 0) > 0 ? 'aggressive' : 
                    (indicators?.rsi || 50) < 40 && (indicators?.macd?.histogram || 0) < 0 ? 'wait' : 'stable',
            position: (indicators?.rsi || 50) > 60 ? 60 : (indicators?.rsi || 50) < 40 ? 20 : 40,
            advice: `当前建议${(indicators?.rsi || 50) > 60 ? '轻仓做多，注意止盈' : (indicators?.rsi || 50) < 40 ? '观望为主，等待企稳信号' : '保持观望，等待明确信号再入场'}。严格执行止损纪律，仓位不超过建议比例。`
          }
        };
        setAnalysis(mockAnalysis);
        saveAnalysis(symbol, mockAnalysis);
        toast({
          title: 'AI分析完成',
          description: '使用本地计算结果（AI响应解析失败）',
        });
      }
      
    } catch (error) {
      toast({
        title: '分析失败',
        description: error instanceof Error ? error.message : '请稍后重试',
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-primary" />
                <h1 className="text-lg font-bold gold-text">K线分析大师</h1>
              </div>
              <SymbolSearch value={symbol} onChange={setSymbol} />
              <ThemeSwitcher />
            </div>
            
            <div className="flex items-center gap-3">
              <TimeFrameSelector value={timeframe} onChange={setTimeframe} />
              
              <Button
                variant="ghost"
                size="icon"
                onClick={loadData}
                disabled={isLoading}
                className="hover:bg-accent"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
              
              <ApiConfigDialog />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Panel - Chart & Controls */}
          <div className="lg:col-span-8 space-y-4">
            <MarketHeader snapshot={snapshot} isLoading={isLoading} />
            
            {/* Chart Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant={showMA ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowMA(!showMA)}
                className="text-xs"
              >
                {showMA ? <Eye className="w-3 h-3 mr-1" /> : <EyeOff className="w-3 h-3 mr-1" />}
                均线
              </Button>
              <Button
                variant={showBB ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowBB(!showBB)}
                className="text-xs"
              >
                {showBB ? <Eye className="w-3 h-3 mr-1" /> : <EyeOff className="w-3 h-3 mr-1" />}
                布林带
              </Button>
              <Button
                variant={showMACD ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowMACD(!showMACD)}
                className="text-xs"
              >
                {showMACD ? <Eye className="w-3 h-3 mr-1" /> : <EyeOff className="w-3 h-3 mr-1" />}
                MACD
              </Button>
              <Button
                variant={showRSI ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowRSI(!showRSI)}
                className="text-xs"
              >
                {showRSI ? <Eye className="w-3 h-3 mr-1" /> : <EyeOff className="w-3 h-3 mr-1" />}
                RSI
              </Button>
              <Button
                variant={showKDJ ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowKDJ(!showKDJ)}
                className="text-xs"
              >
                {showKDJ ? <Eye className="w-3 h-3 mr-1" /> : <EyeOff className="w-3 h-3 mr-1" />}
                KDJ
              </Button>
              <Button
                variant={showWR ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowWR(!showWR)}
                className="text-xs"
              >
                {showWR ? <Eye className="w-3 h-3 mr-1" /> : <EyeOff className="w-3 h-3 mr-1" />}
                W%R
              </Button>
            </div>
            
            {/* Chart */}
            <div className="h-[500px]">
              <KlineChart 
                klines={klines} 
                showMA={showMA} 
                showBB={showBB}
                showMACD={showMACD}
                showRSI={showRSI}
                showKDJ={showKDJ}
                showWR={showWR}
              />
            </div>

            {/* Analysis Button */}
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing || isLoading}
              className="w-full py-6 text-lg font-semibold"
            >
              <Zap className={`w-5 h-5 mr-2 ${isAnalyzing ? 'animate-pulse' : ''}`} />
              {isAnalyzing ? '分析中...' : '生成AI技术分析'}
            </Button>
          </div>

          {/* Right Panel - Indicators & Analysis */}
          <div className="lg:col-span-4 space-y-4 overflow-y-auto max-h-[calc(100vh-120px)] pr-2 scrollbar-custom">
            <IndicatorPanel 
              indicators={indicators} 
              currentPrice={snapshot?.price || 0} 
            />
            
            <AnalysisReport 
              analysis={analysis} 
              isLoading={isAnalyzing} 
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-4 mt-8">
        <div className="container mx-auto px-4 text-center text-xs text-muted-foreground">
          <p>数据来源: Binance API | 本工具仅供参考，不构成投资建议</p>
          <p className="mt-1">投资有风险，入市需谨慎</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
