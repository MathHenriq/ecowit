"""
Primitivas de malha para o gerador procedural de plantas do EcoWit.

Representação: dicts {'V': (n,3) float32, 'F': (m,3) int64, 'C': (n,4) uint8}
Sistema de coordenadas glTF: Y para cima, unidades em metros.
"""
from __future__ import annotations

import numpy as np


def mesh(V, F, C):
    V = np.asarray(V, dtype=np.float32)
    F = np.asarray(F, dtype=np.int64)
    C = np.asarray(C, dtype=np.uint8)
    return {'V': V, 'F': F, 'C': C}


def merge(parts):
    """Junta várias malhas em uma só."""
    parts = [p for p in parts if p is not None and len(p['V'])]
    Vs, Fs, Cs, off = [], [], [], 0
    for p in parts:
        Vs.append(p['V'])
        Fs.append(p['F'] + off)
        Cs.append(p['C'])
        off += len(p['V'])
    return mesh(np.concatenate(Vs), np.concatenate(Fs), np.concatenate(Cs))


def transform(m, R=None, t=(0, 0, 0), s=1.0):
    """Aplica escala -> rotação -> translação."""
    V = m['V'] * (np.asarray(s, dtype=np.float32) if np.ndim(s) else np.float32(s))
    if R is not None:
        V = V @ np.asarray(R, dtype=np.float32).T
    V = V + np.asarray(t, dtype=np.float32)
    return mesh(V, m['F'], m['C'])


def rot_x(a):
    c, s = np.cos(a), np.sin(a)
    return np.array([[1, 0, 0], [0, c, -s], [0, s, c]])


def rot_y(a):
    c, s = np.cos(a), np.sin(a)
    return np.array([[c, 0, s], [0, 1, 0], [-s, 0, c]])


def rot_z(a):
    c, s = np.cos(a), np.sin(a)
    return np.array([[c, -s, 0], [s, c, 0], [0, 0, 1]])


def col(hexcode, alpha=255):
    h = hexcode.lstrip('#')
    return np.array([int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), alpha], dtype=np.float64)


def lerp(a, b, t):
    t = np.clip(np.asarray(t, dtype=np.float64), 0, 1)
    return a + (b - a) * (t[..., None] if np.ndim(t) else t)


def jitter_color(rng, c, amount=10):
    d = rng.uniform(-amount, amount, 3)
    out = c.copy()
    out[:3] = np.clip(out[:3] + d, 0, 255)
    return out


def grid_faces(nu, nv, mask=None):
    """Faces de uma grade nu x nv (vértices em ordem linha-major u,v)."""
    faces = []
    for i in range(nu - 1):
        for j in range(nv - 1):
            if mask is not None and not mask[i, j]:
                continue
            a = i * nv + j
            b = a + 1
            c = a + nv
            d = c + 1
            faces.append([a, c, b])
            faces.append([b, c, d])
    return np.array(faces, dtype=np.int64) if faces else np.zeros((0, 3), dtype=np.int64)


# ---------------------------------------------------------------- superfícies

def lathe(profile, segments=24, color_fn=None, base_color=None, cap_top=False, cap_bottom=False):
    """
    Superfície de revolução em torno do eixo Y.
    profile: lista de (raio, y). color_fn(t_perfil) -> RGBA.
    """
    prof = np.asarray(profile, dtype=np.float64)
    n = len(prof)
    ang = np.linspace(0, 2 * np.pi, segments + 1)
    V, C = [], []
    for i, (r, y) in enumerate(prof):
        t = i / max(n - 1, 1)
        c = color_fn(t) if color_fn else base_color
        for a in ang:
            V.append([r * np.cos(a), y, r * np.sin(a)])
            C.append(c)
    F = grid_faces(n, segments + 1)
    parts = [mesh(V, F, np.clip(C, 0, 255).astype(np.uint8))]
    for is_top, flag in ((True, cap_top), (False, cap_bottom)):
        if not flag:
            continue
        r, y = prof[-1] if is_top else prof[0]
        c = (color_fn(1.0 if is_top else 0.0) if color_fn else base_color)
        ring = [[r * np.cos(a), y, r * np.sin(a)] for a in ang[:-1]]
        center = [[0, y, 0]]
        Vc = np.array(ring + center)
        k = len(ring)
        Fc = []
        for i in range(k):
            j = (i + 1) % k
            Fc.append([i, k, j] if is_top else [j, k, i])
        Cc = np.tile(np.clip(c, 0, 255).astype(np.uint8), (k + 1, 1))
        parts.append(mesh(Vc, np.array(Fc), Cc))
    return merge(parts)


