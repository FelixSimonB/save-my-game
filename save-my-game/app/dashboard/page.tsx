'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import UploadBox from '@/components/UploadBox';
import AddGameModal from '@/components/AddGameModal';
import { Download } from "lucide-react";

type Game = {
  name: string;
  folderId: string;
  thumb?: string | null;
};

export default function Dashboard() {
  const [games, setGames] = useState<Game[]>([]);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [gameName, setGameName] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated' || !session?.accessToken) {
      signOut({ redirect: false });
      router.push('/');
      return;
    }

    const loadGames = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/game/list', { credentials: 'include' });
        const data = await res.json();
        if (data?.ok) {
          const mapped = data.games.map((g: any) => ({ name: g.name, folderId: g.id || g.folderId, thumb: g.thumb || g.thumbUrl || null }));
          setGames(mapped);
          localStorage.setItem('games', JSON.stringify(mapped));
        } else {
          const stored = localStorage.getItem('games');
          if (stored) setGames(JSON.parse(stored));

          console.log('Failed to load games', data?.error);

          signOut({ redirect: false });
          router.push('/');
          return;
        }
      } catch (error) {
        const stored = localStorage.getItem('games');
        if (stored) setGames(JSON.parse(stored));
      } finally {
        setIsLoading(false);
      }
    };

    loadGames();
  }, [router, session, status]);

  const addGame = async (name?: string, thumb?: string) => {
    const finalName = (name ?? gameName).trim();
    if (!finalName) return;
    setIsAdding(true);

    try {
      const res = await fetch('/api/game/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ gameName: finalName, thumb }),
      });
      const data = await res.json();
      const newGame: Game = { name: finalName, folderId: data.folderId || `local-${Date.now()}`, thumb };
      const updated = [...games.filter((game) => game.name !== newGame.name), newGame];
      setGames(updated);
      localStorage.setItem('games', JSON.stringify(updated));
      setGameName('');
      setSelectedGame(newGame);
    } catch (error) {
      console.error('Failed to add game', error);
    } finally {
      setIsAdding(false);
    }
  };

  const selectedCount = useMemo(() => games.length, [games.length]);

  const selectGame = async (game: Game) => {
    setSelectedGame(game);
    if (!game.thumb) {
      try {
        const res = await fetch(`/api/game/search?q=${encodeURIComponent(game.name)}`);
        const data = await res.json();
        const first = Array.isArray(data) && data[0];
        const thumb = first?.thumb ?? null;
        if (thumb) {
          await fetch('/api/game/update-thumb', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: game.name, folderId: game.folderId, thumb }),
          });
          const updated = games.map((g) => (g.folderId === game.folderId ? { ...g, thumb } : g));
          setGames(updated);
          localStorage.setItem('games', JSON.stringify(updated));
          setSelectedGame({ ...game, thumb });
        }
      } catch (err) {
        console.error('Failed to fetch/save thumbnail', err);
      }
    }
  };

  const handleDownload = async (folderId: string) => {
    setIsDownloading(true);

    try {
      const res = await fetch(`/api/game/download?folderId=${encodeURIComponent(folderId)}`);
      console.log('Download response', res);
      if (res.status == 200) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = `${selectedGame?.name || folderId}.zip`;
        a.click();
      } else {
        console.error(`Failed to download ${folderId}`);
      }
    } catch (err) {
      console.error(`Failed to download ${folderId}`, err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className='min-h-screen bg-slate-950 text-slate-100'>
      <div className='mx-auto max-w-[120rem] px-8 py-8 sm:px-6 lg:px-8'>
        <div className='rounded-[2rem] bg-slate-900/95 p-8 shadow-2xl shadow-slate-950/30 ring-1 ring-slate-800/60 backdrop-blur'>
          <div className='flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between'>
            <div>
              <p className='text-3xl font-bold uppercase tracking-[0.2em] text-cyan-300/80'>Save-My-Game</p>
              <p className='mt-4 text-base text-slate-400'>Add a game, select a save target, and drag save files into the upload panel to backup your game.</p>
            </div>

            <div className='flex flex-row gap-2'>
              <button
                type='button'
                onClick={() => router.push('/')}
                className='inline-flex items-center justify-center rounded-full bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50'
              >
                Home
              </button>

              <button
                className='inline-flex items-center justify-center rounded-3xl border border-slate-700 bg-slate-950/90 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:border-slate-600 hover:bg-slate-900'
                onClick={() => signOut()}
              >
                Sign out
              </button>
            </div>
          </div>

          <div className='mt-8 grid gap-4 lg:grid-cols-[1.3fr_auto]'>
            <div className='grid gap-4 sm:grid-cols-[1fr_auto]'>
              <div className='rounded-[1.75rem] border border-slate-800 bg-slate-950/70 p-6 shadow-inner shadow-slate-950/10'>
                <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
                  <div>
                    <p className='text-sm uppercase tracking-[0.35em] text-slate-500'>Create</p>
                    <h3 className='mt-2 text-xl font-semibold text-slate-100'>Add a new game</h3>
                    <p className='mt-1 text-sm text-slate-400'>Search the CheapShark database and add a game with its thumbnail.</p>
                  </div>

                  <div>
                    <button
                      type='button'
                      onClick={() => setShowAddModal(true)}
                      disabled={isAdding}
                      className='inline-flex items-center justify-center rounded-3xl bg-cyan-500 px-6 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50'
                    >
                      {isAdding ? (
                        <>
                          <span className='mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent' />
                          Adding...
                        </>
                      ) : (
                        'Add Game'
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className='rounded-[1.75rem] border border-slate-800 bg-slate-950/70 p-6 shadow-inner shadow-slate-950/10'>
                <p className='text-sm uppercase tracking-[0.35em] text-slate-500'>Game library</p>
                <p className='mt-3 text-3xl font-bold text-slate-50'>{selectedCount}</p>
                <p className='mt-2 text-sm text-slate-400'>Saved game folders available to upload into.</p>
              </div>
            </div>
          </div>
        </div>

        <div className='mt-8 grid gap-6 lg:grid-cols-[1.3fr_720px]'>
          <main className='space-y-4'>
            <div className='rounded-[2rem] border border-slate-800 bg-slate-900/90 p-6 shadow-xl shadow-slate-950/20'>
              <div className='mb-5 flex items-center justify-between'>
                <div>
                  <p className='text-sm uppercase tracking-[0.35em] text-cyan-300/80'>Game library</p>
                  <h2 className='mt-2 text-2xl font-semibold text-slate-100'>Select a folder</h2>
                </div>
                {isLoading ? (
                  <div className='rounded-full bg-slate-950/90 px-3 py-1 text-xs text-slate-400 inline-flex items-center gap-2'><span className='h-3 w-3 rounded-full animate-pulse bg-cyan-300' /> Syncing</div>
                ) : (
                  <div className='rounded-full bg-slate-950/90 px-3 py-1 text-xs text-slate-400'> {games.length} games</div>
                )}
              </div>

              <div className='grid gap-4'>
                {games.length === 0 && !isLoading ? (
                  <div className='rounded-[2rem] border border-dashed border-slate-700 bg-slate-950/40 p-6 text-center text-slate-500'>
                    No saved games yet. Add a game name to get started.
                  </div>
                ) : (
                  games.map((game) => {
                    const active = selectedGame?.folderId === game.folderId;
                    return (
                      <button
                        key={game.folderId}
                        type='button'
                        onClick={() => selectGame(game)}                        
                        disabled={isDownloading}
                        className={`group block w-full rounded-[2rem] border p-6 text-left transition shadow-sm ${
                          active
                            ? 'border-cyan-400 bg-cyan-500/10 shadow-cyan-500/10'
                            : 'border-slate-800 bg-slate-950/80 hover:border-slate-600 hover:bg-slate-900 hover:shadow-slate-900/40'
                        }`}
                      >
                        <div className='flex items-start gap-4'>
                          <div className={`flex h-[87px] w-[231px] shrink-0 items-center justify-center rounded-3xl overflow-hidden ${active ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-200'}`}>
                            {game.thumb ? (
                              // show thumbnail image when available
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={game.thumb} alt={game.name} className='h-[87px] w-[231px] object-cover' />
                            ) : (
                              <div className='text-2xl font-semibold'>
                                {game.name
                                  .split(' ')
                                  .slice(0, 2)
                                  .map((word) => word[0]?.toUpperCase() ?? '')
                                  .join('')}
                              </div>
                            )}
                          </div>

                          <div className='min-w-0 justify-center self-center'>
                            <p className='truncate text-xl font-semibold text-slate-100'>{game.name}</p>
                            <p className='mt-1 text-sm text-slate-600 italic'>{game.folderId}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </main>

          <aside className='space-y-4'>
            {selectedGame ? (
              <div className='rounded-[2rem] border border-slate-800 bg-slate-900/90 p-6 shadow-xl shadow-slate-950/20'>
                <div className='flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between'>
                  <div className='w-full max-w-2xl'>
                    <p className='text-xs uppercase tracking-[0.35em] text-cyan-300/80'>Game Drive</p>
                    <h2 className='mt-2 w-full text-3xl font-semibold text-slate-50 flex items-center gap-4'>

                      <button
                        onClick={() => handleDownload(selectedGame.folderId)}
                        disabled={isDownloading}
                        className={`p-2 rounded-md ${isDownloading ? '' : 'border border-slate-500 hover:bg-slate-600'} active:scale-95 transition`}
                        title="Download save files"
                      >
                        {isDownloading ? (
                          <div className="h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Download size={18} className="text-slate-100" />
                        )}
                      </button> {selectedGame.name}
                      
                      <div className='inline-flex items-center gap-3 rounded-full bg-slate-950/80 px-4 py-2 text-sm text-slate-300 shadow-inner ml-auto'>
                        <span className={`inline-flex h-3 w-3 flex-shrink-0 rounded-full ${isDownloading ? 'animate-pulse bg-cyan-300' : 'bg-emerald-400'}`} />
                        {isDownloading ? (
                          <span>Downloading</span>
                        ) : (
                          <span>{selectedGame.folderId.startsWith('local-') ? 'Local save' : 'Cloud folder'}</span>
                        )}
                      </div>
                    </h2>
                  </div>
                </div>

                <div className='mt-6'>
                  <UploadBox folderId={selectedGame.folderId} />
                </div>
              </div>
            ) : (
              <div className='rounded-[2rem] border border-slate-800 bg-slate-900/90 p-6 shadow-xl shadow-slate-950/20'>
                <p className='text-slate-400'>Select a game folder to begin uploading save files.</p>
              </div>
            )}
          </aside>
        </div>

        <AddGameModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onAdd={addGame} />
      </div>
    </div>
  );
}
