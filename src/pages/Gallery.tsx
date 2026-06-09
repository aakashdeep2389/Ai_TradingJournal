import { useState, useRef, useMemo } from 'react';
import { ImagePlus, Trash2, Search } from 'lucide-react';
import { Screenshot } from '../types';

interface Props {
  screenshots: Screenshot[];
  addScreenshot: (s: Omit<Screenshot, 'id' | 'created_at'>) => void;
  deleteScreenshot: (id: string) => void;
}

export default function Gallery({ screenshots, addScreenshot, deleteScreenshot }: Props) {
  const [filterLabel, setFilterLabel] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [label, setLabel] = useState('');
  const [preview, setPreview] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    if (!filterLabel) return screenshots;
    return screenshots.filter(s => s.label.toLowerCase().includes(filterLabel.toLowerCase()));
  }, [screenshots, filterLabel]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = () => {
    if (!preview) return;
    addScreenshot({ trade_id: null, label, image_data: preview });
    setPreview('');
    setLabel('');
    setShowUpload(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={() => setShowUpload(true)} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors">
          <ImagePlus className="w-4 h-4" /> Upload Screenshot
        </button>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={filterLabel} onChange={e => setFilterLabel(e.target.value)} placeholder="Filter by label..." className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none" />
        </div>
        <span className="text-sm text-gray-500">{filtered.length} screenshots</span>
      </div>

      {showUpload && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <h3 className="font-semibold text-sm mb-3">Upload Chart Screenshot</h3>
          <div className="space-y-3">
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="block text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-emerald-50 dark:file:bg-emerald-900/30 file:text-emerald-700 dark:file:text-emerald-400" />
            <input value={label} onChange={e => setLabel(e.target.value)} placeholder="Label (e.g. Breakout setup on NIFTY)" className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm" />
            {preview && (
              <div className="mt-2">
                <img src={preview} alt="Preview" className="max-h-48 rounded-lg border border-gray-200 dark:border-gray-700" />
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={handleUpload} disabled={!preview} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50">Save</button>
              <button onClick={() => { setShowUpload(false); setPreview(''); setLabel(''); }} className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-12 text-center text-gray-400">
          <ImagePlus className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No screenshots yet. Upload chart screenshots for your trades.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(s => (
            <div key={s.id} className="group relative bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
              <div className="aspect-video bg-gray-100 dark:bg-gray-800">
                {s.image_data ? (
                  <img src={s.image_data} alt={s.label} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <ImagePlus className="w-8 h-8" />
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="text-sm font-medium truncate">{s.label || 'Untitled'}</p>
                <p className="text-xs text-gray-400">{new Date(s.created_at).toLocaleDateString()}</p>
              </div>
              <button
                onClick={() => deleteScreenshot(s.id)}
                className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
