/**
 * Service de identificação de plantas com 2 providers:
 *  - PlantNet:  https://my.plantnet.org/  (científico, score real, 500 req/dia free)
 *  - Gemini:    https://ai.google.dev/    (Vision multimodal, mais flexível)
 *
 * Cada provider retorna um array normalizado de hipóteses (top-N) com confidence 0-1.
 * Se o usuário não tem chave configurada, usamos um mock determinístico baseado no hash
 * da imagem (assim a foto X sempre devolve a "mesma planta", e não sempre Monstera).
 */

import { SPECIES_CATALOG, type Species } from './species'

export type IdentifyProvider = 'plantnet' | 'gemini'

export interface IdentifyHypothesis {
  speciesId: string | null  // null se não encontrou match no nosso catálogo
  popularName: string
  scientificName: string
  confidence: number        // 0-1
}

export interface IdentifyResult {
  provider: IdentifyProvider
  topMatch: IdentifyHypothesis
  alternatives: IdentifyHypothesis[]
  /** Espécie no nosso catálogo (se houver match). */
  matchedSpecies: Species | null
}

/* ──────────────────────────────────────────────────────────── */

const PLANTNET_KEY = import.meta.env.VITE_PLANTNET_API_KEY as string | undefined
const GEMINI_KEY   = import.meta.env.VITE_GEMINI_API_KEY as string | undefined

// Log diagnóstico só uma vez no boot
if (typeof window !== 'undefined') {
  console.log('[identify] config', {
    plantnet: PLANTNET_KEY ? `set (${PLANTNET_KEY.slice(0, 6)}…)` : 'MISSING',
    gemini:   GEMINI_KEY   ? `set (${GEMINI_KEY.slice(0, 6)}…)`   : 'MISSING',
  })
}

/* ─── Entry point principal ─────────────────────────────────── */
export async function identify(
  imageDataUrl: string,
  provider: IdentifyProvider = 'plantnet'
): Promise<IdentifyResult> {
  if (provider === 'plantnet') {
    return PLANTNET_KEY ? identifyWithPlantNet(imageDataUrl) : mockIdentify(imageDataUrl, 'plantnet')
  }
  return GEMINI_KEY ? identifyWithGemini(imageDataUrl) : mockIdentify(imageDataUrl, 'gemini')
}

/* ─── PlantNet (real) ───────────────────────────────────────── */
async function identifyWithPlantNet(imageDataUrl: string): Promise<IdentifyResult> {
  const blob = await dataUrlToBlob(imageDataUrl)
  const form = new FormData()
  // 'organs' precisa ser leaf|flower|fruit|bark|habit (não aceita 'auto' no project 'all')
  form.append('organs', 'leaf')
  form.append('images', blob, 'plant.jpg')

  const url = `https://my-api.plantnet.org/v2/identify/all?api-key=${PLANTNET_KEY}&include-related-images=false&lang=pt`
  console.log('[identify] calling PlantNet…', { url, blobSize: blob.size, blobType: blob.type })
  const res = await fetch(url, { method: 'POST', body: form })
  if (!res.ok) {
    const body = await res.text()
    console.error('[identify] PlantNet error', res.status, body)
    throw new Error(`PlantNet ${res.status}: ${body.slice(0, 200)}`)
  }
  const json = await res.json() as PlantNetResponse
  console.log('[identify] PlantNet OK', { results: json.results?.length })

  const hypotheses: IdentifyHypothesis[] = json.results.slice(0, 5).map((r) => {
    const sci = r.species.scientificNameWithoutAuthor
    const popular = r.species.commonNames?.[0] ?? sci
    return {
      speciesId: matchToCatalog(sci, popular)?.id ?? null,
      popularName: popular,
      scientificName: sci,
      confidence: r.score,
    }
  })

  const top = hypotheses[0]
  return {
    provider: 'plantnet',
    topMatch: top,
    alternatives: hypotheses.slice(1),
    matchedSpecies: top?.speciesId ? SPECIES_CATALOG.find((s) => s.id === top.speciesId) ?? null : null,
  }
}

