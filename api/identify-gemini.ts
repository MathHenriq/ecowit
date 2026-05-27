/**
 * Vercel Edge Function — proxy pra Gemini Vision API.
 */

export const config = { runtime: 'edge' }

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const key = process.env.VITE_GEMINI_API_KEY ?? process.env.GEMINI_API_KEY
  if (!key) return json({ error: 'Server missing GEMINI_API_KEY env var' }, 500)

  let body: { image?: string }
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

  const prompt =
    'Você é um botânico. Identifique a planta na imagem. ' +
    'Retorne APENAS um JSON válido (sem markdown, sem prosa) no formato: ' +
    '{"hypotheses":[{"popular":"nome comum em português","scientific":"Nome Científico","confidence":0.0-1.0}]}. ' +
    'Liste de 1 a 3 hipóteses ordenadas por confiança.'

  // Modelo flash mais estável + amplamente disponível
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 20_000)

  try {
    const upstream = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inline_data: { mime_type: mimeType, data: base64 } },
          ],
        }],
        generationConfig: { responseMimeType: 'application/json' },
      }),
      signal: controller.signal,
    })
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
    return json({ error: `Gemini upstream failed: ${msg}` }, 502)
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
