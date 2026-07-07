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
from pygltflib import GLTF2

sys.path.insert(0, str(Path(__file__).parent))
from plants import BUILDERS  # noqa: E402

OUT_DIR = Path(__file__).resolve().parents[2] / 'public' / 'models' / 'species'


def export_glb(species_id: str, out_path: Path):
    rng = np.random.default_rng(abs(hash(species_id)) % (2 ** 32))
    m = BUILDERS[species_id](rng)
    # COLOR_0 no glTF é linear; nossas paletas são sRGB — converte pra não lavar
    C = m['C'].astype(np.float64) / 255.0
    C[:, :3] = C[:, :3] ** 2.2
    C = (C * 255).round().astype(np.uint8)
    tm = trimesh.Trimesh(vertices=m['V'], faces=m['F'],
                         vertex_colors=C, process=False)
    scene = trimesh.Scene({species_id: tm})
    glb = trimesh.exchange.gltf.export_glb(scene, include_normals=True)
    out_path.write_bytes(glb)

    # pós-processa: material fosco, dupla face (folhas são superfícies abertas)
    g = GLTF2.load_binary(str(out_path))
    if not g.materials:
        from pygltflib import Material, PbrMetallicRoughness
        g.materials = [Material(
            name='plant',
            doubleSided=True,
            pbrMetallicRoughness=PbrMetallicRoughness(
                baseColorFactor=[1, 1, 1, 1], metallicFactor=0.0, roughnessFactor=0.85),
        )]
    for mat in g.materials:
        mat.doubleSided = True
        if mat.pbrMetallicRoughness:
            mat.pbrMetallicRoughness.metallicFactor = 0.0
            mat.pbrMetallicRoughness.roughnessFactor = 0.85
    for mm in g.meshes:
        for prim in mm.primitives:
            if prim.material is None:
                prim.material = 0
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
