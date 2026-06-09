import { useState, useEffect } from 'react';
import { User, Save, Upload, Download } from 'lucide-react';
import { Profile } from '../types';

interface Props {
  profile: Profile | null;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  trades: any[];
  rules: any[];
}

export default function UserProfile({ profile, updateProfile, trades, rules }: Props) {
  const [form, setForm] = useState({
    starting_capital: 100000,
    current_capital: 100000,
    risk_per_trade: 2,
    trading_style: 'Day Trading',
    trading_goals: '',
  });

  useEffect(() => {
    if (profile) {
      setForm({
        starting_capital: profile.starting_capital,
        current_capital: profile.current_capital,
        risk_per_trade: profile.risk_per_trade,
        trading_style: profile.trading_style,
        trading_goals: profile.trading_goals,
      });
    }
  }, [profile]);

  const handleSave = async () => {
    await updateProfile(form);
  };

  const handleBackup = () => {
    const data = {
      profile: form,
      trades,
      rules,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tradejournal-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRestore = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result as string);
          if (data.trades) localStorage.setItem('tj-trades', JSON.stringify(data.trades));
          if (data.rules) localStorage.setItem('tj-rules', JSON.stringify(data.rules));
          if (data.profile) localStorage.setItem('tj-profile', JSON.stringify(data.profile));
          alert('Data restored successfully. Please refresh the page.');
        } catch {
          alert('Invalid backup file.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <div className="max-w-2xl space-y-6">
      {/* Profile form */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-center gap-2 mb-5">
          <User className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold">Trading Profile</h3>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Starting Capital</label>
            <input type="number" value={form.starting_capital} onChange={e => setForm(f => ({ ...f, starting_capital: +e.target.value }))} className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-mono" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Current Capital</label>
            <input type="number" value={form.current_capital} onChange={e => setForm(f => ({ ...f, current_capital: +e.target.value }))} className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-mono" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Risk Per Trade (%)</label>
            <input type="number" step="0.5" value={form.risk_per_trade} onChange={e => setForm(f => ({ ...f, risk_per_trade: +e.target.value }))} className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-mono" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Trading Style</label>
            <select value={form.trading_style} onChange={e => setForm(f => ({ ...f, trading_style: e.target.value }))} className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm">
              <option>Day Trading</option>
              <option>Swing Trading</option>
              <option>Position Trading</option>
              <option>Scalping</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-500 mb-1">Trading Goals</label>
            <textarea value={form.trading_goals} onChange={e => setForm(f => ({ ...f, trading_goals: e.target.value }))} rows={3} placeholder="What are you working towards?" className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm resize-none" />
          </div>
        </div>

        <button onClick={handleSave} className="flex items-center gap-2 mt-5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors">
          <Save className="w-4 h-4" /> Save Profile
        </button>
      </div>

      {/* Backup & Restore */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="font-semibold mb-4">Backup & Restore</h3>
        <p className="text-sm text-gray-500 mb-4">Export your journal data as a JSON backup, or restore from a previous backup file.</p>
        <div className="flex gap-3">
          <button onClick={handleBackup} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
            <Download className="w-4 h-4" /> Backup Data
          </button>
          <button onClick={handleRestore} className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors">
            <Upload className="w-4 h-4" /> Restore Data
          </button>
        </div>
      </div>
    </div>
  );
}
