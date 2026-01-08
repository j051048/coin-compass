import { Kline, IndicatorValues, TechnicalAnalysis, TimeFrame } from '@/types/trading';
import { getSkillEnhancedPrompt, ACTIVE_SKILLS } from './skills';

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

  // Load skill/gem for enhanced analysis
  const skillPrompt = getSkillEnhancedPrompt();

  return `## 已加载技能库: ${ACTIVE_SKILLS.map(s => s.name).join(' + ')}
## 技能作者: ${ACTIVE_SKILLS.map(s => s.author).join(', ')}

${skillPrompt}

## 分析流程（严格执行，输出必须按此顺序）

1. 当前结构概览（时间框架、交易对、价位区间）
2. 大神视角关键形态识别（优先列顶级形态）
3. 量价+指标共振点（成交量变化最重要）
4. 多周期一致性 + 关键位分析
5. 大神共振信号是否出现？（列出匹配的顶级/次顶级组合）
6. 概率评估（上涨/震荡/下跌%区间 + 主要依据）
7. 交易思路（情景推演+观察区+结构止损位+RRR预估+失效信号）
8. 终极风控提醒（每条回复必出现）

---

## 当前市场数据

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

---

请严格按以下JSON格式输出分析结果（不要添加任何其他内容）:
{
  "snapshot": "【结构与价位】当前所处位置、价位区间、结构描述",
  "patterns": "【大神级形态识别】识别到的顶级/次顶级形态及历史胜率参考",
  "indicators": "【量价+指标共振】成交量关键变化、RSI/MACD/布林分析、资金费率/链上辅助信号",
  "timeframes": "【多周期一致性】周/日/4h/1h各级别趋势及一致性评级（极高/高/中/低）",
  "resonance": {
    "rating": "大神共振信号匹配度（5星制，如★★★★☆）",
    "strongestSignal": "当前最强信号描述"
  },
  "scenarios": [
    {
      "type": "bull",
      "probability": 40,
      "trigger": "突破某价位",
      "target": 目标价格数字,
      "stopLoss": 止损价格数字,
      "rrr": "风险回报比如1:3",
      "description": "多头情景详细描述"
    },
    {
      "type": "bear",
      "probability": 35,
      "trigger": "跌破某价位",
      "target": 目标价格数字,
      "stopLoss": 止损价格数字,
      "rrr": "风险回报比如1:2.5",
      "description": "空头情景详细描述"
    },
    {
      "type": "neutral",
      "probability": 25,
      "trigger": "区间震荡",
      "target": 目标价格数字,
      "stopLoss": 止损价格数字,
      "rrr": "风险回报比",
      "description": "震荡情景详细描述"
    }
  ],
  "invalidSignal": "最强失效信号描述",
  "risks": ["风险1", "风险2", "风险3", "【终极风控】加密市场瞬息万变，巨鲸操控+黑天鹅随时出现，此分析仅为概率参考，不构成任何投资建议。永远只用闲钱，单笔风险严格控制在1-2%，杠杆不超过5x。"],
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
