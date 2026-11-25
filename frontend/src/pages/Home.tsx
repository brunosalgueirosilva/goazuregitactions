import type { ReactElement } from 'react'
import { useNavigate } from 'react-router'

export default function Home(): ReactElement {
  const navigate = useNavigate()

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-slate-100">
      <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center shadow-xl">
        <h1 className="text-2xl font-semibold">goazuregitactions</h1>
        <p className="mt-2 text-sm text-slate-400">Go + React on Azure Container Apps</p>
        <button
          type="button"
          onClick={() => void navigate('/dashboard')}
          className="mt-8 w-full rounded-lg bg-sky-500 px-4 py-2.5 font-medium text-slate-950 hover:bg-sky-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
        >
          Sign in
        </button>
        <p className="mt-3 text-xs text-slate-500">Fake sign-in: no account needed.</p>
      </div>
    </main>
  )
}
