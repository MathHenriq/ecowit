# 🌱 EcoWit

Plante, regue, colecione. Um app gamificado inspirado em Duolingo + Pokémon GO para incentivar pessoas a plantarem e cuidarem de plantas no dia a dia.

## ✨ Features

- 📸 **Identificação de plantas** — escaneia com a câmera, IA reconhece (PlantNet + Gemini Vision como segunda opinião)
- 🪴 **Pokédex botânica** — coleção de espécies em prateleiras, plantas bloqueadas com silhueta e cadeado
- 🌿 **Plantação isométrica** — terrenos progressivos (Sacada → Quintal → Sítio → Reserva)
- 🔥 **Streak diário** — foto comprovando que regou hoje (estilo BeReal)
- 👥 **Social** — feed, perfis, jardins de amigos, ranking semanal
- 🤖 **Brotin** — mascote broto-coruja que acompanha o usuário

## 🛠️ Stack

- **Vite** + **React 19** + **TypeScript**
- **Tailwind CSS v4** (design system "Eco-Growth")
- **React Router 7**
- **Supabase** (auth, DB, realtime) — em integração
- **PlantNet API** (identificação científica) + **Gemini Vision** (segunda opinião)
- **PWA** (instalável no celular/tablet)

## 🚀 Rodando localmente

```bash
npm install
cp .env.example .env.local
# preenche as chaves em .env.local
npm run dev
```

Acessa em [http://localhost:5173](http://localhost:5173).

## 🌍 Variáveis de ambiente

| Variável | Pra quê | Obrigatória |
|---|---|---|
| `VITE_PLANTNET_API_KEY` | Identificação principal de plantas | Não (cai em mock) |
| `VITE_GEMINI_API_KEY` | Segunda opinião via IA | Não |
| `VITE_SUPABASE_URL` | Backend | Não (cai em mock) |
| `VITE_SUPABASE_ANON_KEY` | Backend | Não |

Sem chaves, o app roda em **modo mock determinístico** — fotos diferentes retornam espécies diferentes (com base em hash da imagem).

## 📁 Estrutura

```
src/
├── App.tsx            # rotas
├── main.tsx           # entrada
├── index.css          # design system Eco-Growth (tokens, classes squish)
├── components/
│   ├── AppLayout.tsx  # wrapper com BottomNav
│   ├── BottomNav.tsx  # 5 abas + botão central de câmera
│   ├── Brotin.tsx     # mascote SVG (6 moods)
│   ├── IsoDiorama.tsx # cena isométrica da Plantação
│   ├── PlantSprite.tsx# sprites SVG das plantas
│   └── ui.tsx         # Button, Card, Chip, GrowthBar
├── lib/
│   ├── identify.ts    # PlantNet + Gemini service
│   ├── species.ts     # catálogo de espécies
│   ├── supabase.ts    # cliente Supabase
│   └── terrains.ts    # terrenos da Plantação
└── screens/
    ├── Splash.tsx     ✅
    ├── Login.tsx      ✅
    ├── Onboarding.tsx ✅
    ├── Feed.tsx       ✅
    ├── Jardim.tsx     ✅
    ├── Plantacao.tsx  ✅
    ├── Scan.tsx       ✅
    ├── ScanResult.tsx ✅
    └── Placeholder.tsx (genérico para as não construídas ainda)
```

## 🗺️ Roadmap

- [x] Stack + design system
- [x] Splash, Login, Onboarding
- [x] Feed + BottomNav
- [x] Jardim (Pokédex)
- [x] Plantação (diorama isométrico)
- [x] Scan + Resultado + Modal Pokédex
- [x] Integração PlantNet + Gemini
- [ ] Streak / Rega diária com câmera
- [ ] Perfil do usuário
- [ ] Ranking semanal
- [ ] Notificações
- [ ] Configurações
- [ ] Detalhe da planta + Detalhe de post do feed
- [ ] Refinar visual do diorama isométrico
- [ ] Supabase real (auth + DB + RLS)
- [ ] Edge function pra esconder API keys

---

🌿 Feito com carinho pelo Brotin.
