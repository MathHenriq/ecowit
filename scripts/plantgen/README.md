# plantgen — gerador dos modelos 3D das espécies

Gera os modelos 3D usados no AR (`public/models/species/*.glb|.usdz`),
um por espécie do catálogo (`src/lib/species.ts`), em escala real (metros)
com silhueta botânica reconhecível: roseta por filotaxia (echeveria, babosa),
folhas recortadas (costela-de-adão), cacto colunar com nervuras e espinhos
(mandacaru), frondes pinadas (samambaia, palmeira), etc.

## Uso

```bash
pip install numpy scipy trimesh pygltflib usd-core
python3 build.py            # todos os .glb (Android / Scene Viewer / WebXR)
python3 build_usdz.py       # todos os .usdz (iOS / AR Quick Look)
python3 build.py girassol   # só uma espécie
```

- `meshlib.py` — primitivas (superfícies de revolução, tubos, folhas
  paramétricas com perfis de largura, filotaxia em ângulo de ouro)
- `plants.py` — um construtor por espécie (`BUILDERS`)
- Cores por vértice convertidas de sRGB pra linear no export (senão o glTF
  "lava" as cores); material único fosco de dupla face.
- A seed do RNG deriva do id da espécie → saída determinística.
