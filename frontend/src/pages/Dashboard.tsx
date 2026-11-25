import { useState, type ReactElement } from 'react'
import { Link } from 'react-router'
import { callApi, type ApiResult } from '../api.ts'

type Output =
  | { kind: 'idle' }
  | { kind: 'loading'; path: string }
  | { kind: 'done'; path: string; result: ApiResult }
  | { kind: 'error'; path: string; message: string }

export default function Dashboard(): ReactElement {
  const [name, setName] = useState('')
  const [output, setOutput] = useState<Output>({ kind: 'idle' })

  async function run(path: string): Promise<void> {
    setOutput({ kind: 'loading', path })
    try {
      setOutput({ kind: 'done', path, result: await callApi(path) })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      setOutput({ kind: 'error', path, message })
    }
  }

  const helloPath = name.trim() ? `/api/hello?name=${encodeURIComponent(name.trim())}` : '/api/hello'
  const busy = output.kind === 'loading'
  const buttonClass =
    'rounded-lg bg-sky-500 px-4 py-2 font-medium text-slate-950 hover:bg-sky-400 disabled:opacity-50'

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-slate-100">
      <div className="mx-auto max-w-2xl">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <Link to="/" className="text-sm text-slate-400 hover:text-slate-200">
            Sign out
          </Link>
        </header>

        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex flex-wrap items-center gap-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name (optional)"
              className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm placeholder:text-slate-500"
            />
            <button type="button" disabled={busy} onClick={() => void run(helloPath)} className={buttonClass}>
              Call /api/hello
            </button>
            <button type="button" disabled={busy} onClick={() => void run('/api/time')} className={buttonClass}>
              Call /api/time
            </button>
          </div>

          <div className="mt-6">
            <OutputPanel output={output} />
          </div>
        </section>
      </div>
    </main>
  )
}

function OutputPanel({ output }: { output: Output }): ReactElement {
  if (output.kind === 'idle') {
    return <p className="text-sm text-slate-500">Click a button to call the Go API.</p>
  }
  if (output.kind === 'loading') {
    return <p className="text-sm text-slate-400">GET {output.path} …</p>
  }
  if (output.kind === 'error') {
    return (
      <p className="text-sm text-rose-400">
        GET {output.path} failed: {output.message}. Is the Go server running?
      </p>
    )
  }

  const { result } = output
  return (
    <div>
      <p className="text-sm">
        GET {output.path} →{' '}
        <span className={result.ok ? 'text-emerald-400' : 'text-rose-400'}>{result.status}</span>
      </p>
      <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-950 p-4 text-sm text-slate-200">
        {typeof result.body === 'string' ? result.body : JSON.stringify(result.body, null, 2)}
      </pre>
    </div>
  )
}
