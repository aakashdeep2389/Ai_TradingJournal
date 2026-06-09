import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { TrendingUp, TrendingDown, Clock, BarChart3 } from 'lucide-react';
import StatCard from '../components/StatCard';
import { Trade } from '../types';
import { strategyPerformance, instrumentPerformance, pnlByDayOfWeek, pnlByMonth } from '../utils/calculations';

interface Props {
  trades: Trade[];
}

export default function Analytics({ trades }: Props) {
  const closed = useMemo(() => trades.filter(t => t.pnl != null), [trades]);

  const stratPerf = useMemo(() => strategyPerformance(closed), [closed]);
  const instPerf = useMemo(() => instrumentPerformance(closed), [closed]);
  const dowPerf = useMemo(() => pnlByDayOfWeek(closed), [closed]);
  const monthPerf = useMemo(() => pnlByMonth(closed), [closed]);

  const bestStrategy = useMemo(() => {
    const entries = Object.entries(stratPerf);
    if (entries.length === 0) return { name: '—', pnl: 0 };
    return entries.reduce((best, [name, data]) => data.pnl > best.pnl ? { name, pnl: data.pnl } : best, { name: '', pnl: -Infinity });
  }, [stratPerf]);

  const worstStrategy = useMemo(() => {
    const entries = Object.entries(stratPerf);
    if (entries.length === 0) return { name: '—', pnl: 0 };
    return entries.reduce((worst, [name, data]) => data.pnl < worst.pnl ? { name, pnl: data.pnl } : worst, { name: '', pnl: Infinity });
  }, [stratPerf]);

  const bestInstrument = useMemo(() => {
    const entries = Object.entries(instPerf);
    if (entries.length === 0) return { name: '—', pnl: 0 };
    return entries.reduce((best, [name, data]) => data.pnl > best.pnl ? { name, pnl: data.pnl } : best, { name: '', pnl: -Infinity });
  }, [instPerf]);

  const worstInstrument = useMemo(() => {
    const entries = Object.entries(instPerf);
    if (entries.length === 0) return { name: '—', pnl: 0 };
    return entries.reduce((worst, [name, data]) => data.pnl < worst.pnl ? { name, pnl: data.pnl } : worst, { name: '', pnl: Infinity });
  }, [instPerf]);

  const stratChartData = useMemo(() =>
    Object.entries(stratPerf).map(([name, data]) => ({
      name: name.length > 12 ? name.slice(0, 12) + '...' : name,
      pnl: Math.round(data.pnl * 100) / 100,
      winRate: data.count > 0 ? Math.round((data.wins / data.count) * 100) : 0,
      count: data.count,
    })).sort((a, b) => b.pnl - a.pnl),
    [stratPerf]
  );

  const instChartData = useMemo(() =>
    Object.entries(instPerf).map(([name, data]) => ({
      name,
      pnl: Math.round(data.pnl * 100) / 100,
      count: data.count,
    })).sort((a, b) => b.pnl - a.pnl),
    [instPerf]
  );

  const dowChartData = useMemo(() => {
    const order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    return order.map(d => ({ day: d.slice(0, 3), pnl: Math.round((dowPerf[d] ?? 0) * 100) / 100 }));
  }, [dowPerf]);

  const monthChartData = useMemo(() =>
    Object.entries(monthPerf).sort(([a], [b]) => a.localeCompare(b)).map(([month, pnl]) => ({
      month: month.slice(2),
      pnl: Math.round(pnl * 100) / 100,
    })),
    [monthPerf]
  );

  // Pie chart data for strategy distribution
  const pieData = useMemo(() =>
    Object.entries(stratPerf).map(([name, data]) => ({ name, value: data.count })),
    [stratPerf]
  );

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-6">
      {/* Top stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Best Strategy" value={bestStrategy.name} color="emerald" size="sm" />
        <StatCard label="Worst Strategy" value={worstStrategy.name} color="red" size="sm" />
        <StatCard label="Best Instrument" value={bestInstrument.name} color="emerald" size="sm" />
        <StatCard label="Worst Instrument" value={worstInstrument.name} color="red" size="sm" />
      </div>

      {/* Strategy performance */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4.5 h-4.5 text-blue-600" />
            <h3 className="font-semibold text-sm">Strategy Performance</h3>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={stratChartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v: any) => [`₹${Number(v).toLocaleString()}`, 'P&L']} />
              <Bar dataKey="pnl" radius={[0, 4, 4, 0]}>
                {stratChartData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.pnl >= 0 ? '#10b981' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4.5 h-4.5 text-emerald-600" />
            <h3 className="font-semibold text-sm">Strategy Distribution</h3>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }: any) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                {pieData.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Instrument and time-based */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4.5 h-4.5 text-emerald-600" />
            <h3 className="font-semibold text-sm">Instrument Performance</h3>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={instChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v: any) => [`₹${Number(v).toLocaleString()}`, 'P&L']} />
              <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                {instChartData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.pnl >= 0 ? '#10b981' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4.5 h-4.5 text-amber-600" />
            <h3 className="font-semibold text-sm">P&L by Day of Week</h3>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={dowChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v: any) => [`₹${Number(v).toLocaleString()}`, 'P&L']} />
              <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                {dowChartData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.pnl >= 0 ? '#10b981' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly trend */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingDown className="w-4.5 h-4.5 text-blue-600" />
          <h3 className="font-semibold text-sm">P&L by Month</h3>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={monthChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis dataKey="month" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip formatter={(v: any) => [`₹${Number(v).toLocaleString()}`, 'P&L']} />
            <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
              {monthChartData.map((entry, idx) => (
                <Cell key={idx} fill={entry.pnl >= 0 ? '#10b981' : '#ef4444'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
