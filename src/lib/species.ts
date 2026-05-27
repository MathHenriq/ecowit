/**
 * Catálogo de espécies da Pokédex botânica.
 * MVP: lista hardcoded. Futuro: tabela `species` no Supabase, populada via PlantNet.
 */

export type SpeciesCategory = 'suculenta' | 'tropical' | 'erva' | 'flor' | 'cacto' | 'arvore'

export interface Species {
  id: string
  popularName: string
  scientificName: string
  category: SpeciesCategory
  emoji: string         // ilustração placeholder (vai virar SVG/PNG real depois)
  potColor: 'terracotta' | 'stone'
  rarity?: 'common' | 'rare' | 'epic'
  careLevel: 'fácil' | 'médio' | 'difícil'
  sunNeeds: 'sol pleno' | 'meia-sombra' | 'sombra'
  waterDays: number
  description?: string
}

export const SPECIES_CATALOG: Species[] = [
  { id: 'echeveria-elegans',   popularName: 'Echeveria',         scientificName: 'Echeveria elegans',         category: 'suculenta', emoji: '🪷', potColor: 'terracotta', careLevel: 'fácil',   sunNeeds: 'sol pleno',    waterDays: 10, description: 'Suculenta em formato de rosa, conhecida como Rosa-de-Pedra.' },
  { id: 'pilea',               popularName: 'Pilea',             scientificName: 'Pilea peperomioides',       category: 'tropical',  emoji: '🌿', potColor: 'terracotta', careLevel: 'fácil',   sunNeeds: 'meia-sombra',  waterDays: 7,  description: 'Folhas redondas tipo "moeda chinesa". Adora ser dividida com amigos.' },
  { id: 'monstera-deliciosa',  popularName: 'Costela-de-Adão',   scientificName: 'Monstera deliciosa',        category: 'tropical',  emoji: '🌱', potColor: 'stone',      careLevel: 'fácil',   sunNeeds: 'meia-sombra',  waterDays: 7,  description: 'Nativa do México, símbolo das selvas tropicais.' },
  { id: 'cacto-vela',          popularName: 'Cacto-vela',        scientificName: 'Cereus peruvianus',         category: 'cacto',     emoji: '🌵', potColor: 'terracotta', careLevel: 'fácil',   sunNeeds: 'sol pleno',    waterDays: 14, description: 'Cresce alto e firme, igual vela. Adora sol direto.' },
  { id: 'espada-sao-jorge',    popularName: 'Espada-de-São-Jorge', scientificName: 'Dracaena trifasciata',    category: 'tropical',  emoji: '🌾', potColor: 'terracotta', careLevel: 'fácil',   sunNeeds: 'meia-sombra',  waterDays: 14, description: 'Resistente, purifica o ar. Quase indestrutível.' },
  { id: 'manjericao',          popularName: 'Manjericão',        scientificName: 'Ocimum basilicum',          category: 'erva',      emoji: '🌱', potColor: 'stone',      careLevel: 'médio',   sunNeeds: 'sol pleno',    waterDays: 3,  description: 'Aromática queridinha da cozinha italiana.' },
  { id: 'hortela',             popularName: 'Hortelã',           scientificName: 'Mentha spicata',            category: 'erva',      emoji: '🌿', potColor: 'stone',      careLevel: 'fácil',   sunNeeds: 'meia-sombra',  waterDays: 3,  description: 'Refrescante, ideal pra chás e sucos.' },
  { id: 'lavanda',             popularName: 'Lavanda',           scientificName: 'Lavandula angustifolia',    category: 'flor',      emoji: '💜', potColor: 'terracotta', careLevel: 'médio',   sunNeeds: 'sol pleno',    waterDays: 7,  description: 'Aromática roxa, atrai abelhas e relaxa.' },
  { id: 'cravo-defunto',       popularName: 'Cravo-de-defunto',  scientificName: 'Tagetes patula',            category: 'flor',      emoji: '🌼', potColor: 'terracotta', careLevel: 'fácil',   sunNeeds: 'sol pleno',    waterDays: 4,  description: 'Flor laranja vibrante, repele pragas.' },
  { id: 'narciso',             popularName: 'Narciso',           scientificName: 'Narcissus poeticus',        category: 'flor',      emoji: '🌸', potColor: 'stone',      careLevel: 'médio',   sunNeeds: 'sol pleno',    waterDays: 5,  description: 'Pétalas brancas em forma de estrela.' },
  { id: 'strelitzia',          popularName: 'Estrelícia',        scientificName: 'Strelitzia reginae',        category: 'tropical',  emoji: '🦜', potColor: 'terracotta', careLevel: 'difícil', sunNeeds: 'sol pleno',    waterDays: 5,  rarity: 'rare', description: 'Ave-do-paraíso. Flor exótica laranja e azul.' },
  { id: 'orquidea-phalaenopsis', popularName: 'Orquídea',        scientificName: 'Phalaenopsis amabilis',     category: 'flor',      emoji: '🌺', potColor: 'stone',      careLevel: 'difícil', sunNeeds: 'meia-sombra',  waterDays: 7,  rarity: 'rare', description: 'Elegante e exigente, mas recompensa quem cuida.' },
  // Resto do catálogo (bloqueadas — apenas registro de existência)
  { id: 'zamioculca',          popularName: 'Zamioculca',        scientificName: 'Zamioculcas zamiifolia',    category: 'tropical',  emoji: '🌿', potColor: 'stone',      careLevel: 'fácil',   sunNeeds: 'sombra',       waterDays: 14 },
  { id: 'jiboia',              popularName: 'Jiboia',            scientificName: 'Epipremnum aureum',         category: 'tropical',  emoji: '🌿', potColor: 'terracotta', careLevel: 'fácil',   sunNeeds: 'sombra',       waterDays: 7  },
  { id: 'peperomia',           popularName: 'Peperomia',         scientificName: 'Peperomia obtusifolia',     category: 'tropical',  emoji: '🌿', potColor: 'terracotta', careLevel: 'fácil',   sunNeeds: 'meia-sombra',  waterDays: 5  },
  { id: 'kalanchoe',           popularName: 'Kalanchoe',         scientificName: 'Kalanchoe blossfeldiana',   category: 'suculenta', emoji: '🌺', potColor: 'terracotta', careLevel: 'fácil',   sunNeeds: 'sol pleno',    waterDays: 10 },
  { id: 'jade',                popularName: 'Planta-jade',       scientificName: 'Crassula ovata',            category: 'suculenta', emoji: '🪴', potColor: 'terracotta', careLevel: 'fácil',   sunNeeds: 'sol pleno',    waterDays: 14 },
  { id: 'aloe-vera',           popularName: 'Babosa',            scientificName: 'Aloe vera',                 category: 'suculenta', emoji: '🌵', potColor: 'terracotta', careLevel: 'fácil',   sunNeeds: 'sol pleno',    waterDays: 14 },
  { id: 'rosa-deserto',        popularName: 'Rosa-do-deserto',   scientificName: 'Adenium obesum',            category: 'suculenta', emoji: '🌸', potColor: 'terracotta', careLevel: 'médio',   sunNeeds: 'sol pleno',    waterDays: 7,  rarity: 'rare' },
  { id: 'samambaia',           popularName: 'Samambaia',         scientificName: 'Nephrolepis exaltata',      category: 'tropical',  emoji: '🌿', potColor: 'terracotta', careLevel: 'médio',   sunNeeds: 'sombra',       waterDays: 3  },
  { id: 'antúrio',             popularName: 'Antúrio',           scientificName: 'Anthurium andraeanum',      category: 'flor',      emoji: '❤️', potColor: 'stone',      careLevel: 'médio',   sunNeeds: 'meia-sombra',  waterDays: 5  },
  { id: 'girassol',            popularName: 'Girassol',          scientificName: 'Helianthus annuus',         category: 'flor',      emoji: '🌻', potColor: 'terracotta', careLevel: 'fácil',   sunNeeds: 'sol pleno',    waterDays: 2  },
  { id: 'bromelia',            popularName: 'Bromélia',          scientificName: 'Aechmea fasciata',          category: 'tropical',  emoji: '🌺', potColor: 'stone',      careLevel: 'médio',   sunNeeds: 'meia-sombra',  waterDays: 5,  rarity: 'rare' },
  { id: 'salsa',               popularName: 'Salsinha',          scientificName: 'Petroselinum crispum',      category: 'erva',      emoji: '🌿', potColor: 'stone',      careLevel: 'fácil',   sunNeeds: 'meia-sombra',  waterDays: 2  },
  { id: 'alecrim',             popularName: 'Alecrim',           scientificName: 'Rosmarinus officinalis',    category: 'erva',      emoji: '🌿', potColor: 'terracotta', careLevel: 'fácil',   sunNeeds: 'sol pleno',    waterDays: 5  },
  { id: 'cebolinha',           popularName: 'Cebolinha',         scientificName: 'Allium fistulosum',         category: 'erva',      emoji: '🌱', potColor: 'stone',      careLevel: 'fácil',   sunNeeds: 'sol pleno',    waterDays: 2  },
  { id: 'gerbera',             popularName: 'Gérbera',           scientificName: 'Gerbera jamesonii',         category: 'flor',      emoji: '🌼', potColor: 'terracotta', careLevel: 'médio',   sunNeeds: 'sol pleno',    waterDays: 3  },
  { id: 'tulipa',              popularName: 'Tulipa',            scientificName: 'Tulipa gesneriana',         category: 'flor',      emoji: '🌷', potColor: 'stone',      careLevel: 'difícil', sunNeeds: 'sol pleno',    waterDays: 4,  rarity: 'rare' },
  { id: 'rosa',                popularName: 'Rosa',              scientificName: 'Rosa gallica',              category: 'flor',      emoji: '🌹', potColor: 'terracotta', careLevel: 'médio',   sunNeeds: 'sol pleno',    waterDays: 3  },
  { id: 'mandacaru',           popularName: 'Mandacaru',         scientificName: 'Cereus jamacaru',           category: 'cacto',     emoji: '🌵', potColor: 'terracotta', careLevel: 'fácil',   sunNeeds: 'sol pleno',    waterDays: 21, rarity: 'epic' },
  { id: 'palmeira',            popularName: 'Palmeira-areca',    scientificName: 'Dypsis lutescens',          category: 'arvore',    emoji: '🌴', potColor: 'stone',      careLevel: 'médio',   sunNeeds: 'meia-sombra',  waterDays: 4  },
  { id: 'ficus-lyrata',        popularName: 'Ficus lira',        scientificName: 'Ficus lyrata',              category: 'arvore',    emoji: '🌳', potColor: 'stone',      careLevel: 'difícil', sunNeeds: 'meia-sombra',  waterDays: 7,  rarity: 'epic' },
]

/** IDs das espécies que o usuário "tem" desbloqueadas (mock — vai virar query Supabase). */
export const UNLOCKED_SPECIES_IDS = new Set<string>([
  'echeveria-elegans',
  'pilea',
  'monstera-deliciosa',
  'cacto-vela',
  'espada-sao-jorge',
  'manjericao',
  'hortela',
  'lavanda',
  'cravo-defunto',
  'narciso',
  'strelitzia',
  'orquidea-phalaenopsis',
])

export function isUnlocked(id: string): boolean {
  return UNLOCKED_SPECIES_IDS.has(id)
}

export const CATEGORY_LABELS: Record<SpeciesCategory, { plural: string; emoji: string }> = {
  suculenta: { plural: 'Suculentas', emoji: '🪷' },
  tropical:  { plural: 'Tropicais',  emoji: '🌿' },
  erva:      { plural: 'Ervas',      emoji: '🌱' },
  flor:      { plural: 'Flores',     emoji: '🌸' },
  cacto:     { plural: 'Cactos',     emoji: '🌵' },
  arvore:    { plural: 'Árvores',    emoji: '🌳' },
}
