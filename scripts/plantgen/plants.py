"""
Construtores botânicos por espécie — EcoWit.

Cada builder retorna uma malha (metros, Y pra cima, origem no chão)
de uma planta em vaso com silhueta reconhecível da espécie.
"""
from __future__ import annotations

import numpy as np

from meshlib import (col, jitter_color, leaf, lathe, lerp, merge, mesh,
                     place_radial, rot_x, rot_y, rot_z, sphere, transform, tube)

# ------------------------------------------------------------------ paletas

TERRACOTTA = col('#b05e3c')
TERRACOTTA_D = col('#8a4630')
STONE = col('#9a9a94')
STONE_D = col('#77776f')
SOIL = col('#3d2b1f')
SOIL_L = col('#54392a')

GREEN_D = col('#2e6b34')
GREEN = col('#3f8f46')
GREEN_L = col('#67b26b')
GREEN_GLOSSY = col('#2f7a3a')
GREEN_PALE = col('#9fc98f')
GREEN_BLUE = col('#8fb6a5')
GREEN_GREY = col('#7d9a7b')


# ------------------------------------------------------------------- partes

def pot(kind='terracotta', r=0.09, h=0.10, segments=28):
    """Vaso cônico com borda + prato de terra."""
    c1, c2 = (TERRACOTTA, TERRACOTTA_D) if kind == 'terracotta' else (STONE, STONE_D)
    rb = r * 0.68
    profile = [
        (rb * 0.98, 0.0),
        (rb, 0.004),
        (r * 0.97, h * 0.82),
        (r * 0.97, h * 0.84),
        (r * 1.06, h * 0.86),
        (r * 1.06, h),
        (r * 0.92, h),
        (r * 0.92, h * 0.90),
    ]
    body = lathe(profile, segments=segments, cap_bottom=True,
                 color_fn=lambda t: lerp(c2, c1, t * 1.4))
    soil = lathe([(r * 0.90, h * 0.90), (r * 0.55, h * 0.935), (0.001, h * 0.95)],
                 segments=segments, color_fn=lambda t: lerp(SOIL, SOIL_L, t * 0.6))
    return merge([body, soil]), h * 0.93  # malha, nível do substrato


def flower_head(n_petals, petal_len, petal_w, petal_color, petal_tip=None,
                center_r=0.0, center_color=None, tilt=0.35, layers=1, cup=0.25,
                shape='petal', rng=None):
    """Flor genérica: anel(éis) de pétalas + miolo."""
    petal_tip = petal_tip if petal_tip is not None else petal_color
    parts = []
    for L in range(layers):
        k = n_petals - L * 2 if layers > 1 else n_petals
        sc = 1.0 - 0.28 * L
        def mk(i, sc=sc):
            return leaf(petal_len * sc, petal_w * sc, shape=shape, bend=0.25,
                        cup=cup, color_base=petal_color, color_tip=petal_tip,
                        nu=8, nv=5, rng=rng)
        parts.append(place_radial(mk, k, tilt + 0.25 * L, tilt + 0.25 * L,
                                  rng=rng, golden=False, yaw_jitter=0.05,
                                  scale_range=(0.96, 1.04)))
    if center_r > 0:
        parts.append(sphere(center_r, color=center_color, squash=0.55,
                            seg_u=10, seg_v=6))
    return merge(parts)


def stem_curve(h, lean=0.12, n=8, rng=None, sway=0.0):
    """Polilinha de caule com leve curvatura."""
    ts = np.linspace(0, 1, n)
    lx = rng.uniform(-lean, lean) if rng else lean
    lz = rng.uniform(-lean, lean) if rng else 0.0
    xs = lx * ts ** 2 * h + (sway * np.sin(ts * np.pi * 2) * h if sway else 0)
    zs = lz * ts ** 2 * h
    return np.stack([xs, ts * h, zs], axis=1)


def foliage_bush(rng, n_leaves, leaf_len, leaf_w, shape, c_base, c_tip,
                 h_min, h_max, tilt_lo=0.15, tilt_hi=1.1, stem_r=0.0035,
                 stem_color=None, cup=0.18, bend=0.45, edge_wave=0.0,
                 spread=0.02):
    """Arbusto genérico: caules finos, cada um com folha na ponta."""
    stem_color = stem_color if stem_color is not None else GREEN_D
    parts = []
    ga = np.pi * (3 - np.sqrt(5))
    for k in range(n_leaves):
        yaw = k * ga + rng.uniform(-0.15, 0.15)
        h = rng.uniform(h_min, h_max)
        tilt = rng.uniform(tilt_lo, tilt_hi)
        # caule inclinado pra fora
        top = np.array([np.cos(yaw) * (spread + h * 0.35 * np.cos(tilt)),
                        h, -np.sin(yaw) * (spread + h * 0.35 * np.cos(tilt))])
        path = np.stack([np.array([np.cos(yaw) * spread * 0.4, 0, -np.sin(yaw) * spread * 0.4]) * t + top * t
                         for t in np.linspace(0, 1, 5)])
        path[:, 1] = np.linspace(0, h, 5)
        parts.append(tube(path, stem_r, segments=5, base_color=stem_color, cap_end=False))
        lf = leaf(leaf_len * rng.uniform(0.85, 1.15), leaf_w, shape=shape,
                  bend=bend, cup=cup, edge_wave=edge_wave,
                  color_base=jitter_color(rng, c_base), color_tip=jitter_color(rng, c_tip),
                  nu=10, nv=5)
        lf = transform(lf, R=rot_z(0.9 - tilt * 0.5))
        lf = transform(lf, R=rot_y(yaw), t=top)
        parts.append(lf)
    return merge(parts)


def potted(plant, pot_kind='terracotta', pot_r=0.09, pot_h=0.10):
    p, soil_y = pot(pot_kind, r=pot_r, h=pot_h)
    return merge([p, transform(plant, t=(0, soil_y, 0))])


# ---------------------------------------------------------------- suculentas

