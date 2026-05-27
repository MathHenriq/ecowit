/**
 * Endpoint de teste pra verificar se as serverless functions estão deployando.
 * Acessa em: https://<seu-app>.vercel.app/api/health
 */

export const config = { runtime: 'edge' }

export default async function handler(_req: Request): Promise<Response> {
  return new Response(
    JSON.stringify({
      ok: true,
      timestamp: new Date().toISOString(),
      plantnet: process.env.VITE_PLANTNET_API_KEY ? 'configured' : 'MISSING',
      gemini: process.env.VITE_GEMINI_API_KEY ? 'configured' : 'MISSING',
    }),
    {
      status: 200,
      headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
    }
  )
}
