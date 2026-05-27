/**
 * Service de identificação de plantas.
 *
 * Em PRODUÇÃO (Vercel) chamamos serverless functions que escondem as chaves
 * e contornam o CORS do PlantNet:
 *   - POST /api/identify-plantnet  { image: dataUrl }
 *   - POST /api/identify-gemini    { image: dataUrl }
 *
 * Em DEV LOCAL (Vite, sem `vercel dev`), as functions não existem.
 * Detectamos isso e caímos no MOCK determinístico (baseado no hash da imagem).
 */

import { SPECIES_CATALOG, type Species } from './species'

export type IdentifyProvider = 'plantnet' | 'gemini'

export interface IdentifyHypothesis {
  speciesId: string | null
  popularName: string
  scientificName: string
  confidence: number
}

export interface IdentifyResult {
  provider: IdentifyProvider
  topMatch: IdentifyHypothesis
  alternatives: IdentifyHypothesis[]
  matchedSpecies: Species | null
}

/* ─── Detecção de ambiente ─────────────────────────────────── */

// True se estamos em produção (Vercel) — testamos chamando o endpoint /api/health no boot.
// Pra simplificar: se hostname não for localhost, assumimos Vercel.
const IS_PROD = typeof window !== 'undefined'
  && !['localhost', '127.0.0.1', '0.0.0.0'].includes(window.location.hostname)

if (typeof window !== 'undefined') {
  console.log('[identify] env', { hostname: window.location.hostname, prod: IS_PROD })
}

/* ─── Entry point principal ─────────────────────────────────── */
export async function identify(
  imageDataUrl: string,
  provider: IdentifyProvider = 'plantnet'
): Promise<IdentifyResult> {
  if (!IS_PROD) {
    // Em dev local, sem proxy disponível: cai no mock determinístico
    console.log('[identify] DEV mode — using deterministic mock')
    return mockIdentify(imageDataUrl, provider)
  }

  return provider === 'plantnet'
    ? identifyViaProxy(imageDataUrl, '/api/identify-plantnet', 'plantnet')
    : identifyViaProxy(imageDataUrl, '/api/identify-gemini', 'gemini')
}

/* ─── Proxy via Vercel function ─────────────────────────────── */
async function identifyViaProxy(
  imageDataUrl: string,
  endpoint: string,
  provider: IdentifyProvider
): Promise<IdentifyResult> {
  console.log(`[identify] calling ${endpoint}…`)
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ image: imageDataUrl }),
  })

  if (!res.ok) {
    const body = await res.text()
    console.error(`[identify] ${endpoint} error`, res.status, body)
    throw new Error(`${provider} ${res.status}: ${body.slice(0, 200)}`)
  }

  const json = await res.json()
  console.log(`[identify] ${endpoint} OK`)

  return provider === 'plantnet'
    ? parsePlantNet(json)
    : parseGemini(json)
}

/* ─── Parsers das respostas ─────────────────────────────────── */
function parsePlantNet(json: PlantNetResponse): IdentifyResult {
  const hypotheses: IdentifyHypothesis[] = (json.results ?? []).slice(0, 5).map((r) => {
    const sci = r.species.scientificNameWithoutAuthor
    const popular = r.species.commonNames?.[0] ?? sci
    return {
      speciesId: matchToCatalog(sci, popular)?.id ?? null,
      popularName: popular,
      scientificName: sci,
      confidence: r.score,
    }
  })

  const top = hypotheses[0] ?? emptyHypothesis()
  return {
    provider: 'plantnet',
    topMatch: top,
    alternatives: hypotheses.slice(1),
    matchedSpecies: top.speciesId ? SPECIES_CATALOG.find((s) => s.id === top.speciesId) ?? null : null,
  }
}

function parseGemini(json: GeminiResponse): IdentifyResult {
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}'
  const parsed = JSON.parse(text) as { hypotheses?: { popular: string; scientific: string; confidence: number }[] }

  const hypotheses: IdentifyHypothesis[] = (parsed.hypotheses ?? []).slice(0, 5).map((h) => ({
    speciesId: matchToCatalog(h.scientific, h.popular)?.id ?? null,
    popularName: h.popular,
    scientificName: h.scientific,
    confidence: h.confidence,
  }))

  const top = hypotheses[0] ?? emptyHypothesis()
  return {
    provider: 'gemini',
    topMatch: top,
    alternatives: hypotheses.slice(1),
    matchedSpecies: top.speciesId ? SPECIES_CATALOG.find((s) => s.id === top.speciesId) ?? null : null,
  }
}

/* ─── Mock determinístico (dev local) ───────────────────────── */
async function mockIdentify(imageDataUrl: string, provider: IdentifyProvider): Promise<IdentifyResult> {
  await new Promise((r) => setTimeout(r, 1200 + Math.random() * 800))
  const hash = simpleHash(imageDataUrl)
  const pool = SPECIES_CATALOG.filter((s) => s.description)
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

function emptyHypothesis(): IdentifyHypothesis {
  return { speciesId: null, popularName: 'Não identificada', scientificName: '?', confidence: 0 }
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
  const exact = SPECIES_CATALOG.find((s) => s.scientificName.toLowerCase() === sciLower)
  if (exact) return exact
  const genus = sciLower.split(' ')[0]
  const byGenus = SPECIES_CATALOG.find((s) => s.scientificName.toLowerCase().startsWith(genus))
  if (byGenus) return byGenus
  if (popular) {
    const popLower = popular.toLowerCase()
    const byPopular = SPECIES_CATALOG.find(
      (s) => s.popularName.toLowerCase().includes(popLower) || popLower.includes(s.popularName.toLowerCase())
    )
    if (byPopular) return byPopular
  }
  return null
}

/* ─── Types ────────────────────────────────────────────────── */
interface PlantNetResponse {
  results: {
    score: number
    species: {
      scientificNameWithoutAuthor: string
      commonNames?: string[]
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
