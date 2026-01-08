import { TechnicalAnalysis } from '@/types/trading';
import { Skill } from '@/lib/skills';
import { 
  Target, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Shield,
  Zap,
  Clock,
  Star,
  Eye,
  Layers
} from 'lucide-react';

interface AnalysisReportProps {
  analysis: TechnicalAnalysis | null;
  isLoading: boolean;
  activeSkills?: Skill[];
}

export function AnalysisReport({ analysis, isLoading, activeSkills = [] }: AnalysisReportProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="analysis-section animate-pulse">
          <div className="h-4 bg-muted rounded w-32 mb-4" />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-4 bg-muted rounded" />
            ))}
          </div>
        </div>
        <div className="analysis-section animate-pulse">
          <div className="h-4 bg-muted rounded w-32 mb-4" />
          <div className="h-24 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="analysis-section text-center py-8">
        <Zap className="w-8 h-8 text-primary mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">
          点击"生成分析"获取专业K线解读
        </p>
        <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
          <p className="text-xs text-primary font-medium mb-1">已加载技能库</p>
          <p className="text-xs text-muted-foreground">{activeSkills.length > 0 ? activeSkills.map(s => s.name).join(' + ') : '无'}</p>
        </div>
      </div>
    );
  }

  const getStanceStyle = (stance: string) => {
    switch (stance) {
      case 'aggressive':
        return { bg: 'bg-bull/10', text: 'text-bull', label: '激进做多' };
      case 'stable':
        return { bg: 'bg-primary/10', text: 'text-primary', label: '稳健持仓' };
      default:
        return { bg: 'bg-muted', text: 'text-muted-foreground', label: '观望为主' };
    }
  };

  const stanceStyle = getStanceStyle(analysis.summary.stance);

  return (
    <div className="space-y-4">
      {/* Skill Badge */}
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 rounded-lg border border-primary/20">
        <Star className="w-4 h-4 text-primary flex-shrink-0" />
        <span className="text-xs text-primary font-medium truncate">技能库: {activeSkills.length > 0 ? activeSkills.map(s => s.name).join(' + ') : '无'}</span>
      </div>

      {/* Market Snapshot */}
      <div className="analysis-section">
        <h3 className="section-title">
          <Clock className="w-4 h-4" />
          结构与价位
        </h3>
        <p className="text-sm leading-relaxed text-foreground/90">
          {analysis.snapshot}
        </p>
      </div>

      {/* Patterns Recognition - New Section */}
      {analysis.patterns && (
        <div className="analysis-section">
          <h3 className="section-title">
            <Eye className="w-4 h-4" />
            大神级形态识别
          </h3>
          <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-line">
            {analysis.patterns}
          </p>
        </div>
      )}

      {/* Indicators Summary */}
      <div className="analysis-section">
        <h3 className="section-title">
          <Target className="w-4 h-4" />
          量价+指标共振
        </h3>
        <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-line">
          {analysis.indicators}
        </p>
      </div>

      {/* Timeframe Analysis */}
      <div className="analysis-section">
        <h3 className="section-title">
          <Layers className="w-4 h-4" />
          多周期一致性
        </h3>
        <p className="text-sm leading-relaxed text-foreground/90">
          {analysis.timeframes}
        </p>
      </div>

      {/* Resonance Rating - New Section */}
      {analysis.resonance && (
        <div className="analysis-section border-2 border-yellow-500/30 bg-yellow-500/5">
          <h3 className="section-title">
            <Star className="w-4 h-4 text-yellow-500" />
            大神共振信号
          </h3>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">信号匹配度</span>
            <span className="text-lg font-bold text-yellow-500">{analysis.resonance.rating}</span>
          </div>
          <p className="text-sm text-foreground/90">
            <span className="font-medium text-yellow-600">最强信号: </span>
            {analysis.resonance.strongestSignal}
          </p>
        </div>
      )}

      {/* Scenarios */}
      <div className="analysis-section">
        <h3 className="section-title">
          <Target className="w-4 h-4" />
          大神交易思路
        </h3>
        <div className="space-y-3">
          {analysis.scenarios.map((scenario, index) => (
            <div
              key={index}
              className={
                scenario.type === 'bull' ? 'scenario-bull' :
                scenario.type === 'bear' ? 'scenario-bear' :
                'scenario-neutral'
              }
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {scenario.type === 'bull' ? (
                    <TrendingUp className="w-4 h-4 text-bull" />
                  ) : scenario.type === 'bear' ? (
                    <TrendingDown className="w-4 h-4 text-bear" />
                  ) : (
                    <Minus className="w-4 h-4 text-muted-foreground" />
                  )}
                  <span className="text-sm font-medium">
                    {scenario.type === 'bull' ? '多头情景' :
                     scenario.type === 'bear' ? '空头情景' : '震荡情景'}
                  </span>
                </div>
                <span className={`text-xs font-mono px-2 py-0.5 rounded ${
                  scenario.type === 'bull' ? 'bg-bull/20 text-bull' :
                  scenario.type === 'bear' ? 'bg-bear/20 text-bear' :
                  'bg-muted text-muted-foreground'
                }`}>
                  概率 {scenario.probability}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground mb-2">{scenario.description}</p>
              <div className="grid grid-cols-4 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">触发条件</span>
                  <p className="font-mono">{scenario.trigger}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">目标位</span>
                  <p className="font-mono text-bull">{scenario.target.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">止损位</span>
                  <p className="font-mono text-bear">{scenario.stopLoss.toLocaleString()}</p>
                </div>
                {scenario.rrr && (
                  <div>
                    <span className="text-muted-foreground">RRR</span>
                    <p className="font-mono text-primary">{scenario.rrr}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Invalid Signal - New Section */}
      {analysis.invalidSignal && (
        <div className="analysis-section bg-bear/5 border-bear/30">
          <h3 className="section-title">
            <AlertTriangle className="w-4 h-4 text-bear" />
            最强失效信号
          </h3>
          <p className="text-sm leading-relaxed text-bear">
            {analysis.invalidSignal}
          </p>
        </div>
      )}

      {/* Risks */}
      <div className="analysis-section">
        <h3 className="section-title">
          <AlertTriangle className="w-4 h-4 text-bear" />
          终极风控提醒
        </h3>
        <ul className="space-y-2">
          {analysis.risks.map((risk, index) => (
            <li key={index} className="flex items-start gap-2 text-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-bear mt-2 flex-shrink-0" />
              <span className="text-foreground/80">{risk}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Summary */}
      <div className="analysis-section border-2 border-primary/30">
        <h3 className="section-title">
          <Shield className="w-4 h-4 text-primary" />
          一句话总结建议
        </h3>
        <div className="flex items-center justify-between mb-3">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${stanceStyle.bg} ${stanceStyle.text}`}>
            {stanceStyle.label}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">建议仓位</span>
            <span className="text-lg font-mono font-bold text-primary">
              {analysis.summary.position}%
            </span>
          </div>
        </div>
        <p className="text-sm leading-relaxed text-foreground/90">
          {analysis.summary.advice}
        </p>
      </div>
    </div>
  );
}
