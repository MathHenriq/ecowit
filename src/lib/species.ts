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
  // Resto do catálogo (bloqueadas até serem escaneadas)
  { id: 'zamioculca',          popularName: 'Zamioculca',        scientificName: 'Zamioculcas zamiifolia',    category: 'tropical',  emoji: '🌿', potColor: 'stone',      careLevel: 'fácil',   sunNeeds: 'sombra',       waterDays: 14, description: 'Sobrevive até no canto mais escuro da sala. Quase impossível matar.' },
  { id: 'jiboia',              popularName: 'Jiboia',            scientificName: 'Epipremnum aureum',         category: 'tropical',  emoji: '🌿', potColor: 'terracotta', careLevel: 'fácil',   sunNeeds: 'sombra',       waterDays: 7,  description: 'Trepadeira rústica, ótima pra pendurar ou deixar escalando a estante.' },
  { id: 'peperomia',           popularName: 'Peperomia',         scientificName: 'Peperomia obtusifolia',     category: 'tropical',  emoji: '🌿', potColor: 'terracotta', careLevel: 'fácil',   sunNeeds: 'meia-sombra',  waterDays: 5,  description: 'Folhas carnudas e brilhantes, compacta e fácil de cuidar.' },
  { id: 'kalanchoe',           popularName: 'Kalanchoe',         scientificName: 'Kalanchoe blossfeldiana',   category: 'suculenta', emoji: '🌺', potColor: 'terracotta', careLevel: 'fácil',   sunNeeds: 'sol pleno',    waterDays: 10, description: 'Flores em buquês coloridos, dura semanas sem murchar.' },
  { id: 'jade',                popularName: 'Planta-jade',       scientificName: 'Crassula ovata',            category: 'suculenta', emoji: '🪴', potColor: 'terracotta', careLevel: 'fácil',   sunNeeds: 'sol pleno',    waterDays: 14, description: 'Conhecida como "planta da fortuna", folhas redondas tipo moedinhas.' },
  { id: 'aloe-vera',           popularName: 'Babosa',            scientificName: 'Aloe vera',                 category: 'suculenta', emoji: '🌵', potColor: 'terracotta', careLevel: 'fácil',   sunNeeds: 'sol pleno',    waterDays: 14, description: 'Gel cicatrizante natural, clássica de quintal brasileiro.' },
  { id: 'rosa-deserto',        popularName: 'Rosa-do-deserto',   scientificName: 'Adenium obesum',            category: 'suculenta', emoji: '🌸', potColor: 'terracotta', careLevel: 'médio',   sunNeeds: 'sol pleno',    waterDays: 7,  rarity: 'rare', description: 'Caule grosso e tortuoso, flores rosa vibrantes. Rara e exótica.' },
  { id: 'samambaia',           popularName: 'Samambaia',         scientificName: 'Nephrolepis exaltata',      category: 'tropical',  emoji: '🌿', potColor: 'terracotta', careLevel: 'médio',   sunNeeds: 'sombra',       waterDays: 3,  description: 'Folhagem densa e fofa, perfeita pra varanda sombreada.' },
  { id: 'antúrio',             popularName: 'Antúrio',           scientificName: 'Anthurium andraeanum',      category: 'flor',      emoji: '❤️', potColor: 'stone',      careLevel: 'médio',   sunNeeds: 'meia-sombra',  waterDays: 5,  description: 'Flor em coração vermelho intenso, símbolo de hospitalidade.' },
  { id: 'girassol',            popularName: 'Girassol',          scientificName: 'Helianthus annuus',         category: 'flor',      emoji: '🌻', potColor: 'terracotta', careLevel: 'fácil',   sunNeeds: 'sol pleno',    waterDays: 2,  description: 'Acompanha o sol o dia inteiro. Alegria garantida no jardim.' },
  { id: 'bromelia',            popularName: 'Bromélia',          scientificName: 'Aechmea fasciata',          category: 'tropical',  emoji: '🌺', potColor: 'stone',      careLevel: 'médio',   sunNeeds: 'meia-sombra',  waterDays: 5,  rarity: 'rare', description: 'Roseta tropical com flor rosa que dura meses. Acumula água no centro.' },
  { id: 'salsa',               popularName: 'Salsinha',          scientificName: 'Petroselinum crispum',      category: 'erva',      emoji: '🌿', potColor: 'stone',      careLevel: 'fácil',   sunNeeds: 'meia-sombra',  waterDays: 2,  description: 'Não pode faltar no tempero. Cresce rápido se regada com frequência.' },
  { id: 'alecrim',             popularName: 'Alecrim',           scientificName: 'Rosmarinus officinalis',    category: 'erva',      emoji: '🌿', potColor: 'terracotta', careLevel: 'fácil',   sunNeeds: 'sol pleno',    waterDays: 5,  description: 'Aromático e resistente à seca, ótimo pra carnes e batatas.' },
  { id: 'cebolinha',           popularName: 'Cebolinha',         scientificName: 'Allium fistulosum',         category: 'erva',      emoji: '🌱', potColor: 'stone',      careLevel: 'fácil',   sunNeeds: 'sol pleno',    waterDays: 2,  description: 'Corta e nasce de novo. Praticamente eterna na horta.' },
  { id: 'gerbera',             popularName: 'Gérbera',           scientificName: 'Gerbera jamesonii',         category: 'flor',      emoji: '🌼', potColor: 'terracotta', careLevel: 'médio',   sunNeeds: 'sol pleno',    waterDays: 3,  description: 'Flores grandes e coloridas, ótimas pra arranjos.' },
  { id: 'tulipa',              popularName: 'Tulipa',            scientificName: 'Tulipa gesneriana',         category: 'flor',      emoji: '🌷', potColor: 'stone',      careLevel: 'difícil', sunNeeds: 'sol pleno',    waterDays: 4,  rarity: 'rare', description: 'Clássica europeia, precisa de frio pra florescer bem. Desafio pros tropicais.' },
  { id: 'rosa',                popularName: 'Rosa',              scientificName: 'Rosa gallica',              category: 'flor',      emoji: '🌹', potColor: 'terracotta', careLevel: 'médio',   sunNeeds: 'sol pleno',    waterDays: 3,  description: 'A rainha do jardim. Espinhos pra proteger a beleza.' },
  { id: 'mandacaru',           popularName: 'Mandacaru',         scientificName: 'Cereus jamacaru',           category: 'cacto',     emoji: '🌵', potColor: 'terracotta', careLevel: 'fácil',   sunNeeds: 'sol pleno',    waterDays: 21, rarity: 'epic', description: 'Símbolo da caatinga, floresce à noite e aguenta meses sem chuva.' },
  { id: 'palmeira',            popularName: 'Palmeira-areca',    scientificName: 'Dypsis lutescens',          category: 'arvore',    emoji: '🌴', potColor: 'stone',      careLevel: 'médio',   sunNeeds: 'meia-sombra',  waterDays: 4,  description: 'Folhagem tropical elegante, ótima pra purificar o ar de casa.' },
  { id: 'ficus-lyrata',        popularName: 'Ficus lira',        scientificName: 'Ficus lyrata',              category: 'arvore',    emoji: '🌳', potColor: 'stone',      careLevel: 'difícil', sunNeeds: 'meia-sombra',  waterDays: 7,  rarity: 'epic', description: 'Folhas gigantes em formato de violão. Estrela da decoração de interiores.' },
]