def build_echeveria(rng):
    """Roseta compacta de folhas grossas azul-esverdeadas com ponta rosada."""
    base = col('#4f8563')
    def mk(k):
        t = k / 24
        L = 0.078 * (1 - 0.6 * t)  # folhas internas menores
        c = jitter_color(rng, lerp(base, col('#6fa37f'), t), 5)
        return leaf(L, L * 0.5, shape='ovate', bend=0.16, cup=0.35,
                    thickness=0.006 * (1 - 0.4 * t),
                    color_base=c, color_tip=lerp(c, col('#c97f95'), 0.35),
                    nu=9, nv=7)
    rosette = place_radial(mk, 24, 0.3, 1.35, rng=rng, scale_range=(0.95, 1.05))
    return potted(rosette, 'terracotta', pot_r=0.05, pot_h=0.055)


def build_kalanchoe(rng):
    """Folhas grossas recortadas + buquê de florzinhas laranja/vermelhas."""
    def mk(k):
        t = k / 14
        return leaf(0.06 * (1 - 0.3 * t), 0.045, shape='ovate', bend=0.25,
                    cup=0.25, thickness=0.004, edge_wave=0.03,
                    color_base=jitter_color(rng, GREEN_GLOSSY),
                    color_tip=jitter_color(rng, GREEN_L), nu=9, nv=6)
    fol = place_radial(mk, 14, 0.35, 1.0, rng=rng)
    flowers = []
    for _ in range(3):
        st = stem_curve(0.10, lean=0.25, rng=rng)
        stem = tube(st, 0.003, base_color=GREEN_D, cap_end=False)
        cluster = []
        for _ in range(12):
            f = flower_head(4, 0.014, 0.010, col('#e8542f'), petal_tip=col('#ff8a4d'),
                            center_r=0.0025, center_color=col('#ffd24d'), tilt=0.5, rng=rng)
            off = rng.uniform(-0.02, 0.02, 3)
            off[1] = rng.uniform(0, 0.025)
            cluster.append(transform(f, t=st[-1] + off))
        flowers.append(merge([stem, merge(cluster)]))
    return potted(merge([fol, merge(flowers)]), 'terracotta', pot_r=0.075, pot_h=0.08)


def build_jade(rng):
    """Mini-árvore de tronco grosso com folhinhas redondas suculentas."""
    trunk_c = col('#7a5a3a')
    trunk = tube(stem_curve(0.12, lean=0.1, rng=rng), np.linspace(0.011, 0.007, 8),
                 base_color=trunk_c, segments=10)
    parts = [trunk]
    for _ in range(7):
        yaw = rng.uniform(0, 2 * np.pi)
        y0 = rng.uniform(0.05, 0.11)
        br_len = rng.uniform(0.05, 0.09)
        p0 = np.array([0, y0, 0])
        p1 = p0 + np.array([np.cos(yaw) * br_len, br_len * 0.7, -np.sin(yaw) * br_len])
        path = np.stack([p0 + (p1 - p0) * t for t in np.linspace(0, 1, 4)])
        parts.append(tube(path, np.linspace(0.005, 0.003, 4), base_color=trunk_c, segments=7))
        for _ in range(14):
            t = rng.uniform(0.4, 1.0)
            pos = p0 + (p1 - p0) * t + rng.uniform(-0.012, 0.012, 3)
            lf = leaf(0.022, 0.017, shape='round', bend=0.1, cup=0.2, thickness=0.005,
                      color_base=jitter_color(rng, col('#4e8f4a')),
                      color_tip=jitter_color(rng, col('#79b26a')), nu=6, nv=5)
            lf = transform(lf, R=rot_z(rng.uniform(-0.4, 0.7)))
            lf = transform(lf, R=rot_y(rng.uniform(0, 2 * np.pi)), t=pos)
            parts.append(lf)
    return potted(merge(parts), 'terracotta', pot_r=0.08, pot_h=0.085)


def build_aloe(rng):
    """Babosa: roseta ereta de folhas grossas afiladas com pintas."""
    def mk(k):
        t = k / 16
        L = 0.22 * (1 - 0.45 * t)
        c = jitter_color(rng, col('#5f9a58'), 8)
        return leaf(L, 0.045 * (1 - 0.3 * t), shape='lanceolate', bend=0.28,
                    cup=0.5, thickness=0.010,
                    color_base=c, color_tip=lerp(c, col('#8fbf74'), 0.7), nu=12, nv=6)
    rosette = place_radial(mk, 16, 0.7, 1.25, rng=rng)
    return potted(rosette, 'terracotta', pot_r=0.085, pot_h=0.09)


def build_rosa_deserto(rng):
    """Caudex bojudo + galhos com flores rosa."""
    caudex = lathe([(0.001, 0), (0.035, 0.008), (0.045, 0.03), (0.035, 0.08),
                    (0.018, 0.12), (0.012, 0.14)], segments=18,
                   color_fn=lambda t: lerp(col('#9a7a5a'), col('#b89a78'), t))
    parts = [caudex]
    for _ in range(4):
        yaw = rng.uniform(0, 2 * np.pi)
        p0 = np.array([0, 0.13, 0])
        p1 = p0 + np.array([np.cos(yaw) * 0.05, 0.07, -np.sin(yaw) * 0.05])
        path = np.stack([p0 + (p1 - p0) * t for t in np.linspace(0, 1, 4)])
        parts.append(tube(path, np.linspace(0.008, 0.004, 4), base_color=col('#a08464'), segments=7))
        for _ in range(4):
            lf = leaf(0.05, 0.02, shape='ovate', bend=0.3, cup=0.1,
                      color_base=GREEN_GLOSSY, color_tip=GREEN_L, nu=8, nv=5)
            lf = transform(lf, R=rot_z(rng.uniform(0.1, 0.6)))
            lf = transform(lf, R=rot_y(rng.uniform(0, 2 * np.pi)),
                           t=p1 + rng.uniform(-0.01, 0.01, 3))
            parts.append(lf)
        f = flower_head(5, 0.035, 0.028, col('#e86a9a'), petal_tip=col('#f5a8c4'),
                        center_r=0.006, center_color=col('#fff0b0'), tilt=0.35,
                        shape='petal_wide', rng=rng)
        parts.append(transform(f, t=p1 + np.array([0, 0.015, 0])))
    return potted(merge(parts), 'terracotta', pot_r=0.085, pot_h=0.09)


# ------------------------------------------------------------------- cactos