def tube(path, radii, segments=8, color_fn=None, base_color=None, cap_end=True):
    """Tubo ao longo de uma polilinha 3D com raio variável (caule, galho)."""
    path = np.asarray(path, dtype=np.float64)
    n = len(path)
    radii = np.broadcast_to(np.asarray(radii, dtype=np.float64), (n,))
    # frames paralelos simples
    tangents = np.gradient(path, axis=0)
    tangents /= np.linalg.norm(tangents, axis=1, keepdims=True) + 1e-9
    up = np.array([0.0, 1.0, 0.0])
    if abs(np.dot(tangents[0], up)) > 0.95:
        up = np.array([1.0, 0.0, 0.0])
    V, C = [], []
    normal = np.cross(tangents[0], up)
    normal /= np.linalg.norm(normal) + 1e-9
    ang = np.linspace(0, 2 * np.pi, segments + 1)
    for i in range(n):
        t_ = tangents[i]
        normal = normal - t_ * np.dot(normal, t_)
        normal /= np.linalg.norm(normal) + 1e-9
        binorm = np.cross(t_, normal)
        tt = i / max(n - 1, 1)
        c = color_fn(tt) if color_fn else base_color
        for a in ang:
            p = path[i] + radii[i] * (np.cos(a) * normal + np.sin(a) * binorm)
            V.append(p)
            C.append(c)
    F = grid_faces(n, segments + 1)
    parts = [mesh(V, F, np.clip(C, 0, 255).astype(np.uint8))]
    if cap_end:
        # tampa simples no fim (ponta)
        tipc = color_fn(1.0) if color_fn else base_color
        tip = path[-1] + tangents[-1] * radii[-1] * 0.8
        k = len(V)
        ring0 = k - (segments + 1)
        Vt = np.vstack([np.asarray(V[ring0:]), tip])
        Ft = [[i, segments + 1, (i + 1)] for i in range(segments)]
        Ct = np.tile(np.clip(tipc, 0, 255).astype(np.uint8), (segments + 2, 1))
        parts.append(mesh(Vt, np.array(Ft), Ct))
    return merge(parts)


def sphere(radius=1.0, seg_u=12, seg_v=8, color=None, squash=1.0):
    """Esfera uv (squash achata no eixo Y)."""
    us = np.linspace(0, 2 * np.pi, seg_u + 1)
    vs = np.linspace(-np.pi / 2, np.pi / 2, seg_v + 1)
    V, C = [], []
    for v in vs:
        for u in us:
            V.append([
                radius * np.cos(v) * np.cos(u),
                radius * np.sin(v) * squash,
                radius * np.cos(v) * np.sin(u),
            ])
            C.append(color)
    F = grid_faces(seg_v + 1, seg_u + 1)
    return mesh(V, F, np.tile(np.clip(color, 0, 255).astype(np.uint8), (len(V), 1)))


# ------------------------------------------------------------------- folhas

WIDTH_PROFILES = {
    # w(u) em [0,1] -> meia-largura relativa
    'ovate':      lambda u: np.sin(np.pi * np.clip(u, 0, 1) ** 0.85) ** 0.8,
    'lanceolate': lambda u: np.sin(np.pi * np.clip(u, 0, 1)) ** 1.4,
    'strap':      lambda u: np.minimum(1.0, 6 * u) * (1 - np.clip(u, 0, 1) ** 6) ** 0.7,
    'round':      lambda u: np.sqrt(np.clip(u * (1 - u), 0, 1)) * 2,
    'cordate':    lambda u: np.sin(np.pi * np.clip(u, 0, 1) ** 0.62) ** 0.9,
    'fiddle':     lambda u: 0.55 + 0.45 * np.cos(2.4 * np.pi * (np.clip(u, 0, 1) - 0.72)) * np.sin(np.pi * np.clip(u, 0, 1)) ** 0.5,
    'needle':     lambda u: np.sin(np.pi * np.clip(u, 0, 1)) ** 0.5 * 0.9,
    'petal':      lambda u: np.sin(np.pi * np.clip(u, 0, 1) ** 0.7) ** 1.1,
    'petal_wide': lambda u: np.sin(np.pi * np.clip(u, 0, 1) ** 0.55) ** 0.85,
}


