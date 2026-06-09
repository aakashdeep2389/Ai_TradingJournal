import { useState, useMemo } from 'react';
import { Plus, Search, Trash2, Edit3, ChevronDown, ChevronUp, X } from 'lucide-react';
import Modal from '../components/Modal';
import { Trade, MARKETS, DIRECTIONS, EMOTIONS } from '../types';

interface Props {
  trades: Trade[];
  addTrade: (trade: Omit<Trade, 'id' | 'pnl' | 'risk_reward_ratio' | 'created_at' | 'updated_at'>) => Promise<Trade>;
  updateTrade: (id: string, updates: Partial<Trade>) => Promise<void>;
  deleteTrade: (id: string) => Promise<void>;
}

const emptyTrade = {
  trade_date: new Date().toISOString().split('T')[0],
  instrument: '',
  market: 'Stock' as Trade['market'],
  direction: 'Buy' as Trade['direction'],
  strategy: '',
  entry_price: 0,
  exit_price: null as number | null,
  quantity: 1,
  stop_loss: null as number | null,
  target: null as number | null,
  risk_amount: null as number | null,
  reward_amount: null as number | null,
  market_condition: '',
  screenshot_url: '',
  trade_notes: '',
  emotion_before: '',
  emotion_after: '',
  tags: [] as string[],
  holding_time: null as string | null,
};

