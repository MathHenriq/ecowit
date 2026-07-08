# plantgen — gerador dos modelos 3D das espécies

Gera os modelos 3D usados no AR (`public/models/species/*.glb|.usdz`),
um por espécie do catálogo (`src/lib/species.ts`), em escala real (metros)
com silhueta botânica reconhecível: roseta por filotaxia (echeveria, babosa),
folhas recortadas (costela-de-adão), cacto colunar com nervuras e espinhos
(mandacaru), frondes pinadas (samambaia, palmeira), etc.

## Uso

```bash
pip install numpy scipy trimesh pygltflib usd-core Pillow
python3 build.py                     # todos os .glb (Android / Scene Viewer / WebXR)
python3 build_usdz.py                # todos os .usdz (iOS / AR Quick Look)
node    compress.mjs                 # comprime os .glb (weld + dedup + quantização)
python3 build.py girassol            # só uma espécie
```

Pipeline por espécie: `plants.py` monta a malha → `bake.py` assa a cor →
`build.py`/`build_usdz.py` exportam → `compress.mjs` encolhe os GLBs.

- `meshlib.py` — primitivas (superfícies de revolução, tubos, folhas
  paramétricas com perfis de largura, filotaxia em ângulo de ouro)
- `plants.py` — um construtor por espécie (`BUILDERS`)
- `bake.py` — **cor por vértice → baseColorTexture** (palette atlas). Os
  renderizadores de AR (Scene Viewer / Quick Look) não usam `COLOR_0` de
  forma confiável e o modelo aparecia **preto no AR**; com textura PBR
  normal a cor renderiza em todos. UV é constante por face (os 3 vértices
  apontam pro mesmo texel) → sem sangramento entre células.
- `compress.mjs` — `weld + dedup + prune + quantize` (KHR_mesh_quantization).
  Reduz ~45% sem decoder externo; compatível com model-viewer e Scene Viewer.
- A seed do RNG deriva do id da espécie → saída determinística.
- Cuidado com o V: o trimesh inverte a coordenada V na exportação glTF e a
  USD tem origem no canto inferior — ambos os exportadores aplicam `1 - v`.
