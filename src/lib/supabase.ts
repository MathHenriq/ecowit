import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

if (!url || !anon) {
  // eslint-disable-next-line no-console
  console.warn(
    '[EcoWit] Variáveis VITE_SUPABASE_URL e/ou VITE_SUPABASE_ANON_KEY não configuradas. ' +
      'Copie .env.example para .env.local e preencha. App rodando em modo MOCK.'
  )
}

export const supabase = url && anon ? createClient(url, anon) : null

export const isMock = !supabase