export default function TradeJournal({ trades, addTrade, updateTrade, deleteTrade }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyTrade });
  const [search, setSearch] = useState('');
  const [filterMarket, setFilterMarket] = useState('');
  const [filterDirection, setFilterDirection] = useState('');
  const [filterResult, setFilterResult] = useState<'all' | 'win' | 'loss'>('all');
  const [sortField, setSortField] = useState<'trade_date' | 'pnl' | 'instrument'>('trade_date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [tagInput, setTagInput] = useState('');

  const filtered = useMemo(() => {
    let result = [...trades];
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(t =>
        t.instrument.toLowerCase().includes(s) ||
        t.strategy.toLowerCase().includes(s) ||
        t.trade_notes.toLowerCase().includes(s)
      );
    }
    if (filterMarket) result = result.filter(t => t.market === filterMarket);
    if (filterDirection) result = result.filter(t => t.direction === filterDirection);
    if (filterResult === 'win') result = result.filter(t => t.pnl != null && t.pnl > 0);
    if (filterResult === 'loss') result = result.filter(t => t.pnl != null && t.pnl < 0);

    result.sort((a, b) => {
      const aVal = sortField === 'pnl' ? a.pnl ?? 0 : a[sortField];
      const bVal = sortField === 'pnl' ? b.pnl ?? 0 : b[sortField];
      const cmp = typeof aVal === 'string' ? aVal.localeCompare(bVal as string) : (aVal as number) - (bVal as number);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [trades, search, filterMarket, filterDirection, filterResult, sortField, sortDir]);

  const openNew = () => { setForm({ ...emptyTrade }); setEditingId(null); setShowForm(true); };
  const openEdit = (trade: Trade) => {
    setForm({
      trade_date: trade.trade_date,
      instrument: trade.instrument,
      market: trade.market,
      direction: trade.direction,
      strategy: trade.strategy,
      entry_price: trade.entry_price,
      exit_price: trade.exit_price,
      quantity: trade.quantity,
      stop_loss: trade.stop_loss,
      target: trade.target,
      risk_amount: trade.risk_amount,
      reward_amount: trade.reward_amount,
      market_condition: trade.market_condition,
      screenshot_url: trade.screenshot_url,
      trade_notes: trade.trade_notes,
      emotion_before: trade.emotion_before,
      emotion_after: trade.emotion_after,
      tags: trade.tags,
      holding_time: trade.holding_time,
    });
    setEditingId(trade.id);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (editingId) {
      await updateTrade(editingId, form);
    } else {
      await addTrade(form);
    }
    setShowForm(false);
    setEditingId(null);
  };

  const addTag = () => {
    if (tagInput.trim() && !form.tags.includes(tagInput.trim())) {
      setForm(f => ({ ...f, tags: [...f.tags, tagInput.trim()] }));
      setTagInput('');
    }
  };

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const SortIcon = ({ field }: { field: typeof sortField }) => (
    sortField === field ? (sortDir === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />) : null
  );

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> Add Trade
        </button>

        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search instrument, strategy, notes..."
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
          />
        </div>

        <select value={filterMarket} onChange={e => setFilterMarket(e.target.value)} className="px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm">
          <option value="">All Markets</option>
          {MARKETS.map(m => <option key={m} value={m}>{m}</option>)}
        </select>

        <select value={filterDirection} onChange={e => setFilterDirection(e.target.value)} className="px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm">
          <option value="">All Directions</option>
          {DIRECTIONS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>

        <select value={filterResult} onChange={e => setFilterResult(e.target.value as any)} className="px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm">
          <option value="all">All Results</option>
          <option value="win">Wins Only</option>
          <option value="loss">Losses Only</option>
        </select>

        <span className="text-sm text-gray-500">{filtered.length} trades</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-800">
              <th className="px-4 py-3 text-left font-medium text-gray-500 cursor-pointer" onClick={() => toggleSort('trade_date')}>Date <SortIcon field="trade_date" /></th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 cursor-pointer" onClick={() => toggleSort('instrument')}>Instrument <SortIcon field="instrument" /></th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Market</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Direction</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Strategy</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">Entry</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">Exit</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">Qty</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500 cursor-pointer" onClick={() => toggleSort('pnl')}>P&L <SortIcon field="pnl" /></th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">R:R</th>
              <th className="px-4 py-3 text-center font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(t => (
              <tr key={t.id} className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <td className="px-4 py-3 whitespace-nowrap">{t.trade_date}</td>
                <td className="px-4 py-3 font-medium">{t.instrument}</td>
                <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800">{t.market}</span></td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${t.direction === 'Buy' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
                    {t.direction}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{t.strategy || '—'}</td>
                <td className="px-4 py-3 text-right font-mono">{t.entry_price.toLocaleString()}</td>
                <td className="px-4 py-3 text-right font-mono">{t.exit_price?.toLocaleString() ?? '—'}</td>
                <td className="px-4 py-3 text-right">{t.quantity}</td>
                <td className={`px-4 py-3 text-right font-semibold font-mono ${t.pnl != null ? (t.pnl > 0 ? 'text-emerald-600 dark:text-emerald-400' : t.pnl < 0 ? 'text-red-600 dark:text-red-400' : '') : ''}`}>
                  {t.pnl != null ? `${t.pnl > 0 ? '+' : ''}${t.pnl.toLocaleString()}` : '—'}
                </td>
                <td className="px-4 py-3 text-right">{t.risk_reward_ratio ?? '—'}</td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button onClick={() => openEdit(t)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                      <Edit3 className="w-3.5 h-3.5 text-gray-500" />
                    </button>
                    <button onClick={() => { if (confirm('Delete this trade?')) deleteTrade(t.id); }} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={11} className="px-4 py-12 text-center text-gray-400">No trades found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Trade Form Modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title={editingId ? 'Edit Trade' : 'New Trade'} wide>
        <div className="grid md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-2">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Trade Date</label>
            <input type="date" value={form.trade_date} onChange={e => setForm(f => ({ ...f, trade_date: e.target.value }))} className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Instrument</label>
            <input value={form.instrument} onChange={e => setForm(f => ({ ...f, instrument: e.target.value }))} placeholder="e.g. NIFTY, RELIANCE" className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Market</label>
            <select value={form.market} onChange={e => setForm(f => ({ ...f, market: e.target.value as Trade['market'] }))} className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm">
              {MARKETS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Direction</label>
            <select value={form.direction} onChange={e => setForm(f => ({ ...f, direction: e.target.value as Trade['direction'] }))} className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm">
              {DIRECTIONS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Strategy</label>
            <input value={form.strategy} onChange={e => setForm(f => ({ ...f, strategy: e.target.value }))} placeholder="e.g. Breakout, Pullback" className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Entry Price</label>
            <input type="number" value={form.entry_price || ''} onChange={e => setForm(f => ({ ...f, entry_price: +e.target.value }))} className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-mono" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Exit Price</label>
            <input type="number" value={form.exit_price ?? ''} onChange={e => setForm(f => ({ ...f, exit_price: e.target.value ? +e.target.value : null }))} className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-mono" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Quantity</label>
            <input type="number" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: +e.target.value }))} className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-mono" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Stop Loss</label>
            <input type="number" value={form.stop_loss ?? ''} onChange={e => setForm(f => ({ ...f, stop_loss: e.target.value ? +e.target.value : null }))} className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-mono" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Target</label>
            <input type="number" value={form.target ?? ''} onChange={e => setForm(f => ({ ...f, target: e.target.value ? +e.target.value : null }))} className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-mono" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Risk Amount</label>
            <input type="number" value={form.risk_amount ?? ''} onChange={e => setForm(f => ({ ...f, risk_amount: e.target.value ? +e.target.value : null }))} className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-mono" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Reward Amount</label>
            <input type="number" value={form.reward_amount ?? ''} onChange={e => setForm(f => ({ ...f, reward_amount: e.target.value ? +e.target.value : null }))} className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-mono" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Market Condition</label>
            <input value={form.market_condition} onChange={e => setForm(f => ({ ...f, market_condition: e.target.value }))} placeholder="Trending, Range-bound..." className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Holding Time</label>
            <input value={form.holding_time ?? ''} onChange={e => setForm(f => ({ ...f, holding_time: e.target.value || null }))} placeholder="e.g. 45 minutes" className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Emotion Before</label>
            <select value={form.emotion_before} onChange={e => setForm(f => ({ ...f, emotion_before: e.target.value }))} className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm">
              <option value="">Select...</option>
              {EMOTIONS.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Emotion After</label>
            <select value={form.emotion_after} onChange={e => setForm(f => ({ ...f, emotion_after: e.target.value }))} className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm">
              <option value="">Select...</option>
              {EMOTIONS.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>

          {/* Tags */}
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-500 mb-1">Tags</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {form.tags.map(tag => (
                <span key={tag} className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs flex items-center gap-1">
                  {tag}
                  <button onClick={() => setForm(f => ({ ...f, tags: f.tags.filter(t => t !== tag) }))}><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }} placeholder="Add tag..." className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm" />
              <button onClick={addTag} className="px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-700">Add</button>
            </div>
          </div>

          {/* Notes */}
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-500 mb-1">Trade Notes</label>
            <textarea value={form.trade_notes} onChange={e => setForm(f => ({ ...f, trade_notes: e.target.value }))} rows={3} placeholder="What happened during this trade..." className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm resize-none" />
          </div>
        </div>

        {/* Auto-calculated preview */}
        {form.exit_price != null && form.entry_price > 0 && (
          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-xs font-medium text-gray-500 mb-1">Auto-calculated P&L Preview</p>
            <p className={`text-lg font-bold font-mono ${form.direction === 'Buy'
              ? (form.exit_price - form.entry_price) * form.quantity >= 0 ? 'text-emerald-600' : 'text-red-600'
              : (form.entry_price - form.exit_price) * form.quantity >= 0 ? 'text-emerald-600' : 'text-red-600'
            }`}>
              {form.direction === 'Buy'
                ? ((form.exit_price - form.entry_price) * form.quantity).toFixed(2)
                : ((form.entry_price - form.exit_price) * form.quantity).toFixed(2)
              } ₹
            </p>
            {form.stop_loss != null && form.target != null && (
              <p className="text-xs text-gray-500 mt-1">
                R:R = {form.direction === 'Buy'
                  ? (Math.abs(form.target - form.entry_price) / Math.abs(form.entry_price - form.stop_loss)).toFixed(2)
                  : (Math.abs(form.entry_price - form.target) / Math.abs(form.stop_loss - form.entry_price)).toFixed(2)
                }:1
              </p>
            )}
          </div>
        )}

        <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-gray-200 dark:border-gray-800">
          <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">Cancel</button>
          <button onClick={handleSubmit} className="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition-colors">
            {editingId ? 'Update Trade' : 'Add Trade'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
