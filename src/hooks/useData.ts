import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Trade, RuleTracker, Profile, Screenshot } from '../types';
import { generateSampleTrades, generateSampleRules } from '../utils/sampleData';

const STORAGE_KEY_TRADES = 'tj-trades';
const STORAGE_KEY_RULES = 'tj-rules';
const STORAGE_KEY_PROFILE = 'tj-profile';
const STORAGE_KEY_SCREENSHOTS = 'tj-screenshots';

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch { return fallback; }
}

function saveToStorage<T>(key: string, data: T) {
  localStorage.setItem(key, JSON.stringify(data));
}

// Try to load from Supabase, fallback to localStorage
async function loadTradesFromDB(): Promise<Trade[]> {
  try {
    const { data, error } = await supabase.from('trades').select('*').order('trade_date', { ascending: false });
    if (error || !data || data.length === 0) return loadFromStorage<Trade[]>(STORAGE_KEY_TRADES, generateSampleTrades());
    return data as Trade[];
  } catch {
    return loadFromStorage<Trade[]>(STORAGE_KEY_TRADES, generateSampleTrades());
  }
}

async function loadRulesFromDB(): Promise<RuleTracker[]> {
  try {
    const { data, error } = await supabase.from('rule_tracker').select('*').order('rule_date', { ascending: false });
    if (error || !data || data.length === 0) return loadFromStorage<RuleTracker[]>(STORAGE_KEY_RULES, generateSampleRules());
    return data as RuleTracker[];
  } catch {
    return loadFromStorage<RuleTracker[]>(STORAGE_KEY_RULES, generateSampleRules());
  }
}

async function loadProfileFromDB(): Promise<Profile | null> {
  try {
    const { data, error } = await supabase.from('profiles').select('*').limit(1).single();
    if (error || !data) return loadFromStorage<Profile | null>(STORAGE_KEY_PROFILE, null);
    return data as Profile;
  } catch {
    return loadFromStorage<Profile | null>(STORAGE_KEY_PROFILE, null);
  }
}

export function useTrades() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTradesFromDB().then(data => {
      setTrades(data);
      saveToStorage(STORAGE_KEY_TRADES, data);
      setLoading(false);
    });
  }, []);

  const addTrade = useCallback(async (trade: Omit<Trade, 'id' | 'pnl' | 'risk_reward_ratio' | 'created_at' | 'updated_at'>) => {
    const newTrade: Trade = {
      ...trade,
      id: crypto.randomUUID(),
      pnl: null,
      risk_reward_ratio: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as Trade;
    // Recalculate computed fields
    if (newTrade.exit_price != null) {
      newTrade.pnl = newTrade.direction === 'Buy'
        ? Math.round((newTrade.exit_price - newTrade.entry_price) * newTrade.quantity * 100) / 100
        : Math.round((newTrade.entry_price - newTrade.exit_price) * newTrade.quantity * 100) / 100;
    }
    if (newTrade.stop_loss != null && newTrade.target != null && newTrade.entry_price > 0) {
      const risk = Math.abs(newTrade.entry_price - newTrade.stop_loss);
      const reward = newTrade.direction === 'Buy'
        ? Math.abs(newTrade.target - newTrade.entry_price)
        : Math.abs(newTrade.entry_price - newTrade.target);
      newTrade.risk_reward_ratio = risk === 0 ? null : Math.round((reward / risk) * 100) / 100;
    }

    setTrades(prev => {
      const updated = [newTrade, ...prev];
      saveToStorage(STORAGE_KEY_TRADES, updated);
      return updated;
    });

    try {
      await supabase.from('trades').insert([{
        ...newTrade,
        pnl: undefined,
        risk_reward_ratio: undefined,
      }]);
    } catch { /* offline fallback */ }
    return newTrade;
  }, []);

  const updateTrade = useCallback(async (id: string, updates: Partial<Trade>) => {
    setTrades(prev => {
      const updated = prev.map(t => t.id === id ? { ...t, ...updates, updated_at: new Date().toISOString() } : t);
      saveToStorage(STORAGE_KEY_TRADES, updated);
      return updated;
    });

    try {
      const { pnl, risk_reward_ratio, ...dbUpdates } = updates as any;
      await supabase.from('trades').update({ ...dbUpdates, updated_at: new Date().toISOString() }).eq('id', id);
    } catch { /* offline fallback */ }
  }, []);

  const deleteTrade = useCallback(async (id: string) => {
    setTrades(prev => {
      const updated = prev.filter(t => t.id !== id);
      saveToStorage(STORAGE_KEY_TRADES, updated);
      return updated;
    });
    try { await supabase.from('trades').delete().eq('id', id); } catch { /* offline fallback */ }
  }, []);

  return { trades, loading, addTrade, updateTrade, deleteTrade, setTrades };
}

export function useRules() {
  const [rules, setRules] = useState<RuleTracker[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRulesFromDB().then(data => {
      setRules(data);
      saveToStorage(STORAGE_KEY_RULES, data);
      setLoading(false);
    });
  }, []);

  const upsertRule = useCallback(async (rule: Omit<RuleTracker, 'id' | 'created_at'>) => {
    setRules(prev => {
      const existing = prev.find(r => r.rule_date === rule.rule_date);
      let updated: RuleTracker[];
      if (existing) {
        updated = prev.map(r => r.rule_date === rule.rule_date ? { ...r, ...rule } : r);
      } else {
        updated = [{ ...rule, id: crypto.randomUUID(), created_at: new Date().toISOString() }, ...prev];
      }
      saveToStorage(STORAGE_KEY_RULES, updated);
      return updated;
    });

    try {
      await supabase.from('rule_tracker').upsert([rule], { onConflict: 'rule_date' });
    } catch { /* offline fallback */ }
  }, []);

  return { rules, loading, upsertRule };
}

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfileFromDB().then(data => {
      setProfile(data);
      if (data) saveToStorage(STORAGE_KEY_PROFILE, data);
      setLoading(false);
    });
  }, []);

  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    setProfile(prev => {
      const updated = prev
        ? { ...prev, ...updates, updated_at: new Date().toISOString() }
        : { id: crypto.randomUUID(), starting_capital: 100000, current_capital: 100000, risk_per_trade: 2, trading_style: 'Day Trading', trading_goals: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), ...updates };
      saveToStorage(STORAGE_KEY_PROFILE, updated);
      return updated;
    });

    try {
      if (profile?.id) {
        await supabase.from('profiles').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', profile.id);
      } else {
        await supabase.from('profiles').insert([updates]);
      }
    } catch { /* offline fallback */ }
  }, [profile]);

  return { profile, loading, updateProfile };
}

export function useScreenshots() {
  const [screenshots, setScreenshots] = useState<Screenshot[]>(() => loadFromStorage<Screenshot[]>(STORAGE_KEY_SCREENSHOTS, []));

  const addScreenshot = useCallback((s: Omit<Screenshot, 'id' | 'created_at'>) => {
    const newS: Screenshot = { ...s, id: crypto.randomUUID(), created_at: new Date().toISOString() };
    setScreenshots(prev => {
      const updated = [newS, ...prev];
      saveToStorage(STORAGE_KEY_SCREENSHOTS, updated);
      return updated;
    });
  }, []);

  const deleteScreenshot = useCallback((id: string) => {
    setScreenshots(prev => {
      const updated = prev.filter(s => s.id !== id);
      saveToStorage(STORAGE_KEY_SCREENSHOTS, updated);
      return updated;
    });
  }, []);

  return { screenshots, addScreenshot, deleteScreenshot };
}
