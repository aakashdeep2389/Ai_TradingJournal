
-- User Profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  starting_capital NUMERIC DEFAULT 100000,
  current_capital NUMERIC DEFAULT 100000,
  risk_per_trade NUMERIC DEFAULT 2,
  trading_style TEXT DEFAULT 'Day Trading',
  trading_goals TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Trades
CREATE TABLE trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_date DATE NOT NULL DEFAULT CURRENT_DATE,
  instrument TEXT NOT NULL,
  market TEXT NOT NULL DEFAULT 'Stock',
  direction TEXT NOT NULL DEFAULT 'Buy',
  strategy TEXT DEFAULT '',
  entry_price NUMERIC NOT NULL,
  exit_price NUMERIC,
  quantity NUMERIC NOT NULL DEFAULT 1,
  stop_loss NUMERIC,
  target NUMERIC,
  risk_amount NUMERIC,
  reward_amount NUMERIC,
  pnl NUMERIC GENERATED ALWAYS AS (
    CASE
      WHEN exit_price IS NOT NULL THEN
        CASE
          WHEN direction = 'Buy' THEN (exit_price - entry_price) * quantity
          ELSE (entry_price - exit_price) * quantity
        END
      ELSE NULL
    END
  ) STORED,
  risk_reward_ratio NUMERIC GENERATED ALWAYS AS (
    CASE
      WHEN stop_loss IS NOT NULL AND target IS NOT NULL AND entry_price IS NOT NULL THEN
        CASE
          WHEN direction = 'Buy' THEN
            ROUND(ABS(target - entry_price) / NULLIF(ABS(entry_price - stop_loss), 0), 2)
          ELSE
            ROUND(ABS(entry_price - target) / NULLIF(ABS(stop_loss - entry_price), 0), 2)
        END
      ELSE NULL
    END
  ) STORED,
  market_condition TEXT DEFAULT '',
  screenshot_url TEXT DEFAULT '',
  trade_notes TEXT DEFAULT '',
  emotion_before TEXT DEFAULT '',
  emotion_after TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  holding_time INTERVAL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Trading Rules Tracker
CREATE TABLE rule_tracker (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_date DATE NOT NULL,
  no_overtrading BOOLEAN DEFAULT false,
  min_risk_reward BOOLEAN DEFAULT false,
  valid_setup BOOLEAN DEFAULT false,
  exit_at_sl_target BOOLEAN DEFAULT false,
  no_revenge_trading BOOLEAN DEFAULT false,
  no_fomo BOOLEAN DEFAULT false,
  follow_plan BOOLEAN DEFAULT false,
  position_sizing BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(rule_date)
);

-- Screenshots metadata (actual files stored as base64 in localStorage)
CREATE TABLE screenshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id UUID REFERENCES trades(id) ON DELETE CASCADE,
  label TEXT DEFAULT '',
  image_data TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE rule_tracker ENABLE ROW LEVEL SECURITY;
ALTER TABLE screenshots ENABLE ROW LEVEL SECURITY;

-- Since this is a single-user app (no auth), use simple policies
-- In production, replace with auth.uid() checks
CREATE POLICY "select_profiles" ON profiles FOR SELECT TO anon USING (true);
CREATE POLICY "insert_profiles" ON profiles FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "update_profiles" ON profiles FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "select_trades" ON trades FOR SELECT TO anon USING (true);
CREATE POLICY "insert_trades" ON trades FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "update_trades" ON trades FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "delete_trades" ON trades FOR DELETE TO anon USING (true);

CREATE POLICY "select_rules" ON rule_tracker FOR SELECT TO anon USING (true);
CREATE POLICY "insert_rules" ON rule_tracker FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "update_rules" ON rule_tracker FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "delete_rules" ON rule_tracker FOR DELETE TO anon USING (true);

CREATE POLICY "select_screenshots" ON screenshots FOR SELECT TO anon USING (true);
CREATE POLICY "insert_screenshots" ON screenshots FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "delete_screenshots" ON screenshots FOR DELETE TO anon USING (true);
