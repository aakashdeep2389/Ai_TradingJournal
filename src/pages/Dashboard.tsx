import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { Target, DollarSign, Activity, BarChart3 } from 'lucide-react';
import StatCard from '../components/StatCard';
import { Trade, RuleTracker } from '../types';
import { winRate, totalPnl, profitFactor, avgProfit, avgLoss, avgRiskReward, pnlByMonth, pnlByDayOfWeek } from '../utils/calculations';

interface Props {
  trades: Trade[];
  rules: RuleTracker[];
}

export default function Dashboard({ trades, rules }: Props) {
  const closedTrades = useMemo(() => trades.filter(t => t.pnl != null), [trades]);
  const wins = useMemo(() => closedTrades.filter(t => t.pnl! > 0), [closedTrades]);
  const losses = useMemo(() => closedTrades.filter(t => t.pnl! < 0), [closedTrades]);

  const stats = useMemo(() => ({
    totalTrades: closedTrades.length,
    wins: wins.length,
    losses: losses.length,
    winRate: winRate(closedTrades),
    totalPnl: totalPnl(closedTrades),
    avgProfit: avgProfit(closedTrades),
    avgLoss: avgLoss(closedTrades),
    profitFactor: profitFactor(closedTrades),
    avgRR: avgRiskReward(closedTrades),
  }), [closedTrades, wins, losses]);

  // Equity curve
  const equityData = useMemo(() => {
    const sorted = [...closedTrades].sort((a, b) => a.trade_date.localeCompare(b.trade_date));
    let cumPnl = 0;
    return sorted.map(t => {
      cumPnl += t.pnl!;
      return { date: t.trade_date, equity: Math.round(cumPnl * 100) / 100 };
    });
  }, [closedTrades]);

  // Monthly performance
  const monthlyData = useMemo(() => {
    const byMonth = pnlByMonth(closedTrades);
    return Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, pnl]) => ({ month, pnl: Math.round(pnl * 100) / 100 }));
  }, [closedTrades]);

  // Day of week
  const dowData = useMemo(() => {
    const byDay = pnlByDayOfWeek(closedTrades);
    const order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    return order.map(d => ({ day: d.slice(0, 3), pnl: Math.round((byDay[d] ?? 0) * 100) / 100 }));
  }, [closedTrades]);

  // Daily P&L calendar (last 35 days)
  const calendarDays = useMemo(() => {
    const map: Record<string, number> = {};
    closedTrades.forEach(t => {
      map[t.trade_date] = (map[t.trade_date] ?? 0) + t.pnl!;
    });
    const days = [];
    const today = new Date();
    for (let i = 34; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      days.push({ date: key, day: d.getDate(), pnl: Math.round((map[key] ?? 0) * 100) / 100 });
    }
    return days;
  }, [closedTrades]);

  // Discipline score
  const disciplineScore = useMemo(() => {
    if (rules.length === 0) return 0;
    const total = rules.reduce((sum, r) => {
      const followed = [r.no_overtrading, r.min_risk_reward, r.valid_setup, r.exit_at_sl_target, r.no_revenge_trading, r.no_fomo, r.follow_plan, r.position_sizing].filter(Boolean).length;
      return sum + followed;
    }, 0);
    return Math.round((total / (rules.length * 8)) * 10000) / 100;
  }, [rules]);

  const pnlColor = stats.totalPnl >= 0 ? 'emerald' : 'red';

  return (
    <div className="space-y-6">
      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard label="Total Trades" value={stats.totalTrades} color="blue" />
        <StatCard label="Winning Trades" value={stats.wins} color="emerald" />
        <StatCard label="Losing Trades" value={stats.losses} color="red" />
        <StatCard label="Win Rate" value={stats.winRate} suffix="%" color={stats.winRate >= 50 ? 'emerald' : 'amber'} />
        <StatCard label="Total P&L" value={stats.totalPnl} suffix="₹" color={pnlColor} />
        <StatCard label="Avg Profit" value={stats.avgProfit} suffix="₹" color="emerald" />
        <StatCard label="Avg Loss" value={stats.avgLoss} suffix="₹" color="red" />
        <StatCard label="Profit Factor" value={stats.profitFactor} color={stats.profitFactor >= 1.5 ? 'emerald' : 'amber'} />
        <StatCard label="Avg R:R" value={stats.avgRR} suffix=':1' color="blue" />
        <StatCard label="Discipline" value={disciplineScore} suffix="%" color={disciplineScore >= 70 ? 'emerald' : 'amber'} />
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Equity Curve */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-4.5 h-4.5 text-emerald-600" />
            <h3 className="font-semibold text-sm">Equity Curve</h3>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={equityData}>
              <defs>
                <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={v => v.slice(5)} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: any) => [`₹${Number(v).toLocaleString()}`, 'Cumulative P&L']} labelFormatter={l => `Date: ${l}`} />
              <Area type="monotone" dataKey="equity" stroke="#10b981" fill="url(#equityGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Performance */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4.5 h-4.5 text-blue-600" />
            <h3 className="font-semibold text-sm">Monthly Performance</h3>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} tickFormatter={v => v.slice(2)} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: any) => [`₹${Number(v).toLocaleString()}`, 'P&L']} />
              <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                {monthlyData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.pnl >= 0 ? '#10b981' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Day of Week */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4.5 h-4.5 text-amber-600" />
            <h3 className="font-semibold text-sm">P&L by Day of Week</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dowData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v: any) => [`₹${Number(v).toLocaleString()}`, 'P&L']} />
              <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                {dowData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.pnl >= 0 ? '#10b981' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Daily P&L Calendar */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-4.5 h-4.5 text-blue-600" />
            <h3 className="font-semibold text-sm">Daily P&L Calendar</h3>
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
              <div key={i} className="text-center text-xs font-medium text-gray-400 pb-1">{d}</div>
            ))}
            {calendarDays.map((d, i) => {
              const isWeekend = new Date(d.date).getDay() === 0 || new Date(d.date).getDay() === 6;
              const bg = d.pnl > 0 ? 'bg-emerald-500/20 text-emerald-400' : d.pnl < 0 ? 'bg-red-500/20 text-red-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-400';
              return (
                <div key={i} className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs ${isWeekend ? 'opacity-30' : ''} ${bg}`} title={`${d.date}: ₹${d.pnl}`}>
                  <span className="font-medium">{d.day}</span>
                  {d.pnl !== 0 && <span className="text-[9px] mt-0.5">{d.pnl > 0 ? '+' : ''}{d.pnl > 999 ? `${(d.pnl/1000).toFixed(0)}k` : d.pnl}</span>}
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-500/20" /> Profit</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-500/20" /> Loss</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-gray-100 dark:bg-gray-800" /> No Trade</span>
          </div>
        </div>
      </div>
    </div>
  );
}
