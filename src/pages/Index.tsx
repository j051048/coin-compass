import { useState, useEffect, useCallback } from 'react';
import { Zap, Eye, EyeOff, RefreshCw, BarChart3, Lock, Menu } from 'lucide-react';
import { useConnectModal } from '@rainbow-me/rainbowkit';
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
import { WalletButton } from '@/components/WalletButton';
import { PaymentPanel } from '@/components/PaymentPanel';
import { SkillManager } from '@/components/SkillManager';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { usePaymentGate } from '@/hooks/usePaymentGate';
import { useSkillManager } from '@/hooks/useSkillManager';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';

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
  const [showVOL, setShowVOL] = useState(false);
  const [showBB, setShowBB] = useState(false);
  const [showMACD, setShowMACD] = useState(false);
  const [showRSI, setShowRSI] = useState(false);
  const [showKDJ, setShowKDJ] = useState(false);
  const [showWR, setShowWR] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { toast } = useToast();
  
  // Skill manager hook
  const { activeSkills, getActivePrompt } = useSkillManager();
  
  // Payment gate hook
  const {
    canUse,
    needsPayment,
    remainingUses,
    isPaying,
    isConnected,
    consumeUse,
    payWithToken,
  } = usePaymentGate();
  
  const { openConnectModal } = useConnectModal();

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
    if (!canUse) {
      toast({
        title: '使用次数已用完',
        description: '请付费解锁更多次数',
        variant: 'destructive',
      });
      return;
    }

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

    // Consume one use before starting analysis
    consumeUse();
    
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
        <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-3">
          <div className="flex items-center gap-2">
            {/* Logo */}
            <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
              <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              <h1 className="text-xs sm:text-lg font-bold gold-text hidden sm:block">K线大师</h1>
            </div>
            
            {/* Search - Flexible */}
            <div className="flex-1 min-w-0 max-w-[120px] sm:max-w-[200px] md:max-w-none">
              <SymbolSearch value={symbol} onChange={setSymbol} />
            </div>
            
            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-2">
              <TimeFrameSelector value={timeframe} onChange={setTimeframe} />
              <SkillManager />
              <ThemeSwitcher />
              <WalletButton />
              <Button
                variant="ghost"
                size="icon"
                onClick={loadData}
                disabled={isLoading}
                className="hover:bg-accent h-8 w-8"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
              <ApiConfigDialog />
            </div>

            {/* Mobile Actions */}
            <div className="flex md:hidden items-center gap-0.5 flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={loadData}
                disabled={isLoading}
                className="hover:bg-accent h-7 w-7 sm:h-8 sm:w-8"
              >
                <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8">
                    <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[280px] p-4">
                  <div className="space-y-4 pt-4">
                    <p className="text-sm font-medium text-muted-foreground">时间周期</p>
                    <TimeFrameSelector value={timeframe} onChange={setTimeframe} />
                    
                    <div className="border-t border-border pt-4">
                      <p className="text-sm font-medium text-muted-foreground mb-3">设置</p>
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">主题</span>
                          <ThemeSwitcher />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">钱包</span>
                          <WalletButton />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">API配置</span>
                          <ApiConfigDialog />
                        </div>
                      </div>
                    </div>
                    <div className="border-t border-border pt-4">
                      <p className="text-sm font-medium text-muted-foreground mb-3">技能库管理</p>
                      <SkillManager />
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-2 sm:px-4 py-2 sm:py-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4">
          {/* Left Panel - Chart & Controls */}
          <div className="lg:col-span-8 space-y-3 sm:space-y-4">
            <MarketHeader snapshot={snapshot} isLoading={isLoading} symbol={symbol} />
            
            {/* Chart Controls - Scrollable on mobile */}
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-2 scrollbar-thin">
              <Button
                variant={showMA ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowMA(!showMA)}
                className="text-xs h-7 px-2 flex-shrink-0"
              >
                {showMA ? <Eye className="w-3 h-3 mr-1" /> : <EyeOff className="w-3 h-3 mr-1" />}
                均线
              </Button>
              <Button
                variant={showVOL ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowVOL(!showVOL)}
                className="text-xs h-7 px-2 flex-shrink-0"
              >
                {showVOL ? <Eye className="w-3 h-3 mr-1" /> : <EyeOff className="w-3 h-3 mr-1" />}
                VOL
              </Button>
              <Button
                variant={showBB ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowBB(!showBB)}
                className="text-xs h-7 px-2 flex-shrink-0"
              >
                {showBB ? <Eye className="w-3 h-3 mr-1" /> : <EyeOff className="w-3 h-3 mr-1" />}
                布林带
              </Button>
              <Button
                variant={showMACD ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowMACD(!showMACD)}
                className="text-xs h-7 px-2 flex-shrink-0"
              >
                {showMACD ? <Eye className="w-3 h-3 mr-1" /> : <EyeOff className="w-3 h-3 mr-1" />}
                MACD
              </Button>
              <Button
                variant={showRSI ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowRSI(!showRSI)}
                className="text-xs h-7 px-2 flex-shrink-0"
              >
                {showRSI ? <Eye className="w-3 h-3 mr-1" /> : <EyeOff className="w-3 h-3 mr-1" />}
                RSI
              </Button>
              <Button
                variant={showKDJ ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowKDJ(!showKDJ)}
                className="text-xs h-7 px-2 flex-shrink-0"
              >
                {showKDJ ? <Eye className="w-3 h-3 mr-1" /> : <EyeOff className="w-3 h-3 mr-1" />}
                KDJ
              </Button>
              <Button
                variant={showWR ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowWR(!showWR)}
                className="text-xs h-7 px-2 flex-shrink-0"
              >
                {showWR ? <Eye className="w-3 h-3 mr-1" /> : <EyeOff className="w-3 h-3 mr-1" />}
                W%R
              </Button>
            </div>
            
            {/* Chart */}
            <div className="h-[300px] sm:h-[400px] lg:h-[500px]">
              <KlineChart 
                klines={klines} 
                showMA={showMA}
                showVOL={showVOL}
                showBB={showBB}
                showMACD={showMACD}
                showRSI={showRSI}
                showKDJ={showKDJ}
                showWR={showWR}
              />
            </div>

            {/* Analysis Button */}
            <div className="space-y-2 sm:space-y-3">
              <Button
                onClick={handleAnalyze}
                disabled={isAnalyzing || isLoading || !canUse}
                className={`w-full py-4 sm:py-6 text-base sm:text-lg font-semibold ${!canUse ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {!canUse ? (
                  <>
                    <Lock className="w-5 h-5 mr-2" />
                    使用次数已用完
                  </>
                ) : (
                  <>
                    <Zap className={`w-5 h-5 mr-2 ${isAnalyzing ? 'animate-pulse' : ''}`} />
                    {isAnalyzing ? '分析中...' : `生成AI技术分析 (剩余${remainingUses}次)`}
                  </>
                )}
              </Button>
              
              {/* Payment Panel - show when needs payment */}
              {needsPayment && (
                <PaymentPanel
                  isPaying={isPaying}
                  isConnected={isConnected}
                  onPay={payWithToken}
                  onConnect={() => openConnectModal?.()}
                />
              )}
              
              {/* Active Skills Info on Mobile */}
              {activeSkills.length > 0 && (
                <div className="lg:hidden p-2 bg-primary/5 rounded-lg border border-primary/20 text-center">
                  <p className="text-xs text-muted-foreground">已激活技能: <span className="text-primary font-medium">{activeSkills.length}</span></p>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Indicators & Analysis */}
          <div className="lg:col-span-4 space-y-3 sm:space-y-4 lg:overflow-y-auto lg:max-h-[calc(100vh-120px)] lg:pr-2 scrollbar-custom">
            <IndicatorPanel 
              indicators={indicators} 
              currentPrice={snapshot?.price || 0} 
            />
            
            <AnalysisReport 
              analysis={analysis} 
              isLoading={isAnalyzing}
              activeSkills={activeSkills}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-3 sm:py-4 mt-4 sm:mt-8">
        <div className="container mx-auto px-2 sm:px-4 text-center text-[10px] sm:text-xs text-muted-foreground">
          <p>数据来源: Binance API | 本工具仅供参考，不构成投资建议</p>
          <p className="mt-0.5 sm:mt-1">投资有风险，入市需谨慎</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
