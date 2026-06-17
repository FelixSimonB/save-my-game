'use client';

import { useEffect, useState } from 'react';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (name: string, thumb?: string) => Promise<void> | void;
};

type Suggestion = {
  gameID: number;
  external: string;
  thumb: string;
};

export default function AddGameModal({ isOpen, onClose, onAdd }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Suggestion | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
      setSelected(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const id = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/game/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        // map to expected fields
        const mapped = (data || []).map((g: any) => ({ gameID: g.gameID, external: g.external, thumb: g.thumb }));
        setResults(mapped.slice(0, 10));
      } catch (err) {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => clearTimeout(id);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className="relative mx-4 w-full max-w-2xl rounded-2xl bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-100">Add Game</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">Close</button>
        </div>

        <div className="mt-4">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search games..."
            className="w-full rounded-3xl border border-slate-800 bg-slate-950/90 px-4 py-3 text-slate-100 outline-none"
          />
        </div>

        <div className="mt-4 max-h-64 overflow-auto">
          {loading && <div className="text-sm text-slate-400 text-center">Searching...</div>}
          {!loading && results.length === 0 && query.trim() !== '' && (
            <div className="text-sm text-slate-400 text-center">No results</div>
          )}

          <ul className="mt-2 grid gap-2">
            {results.map((r) => (
              <li key={r.gameID}>
                <button
                  type="button"
                  onClick={() => setSelected(r)}
                  className={`group flex w-full items-center gap-3 rounded-xl p-2 text-left transition ${
                    selected?.external === r.external ? 'bg-cyan-500/10' : 'hover:bg-slate-800'
                  }`}
                >
                  <img src={r.thumb} alt={r.external} className="h-[87px] w-[231px] rounded-md object-cover" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-100">{r.external}</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => {
              onClose();
            }}
            className="rounded-3xl px-5 py-2 text-sm text-slate-300 hover:text-slate-100"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={async () => {
              const name = selected ? selected.external : query.trim();
              if (!name) return;
              await onAdd(name, selected?.thumb);
              onClose();
            }}
            className="rounded-3xl bg-cyan-500 px-5 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400"
          >
            Add Game
          </button>
        </div>
      </div>
    </div>
  );
}