def leaf(length, width, shape='ovate', bend=0.5, cup=0.15, twist=0.0,
         color_base=None, color_tip=None, nu=14, nv=7,
         splits=0, split_depth=0.55, taper_tip=True, midrib=0.0,
         thickness=0.0, rng=None, edge_wave=0.0):
    """
    Folha paramétrica. Base na origem apontando +X, face para cima (+Y).
      bend: arqueamento pra baixo ao longo do comprimento (0..1+)
      cup: curvatura em U transversal
      splits: nº de recortes por lado (Monstera)
      thickness: extrusão para folhas suculentas
      edge_wave: ondulação da borda
    """
    wf = WIDTH_PROFILES[shape]
    us = np.linspace(0, 1, nu)
    vs = np.linspace(-1, 1, nv)
    Uu, Vv = np.meshgrid(us, vs, indexing='ij')
    half_w = wf(Uu) * width / 2
    X = Uu * length
    Z = Vv * half_w
    # curvatura transversal (concha)
    Y = cup * width * (Vv ** 2) * wf(Uu)
    # nervura central levantada
    Y += midrib * width * (1 - np.abs(Vv)) * 0.0
    # ondulação de borda
    if edge_wave:
        Y += edge_wave * width * np.abs(Vv) * np.sin(Uu * np.pi * 5)
    # arqueamento (droop): rotaciona progressivamente
    ang = -bend * (Uu ** 1.5) * np.pi / 2
    Xb = X * np.cos(ang) - Y * np.sin(ang)
    Yb = X * np.sin(ang) + Y * np.cos(ang)
    # ajuste: arquear pra cima primeiro e depois cair fica mais natural
    Yb += np.sin(np.pi * Uu) * length * 0.08 * (1 - bend * 0.5)
    if twist:
        tw = twist * Uu
        Znew = Z * np.cos(tw) - Yb * np.sin(tw) * 0.3
        Yb = Yb + Z * np.sin(tw)
        Z = Znew
    V = np.stack([Xb, Yb, Z], axis=-1).reshape(-1, 3)

    # máscara de recortes (Monstera) — remove faces em faixas próximas da borda
    maskgrid = np.ones((nu - 1, nv - 1), dtype=bool)
    if splits > 0:
        for i in range(nu - 1):
            uc = (us[i] + us[i + 1]) / 2
            for j in range(nv - 1):
                vc = (vs[j] + vs[j + 1]) / 2
                if abs(vc) < (1 - split_depth):
                    continue
                phase = uc * splits + (0.5 if vc > 0 else 0.15)
                if (phase % 1.0) < 0.38 and 0.15 < uc < 0.92:
                    maskgrid[i, j] = False
    F = grid_faces(nu, nv, maskgrid)

    # cores: gradiente base->ponta + leve escurecimento na nervura
    t = Uu.reshape(-1)
    C = lerp(np.asarray(color_base, dtype=np.float64), np.asarray(color_tip, dtype=np.float64), t)
    C = np.clip(C, 0, 255).astype(np.uint8)
    m = mesh(V, F, C)

    if thickness > 0:
        lower = mesh(V - np.array([0, thickness, 0], dtype=np.float32),
                     F[:, ::-1], (C * 0.82).astype(np.uint8))
        m = merge([m, lower])
    return m


def place_radial(part_fn, count, tilt_start, tilt_end, y=0.0, r0=0.0,
                 rng=None, scale_range=(0.9, 1.1), yaw_jitter=0.12, golden=True):
    """Distribui cópias de part_fn(k) em círculo/espiral (filotaxia)."""
    parts = []
    ga = np.pi * (3 - np.sqrt(5))  # ângulo de ouro
    for k in range(count):
        yaw = k * ga if golden else k * 2 * np.pi / count
        if rng is not None:
            yaw += rng.uniform(-yaw_jitter, yaw_jitter)
        t = k / max(count - 1, 1)
        tilt = tilt_start + (tilt_end - tilt_start) * t
        s = rng.uniform(*scale_range) if rng is not None else 1.0
        p = part_fn(k)
        p = transform(p, R=rot_z(tilt), s=s)
        p = transform(p, R=rot_y(yaw), t=(r0 * np.cos(yaw), y, -r0 * np.sin(yaw)))
        parts.append(p)
    return merge(parts)
