import { Trade, RuleTracker } from '../types';

const strategies = ['Breakout', 'Pullback', 'Mean Reversion', 'Trend Following', 'Scalping', 'VWAP'];
const instruments = ['NIFTY', 'BANKNIFTY', 'RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'EUR/USD', 'BTC/USD', 'ADANIENT', 'SBIN'];
const markets: Trade['market'][] = ['Nifty', 'BankNifty', 'Stock', 'Forex', 'Crypto'];
const emotions: Trade['emotion_before'][] = ['Calm', 'Confident', 'Anxious', 'Disciplined', 'FOMO', 'Excited'];
const emotionsAfter: Trade['emotion_after'][] = ['Calm', 'Confident', 'Fearful', 'Greedy', 'Disciplined', 'Impatient'];
const conditions = ['Trending Up', 'Trending Down', 'Range-bound', 'Volatile', 'Quiet'];

function rand(min: number, max: number) { return Math.round((Math.random() * (max - min) + min) * 100) / 100; }
function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

export function generateSampleTrades(): Trade[] {
  const trades: Trade[] = [];
  const today = new Date();

  for (let i = 0; i < 75; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    const tradesPerDay = Math.random() > 0.3 ? 1 : Math.random() > 0.5 ? 2 : 3;
    const market = pick(markets);

    for (let j = 0; j < tradesPerDay; j++) {
      const direction: Trade['direction'] = Math.random() > 0.5 ? 'Buy' : 'Sell';
      const entry = market === 'Crypto' ? rand(25000, 70000) : market === 'Forex' ? rand(1.05, 1.35) : market === 'Nifty' ? rand(22000, 24500) : market === 'BankNifty' ? rand(48000, 52000) : rand(500, 3500);
      const isWin = Math.random() > 0.42;
      const movePct = rand(0.2, 3) / 100;
      const exitPrice = direction === 'Buy'
        ? entry * (isWin ? (1 + movePct) : (1 - movePct * 0.6))
        : entry * (isWin ? (1 - movePct) : (1 + movePct * 0.6));
      const stopLoss = direction === 'Buy' ? entry * (1 - movePct * 0.8) : entry * (1 + movePct * 0.8);
      const target = direction === 'Buy' ? entry * (1 + movePct * 2.5) : entry * (1 - movePct * 2.5);
      const qty = market === 'Forex' ? rand(1000, 10000) : market === 'Crypto' ? rand(0.01, 0.5) : market === 'Nifty' || market === 'BankNifty' ? rand(25, 100) : rand(10, 200);

      trades.push({
        id: `sample-${i}-${j}`,
        trade_date: date.toISOString().split('T')[0],
        instrument: pick(instruments.filter(inst => {
          if (market === 'Nifty') return inst === 'NIFTY';
          if (market === 'BankNifty') return inst === 'BANKNIFTY';
          if (market === 'Forex') return inst === 'EUR/USD';
          if (market === 'Crypto') return inst === 'BTC/USD';
          return !['NIFTY', 'BANKNIFTY', 'EUR/USD', 'BTC/USD'].includes(inst);
        })),
        market,
        direction,
        strategy: pick(strategies),
        entry_price: entry,
        exit_price: Math.round(exitPrice * 100) / 100,
        quantity: qty,
        stop_loss: Math.round(stopLoss * 100) / 100,
        target: Math.round(target * 100) / 100,
        risk_amount: Math.round(Math.abs(entry - stopLoss) * qty * 100) / 100,
        reward_amount: Math.round(Math.abs(target - entry) * qty * 100) / 100,
        pnl: Math.round((exitPrice - entry) * qty * (direction === 'Buy' ? 1 : -1) * 100) / 100,
        risk_reward_ratio: Math.round(Math.abs(target - entry) / Math.abs(entry - stopLoss) * 100) / 100,
        market_condition: pick(conditions),
        screenshot_url: '',
        trade_notes: isWin ? 'Good trade, followed the plan.' : 'Should have waited for better entry.',
        emotion_before: pick(emotions),
        emotion_after: pick(emotionsAfter),
        tags: [pick(strategies).toLowerCase()],
        holding_time: `${Math.floor(rand(5, 240))} minutes`,
        created_at: date.toISOString(),
        updated_at: date.toISOString(),
      });
    }
  }
  return trades;
}

export function generateSampleRules(): RuleTracker[] {
  const rules: RuleTracker[] = [];
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    if (date.getDay() === 0 || date.getDay() === 6) continue;
    const discipline = Math.random();
    rules.push({
      id: `rule-${i}`,
      rule_date: date.toISOString().split('T')[0],
      no_overtrading: discipline > 0.2,
      min_risk_reward: discipline > 0.3,
      valid_setup: discipline > 0.15,
      exit_at_sl_target: discipline > 0.25,
      no_revenge_trading: discipline > 0.35,
      no_fomo: discipline > 0.3,
      follow_plan: discipline > 0.2,
      position_sizing: discipline > 0.4,
      created_at: date.toISOString(),
    });
  }
  return rules;
}
