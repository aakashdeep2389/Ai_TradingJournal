import { Trade } from '../types';

export function calcPnl(trade: Trade): number | null {
  if (trade.exit_price == null) return null;
  return trade.direction === 'Buy'
    ? (trade.exit_price - trade.entry_price) * trade.quantity
    : (trade.entry_price - trade.exit_price) * trade.quantity;
}

export function calcRiskReward(trade: Trade): number | null {
  if (trade.stop_loss == null || trade.target == null) return null;
  if (trade.direction === 'Buy') {
    const risk = Math.abs(trade.entry_price - trade.stop_loss);
    const reward = Math.abs(trade.target - trade.entry_price);
    return risk === 0 ? null : Math.round((reward / risk) * 100) / 100;
  }
  const risk = Math.abs(trade.stop_loss - trade.entry_price);
  const reward = Math.abs(trade.entry_price - trade.target);
  return risk === 0 ? null : Math.round((reward / risk) * 100) / 100;
}

export function winRate(trades: Trade[]): number {
  const closed = trades.filter(t => t.pnl != null);
  if (closed.length === 0) return 0;
  return Math.round((closed.filter(t => t.pnl! > 0).length / closed.length) * 10000) / 100;
}

export function totalPnl(trades: Trade[]): number {
  return trades.reduce((sum, t) => sum + (t.pnl ?? 0), 0);
}

export function profitFactor(trades: Trade[]): number {
  const closed = trades.filter(t => t.pnl != null);
  const gains = closed.filter(t => t.pnl! > 0).reduce((s, t) => s + t.pnl!, 0);
  const losses = Math.abs(closed.filter(t => t.pnl! < 0).reduce((s, t) => s + t.pnl!, 0));
  return losses === 0 ? 0 : Math.round((gains / losses) * 100) / 100;
}

export function avgProfit(trades: Trade[]): number {
  const wins = trades.filter(t => t.pnl != null && t.pnl! > 0);
  if (wins.length === 0) return 0;
  return Math.round((wins.reduce((s, t) => s + t.pnl!, 0) / wins.length) * 100) / 100;
}

export function avgLoss(trades: Trade[]): number {
  const losses = trades.filter(t => t.pnl != null && t.pnl! < 0);
  if (losses.length === 0) return 0;
  return Math.round((losses.reduce((s, t) => s + t.pnl!, 0) / losses.length) * 100) / 100;
}

export function avgRiskReward(trades: Trade[]): number {
  const withRR = trades.filter(t => t.risk_reward_ratio != null);
  if (withRR.length === 0) return 0;
  return Math.round((withRR.reduce((s, t) => s + t.risk_reward_ratio!, 0) / withRR.length) * 100) / 100;
}

export function pnlByMonth(trades: Trade[]): Record<string, number> {
  const map: Record<string, number> = {};
  trades.filter(t => t.pnl != null).forEach(t => {
    const key = t.trade_date.slice(0, 7);
    map[key] = (map[key] ?? 0) + t.pnl!;
  });
  return map;
}

export function pnlByDayOfWeek(trades: Trade[]): Record<string, number> {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const map: Record<string, number> = {};
  trades.filter(t => t.pnl != null).forEach(t => {
    const d = days[new Date(t.trade_date).getDay()];
    map[d] = (map[d] ?? 0) + t.pnl!;
  });
  return map;
}

export function strategyPerformance(trades: Trade[]): Record<string, { wins: number; losses: number; pnl: number; count: number }> {
  const map: Record<string, { wins: number; losses: number; pnl: number; count: number }> = {};
  trades.filter(t => t.pnl != null && t.strategy).forEach(t => {
    if (!map[t.strategy]) map[t.strategy] = { wins: 0, losses: 0, pnl: 0, count: 0 };
    map[t.strategy].pnl += t.pnl!;
    map[t.strategy].count++;
    if (t.pnl! > 0) map[t.strategy].wins++;
    else if (t.pnl! < 0) map[t.strategy].losses++;
  });
  return map;
}

export function instrumentPerformance(trades: Trade[]): Record<string, { pnl: number; count: number }> {
  const map: Record<string, { pnl: number; count: number }> = {};
  trades.filter(t => t.pnl != null).forEach(t => {
    if (!map[t.instrument]) map[t.instrument] = { pnl: 0, count: 0 };
    map[t.instrument].pnl += t.pnl!;
    map[t.instrument].count++;
  });
  return map;
}
