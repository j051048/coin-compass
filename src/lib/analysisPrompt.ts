import { Kline, IndicatorValues, TechnicalAnalysis, TimeFrame } from '@/types/trading';

export function generateAnalysisPrompt(
  symbol: string,
  timeframe: TimeFrame,
  klines: Kline[],
  indicators: IndicatorValues
): string {
  const recent = klines.slice(-30);
  const priceData = recent.map(k => ({
    time: new Date(k.time * 1000).toISOString().slice(0, 16),
    o: k.open.toFixed(2),
    h: k.high.toFixed(2),
    l: k.low.toFixed(2),
    c: k.close.toFixed(2),
    v: (k.volume / 1e6).toFixed(2) + 'M'
  }));

  const currentPrice = klines[klines.length - 1].close;
  const highestRecent = Math.max(...recent.map(k => k.high));
  const lowestRecent = Math.min(...recent.map(k => k.low));

  return `你是币圈顶级量化交易员+链上数据分析师+技术派K线大师，经验超过10年。只说干货，不废话，不预测"一定会涨/跌"，只给高概率情景+风险提示。

交易对: ${symbol}
时间框架: ${timeframe}
当前价格: ${currentPrice}
近期高点: ${highestRecent}
近期低点: ${lowestRecent}

技术指标:
- MA7: ${indicators.ma7?.toFixed(2) || 'N/A'}
- MA21: ${indicators.ma21?.toFixed(2) || 'N/A'}
- MA50: ${indicators.ma50?.toFixed(2) || 'N/A'}
- MA200: ${indicators.ma200?.toFixed(2) || 'N/A'}
- RSI(14): ${indicators.rsi?.toFixed(1) || 'N/A'}
- MACD: DIF=${indicators.macd?.macd?.toFixed(2) || 'N/A'}, DEA=${indicators.macd?.signal?.toFixed(2) || 'N/A'}, 柱=${indicators.macd?.histogram?.toFixed(2) || 'N/A'}
- 布林带: 上轨=${indicators.bollingerBands?.upper?.toFixed(2) || 'N/A'}, 中轨=${indicators.bollingerBands?.middle?.toFixed(2) || 'N/A'}, 下轨=${indicators.bollingerBands?.lower?.toFixed(2) || 'N/A'}

近30根K线数据:
${JSON.stringify(priceData, null, 2)}

请严格按以下JSON格式输出分析结果（不要添加任何其他内容）:
{
  "snapshot": "1-7天行情快照，包含价格走势、成交量变化、关键支撑阻力位",
  "indicators": "技术指标解读，包含均线、MACD、RSI、布林带、成交量异动、K线形态分析",
  "timeframes": "多时间框架共振分析，是否存在强势信号或背离预警",
  "scenarios": [
    {
      "type": "bull",
      "probability": 40,
      "trigger": "突破某价位",
      "target": 目标价格数字,
      "stopLoss": 止损价格数字,
      "description": "详细描述"
    },
    {
      "type": "bear",
      "probability": 35,
      "trigger": "跌破某价位",
      "target": 目标价格数字,
      "stopLoss": 止损价格数字,
      "description": "详细描述"
    },
    {
      "type": "neutral",
      "probability": 25,
      "trigger": "区间震荡",
      "target": 目标价格数字,
      "stopLoss": 止损价格数字,
      "description": "详细描述"
    }
  ],
  "risks": ["风险1", "风险2", "风险3"],
  "summary": {
    "stance": "aggressive/stable/wait",
    "position": 0到100的数字表示建议仓位,
    "advice": "一句话总结建议"
  }
}`;
}

export function parseAnalysisResponse(response: string): TechnicalAnalysis | null {
  try {
    // Try to extract JSON from the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    // Validate required fields
    if (!parsed.snapshot || !parsed.indicators || !parsed.scenarios || !parsed.summary) {
      return null;
    }
    
    return parsed as TechnicalAnalysis;
  } catch (error) {
    console.error('Failed to parse analysis response:', error);
    return null;
  }
}
