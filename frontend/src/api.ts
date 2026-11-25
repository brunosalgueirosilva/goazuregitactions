export interface ApiResult {
  status: number
  ok: boolean
  body: unknown
}

// Calls the Go API and returns the status with the body, parsed as JSON when possible.
export async function callApi(path: string): Promise<ApiResult> {
  const res = await fetch(path, { headers: { Accept: 'application/json' } })
  const text = await res.text()
  let body: unknown = text
  try {
    body = JSON.parse(text)
  } catch {
    // Not JSON (e.g. the plain-text 404 page): keep the raw text.
  }
  return { status: res.status, ok: res.ok, body }
}