def ribbed_column(h, r, ribs=8, rib_depth=0.18, color_lo=None, color_hi=None,
                  segments_per_rib=4, ny=12, dome=True):
    """Coluna de cacto com nervuras verticais e topo abaulado."""
    seg = ribs * segments_per_rib
    ang = np.linspace(0, 2 * np.pi, seg + 1)
    ys = np.linspace(0, h, ny)
    V, C = [], []
    for i, y in enumerate(ys):
        t = i / (ny - 1)
        # afunila e abaula no topo
        rr = r * (1 - 0.15 * t)
        if dome and t > 0.8:
            rr *= np.sqrt(max(1 - ((t - 0.8) / 0.2) ** 2 * 0.9, 0.05))
        c = lerp(color_lo, color_hi, t)
        for a in ang:
            rib = 1 - rib_depth * (0.5 + 0.5 * np.cos(a * ribs))
            V.append([rr * rib * np.cos(a), y, rr * rib * np.sin(a)])
            C.append(c)
    from meshlib import grid_faces
    F = grid_faces(ny, seg + 1)
    top = sphere(r * 0.25, color=color_hi, squash=0.5, seg_u=8, seg_v=4)
    top = transform(top, t=(0, h * 0.99, 0))
    return merge([mesh(V, F, np.clip(C, 0, 255).astype(np.uint8)), top])


def cactus_spines(rng, h, r, ribs, count, color=None):
    """Espinhos: pequenos triângulos em cruz sobre as nervuras."""
    color = color if color is not None else col('#e8e0c0')
    parts = []
    for _ in range(count):
        a = (rng.integers(0, ribs) / ribs) * 2 * np.pi
        y = rng.uniform(0.05 * h, 0.95 * h)
        rr = r * (1 - 0.15 * y / h) * 1.0
        pos = np.array([rr * np.cos(a), y, rr * np.sin(a)])
        sp = leaf(0.012, 0.0015, shape='needle', bend=0.05, cup=0,
                  color_base=color, color_tip=color, nu=3, nv=3)
        sp = transform(sp, R=rot_y(-a + rng.uniform(-0.5, 0.5)), t=pos)
        parts.append(sp)
    return merge(parts)


def build_cacto_vela(rng):
    c_lo, c_hi = col('#3a7a44'), col('#5aa062')
    main = ribbed_column(0.34, 0.045, ribs=8, color_lo=c_lo, color_hi=c_hi)
    side = ribbed_column(0.16, 0.030, ribs=7, color_lo=c_lo, color_hi=c_hi)
    side = transform(side, t=(0.055, 0.0, 0.01))
    spines = merge([cactus_spines(rng, 0.34, 0.045, 8, 70),
                    transform(cactus_spines(rng, 0.16, 0.030, 7, 30), t=(0.055, 0, 0.01))])
    return potted(merge([main, side, spines]), 'terracotta', pot_r=0.085, pot_h=0.095)


def build_mandacaru(rng):
    """Colunar com braços erguidos, estilo caatinga."""
    c_lo, c_hi = col('#2f6e3e'), col('#4f9457')
    main = ribbed_column(0.48, 0.05, ribs=9, color_lo=c_lo, color_hi=c_hi, ny=16)
    parts = [main]
    for side in (-1, 1):
        y0 = rng.uniform(0.16, 0.24)
        elbow = np.array([side * 0.085, y0 + 0.02, rng.uniform(-0.02, 0.02)])
        path = np.stack([
            np.array([side * 0.04, y0, 0]),
            np.array([side * 0.08, y0 + 0.005, elbow[2]]),
            elbow,
        ])
        parts.append(tube(path, 0.032, segments=9, base_color=c_lo, cap_end=False))
        arm = ribbed_column(rng.uniform(0.14, 0.2), 0.032, ribs=8,
                            color_lo=c_lo, color_hi=c_hi, ny=8)
        parts.append(transform(arm, t=elbow))
    parts.append(cactus_spines(rng, 0.48, 0.05, 9, 90))
    f = flower_head(8, 0.03, 0.014, col('#f5f0e0'), center_r=0.006,
                    center_color=col('#f0e0a0'), tilt=0.9, rng=rng)
    parts.append(transform(f, t=(0.02, 0.47, 0.01)))
    return potted(merge(parts), 'terracotta', pot_r=0.10, pot_h=0.10)


# ----------------------------------------------------------------- tropicais

def build_monstera(rng):
    """Costela-de-Adão: folhas cordadas grandes com recortes."""
    parts = []
    n = 7
    for k in range(n):
        yaw = k * 2.4 + rng.uniform(-0.2, 0.2)
        h = rng.uniform(0.18, 0.34)
        lean = 0.35 + 0.3 * rng.random()
        top = np.array([np.cos(yaw) * h * lean * 0.5, h, -np.sin(yaw) * h * lean * 0.5])
        path = np.stack([top * t for t in np.linspace(0, 1, 6)])
        path[:, 1] = np.linspace(0, h, 6) ** 1.1 * h ** -0.1
        parts.append(tube(path, np.linspace(0.008, 0.005, 6), base_color=GREEN_D, cap_end=False))
        L = rng.uniform(0.19, 0.27)
        lf = leaf(L, L * 0.9, shape='cordate', bend=0.28, cup=0.06,
                  splits=3, split_depth=0.42,
                  color_base=jitter_color(rng, col('#2c6e35')),
                  color_tip=jitter_color(rng, col('#47934f')), nu=20, nv=13)
        lf = transform(lf, R=rot_z(0.45 - rng.uniform(0, 0.45)))
        lf = transform(lf, R=rot_y(yaw), t=top)
        parts.append(lf)
    return potted(merge(parts), 'stone', pot_r=0.11, pot_h=0.115)


def build_espada(rng):
    """Espada-de-São-Jorge: lâminas eretas com leve torção."""
    def mk(k):
        t = k / 12
        L = rng.uniform(0.36, 0.52) * (1 - 0.25 * t)
        c = jitter_color(rng, col('#2f6b3a'), 6)
        return leaf(L, 0.045, shape='strap', bend=0.08, cup=0.3,
                    twist=rng.uniform(-0.5, 0.5),
                    color_base=c, color_tip=lerp(c, col('#c9d96a'), 0.55),
                    nu=14, nv=5)
    blades = place_radial(mk, 12, 1.28, 1.45, rng=rng, scale_range=(0.9, 1.1))
    return potted(blades, 'terracotta', pot_r=0.075, pot_h=0.09)


