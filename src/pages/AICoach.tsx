import { useMemo } from 'react';
import { Bot, AlertTriangle, TrendingUp, Brain, Target, Lightbulb, CheckCircle2 } from 'lucide-react';
import { Trade, RuleTracker } from '../types';
import { strategyPerformance, winRate, profitFactor } from '../utils/calculations';

interface Props {
  trades: Trade[];
  rules: RuleTracker[];
}

interface Insight {
  type: 'warning' | 'success' | 'info' | 'suggestion';
  icon: any;
  title: string;
  description: string;
}

export default function AICoach({ trades, rules }: Props) {
  const closed = useMemo(() => trades.filter(t => t.pnl != null), [trades]);
  const wr = useMemo(() => winRate(closed), [closed]);
  const pf = useMemo(() => profitFactor(closed), [closed]);
  const stratPerf = useMemo(() => strategyPerformance(closed), [closed]);

  const insights = useMemo(() => {
    const items: Insight[] = [];

    // Overtrading detection
    const tradesPerDay: Record<string, number> = {};
    closed.forEach(t => { tradesPerDay[t.trade_date] = (tradesPerDay[t.trade_date] ?? 0) + 1; });
    const overtradeDays = Object.entries(tradesPerDay).filter(([, c]) => c > 3);
    if (overtradeDays.length > 0) {
      items.push({
        type: 'warning',
        icon: AlertTriangle,
        title: 'Overtrading Detected',
        description: `You took more than 3 trades on ${overtradeDays.length} day(s). Overtrading often leads to diminished focus and poor decision-making. Consider setting a daily trade limit.`,
      });
    }

    // Revenge trading detection
    const revengeTrades = closed.filter(t => t.emotion_before === 'Revenge' || t.emotion_before === 'FOMO');
    if (revengeTrades.length > 0) {
      const revengeWinRate = revengeTrades.filter(t => t.pnl! > 0).length / revengeTrades.length * 100;
      items.push({
        type: 'warning',
        icon: AlertTriangle,
        title: 'Emotional Trading Detected',
        description: `You entered ${revengeTrades.length} trades while feeling revenge/FOMO with only ${revengeWinRate.toFixed(0)}% win rate. Step away after a loss to avoid revenge trades.`,
      });
    }

    // Win rate analysis
    if (wr < 40) {
      items.push({
        type: 'warning',
        icon: Target,
        title: 'Low Win Rate',
        description: `Your ${wr.toFixed(1)}% win rate is below the typical threshold. Focus on trade quality over quantity. Wait for A+ setups only.`,
      });
    } else if (wr >= 55) {
      items.push({
        type: 'success',
        icon: CheckCircle2,
        title: 'Strong Win Rate',
        description: `Your ${wr.toFixed(1)}% win rate is solid. Keep maintaining your edge and don't become overconfident.`,
      });
    }

    // Profit factor
    if (pf < 1) {
      items.push({
        type: 'warning',
        icon: TrendingUp,
        title: 'Negative Profit Factor',
        description: `Your profit factor of ${pf} means losses exceed gains. Review your risk management — cut losses short and let winners run.`,
      });
    } else if (pf >= 2) {
      items.push({
        type: 'success',
        icon: TrendingUp,
        title: 'Excellent Profit Factor',
        description: `Profit factor of ${pf} shows strong edge. Your winners significantly outweigh your losers.`,
      });
    }

    // Best strategy
    const bestStrat = Object.entries(stratPerf).reduce((best, [name, data]) =>
      data.pnl > best.pnl ? { name, pnl: data.pnl, wins: data.wins, count: data.count } : best,
      { name: '', pnl: -Infinity, wins: 0, count: 0 }
    );
    if (bestStrat.name) {
      items.push({
        type: 'success',
        icon: Brain,
        title: 'Best Performing Setup',
        description: `"${bestStrat.name}" is your best strategy with ₹${bestStrat.pnl.toLocaleString()} P&L and ${bestStrat.count > 0 ? ((bestStrat.wins / bestStrat.count) * 100).toFixed(0) : 0}% win rate across ${bestStrat.count} trades. Consider allocating more size to this strategy.`,
      });
    }

    // Worst strategy
    const worstStrat = Object.entries(stratPerf).reduce((worst, [name, data]) =>
      data.pnl < worst.pnl ? { name, pnl: data.pnl, count: data.count } : worst,
      { name: '', pnl: Infinity, count: 0 }
    );
    if (worstStrat.name && worstStrat.pnl < 0) {
      items.push({
        type: 'warning',
        icon: AlertTriangle,
        title: 'Underperforming Strategy',
        description: `"${worstStrat.name}" has lost ₹${Math.abs(worstStrat.pnl).toLocaleString()} across ${worstStrat.count} trades. Review whether this strategy still has an edge or needs refinement.`,
      });
    }

    // Discipline analysis
    if (rules.length > 0) {
      const recentRules = rules.slice(0, 7);
      const avgDiscipline = recentRules.reduce((sum, r) => {
        const followed = [r.no_overtrading, r.min_risk_reward, r.valid_setup, r.exit_at_sl_target, r.no_revenge_trading, r.no_fomo, r.follow_plan, r.position_sizing].filter(Boolean).length;
        return sum + (followed / 8) * 100;
      }, 0) / recentRules.length;

      if (avgDiscipline < 50) {
        items.push({
          type: 'warning',
          icon: Target,
          title: 'Discipline Declining',
          description: `Your recent 7-day discipline score is ${avgDiscipline.toFixed(0)}%. Poor discipline is the #1 reason traders fail. Recommit to your rules.`,
        });
      } else if (avgDiscipline >= 80) {
        items.push({
          type: 'success',
          icon: CheckCircle2,
          title: 'Strong Discipline',
          description: `Your ${avgDiscipline.toFixed(0)}% discipline score over the last 7 days is excellent. Consistent rule-following builds long-term profitability.`,
        });
      }
    }

    // Emotion analysis
    const emotionMap: Record<string, { wins: number; total: number }> = {};
    closed.forEach(t => {
      if (t.emotion_before) {
        if (!emotionMap[t.emotion_before]) emotionMap[t.emotion_before] = { wins: 0, total: 0 };
        emotionMap[t.emotion_before].total++;
        if (t.pnl! > 0) emotionMap[t.emotion_before].wins++;
      }
    });
    const worstEmotion = Object.entries(emotionMap).reduce((worst, [emotion, data]) =>
      data.total >= 3 && (data.wins / data.total) < (worst.total > 0 ? worst.wins / worst.total : 1) ? { emotion, ...data } : worst,
      { emotion: '', wins: 0, total: 0 } as any
    );
    if (worstEmotion.emotion && worstEmotion.total >= 3) {
      items.push({
        type: 'warning',
        icon: Brain,
        title: `Warning: "${worstEmotion.emotion}" Trades`,
        description: `When entering trades feeling "${worstEmotion.emotion}", your win rate drops to ${((worstEmotion.wins / worstEmotion.total) * 100).toFixed(0)}%. Avoid trading when in this emotional state.`,
      });
    }

    // Suggestions
    items.push({
      type: 'suggestion',
      icon: Lightbulb,
      title: 'Weekly Review Recommendation',
      description: 'Review your last 10 trades every weekend. Identify patterns in your winners and losers. The biggest improvements come from systematic self-review.',
    });

    if (closed.length > 20) {
      const recentPnl = closed.slice(0, 10).reduce((s, t) => s + t.pnl!, 0);
      const olderPnl = closed.slice(10, 20).reduce((s, t) => s + t.pnl!, 0);
      if (recentPnl > olderPnl) {
        items.push({
          type: 'success',
          icon: TrendingUp,
          title: 'Improving Performance',
          description: `Your recent 10 trades show ₹${recentPnl.toLocaleString()} vs ₹${olderPnl.toLocaleString()} in the prior 10. Keep up the improvement!`,
        });
      }
    }

    items.push({
      type: 'suggestion',
      icon: Lightbulb,
      title: 'Position Sizing Tip',
      description: 'Never risk more than 1-2% of your capital on a single trade. This ensures you survive losing streaks and stay in the game long enough for your edge to play out.',
    });

    return items;
  }, [closed, rules, wr, pf, stratPerf]);

  const typeStyles = {
    warning: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
    success: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800',
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    suggestion: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
  };

  const iconColors = {
    warning: 'text-amber-600',
    success: 'text-emerald-600',
    info: 'text-blue-600',
    suggestion: 'text-purple-600',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 dark:from-emerald-900 dark:to-gray-900 rounded-xl p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Bot className="w-6 h-6" />
          <h2 className="text-lg font-bold">AI Trading Coach</h2>
        </div>
        <p className="text-sm text-gray-300">Analyzing your journal data to identify patterns, mistakes, and opportunities for improvement.</p>
        <div className="flex gap-6 mt-4">
          <div>
            <p className="text-xs text-gray-400">Trades Analyzed</p>
            <p className="text-xl font-bold">{closed.length}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Insights Generated</p>
            <p className="text-xl font-bold">{insights.length}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Win Rate</p>
            <p className="text-xl font-bold">{wr.toFixed(1)}%</p>
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="space-y-3">
        {insights.map((insight, i) => (
          <div key={i} className={`rounded-xl border p-4 ${typeStyles[insight.type]}`}>
            <div className="flex items-start gap-3">
              <insight.icon className={`w-5 h-5 mt-0.5 shrink-0 ${iconColors[insight.type]}`} />
              <div>
                <h3 className="font-semibold text-sm mb-1">{insight.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{insight.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
