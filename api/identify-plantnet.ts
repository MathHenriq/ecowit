/**
 * Vercel Serverless Function — proxy pro PlantNet API.
 * Necessário porque o PlantNet rejeita CORS de domínios não-cadastrados.
 *
 * Recebe: POST com body JSON { image: "data:image/jpeg;base64,..." }
 * Devolve: resposta original do PlantNet
 *
 * Configuração: definir VITE_PLANTNET_API_KEY (ou PLANTNET_API_KEY) no painel da Vercel.
 */

export const config = { runtime: 'nodejs' }

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  const key = process.env.VITE_PLANTNET_API_KEY ?? process.env.PLANTNET_API_KEY
  if (!key) {
    return json({ error: 'Server missing PLANTNET_API_KEY env var' }, 500)
  }

  let body: { image?: string; organs?: string }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }

  if (!body.image || !body.image.startsWith('data:image/')) {
    return json({ error: 'Missing or invalid image (expected data URL)' }, 400)
  }

  // Decodifica o data URL pra Blob
  const m = body.image.match(/^data:(image\/[^;]+);base64,(.+)$/)
  if (!m) return json({ error: 'Invalid data URL' }, 400)
  const mimeType = m[1]
  const base64 = m[2]
  const buffer = Buffer.from(base64, 'base64')
  const blob = new Blob([buffer], { type: mimeType })

  // Monta multipart pro PlantNet
  const organ = body.organs ?? 'leaf'
  const form = new FormData()
  form.append('organs', organ)
  form.append('images', blob, 'plant.jpg')

  const url = `https://my-api.plantnet.org/v2/identify/all?api-key=${key}&include-related-images=false&lang=pt`
  const upstream = await fetch(url, { method: 'POST', body: form })
  const text = await upstream.text()

  return new Response(text, {
    status: upstream.status,
    headers: {
      'content-type': upstream.headers.get('content-type') ?? 'application/json',
      'cache-control': 'no-store',
    },
  })
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}