def build_zamioculca(rng):
    """Hastes arqueadas com folíolos ovais brilhantes alternados."""
    parts = []
    for k in range(6):
        yaw = k * 1.05 + rng.uniform(-0.2, 0.2)
        h = rng.uniform(0.24, 0.36)
        lean = rng.uniform(0.25, 0.45)
        path = stem_curve(h, lean=lean, n=9, rng=rng)
        path = (rot_y(yaw) @ path.T).T
        parts.append(tube(np.asarray(path), np.linspace(0.006, 0.003, 9),
                          base_color=col('#2d5c33'), cap_end=False))
        for i in range(3, 9):
            t = i / 8
            p = path[i]
            for side in (-1, 1):
                lf = leaf(0.045, 0.022, shape='ovate', bend=0.2, cup=0.15,
                          color_base=jitter_color(rng, col('#265c2e')),
                          color_tip=jitter_color(rng, col('#3f8a48')), nu=7, nv=5)
                lf = transform(lf, R=rot_z(rng.uniform(0.0, 0.4)))
                lf = transform(lf, R=rot_y(yaw + side * 1.25 + rng.uniform(-0.2, 0.2)), t=p)
                parts.append(lf)
    return potted(merge(parts), 'stone', pot_r=0.09, pot_h=0.10)


def build_jiboia(rng):
    """Trepadeira pendente: vinhas caindo do vaso com folhas cordadas."""
    parts = []
    for k in range(8):
        yaw = k * 0.785 + rng.uniform(-0.3, 0.3)
        vlen = rng.uniform(0.10, 0.20)
        dirv = np.array([np.cos(yaw), 0, -np.sin(yaw)])
        # vinha sai do centro, passa da borda e cai
        pts = []
        for t in np.linspace(0, 1, 10):
            radial = dirv * (0.02 + t * 0.09)
            y = 0.02 + 0.02 * np.sin(t * np.pi) - (t ** 1.8) * vlen
            pts.append([radial[0], y, radial[2]])
        path = np.asarray(pts)
        parts.append(tube(path, 0.0035, base_color=col('#3a7a40'), cap_end=False))
        for i in range(1, 10):
            p = path[i]
            lf = leaf(0.05, 0.042, shape='cordate', bend=0.35, cup=0.12,
                      color_base=jitter_color(rng, col('#3c8a42')),
                      color_tip=jitter_color(rng, col('#8fc464')), nu=9, nv=7)
            lf = transform(lf, R=rot_z(-0.7 - 0.06 * i))
            lf = transform(lf, R=rot_y(yaw + rng.uniform(-0.7, 0.7)), t=p)
            parts.append(lf)
    # tufo no topo
    tuft = foliage_bush(rng, 8, 0.06, 0.05, 'cordate', col('#3c8a42'), col('#8fc464'),
                        0.03, 0.09, stem_r=0.003)
    return potted(merge(parts + [tuft]), 'terracotta', pot_r=0.09, pot_h=0.10)


def build_peperomia(rng):
    fol = foliage_bush(rng, 16, 0.05, 0.04, 'ovate', col('#2f7a3a'), col('#55a555'),
                       0.04, 0.12, tilt_lo=0.3, tilt_hi=1.0, cup=0.28, bend=0.25)
    return potted(fol, 'terracotta', pot_r=0.075, pot_h=0.08)


def build_pilea(rng):
    """Folhas-moeda: discos em hastes finas."""
    parts = []
    for k in range(14):
        yaw = k * 2.4 + rng.uniform(-0.25, 0.25)
        h = rng.uniform(0.06, 0.16)
        lean = rng.uniform(0.3, 0.7)
        top = np.array([np.cos(yaw) * h * lean, h, -np.sin(yaw) * h * lean])
        path = np.stack([top * t for t in np.linspace(0, 1, 5)])
        parts.append(tube(path, 0.0025, base_color=col('#5a8a4a'), cap_end=False))
        d = rng.uniform(0.035, 0.06)
        lf = leaf(d, d * 0.95, shape='round', bend=0.06, cup=0.06,
                  color_base=jitter_color(rng, col('#3f8f46')),
                  color_tip=jitter_color(rng, col('#5fae5f')), nu=9, nv=9)
        lf = transform(lf, t=(-d / 2, 0, 0))          # centraliza o disco
        lf = transform(lf, R=rot_z(rng.uniform(-0.15, 0.3)))
        lf = transform(lf, R=rot_y(yaw), t=top)
        parts.append(lf)
    return potted(merge(parts), 'terracotta', pot_r=0.075, pot_h=0.08)


def build_samambaia(rng):
    """Frondes pinadas arqueadas pra todos os lados."""
    def frond(k):
        L = rng.uniform(0.20, 0.30)
        rachis = np.stack([[t * L, np.sin(t * np.pi * 0.5) * L * 0.15 - t ** 2 * L * 0.35, 0]
                           for t in np.linspace(0, 1, 10)])
        parts = [tube(rachis, np.linspace(0.0025, 0.001, 10),
                      base_color=col('#4a7a3a'), segments=5, cap_end=False)]
        for i in range(1, 10):
            t = i / 9
            p = rachis[i]
            pl = 0.035 * np.sin(np.pi * min(t * 1.15, 1)) + 0.008
            for side in (-1, 1):
                pin = leaf(pl, pl * 0.32, shape='lanceolate', bend=0.15, cup=0.1,
                           color_base=jitter_color(rng, col('#3a7a34'), 6),
                           color_tip=jitter_color(rng, col('#5f9e4f'), 6), nu=5, nv=3)
                pin = transform(pin, R=rot_y(side * 1.15), t=p)
                parts.append(pin)
        return merge(parts)
    fronds = place_radial(frond, 16, 0.15, 1.1, rng=rng, scale_range=(0.8, 1.1))
    return potted(fronds, 'terracotta', pot_r=0.09, pot_h=0.10)


