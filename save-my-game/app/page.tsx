"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isLoading = status === 'loading';

  return (
    <div className='min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4 py-8'>
      <div className='w-full max-w-5xl rounded-[2rem] bg-slate-900/95 p-10 shadow-2xl shadow-slate-950/30 ring-1 ring-slate-800/60 backdrop-blur'>
        <div className='grid gap-10 lg:grid-cols-[1fr_340px] lg:items-center'>
          <div className='space-y-6'>
            <div>
              <p className='text-sm uppercase tracking-[0.35em] text-cyan-300/80'>Save My Game</p>
              <h1 className='mt-4 text-5xl font-semibold text-slate-50'>Sign in securely and manage your game saves</h1>
              <p className='mt-5 max-w-2xl text-base leading-8 text-slate-400'>Use your Google account to access the dashboard, create save folders, and upload files with streamlined progress feedback.</p>
            </div>

            {session ? (
              <div className='space-y-4 rounded-[1.75rem] border border-slate-800 bg-slate-950/80 p-6 shadow-inner shadow-slate-950/10'>
                <p className='text-sm uppercase tracking-[0.35em] text-slate-500'>Logged in as</p>
                <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                  <div>
                    <p className='text-xl font-semibold text-slate-100'>{session.user?.name}</p>
                    <p className='text-sm text-slate-500'>{session.user?.email}</p>
                  </div>
                  <div className='rounded-3xl bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300'>Google account</div>
                </div>
                <div className='flex flex-col gap-3 sm:flex-row'>
                  <button
                    className='inline-flex items-center justify-center rounded-3xl bg-cyan-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400'
                    onClick={() => router.push('/dashboard')}
                  >
                    Go to Dashboard
                  </button>
                  <button
                    className='inline-flex items-center justify-center rounded-3xl border border-slate-700 bg-slate-950/90 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:border-slate-600 hover:bg-slate-900'
                    onClick={() => signOut()}
                  >
                    Sign out
                  </button>
                </div>
              </div>
            ) : (
              <div className='rounded-[1.75rem] border border-slate-800 bg-slate-950/80 p-8 text-center shadow-inner shadow-slate-950/10'>
                <p className='text-sm uppercase tracking-[0.35em] text-slate-500'>Get started</p>
                <h2 className='mt-4 text-3xl font-semibold text-slate-100'>Sign in with Google</h2>
                <p className='mt-3 text-sm text-slate-400'>Access the dashboard and manage your save files with live uploads and progress tracking.</p>
                <button
                  className='mt-8 inline-flex w-full items-center justify-center gap-3 rounded-3xl bg-cyan-500 px-6 py-4 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50'
                  onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className='inline-flex items-center gap-2'>
                      <span className='h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent' />
                      Signing in...
                    </span>
                  ) : (
                    <>Sign in with Google</>
                  )}
                </button>
              </div>
            )}
          </div>

          <div className='rounded-[2rem] border border-slate-800 bg-slate-950/80 p-7 shadow-xl shadow-slate-950/20'>
            <div className='space-y-5'>
              <div className='rounded-[1.75rem] bg-slate-900/90 p-6'>
                <p className='text-sm uppercase tracking-[0.35em] text-slate-500'>Why sign in?</p>
                <ul className='mt-4 space-y-3 text-sm text-slate-400'>
                  <li className='flex items-start gap-3'>
                    <span className='mt-1 h-2.5 w-2.5 rounded-full bg-cyan-400' />
                    Secure Google authentication.
                  </li>
                  <li className='flex items-start gap-3'>
                    <span className='mt-1 h-2.5 w-2.5 rounded-full bg-cyan-400' />
                    Sync game folders and save files.
                  </li>
                  <li className='flex items-start gap-3'>
                    <span className='mt-1 h-2.5 w-2.5 rounded-full bg-cyan-400' />
                    Track uploads with progress feedback.
                  </li>
                </ul>
              </div>
              <div className='rounded-[1.75rem] border border-slate-800 bg-slate-900/90 p-6'>
                <p className='text-sm uppercase tracking-[0.35em] text-slate-500'>Ready when you are</p>
                <p className='mt-3 text-slate-400'>Your dashboard experience is just one click away, powered by Google sign-in.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
