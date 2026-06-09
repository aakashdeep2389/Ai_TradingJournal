import { useMemo, useState } from 'react';
import { Shield, Check, X } from 'lucide-react';
import StatCard from '../components/StatCard';
import { RuleTracker, RULES } from '../types';

interface Props {
  rules: RuleTracker[];
  upsertRule: (rule: Omit<RuleTracker, 'id' | 'created_at'>) => Promise<void>;
}

export default function RulesTracker({ rules, upsertRule }: Props) {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const monthRules = useMemo(() =>
    rules.filter(r => r.rule_date.startsWith(selectedMonth)).sort((a, b) => a.rule_date.localeCompare(b.rule_date)),
    [rules, selectedMonth]
  );

  const disciplineScore = useMemo(() => {
    if (monthRules.length === 0) return 0;
    const total = monthRules.reduce((sum, r) => {
      const followed = [r.no_overtrading, r.min_risk_reward, r.valid_setup, r.exit_at_sl_target, r.no_revenge_trading, r.no_fomo, r.follow_plan, r.position_sizing].filter(Boolean).length;
      return sum + followed;
    }, 0);
    return Math.round((total / (monthRules.length * 8)) * 10000) / 100;
  }, [monthRules]);

  const ruleScores = useMemo(() => {
    const scores: Record<string, { followed: number; total: number }> = {};
    RULES.forEach(({ key }) => { scores[key] = { followed: 0, total: 0 }; });
    monthRules.forEach(r => {
      RULES.forEach(({ key }) => {
        scores[key].total++;
        if ((r as any)[key]) scores[key].followed++;
      });
    });
    return scores;
  }, [monthRules]);

  const toggleRule = async (date: string, key: string, currentVal: boolean) => {
    const existing = monthRules.find(r => r.rule_date === date);
    if (existing) {
      const { id: _id, created_at: _ca, ...rest } = existing;
      await upsertRule({ ...rest, rule_date: date, [key]: !currentVal });
    } else {
      const newRule: any = { rule_date: date, no_overtrading: false, min_risk_reward: false, valid_setup: false, exit_at_sl_target: false, no_revenge_trading: false, no_fomo: false, follow_plan: false, position_sizing: false };
      newRule[key] = true;
      await upsertRule(newRule);
    }
  };

  // Generate calendar days for the month
  const calendarDays = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const days: { date: string; day: number; rule: RuleTracker | undefined; score: number }[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const date = `${selectedMonth}-${String(d).padStart(2, '0')}`;
      const rule = monthRules.find(r => r.rule_date === date);
      let score = 0;
      if (rule) {
        const followed = [rule.no_overtrading, rule.min_risk_reward, rule.valid_setup, rule.exit_at_sl_target, rule.no_revenge_trading, rule.no_fomo, rule.follow_plan, rule.position_sizing].filter(Boolean).length;
        score = Math.round((followed / 8) * 100);
      }
      days.push({ date, day: d, rule, score });
    }
    return days;
  }, [selectedMonth, monthRules]);

  const getHeatColor = (score: number, hasRule: boolean) => {
    if (!hasRule) return 'bg-gray-100 dark:bg-gray-800';
    if (score >= 87.5) return 'bg-emerald-500 text-white';
    if (score >= 75) return 'bg-emerald-400 text-white';
    if (score >= 62.5) return 'bg-emerald-300 text-emerald-900';
    if (score >= 50) return 'bg-yellow-300 text-yellow-900';
    if (score >= 37.5) return 'bg-orange-300 text-orange-900';
    return 'bg-red-400 text-white';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm" />
        <StatCard label="Discipline Score" value={disciplineScore} suffix="%" color={disciplineScore >= 70 ? 'emerald' : 'amber'} size="sm" />
      </div>

      {/* Discipline Heatmap */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-4.5 h-4.5 text-emerald-600" />
          <h3 className="font-semibold text-sm">Monthly Discipline Heatmap</h3>
        </div>
        <div className="grid grid-cols-7 gap-1.5 mb-4">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
            <div key={d} className="text-center text-xs font-medium text-gray-400 pb-1">{d}</div>
          ))}
          {(() => {
            const firstDay = new Date(calendarDays[0]?.date + 'T12:00:00').getDay();
            const offset = firstDay === 0 ? 6 : firstDay - 1;
            const cells = [];
            for (let i = 0; i < offset; i++) cells.push(<div key={`blank-${i}`} />);
            calendarDays.forEach(d => {
              const dow = new Date(d.date + 'T12:00:00').getDay();
              const isWeekend = dow === 0 || dow === 6;
              cells.push(
                <div key={d.date} className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs cursor-pointer ${isWeekend ? 'opacity-30' : ''} ${getHeatColor(d.score, !!d.rule)}`} title={`${d.date}: ${d.score}% discipline`}>
                  <span className="font-medium">{d.day}</span>
                  {d.rule && <span className="text-[9px]">{d.score}%</span>}
                </div>
              );
            });
            return cells;
          })()}
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span>Less</span>
          {['bg-red-400', 'bg-orange-300', 'bg-yellow-300', 'bg-emerald-300', 'bg-emerald-400', 'bg-emerald-500'].map((c, i) => (
            <span key={i} className={`w-4 h-4 rounded ${c}`} />
          ))}
          <span>More</span>
        </div>
      </div>

      {/* Rule-by-rule breakdown */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
        <h3 className="font-semibold text-sm mb-4">Rule Compliance</h3>
        <div className="space-y-3">
          {RULES.map(({ key, label }) => {
            const score = ruleScores[key];
            const pct = score.total > 0 ? Math.round((score.followed / score.total) * 100) : 0;
            return (
              <div key={key} className="flex items-center gap-3">
                <span className="text-sm w-44 shrink-0">{label}</span>
                <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-sm font-mono w-12 text-right">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Day-by-day tracker */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 overflow-x-auto">
        <h3 className="font-semibold text-sm mb-4">Day-by-Day Tracker</h3>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-800">
              <th className="px-2 py-2 text-left font-medium text-gray-500">Date</th>
              {RULES.map(({ key, label }) => (
                <th key={key} className="px-2 py-2 text-center font-medium text-gray-500" title={label}>
                  <span className="truncate block max-w-[60px]">{label.split(' ').slice(0, 2).join(' ')}</span>
                </th>
              ))}
              <th className="px-2 py-2 text-center font-medium text-gray-500">Score</th>
            </tr>
          </thead>
          <tbody>
            {calendarDays.filter(d => new Date(d.date + 'T12:00:00').getDay() !== 0 && new Date(d.date + 'T12:00:00').getDay() !== 6).map(d => (
              <tr key={d.date} className="border-b border-gray-100 dark:border-gray-800/50">
                <td className="px-2 py-1.5 font-medium whitespace-nowrap">{d.date.slice(5)}</td>
                {RULES.map(({ key }) => {
                  const val = d.rule ? (d.rule as any)[key] : false;
                  return (
                    <td key={key} className="px-2 py-1.5 text-center">
                      <button
                        onClick={() => toggleRule(d.date, key, val)}
                        className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${val ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}
                      >
                        {val ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                      </button>
                    </td>
                  );
                })}
                <td className="px-2 py-1.5 text-center font-semibold">{d.rule ? `${d.score}%` : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