def build_bromelia(rng):
    """Roseta de fitas + inflorescência rosa central."""
    def mk(k):
        t = k / 14
        L = 0.20 * (1 - 0.4 * t)
        c = jitter_color(rng, col('#4a8a52'), 6)
        return leaf(L, 0.045, shape='strap', bend=0.42, cup=0.4,
                    color_base=c, color_tip=lerp(c, col('#7ab080'), 0.5), nu=12, nv=5)
    rosette = place_radial(mk, 14, 0.55, 1.15, rng=rng)
    spike_stem = tube(np.stack([[0, t * 0.16, 0] for t in np.linspace(0, 1, 4)]),
                      0.008, base_color=col('#d06080'), cap_end=False)
    def bract(k):
        return leaf(0.05, 0.02, shape='lanceolate', bend=0.15, cup=0.25,
                    color_base=col('#e05a8a'), color_tip=col('#f490b8'), nu=7, nv=4)
    spike = place_radial(bract, 12, 0.5, 1.1, rng=rng)
    spike = transform(spike, t=(0, 0.16, 0))
    return potted(merge([rosette, spike_stem, spike]), 'stone', pot_r=0.09, pot_h=0.095)


def build_strelitzia(rng):
    """Estrelícia: folhas-remo + flor ave-do-paraíso."""
    parts = []
    for k in range(5):
        yaw = k * 1.25 + rng.uniform(-0.15, 0.15)
        h = rng.uniform(0.22, 0.34)
        path = stem_curve(h, lean=0.18, rng=rng)
        path = (rot_y(yaw) @ path.T).T
        parts.append(tube(np.asarray(path), np.linspace(0.007, 0.004, 8),
                          base_color=col('#3a6b3a'), cap_end=False))
        lf = leaf(0.16, 0.09, shape='ovate', bend=0.3, cup=0.12,
                  color_base=jitter_color(rng, col('#33703c')),
                  color_tip=jitter_color(rng, col('#4f8f57')), nu=12, nv=7)
        lf = transform(lf, R=rot_z(0.5))
        lf = transform(lf, R=rot_y(yaw), t=path[-1])
        parts.append(lf)
    # flor: bico + leque laranja + língua azul
    fh = 0.30
    fstem = tube(np.stack([[t * 0.05, t * fh, 0] for t in np.linspace(0, 1, 6)]),
                 0.006, base_color=col('#3a6b3a'), cap_end=False)
    beak = leaf(0.11, 0.03, shape='lanceolate', bend=0.0, cup=0.5,
                color_base=col('#4a7a5a'), color_tip=col('#c05a6a'), nu=8, nv=5)
    beak = transform(beak, R=rot_z(-0.25), t=(0.05, fh, 0))
    petals = []
    for i in range(4):
        p = leaf(0.09, 0.016, shape='lanceolate', bend=-0.1, cup=0.2,
                 color_base=col('#f08a1e'), color_tip=col('#ffb03a'), nu=8, nv=4)
        p = transform(p, R=rot_z(0.5 + i * 0.35), t=(0.06, fh, 0))
        petals.append(p)
    tongue = leaf(0.07, 0.012, shape='lanceolate', bend=-0.05, cup=0.3,
                  color_base=col('#2a4ac0'), color_tip=col('#4a6ae0'), nu=7, nv=4)
    tongue = transform(tongue, R=rot_z(0.65), t=(0.065, fh + 0.005, 0))
    parts += [fstem, beak, merge(petals), tongue]
    return potted(merge(parts), 'terracotta', pot_r=0.10, pot_h=0.11)


def build_palmeira(rng):
    """Areca: várias canas finas + frondes pinadas arqueadas."""
    parts = []
    for k in range(4):
        off = np.array([rng.uniform(-0.03, 0.03), 0, rng.uniform(-0.03, 0.03)])
        h = rng.uniform(0.35, 0.5)
        cane = tube(np.stack([off * (1 - t) * 0.5 + np.array([off[0], t * h, off[2]])
                              for t in np.linspace(0, 1, 6)]),
                    np.linspace(0.012, 0.007, 6),
                    base_color=col('#c8b26a'), cap_end=False)
        parts.append(cane)
        topo = np.array([off[0], h, off[2]])
        for j in range(5):
            yaw = j * 1.256 + k * 0.5 + rng.uniform(-0.2, 0.2)
            L = rng.uniform(0.25, 0.38)
            rachis = np.stack([topo + (rot_y(yaw) @ np.array([t * L, np.sin(t * 2.2) * L * 0.28 - t ** 2 * L * 0.15, 0]))
                               for t in np.linspace(0, 1, 10)])
            parts.append(tube(rachis, np.linspace(0.004, 0.0015, 10),
                              base_color=col('#7a9a4a'), segments=5, cap_end=False))
            for i in range(1, 10):
                t = i / 9
                pl = 0.09 * np.sin(np.pi * min(t * 1.2, 1)) + 0.01
                for side in (-1, 1):
                    pin = leaf(pl, pl * 0.14, shape='lanceolate', bend=0.35, cup=0.1,
                               color_base=jitter_color(rng, col('#4a8a42'), 6),
                               color_tip=jitter_color(rng, col('#79ae5f'), 6), nu=5, nv=3)
                    pin = transform(pin, R=rot_z(-0.2), s=1.0)
                    pin = transform(pin, R=rot_y(yaw + side * 0.85), t=rachis[i])
                    parts.append(pin)
    return potted(merge(parts), 'stone', pot_r=0.115, pot_h=0.12)


def build_ficus_lyrata(rng):
    """Ficus lira: tronco fino + folhas violão grandes e brilhantes."""
    h = 0.55
    trunk = tube(stem_curve(h, lean=0.06, rng=rng), np.linspace(0.012, 0.007, 8),
                 base_color=col('#8a7050'), segments=9)
    parts = [trunk]
    for k in range(11):
        t = 0.35 + 0.65 * k / 10
        yaw = k * 2.4 + rng.uniform(-0.2, 0.2)
        pos = np.array([0.06 * t ** 2, t * h, 0])
        L = rng.uniform(0.12, 0.17)
        lf = leaf(L, L * 0.72, shape='fiddle', bend=0.3, cup=0.14, edge_wave=0.02,
                  color_base=jitter_color(rng, col('#2c6630')),
                  color_tip=jitter_color(rng, col('#3f8a45')), nu=14, nv=9)
        lf = transform(lf, R=rot_z(rng.uniform(-0.35, 0.15)))
        lf = transform(lf, R=rot_y(yaw), t=(pos[0] * np.cos(yaw), pos[1], -pos[0] * np.sin(yaw)))
        parts.append(lf)
    return potted(merge(parts), 'stone', pot_r=0.10, pot_h=0.12)


# -------------------------------------------------------------------- ervas