/* ─── Gemini Vision (real) ──────────────────────────────────── */
async function identifyWithGemini(imageDataUrl: string): Promise<IdentifyResult> {
  const base64 = imageDataUrl.split(',')[1]
  const prompt =
    'Você é um botânico. Identifique a planta na imagem. ' +
    'Retorne APENAS um JSON válido, sem markdown, sem prosa, no formato: ' +
    '{"hypotheses":[{"popular":"nome comum em português","scientific":"Nome Científico","confidence":0.0-1.0}, ...]}. ' +
    'Liste de 1 a 3 hipóteses, ordenadas por confiança.'

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: prompt },
          { inline_data: { mime_type: 'image/jpeg', data: base64 } },
        ],
      }],
      generationConfig: { responseMimeType: 'application/json' },
    }),
  })
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`)
  const json = await res.json() as GeminiResponse
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}'
  const parsed = JSON.parse(text) as { hypotheses?: { popular: string; scientific: string; confidence: number }[] }

  const hypotheses: IdentifyHypothesis[] = (parsed.hypotheses ?? []).slice(0, 5).map((h) => ({
    speciesId: matchToCatalog(h.scientific, h.popular)?.id ?? null,
    popularName: h.popular,
    scientificName: h.scientific,
    confidence: h.confidence,
  }))

  const top = hypotheses[0] ?? {
    speciesId: null, popularName: 'Não identificada', scientificName: '?', confidence: 0,
  }
  return {
    provider: 'gemini',
    topMatch: top,
    alternatives: hypotheses.slice(1),
    matchedSpecies: top.speciesId ? SPECIES_CATALOG.find((s) => s.id === top.speciesId) ?? null : null,
  }
}

/* ─── Mock determinístico (sem chave configurada) ───────────── */
async function mockIdentify(imageDataUrl: string, provider: IdentifyProvider): Promise<IdentifyResult> {
  // Hash simples da imagem pra escolher espécie "aleatória mas determinística"
  await new Promise((r) => setTimeout(r, 1200 + Math.random() * 800))
  const hash = simpleHash(imageDataUrl)
  const pool = SPECIES_CATALOG.filter((s) => s.description) // só com descrição
  const top = pool[hash % pool.length]
  const alt1 = pool[(hash + 7) % pool.length]
  const alt2 = pool[(hash + 13) % pool.length]
  return {
    provider,
    topMatch: hyp(top, 0.82 + ((hash % 13) / 100)),
    alternatives: [hyp(alt1, 0.08), hyp(alt2, 0.04)],
    matchedSpecies: top,
  }
}

function hyp(s: Species, confidence: number): IdentifyHypothesis {
  return {
    speciesId: s.id,
    popularName: s.popularName,
    scientificName: s.scientificName,
    confidence,
  }
}

function simpleHash(s: string): number {
  let h = 0
  for (let i = 0; i < Math.min(s.length, 5000); i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

/* ─── Matching: API → nosso catálogo ────────────────────────── */
function matchToCatalog(scientific: string, popular?: string): Species | null {
  const sciLower = scientific.toLowerCase()
  // 1. Match exato pelo nome científico
  const exact = SPECIES_CATALOG.find((s) => s.scientificName.toLowerCase() === sciLower)
  if (exact) return exact
  // 2. Match pelo gênero (primeira palavra)
  const genus = sciLower.split(' ')[0]
  const byGenus = SPECIES_CATALOG.find((s) => s.scientificName.toLowerCase().startsWith(genus))
  if (byGenus) return byGenus
  // 3. Match pelo nome popular (heurística)
  if (popular) {
    const popLower = popular.toLowerCase()
    const byPopular = SPECIES_CATALOG.find((s) => s.popularName.toLowerCase().includes(popLower) || popLower.includes(s.popularName.toLowerCase()))
    if (byPopular) return byPopular
  }
  return null
}

/* ─── Helpers ──────────────────────────────────────────────── */
async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl)
  return res.blob()
}

/* ─── Types das APIs ───────────────────────────────────────── */
interface PlantNetResponse {
  results: {
    score: number
    species: {
      scientificNameWithoutAuthor: string
      commonNames?: string[]
      family?: { scientificNameWithoutAuthor: string }
      genus?: { scientificNameWithoutAuthor: string }
    }
  }[]
}

interface GeminiResponse {
  candidates?: {
    content?: {
      parts?: { text?: string }[]
    }
  }[]
}

export function hasProvider(p: IdentifyProvider): boolean {
  return p === 'plantnet' ? !!PLANTNET_KEY : !!GEMINI_KEY
}