/** IDs das espécies que o usuário "tem" desbloqueadas (mock — vai virar query Supabase). */
const UNLOCKED_STORAGE_KEY = 'ecowit:unlockedSpecies'

const DEFAULT_UNLOCKED = [
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
]

function loadUnlockedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(UNLOCKED_STORAGE_KEY)
    if (raw) return new Set(JSON.parse(raw) as string[])
  } catch {
    // ignore, cai no default
  }
  return new Set(DEFAULT_UNLOCKED)
}

class PersistedSpeciesSet extends Set<string> {
  add(id: string) {
    super.add(id)
    localStorage.setItem(UNLOCKED_STORAGE_KEY, JSON.stringify([...this]))
    return this
  }
}

export const UNLOCKED_SPECIES_IDS: Set<string> = new PersistedSpeciesSet(loadUnlockedIds())

export function isUnlocked(id: string): boolean {
  return UNLOCKED_SPECIES_IDS.has(id)
}

/** Caminhos dos modelos 3D reais por espécie (gerados por scripts/plantgen). */
export function modelPathsFor(species: Species): { glb: string; usdz: string } {
  // nomes de arquivo são ASCII (ex.: 'antúrio' -> 'anturio')
  const slug = species.id.normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
  return {
    glb: `/models/species/${slug}.glb`,
    usdz: `/models/species/${slug}.usdz`,
  }
}

/** Faixa de umidade do ar recomendada (%) por categoria. */
export const CATEGORY_HUMIDITY: Record<SpeciesCategory, { min: number; max: number; tip: string }> = {
  cacto:     { min: 10, max: 30, tip: 'Ar seco é ótimo. Evite banheiros e cozinhas úmidas.' },
  suculenta: { min: 20, max: 40, tip: 'Prefere ar seco; nunca borrife as folhas.' },
  erva:      { min: 40, max: 60, tip: 'Umidade média. Vaso com boa drenagem perto da janela.' },
  flor:      { min: 40, max: 60, tip: 'Umidade média; evite molhar as flores ao regar.' },
  tropical:  { min: 60, max: 80, tip: 'Adora ar úmido: borrife as folhas ou use pratinho com pedras e água.' },
  arvore:    { min: 50, max: 70, tip: 'Umidade moderada e boa ventilação, longe do ar-condicionado.' },
}

export const CATEGORY_LABELS: Record<SpeciesCategory, { plural: string; emoji: string }> = {
  suculenta: { plural: 'Suculentas', emoji: '🪷' },
  tropical:  { plural: 'Tropicais',  emoji: '🌿' },
  erva:      { plural: 'Ervas',      emoji: '🌱' },
  flor:      { plural: 'Flores',     emoji: '🌸' },
  cacto:     { plural: 'Cactos',     emoji: '🌵' },
  arvore:    { plural: 'Árvores',    emoji: '🌳' },
}