def build_manjericao(rng):
    fol = foliage_bush(rng, 26, 0.045, 0.03, 'ovate', col('#3f8f3a'), col('#66b25a'),
                       0.06, 0.17, tilt_lo=0.2, tilt_hi=1.2, cup=0.22, bend=0.35)
    return potted(fol, 'stone', pot_r=0.08, pot_h=0.085)


def build_hortela(rng):
    fol = foliage_bush(rng, 24, 0.04, 0.032, 'ovate', col('#4aa04a'), col('#7cc86a'),
                       0.05, 0.15, tilt_lo=0.2, tilt_hi=1.2, cup=0.15, bend=0.3,
                       edge_wave=0.04)
    return potted(fol, 'stone', pot_r=0.08, pot_h=0.085)


def build_salsa(rng):
    """Salsinha: hastes finas com tufos triplos recortados."""
    parts = []
    for k in range(18):
        yaw = k * 2.4 + rng.uniform(-0.3, 0.3)
        h = rng.uniform(0.08, 0.16)
        lean = rng.uniform(0.15, 0.5)
        top = np.array([np.cos(yaw) * h * lean, h, -np.sin(yaw) * h * lean])
        path = np.stack([top * t for t in np.linspace(0, 1, 4)])
        parts.append(tube(path, 0.0018, base_color=col('#4a9a3a'), segments=4, cap_end=False))
        for j, dyaw in enumerate((-0.7, 0.0, 0.7)):
            lf = leaf(0.022, 0.02, shape='round', bend=0.15, cup=0.05, edge_wave=0.12,
                      color_base=jitter_color(rng, col('#3f9a38')),
                      color_tip=jitter_color(rng, col('#5fbe50')), nu=6, nv=6)
            lf = transform(lf, R=rot_z(0.3))
            lf = transform(lf, R=rot_y(yaw + dyaw), t=top)
            parts.append(lf)
    return potted(merge(parts), 'stone', pot_r=0.075, pot_h=0.08)


def build_alecrim(rng):
    """Alecrim: hastes lenhosas eretas cobertas de agulhinhas."""
    parts = []
    for k in range(10):
        yaw = k * 0.63 + rng.uniform(-0.2, 0.2)
        h = rng.uniform(0.13, 0.21)
        lean = rng.uniform(0.05, 0.3)
        path = stem_curve(h, lean=lean, n=9, rng=rng)
        path = (rot_y(yaw) @ path.T).T
        parts.append(tube(np.asarray(path), np.linspace(0.0022, 0.0012, 9),
                          base_color=col('#6a7a4a'), segments=5, cap_end=False))
        for i in range(2, 9):
            p = path[i]
            for _ in range(8):
                nd = leaf(0.024, 0.0045, shape='needle', bend=0.12, cup=0.3,
                          color_base=jitter_color(rng, col('#3d6b3d'), 8),
                          color_tip=jitter_color(rng, col('#6f9a5f'), 8), nu=4, nv=3)
                nd = transform(nd, R=rot_z(rng.uniform(0.2, 1.1)))
                nd = transform(nd, R=rot_y(rng.uniform(0, 2 * np.pi)), t=p)
                parts.append(nd)
    return potted(merge(parts), 'terracotta', pot_r=0.07, pot_h=0.08)


def build_cebolinha(rng):
    """Tufo de folhas cilíndricas finas."""
    parts = []
    for _ in range(26):
        a = rng.uniform(0, 2 * np.pi)
        r0 = rng.uniform(0, 0.02)
        h = rng.uniform(0.14, 0.26)
        lean = rng.uniform(0.05, 0.4)
        base_p = np.array([r0 * np.cos(a), 0, r0 * np.sin(a)])
        tip = base_p + np.array([np.cos(a) * lean * h * 0.4, h, -np.sin(a) * lean * h * 0.4])
        path = np.stack([base_p + (tip - base_p) * t + np.array([0, 0, 0]) for t in np.linspace(0, 1, 5)])
        path[:, 1] = np.linspace(0, h, 5) - np.linspace(0, 1, 5) ** 2.5 * h * lean * 0.3
        g = jitter_color(rng, col('#3f9a44'), 10)
        parts.append(tube(path, np.linspace(0.0028, 0.0008, 5),
                          color_fn=lambda t, g=g: lerp(g, g * 1.25, t), segments=5))
    return potted(merge(parts), 'stone', pot_r=0.07, pot_h=0.075)


# -------------------------------------------------------------------- flores

def basal_leaves(rng, n, L, W, shape='ovate', c1=None, c2=None, tilt_lo=0.25, tilt_hi=0.8):
    c1 = c1 if c1 is not None else GREEN
    c2 = c2 if c2 is not None else GREEN_L
    def mk(k):
        return leaf(L * rng.uniform(0.8, 1.15), W, shape=shape, bend=0.4, cup=0.18,
                    color_base=jitter_color(rng, c1), color_tip=jitter_color(rng, c2),
                    nu=9, nv=5)
    return place_radial(mk, n, tilt_lo, tilt_hi, rng=rng)


def build_lavanda(rng):
    """Hastes finas com espigas roxas + folhagem cinza-verde."""
    parts = [foliage_bush(rng, 18, 0.03, 0.005, 'lanceolate', col('#7d9a7b'),
                          col('#9ab896'), 0.03, 0.09, stem_r=0.0015)]
    for _ in range(12):
        h = rng.uniform(0.16, 0.26)
        path = stem_curve(h, lean=0.2, rng=rng)
        yaw = rng.uniform(0, 2 * np.pi)
        path = (rot_y(yaw) @ path.T).T
        parts.append(tube(np.asarray(path), 0.0015, base_color=col('#7a9a6a'),
                          segments=4, cap_end=False))
        top = path[-1]
        spike = []
        for i in range(8):
            t = i / 7
            b = sphere(0.006 * (1 - 0.3 * t), seg_u=6, seg_v=4, squash=0.8,
                       color=jitter_color(rng, lerp(col('#8a5ac0'), col('#b48ae0'), t), 8))
            spike.append(transform(b, t=top + np.array([0, 0.005 + i * 0.008, 0])))
        parts.append(merge(spike))
    return potted(merge(parts), 'terracotta', pot_r=0.08, pot_h=0.085)


