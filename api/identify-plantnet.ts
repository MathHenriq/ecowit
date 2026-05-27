/**
 * Vercel Edge Function — proxy pro PlantNet API.
 * Edge runtime = cold start mais rápido + timeout maior (25s no Hobby plan).
 */

export const config = { runtime: 'edge' }

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const key = process.env.VITE_PLANTNET_API_KEY ?? process.env.PLANTNET_API_KEY
  if (!key) return json({ error: 'Server missing PLANTNET_API_KEY env var' }, 500)

  let body: { image?: string; organs?: string }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }

  if (!body.image || !body.image.startsWith('data:image/')) {
    return json({ error: 'Missing or invalid image (expected data URL)' }, 400)
  }

  const m = body.image.match(/^data:(image\/[^;]+);base64,(.+)$/)
  if (!m) return json({ error: 'Invalid data URL' }, 400)
  const mimeType = m[1]
  const base64 = m[2]

  // Edge runtime: decode base64 com atob + Uint8Array (sem Buffer)
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  const blob = new Blob([bytes], { type: mimeType })

  const organ = body.organs ?? 'leaf'
  const form = new FormData()
  form.append('organs', organ)
  form.append('images', blob, 'plant.jpg')

  const url = `https://my-api.plantnet.org/v2/identify/all?api-key=${key}&include-related-images=false&lang=pt`

  // Timeout interno de 20s
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 20_000)

  try {
    const upstream = await fetch(url, { method: 'POST', body: form, signal: controller.signal })
    const text = await upstream.text()
    return new Response(text, {
      status: upstream.status,
      headers: {
        'content-type': upstream.headers.get('content-type') ?? 'application/json',
        'cache-control': 'no-store',
      },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown upstream error'
    return json({ error: `PlantNet upstream failed: ${msg}` }, 502)
  } finally {
    clearTimeout(timeoutId)
  }
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  })
}
