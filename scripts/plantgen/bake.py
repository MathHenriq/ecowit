"""
Baking de cor-por-vértice -> textura (palette atlas).

Por que existe: os renderizadores de AR (Android Scene Viewer e iOS AR
Quick Look) não usam COLOR_0 (cor por vértice) de forma confiável — o
modelo aparecia totalmente preto no AR mesmo funcionando no <model-viewer>.
A solução universal é usar um baseColorTexture PBR normal.

Truque: cada face vira uma cor sólida (média dos 3 vértices) e recebe uma
UV CONSTANTE (os 3 vértices apontam pro mesmo texel do atlas). Como a UV
não varia dentro do triângulo, não há sangramento entre células nem
problema de mipmap — o texel amostrado é sempre exato.
"""
from __future__ import annotations

import numpy as np


def bake_mesh(m, block: int = 3):
    """
    m: dict {'V','F','C'} (C = cor por vértice sRGB uint8, RGBA).
    Retorna dict:
      positions (3F,3) float32 — malha "desgrudada" (uma cópia de vértice por face)
      uvs       (3F,2) float32
      indices   (F,3)  int64
      image     (H,W,3) uint8 — atlas de cores em sRGB
    """
    V = np.asarray(m['V'], dtype=np.float64)
    F = np.asarray(m['F'], dtype=np.int64)
    C = np.asarray(m['C'], dtype=np.float64)

    # cor sólida por face = média dos 3 vértices (mantém o sRGB que definimos)
    face_rgb = C[F][:, :, :3].mean(axis=1).round().clip(0, 255).astype(np.uint8)

    # paleta de cores únicas + índice de cada face
    palette, inv = np.unique(face_rgb, axis=0, return_inverse=True)
    inv = inv.reshape(-1)
    n = len(palette)

    gw = int(np.ceil(np.sqrt(n)))
    gh = int(np.ceil(n / gw))
    W, H = gw * block, gh * block
    image = np.zeros((H, W, 3), dtype=np.uint8)

    cols = np.arange(n) % gw
    rows = np.arange(n) // gw
    for k in range(n):
        r, c = rows[k], cols[k]
        image[r * block:(r + 1) * block, c * block:(c + 1) * block] = palette[k]

    # UV do centro da célula de cada face (independe do tamanho do bloco)
    u = (cols[inv] + 0.5) / gw
    v = (rows[inv] + 0.5) / gh
    face_uv = np.stack([u, v], axis=1)                     # (F,2)

    positions = V[F].reshape(-1, 3).astype(np.float32)     # (3F,3)
    uvs = np.repeat(face_uv, 3, axis=0).astype(np.float32)  # (3F,2)
    indices = np.arange(len(F) * 3, dtype=np.int64).reshape(-1, 3)

    return {
        'positions': positions,
        'uvs': uvs,
        'indices': indices,
        'image': image,
    }