def build_cravo(rng):
    """Tagetes: pompons laranja + folhagem recortada."""
    parts = [foliage_bush(rng, 16, 0.035, 0.02, 'lanceolate', col('#3a7a34'),
                          col('#5a9e4a'), 0.04, 0.12, edge_wave=0.08)]
    for _ in range(6):
        h = rng.uniform(0.10, 0.18)
        yaw = rng.uniform(0, 2 * np.pi)
        path = (rot_y(yaw) @ stem_curve(h, lean=0.3, rng=rng).T).T
        parts.append(tube(np.asarray(path), 0.0025, base_color=col('#3a7a34'), cap_end=False))
        pompom = []
        cbase = col('#f08a1e') if rng.random() < 0.6 else col('#e8b81e')
        for L in range(3):
            f = flower_head(8 - L, 0.020 * (1 - 0.22 * L), 0.012, cbase,
                            petal_tip=lerp(cbase, col('#ffd25a'), 0.4),
                            tilt=0.35 + 0.4 * L, shape='petal_wide', rng=rng)
            pompom.append(f)
        parts.append(transform(merge(pompom), t=np.asarray(path)[-1]))
    return potted(merge(parts), 'terracotta', pot_r=0.08, pot_h=0.085)


def build_narciso(rng):
    parts = [basal_leaves(rng, 8, 0.20, 0.018, shape='strap',
                          c1=col('#4a8a4a'), c2=col('#6aae66'), tilt_lo=0.9, tilt_hi=1.25)]
    for _ in range(4):
        h = rng.uniform(0.20, 0.28)
        yaw = rng.uniform(0, 2 * np.pi)
        path = (rot_y(yaw) @ stem_curve(h, lean=0.12, rng=rng).T).T
        parts.append(tube(np.asarray(path), 0.0035, base_color=col('#4a8a4a'), cap_end=False))
        f = flower_head(6, 0.030, 0.017, col('#f8f6ee'), petal_tip=col('#fffef8'),
                        tilt=0.25, shape='petal', rng=rng)
        cup = lathe([(0.004, 0), (0.008, 0.008), (0.009, 0.014)], segments=10,
                    color_fn=lambda t: lerp(col('#f0a818'), col('#ffcc40'), t))
        head = merge([f, cup])
        head = transform(head, R=rot_z(rng.uniform(0.5, 0.9)))
        parts.append(transform(head, R=rot_y(yaw), t=np.asarray(path)[-1]))
    return potted(merge(parts), 'stone', pot_r=0.075, pot_h=0.085)


def build_orquidea(rng):
    """Phalaenopsis: folhas basais largas + haste arqueada com flores."""
    parts = [basal_leaves(rng, 5, 0.15, 0.07, shape='strap',
                          c1=col('#2f6e38'), c2=col('#478a4d'), tilt_lo=0.2, tilt_hi=0.55)]
    h = 0.30
    path = np.stack([[t * 0.13 + t * t * 0.09, t ** 0.85 * h, 0.02 * np.sin(t * 3)]
                     for t in np.linspace(0, 1, 12)])
    parts.append(tube(path, np.linspace(0.005, 0.003, 12), base_color=col('#5a7a4a'), cap_end=False))
    pink = rng.random() < 0.5
    cp = col('#e88ab8') if pink else col('#f5f2ea')
    ct = col('#f7c2dc') if pink else col('#ffffff')
    for i in range(4, 12):
        f = merge([
            flower_head(5, 0.042, 0.030, cp, petal_tip=ct, tilt=0.12,
                        shape='petal_wide', rng=rng),
            sphere(0.007, color=col('#c04a7a'), seg_u=8, seg_v=5),
        ])
        f = transform(f, R=rot_x(np.pi / 2 * 0.65))
        f = transform(f, R=rot_y(rng.uniform(-1.8, 1.0)),
                      t=path[i] + np.array([0.015, 0, 0]))
        parts.append(f)
    return potted(merge(parts), 'stone', pot_r=0.07, pot_h=0.09)


def build_girassol(rng):
    """Girassol alto com capítulo grande."""
    h = 0.55
    stem = tube(stem_curve(h, lean=0.05, rng=rng), np.linspace(0.010, 0.006, 8),
                base_color=col('#4a8a3a'), segments=8)
    parts = [stem]
    for k in range(5):
        t = 0.25 + 0.5 * k / 4
        yaw = k * 2.2
        lf = leaf(0.12, 0.09, shape='cordate', bend=0.45, cup=0.1, edge_wave=0.03,
                  color_base=jitter_color(rng, col('#3a7a34')),
                  color_tip=jitter_color(rng, col('#559a4a')), nu=10, nv=7)
        lf = transform(lf, R=rot_z(0.4 - t * 0.3))
        lf = transform(lf, R=rot_y(yaw), t=(0.01, t * h, 0))
        parts.append(lf)
    # capítulo
    disc = sphere(0.045, color=col('#5a3a1e'), squash=0.35, seg_u=14, seg_v=7)
    disc2 = sphere(0.036, color=col('#7a4a24'), squash=0.5, seg_u=12, seg_v=6)
    disc2 = transform(disc2, t=(0, 0.008, 0))
    def ray(k):
        return leaf(0.065, 0.018, shape='petal', bend=0.12, cup=0.12,
                    color_base=col('#f2a91e'), color_tip=col('#ffd23a'), nu=7, nv=4)
    rays = place_radial(ray, 24, 0.06, 0.06, r0=0.034, rng=rng, golden=False, yaw_jitter=0.04)
    head = merge([disc, disc2, rays])
    head = transform(head, R=rot_x(np.pi / 2 * 0.75), t=(0.02, h + 0.02, 0))
    parts.append(head)
    return potted(merge(parts), 'terracotta', pot_r=0.10, pot_h=0.11)


