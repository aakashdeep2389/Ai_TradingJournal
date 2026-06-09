export interface Trade {
  id: string;
  trade_date: string;
  instrument: string;
  market: 'Nifty' | 'BankNifty' | 'Stock' | 'Forex' | 'Crypto';
  direction: 'Buy' | 'Sell';
  strategy: string;
  entry_price: number;
  exit_price: number | null;
  quantity: number;
  stop_loss: number | null;
  target: number | null;
  risk_amount: number | null;
  reward_amount: number | null;
  pnl: number | null;
  risk_reward_ratio: number | null;
  market_condition: string;
  screenshot_url: string;
  trade_notes: string;
  emotion_before: string;
  emotion_after: string;
  tags: string[];
  holding_time: string | null;
  created_at: string;
  updated_at: string;
}

export interface RuleTracker {
  id: string;
  rule_date: string;
  no_overtrading: boolean;
  min_risk_reward: boolean;
  valid_setup: boolean;
  exit_at_sl_target: boolean;
  no_revenge_trading: boolean;
  no_fomo: boolean;
  follow_plan: boolean;
  position_sizing: boolean;
  created_at: string;
}

export interface Profile {
  id: string;
  starting_capital: number;
  current_capital: number;
  risk_per_trade: number;
  trading_style: string;
  trading_goals: string;
  created_at: string;
  updated_at: string;
}

export interface Screenshot {
  id: string;
  trade_id: string | null;
  label: string;
  image_data: string;
  created_at: string;
}

export type MarketType = Trade['market'];
export type DirectionType = Trade['direction'];
export type EmotionType = 'Calm' | 'Confident' | 'Anxious' | 'Fearful' | 'Greedy' | 'FOMO' | 'Revenge' | 'Excited' | 'Disciplined' | 'Impatient';

export const RULES = [
  { key: 'no_overtrading', label: 'No Overtrading' },
  { key: 'min_risk_reward', label: 'Min 1:3 Risk Reward' },
  { key: 'valid_setup', label: 'Entry Only On Valid Setup' },
  { key: 'exit_at_sl_target', label: 'Exit Only At SL/Target' },
  { key: 'no_revenge_trading', label: 'No Revenge Trading' },
  { key: 'no_fomo', label: 'No FOMO Trades' },
  { key: 'follow_plan', label: 'Follow Trading Plan' },
  { key: 'position_sizing', label: 'Maintain Position Sizing' },
] as const;

export const MARKETS: MarketType[] = ['Nifty', 'BankNifty', 'Stock', 'Forex', 'Crypto'];
export const DIRECTIONS: DirectionType[] = ['Buy', 'Sell'];
export const EMOTIONS: EmotionType[] = ['Calm', 'Confident', 'Anxious', 'Fearful', 'Greedy', 'FOMO', 'Revenge', 'Excited', 'Disciplined', 'Impatient'];
