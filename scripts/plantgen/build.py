"""
Gera public/models/species/<id>.glb para todas as espécies do catálogo.

Uso: python3 build.py [id ...]   (sem args = todas)
"""
from __future__ import annotations

import sys
import unicodedata
from pathlib import Path

import numpy as np
import trimesh
from PIL import Image
from pygltflib import GLTF2
from trimesh.visual import TextureVisuals
from trimesh.visual.material import PBRMaterial

sys.path.insert(0, str(Path(__file__).parent))
from bake import bake_mesh  # noqa: E402
from plants import BUILDERS  # noqa: E402

OUT_DIR = Path(__file__).resolve().parents[2] / 'public' / 'models' / 'species'


def export_glb(species_id: str, out_path: Path):
    rng = np.random.default_rng(abs(hash(species_id)) % (2 ** 32))
    m = BUILDERS[species_id](rng)

    # Cor por vértice -> baseColorTexture (AR real precisa disso; COLOR_0 fica
    # preto no Scene Viewer/Quick Look). UV constante por face = sem bleed.
    baked = bake_mesh(m)
    img = Image.fromarray(baked['image'], mode='RGB')
    mat = PBRMaterial(
        name='plant',
        baseColorTexture=img,
        metallicFactor=0.0,
        roughnessFactor=0.9,
    )
    # trimesh inverte V na exportação glTF; pré-compensa pra amostrar o texel certo
    uvs = baked['uvs'].copy()
    uvs[:, 1] = 1.0 - uvs[:, 1]
    visual = TextureVisuals(uv=uvs, image=img, material=mat)
    tm = trimesh.Trimesh(vertices=baked['positions'], faces=baked['indices'],
                         visual=visual, process=False)
    scene = trimesh.Scene({species_id: tm})
    glb = trimesh.exchange.gltf.export_glb(scene, include_normals=True)
    out_path.write_bytes(glb)

    # pós-processa: dupla face (folhas são superfícies abertas) + sampler nearest
    g = GLTF2.load_binary(str(out_path))
    for mat in g.materials or []:
        mat.doubleSided = True
        if mat.pbrMetallicRoughness:
            mat.pbrMetallicRoughness.metallicFactor = 0.0
            mat.pbrMetallicRoughness.roughnessFactor = 0.9
    # amostragem nearest evita qualquer suavização entre células da paleta
    from pygltflib import Sampler
    g.samplers = [Sampler(magFilter=9728, minFilter=9728, wrapS=33071, wrapT=33071)]
    for tex in g.textures or []:
        tex.sampler = 0
    g.save_binary(str(out_path))


def main():
    ids = sys.argv[1:] or list(BUILDERS)
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    # seed do hash do python é aleatória por processo; usa hash estável
    global hash
    import zlib
    hash = lambda s: zlib.crc32(s.encode())  # noqa: E731
    for sid in ids:
        slug = unicodedata.normalize('NFKD', sid).encode('ascii', 'ignore').decode()
        out = OUT_DIR / f'{slug}.glb'
        export_glb(sid, out)
        kb = out.stat().st_size / 1024
        print(f'{sid:24s} {kb:8.1f} KB')


if __name__ == '__main__':
    main()