def build_anturio(rng):
    """Antúrio: espata vermelha em coração + espádice amarelo."""
    parts = [basal_leaves(rng, 7, 0.11, 0.075, shape='cordate',
                          c1=col('#2c6630'), c2=col('#3f8a45'), tilt_lo=0.45, tilt_hi=1.0)]
    for _ in range(3):
        h = rng.uniform(0.16, 0.24)
        yaw = rng.uniform(0, 2 * np.pi)
        path = (rot_y(yaw) @ stem_curve(h, lean=0.15, rng=rng).T).T
        parts.append(tube(np.asarray(path), 0.003, base_color=col('#3a6b3a'), cap_end=False))
        spathe = leaf(0.06, 0.055, shape='cordate', bend=0.15, cup=-0.08,
                      color_base=col('#c81e28'), color_tip=col('#e8404a'), nu=10, nv=8)
        spathe = transform(spathe, R=rot_z(0.5))
        spadix = tube(np.stack([[0.005 + t * 0.008, t * 0.035, 0] for t in np.linspace(0, 1, 4)]),
                      np.linspace(0.005, 0.003, 4), base_color=col('#f0c030'))
        head = merge([spathe, spadix])
        parts.append(transform(head, R=rot_y(yaw), t=np.asarray(path)[-1]))
    return potted(merge(parts), 'stone', pot_r=0.085, pot_h=0.095)


def build_gerbera(rng):
    parts = [basal_leaves(rng, 8, 0.09, 0.035, shape='lanceolate',
                          c1=col('#3a7a34'), c2=col('#549a48'), tilt_lo=0.25, tilt_hi=0.7)]
    cols = [col('#e8483a'), col('#f0821e'), col('#e85a9a')]
    for i in range(3):
        h = rng.uniform(0.16, 0.24)
        yaw = i * 2.1 + rng.uniform(-0.3, 0.3)
        path = (rot_y(yaw) @ stem_curve(h, lean=0.18, rng=rng).T).T
        parts.append(tube(np.asarray(path), 0.003, base_color=col('#4a8a3a'), cap_end=False))
        c = cols[i % 3]
        f = merge([
            flower_head(16, 0.032, 0.008, c, petal_tip=lerp(c, col('#ffffff'), 0.25),
                        tilt=0.18, layers=2, shape='petal', rng=rng),
            sphere(0.007, color=col('#4a3020'), squash=0.5, seg_u=10, seg_v=5),
        ])
        f = transform(f, R=rot_x(np.pi / 2 * 0.7))
        parts.append(transform(f, R=rot_y(yaw), t=np.asarray(path)[-1] + np.array([0, 0.005, 0])))
    return potted(merge(parts), 'terracotta', pot_r=0.08, pot_h=0.085)


def build_tulipa(rng):
    parts = [basal_leaves(rng, 4, 0.16, 0.045, shape='strap',
                          c1=col('#5a8a5a'), c2=col('#7aa87a'), tilt_lo=0.8, tilt_hi=1.1)]
    for _ in range(3):
        h = rng.uniform(0.2, 0.27)
        yaw = rng.uniform(0, 2 * np.pi)
        path = (rot_y(yaw) @ stem_curve(h, lean=0.08, rng=rng).T).T
        parts.append(tube(np.asarray(path), 0.004, base_color=col('#5a8a5a'), cap_end=False))
        def petal(k):
            return leaf(0.045, 0.03, shape='petal_wide', bend=-0.25, cup=0.55,
                        color_base=col('#d42a3c'), color_tip=col('#f05a5a'), nu=8, nv=6)
        cupf = place_radial(petal, 6, 1.25, 1.25, rng=rng, golden=False, yaw_jitter=0.03)
        parts.append(transform(cupf, t=np.asarray(path)[-1]))
    return potted(merge(parts), 'stone', pot_r=0.075, pot_h=0.085)


def build_rosa(rng):
    """Roseira: flores em camadas + folhas serrilhadas."""
    parts = []
    for i in range(3):
        h = rng.uniform(0.18, 0.28)
        yaw = i * 2.1 + rng.uniform(-0.3, 0.3)
        path = (rot_y(yaw) @ stem_curve(h, lean=0.15, rng=rng).T).T
        parts.append(tube(np.asarray(path), np.linspace(0.004, 0.0025, 8),
                          base_color=col('#3a6b2e'), cap_end=False))
        for j in range(3):
            t = 0.3 + j * 0.25
            idx = int(t * 7)
            lf = leaf(0.035, 0.022, shape='ovate', bend=0.25, cup=0.12, edge_wave=0.05,
                      color_base=jitter_color(rng, col('#2f6b2a')),
                      color_tip=jitter_color(rng, col('#478a3d')), nu=7, nv=5)
            lf = transform(lf, R=rot_z(0.3))
            lf = transform(lf, R=rot_y(yaw + j * 2.0), t=np.asarray(path)[idx])
            parts.append(lf)
        bloom = flower_head(7, 0.028, 0.024, col('#c01830'), petal_tip=col('#e84858'),
                            tilt=0.55, layers=3, cup=0.5, shape='petal_wide', rng=rng)
        bud = sphere(0.008, color=col('#a01228'), squash=1.1, seg_u=8, seg_v=5)
        parts.append(transform(merge([bloom, bud]),
                               t=np.asarray(path)[-1] + np.array([0, 0.005, 0])))
    parts.append(foliage_bush(rng, 8, 0.03, 0.02, 'ovate', col('#2f6b2a'), col('#478a3d'),
                              0.04, 0.10))
    return potted(merge(parts), 'terracotta', pot_r=0.08, pot_h=0.09)


BUILDERS = {
    'echeveria-elegans': build_echeveria,
    'pilea': build_pilea,
    'monstera-deliciosa': build_monstera,
    'cacto-vela': build_cacto_vela,
    'espada-sao-jorge': build_espada,
    'manjericao': build_manjericao,
    'hortela': build_hortela,
    'lavanda': build_lavanda,
    'cravo-defunto': build_cravo,
    'narciso': build_narciso,
    'strelitzia': build_strelitzia,
    'orquidea-phalaenopsis': build_orquidea,
    'zamioculca': build_zamioculca,
    'jiboia': build_jiboia,
    'peperomia': build_peperomia,
    'kalanchoe': build_kalanchoe,
    'jade': build_jade,
    'aloe-vera': build_aloe,
    'rosa-deserto': build_rosa_deserto,
    'samambaia': build_samambaia,
    'antúrio': build_anturio,
    'girassol': build_girassol,
    'bromelia': build_bromelia,
    'salsa': build_salsa,
    'alecrim': build_alecrim,
    'cebolinha': build_cebolinha,
    'gerbera': build_gerbera,
    'tulipa': build_tulipa,
    'rosa': build_rosa,
    'mandacaru': build_mandacaru,
    'palmeira': build_palmeira,
    'ficus-lyrata': build_ficus_lyrata,
}
