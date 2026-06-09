import { useState, useMemo } from 'react';
import { FileText, Download } from 'lucide-react';
import { Trade } from '../types';
import { winRate, totalPnl, profitFactor, avgProfit, avgLoss, strategyPerformance } from '../utils/calculations';

interface Props {
  trades: Trade[];
}

export default function Reports({ trades }: Props) {
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const closed = useMemo(() => trades.filter(t => t.pnl != null), [trades]);

  const reportTrades = useMemo(() => {
    if (reportType === 'daily') {
      return closed.filter(t => t.trade_date === selectedDate);
    }
    if (reportType === 'weekly') {
      const d = new Date(selectedDate);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay() + 1);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      return closed.filter(t => {
        const td = new Date(t.trade_date);
        return td >= weekStart && td <= weekEnd;
      });
    }
    const month = selectedDate.slice(0, 7);
    return closed.filter(t => t.trade_date.startsWith(month));
  }, [closed, reportType, selectedDate]);

  const stats = useMemo(() => ({
    trades: reportTrades.length,
    winRate: winRate(reportTrades),
    pnl: totalPnl(reportTrades),
    profitFactor: profitFactor(reportTrades),
    avgProfit: avgProfit(reportTrades),
    avgLoss: avgLoss(reportTrades),
  }), [reportTrades]);

  const stratBreakdown = useMemo(() => strategyPerformance(reportTrades), [reportTrades]);

  const exportCSV = () => {
    const headers = ['Date', 'Instrument', 'Market', 'Direction', 'Strategy', 'Entry', 'Exit', 'Qty', 'P&L', 'R:R', 'Emotion Before', 'Emotion After', 'Notes'];
    const rows = reportTrades.map(t => [t.trade_date, t.instrument, t.market, t.direction, t.strategy, t.entry_price, t.exit_price ?? '', t.quantity, t.pnl ?? '', t.risk_reward_ratio ?? '', t.emotion_before, t.emotion_after, `"${t.trade_notes}"`]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    downloadFile(csv, `trade-report-${reportType}-${selectedDate}.csv`, 'text/csv');
  };

  const exportJSON = () => {
    const data = { reportType, date: selectedDate, stats, trades: reportTrades };
    downloadFile(JSON.stringify(data, null, 2), `trade-report-${reportType}-${selectedDate}.json`, 'application/json');
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const periodLabel = reportType === 'daily' ? selectedDate : reportType === 'weekly' ? `Week of ${selectedDate}` : selectedDate.slice(0, 7);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          {(['daily', 'weekly', 'monthly'] as const).map(type => (
            <button
              key={type}
              onClick={() => setReportType(type)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${reportType === type ? 'bg-white dark:bg-gray-700 shadow-sm' : 'text-gray-500'}`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
        <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm" />
        <span className="text-sm text-gray-500">{periodLabel}</span>
      </div>

      {/* Report card */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold">{reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report — {periodLabel}</h3>
          </div>
          <div className="flex gap-2">
            <button onClick={exportCSV} className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              <Download className="w-3.5 h-3.5" /> CSV
            </button>
            <button onClick={exportJSON} className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              <Download className="w-3.5 h-3.5" /> JSON
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-xs text-gray-500">Total Trades</p>
            <p className="text-lg font-bold">{stats.trades}</p>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-xs text-gray-500">Win Rate</p>
            <p className={`text-lg font-bold ${stats.winRate >= 50 ? 'text-emerald-600' : 'text-amber-600'}`}>{stats.winRate}%</p>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-xs text-gray-500">Net P&L</p>
            <p className={`text-lg font-bold font-mono ${stats.pnl >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>₹{stats.pnl.toLocaleString()}</p>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-xs text-gray-500">Profit Factor</p>
            <p className="text-lg font-bold">{stats.profitFactor}</p>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-xs text-gray-500">Avg Profit</p>
            <p className="text-lg font-bold font-mono text-emerald-600">₹{stats.avgProfit.toLocaleString()}</p>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-xs text-gray-500">Avg Loss</p>
            <p className="text-lg font-bold font-mono text-red-600">₹{stats.avgLoss.toLocaleString()}</p>
          </div>
        </div>

        {/* Strategy breakdown */}
        {Object.keys(stratBreakdown).length > 0 && (
          <div className="mb-6">
            <h4 className="font-medium text-sm mb-3">Strategy Breakdown</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800">
                    <th className="px-3 py-2 text-left font-medium text-gray-500">Strategy</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-500">Trades</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-500">Wins</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-500">Losses</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-500">P&L</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(stratBreakdown).map(([name, data]) => (
                    <tr key={name} className="border-b border-gray-100 dark:border-gray-800/50">
                      <td className="px-3 py-2 font-medium">{name}</td>
                      <td className="px-3 py-2 text-right">{data.count}</td>
                      <td className="px-3 py-2 text-right text-emerald-600">{data.wins}</td>
                      <td className="px-3 py-2 text-right text-red-600">{data.losses}</td>
                      <td className={`px-3 py-2 text-right font-mono font-semibold ${data.pnl >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>₹{data.pnl.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Trade list */}
        <div>
          <h4 className="font-medium text-sm mb-3">Trade Details</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th className="px-3 py-2 text-left font-medium text-gray-500">Date</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">Instrument</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">Direction</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">Strategy</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-500">Entry</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-500">Exit</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-500">P&L</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">Emotion</th>
                </tr>
              </thead>
              <tbody>
                {reportTrades.map(t => (
                  <tr key={t.id} className="border-b border-gray-100 dark:border-gray-800/50">
                    <td className="px-3 py-1.5">{t.trade_date}</td>
                    <td className="px-3 py-1.5 font-medium">{t.instrument}</td>
                    <td className="px-3 py-1.5">{t.direction}</td>
                    <td className="px-3 py-1.5 text-gray-500">{t.strategy}</td>
                    <td className="px-3 py-1.5 text-right font-mono">{t.entry_price}</td>
                    <td className="px-3 py-1.5 text-right font-mono">{t.exit_price ?? '—'}</td>
                    <td className={`px-3 py-1.5 text-right font-mono font-semibold ${t.pnl != null ? (t.pnl > 0 ? 'text-emerald-600' : t.pnl < 0 ? 'text-red-600' : '') : ''}`}>
                      {t.pnl != null ? `${t.pnl > 0 ? '+' : ''}${t.pnl.toLocaleString()}` : '—'}
                    </td>
                    <td className="px-3 py-1.5 text-gray-500">{t.emotion_before}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
