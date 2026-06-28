#!/usr/bin/env python3
"""
Gerador procedural dos modelos 3D de plantas (AR / visualizador).

Por quê: os modelos anteriores eram primitivas cruas (uma bolha + um cilindro)
e usuários relatavam não reconhecer que era uma planta. Aqui montamos silhuetas
claramente legíveis por categoria — flor com pétalas em coroa, cacto saguaro,
árvore com copa em nuvem, suculenta em roseta, erva em tufo, tropical com folhas
largas — sempre num vaso com terra, pra leitura instantânea.

Emite, por categoria, em public/models/:
  - plant-<cat>.glb   (Android Scene Viewer / WebXR + visualizador padrão)
  - plant-<cat>.usdz  (iOS AR Quick Look, via USDA empacotado)

Sem dependências externas. Rode:  python3 scripts/gen-models.py
"""

import math
import struct
import json
import os
import zipfile

OUT = os.path.join(os.path.dirname(__file__), "..", "public", "models")

# ----------------------------------------------------------------------------
# Álgebra mínima (vetores / matrizes 3x3), Python puro.
# ----------------------------------------------------------------------------

def mat_mul(a, b):
    return [[sum(a[i][k] * b[k][j] for k in range(3)) for j in range(3)] for i in range(3)]

def mat_vec(m, v):
    return [sum(m[i][k] * v[k] for k in range(3)) for i in range(3)]

def rot_x(t):
    c, s = math.cos(t), math.sin(t)
    return [[1, 0, 0], [0, c, -s], [0, s, c]]

def rot_y(t):
    c, s = math.cos(t), math.sin(t)
    return [[c, 0, s], [0, 1, 0], [-s, 0, c]]

def rot_z(t):
    c, s = math.cos(t), math.sin(t)
    return [[c, -s, 0], [s, c, 0], [0, 0, 1]]

def normalize(v):
    n = math.sqrt(v[0] ** 2 + v[1] ** 2 + v[2] ** 2) or 1.0
    return [v[0] / n, v[1] / n, v[2] / n]


class Geom:
    """Acumula posições, normais e índices (triângulos)."""

    def __init__(self):
        self.pos = []
        self.nrm = []
        self.idx = []

    def add(self, verts, norms, faces, scale=(1, 1, 1), rot=None, translate=(0, 0, 0)):
        """Adiciona uma malha aplicando S, depois R, depois T.

        rot: matriz 3x3 (ou None). Normais usam R * (n / S) normalizado.
        """
        base = len(self.pos)
        sx, sy, sz = scale
        R = rot
        tx, ty, tz = translate
        for (x, y, z) in verts:
            x, y, z = x * sx, y * sy, z * sz
            if R:
                x, y, z = mat_vec(R, (x, y, z))
            self.pos.append((x + tx, y + ty, z + tz))
        for (nx, ny, nz) in norms:
            nx, ny, nz = nx / sx, ny / sy, nz / sz
            if R:
                nx, ny, nz = mat_vec(R, (nx, ny, nz))
            self.nrm.append(tuple(normalize((nx, ny, nz))))
        for f in faces:
            self.idx.append((f[0] + base, f[1] + base, f[2] + base))


# ----------------------------------------------------------------------------
# Primitivas paramétricas
# ----------------------------------------------------------------------------

def cylinder(r_bottom, r_top, height, seg=16, cap_bottom=True, cap_top=True, y0=0.0):
    """Cilindro/cone truncado ao longo de +Y, base em y0."""
    verts, norms, faces = [], [], []
    for i in range(seg + 1):
        a = 2 * math.pi * i / seg
        ca, sa = math.cos(a), math.sin(a)
        # parede inferior
        verts.append((r_bottom * ca, y0, r_bottom * sa))
        # parede superior
        verts.append((r_top * ca, y0 + height, r_top * sa))
        # normal lateral aproximada (inclui inclinação do cone)
        slope = (r_bottom - r_top)
        nrm = normalize((ca, slope / max(height, 1e-4), sa))
        norms.append(nrm)
        norms.append(nrm)
    for i in range(seg):
        b = i * 2
        faces.append((b, b + 1, b + 2))
        faces.append((b + 1, b + 3, b + 2))
    if cap_bottom and r_bottom > 1e-5:
        c = len(verts)
        verts.append((0, y0, 0)); norms.append((0, -1, 0))
        ring0 = len(verts)
        for i in range(seg + 1):
            a = 2 * math.pi * i / seg
            verts.append((r_bottom * math.cos(a), y0, r_bottom * math.sin(a)))
            norms.append((0, -1, 0))
        for i in range(seg):
            faces.append((c, ring0 + i + 1, ring0 + i))
    if cap_top and r_top > 1e-5:
        c = len(verts)
        verts.append((0, y0 + height, 0)); norms.append((0, 1, 0))
        ring0 = len(verts)
        for i in range(seg + 1):
            a = 2 * math.pi * i / seg
            verts.append((r_top * math.cos(a), y0 + height, r_top * math.sin(a)))
            norms.append((0, 1, 0))
        for i in range(seg):
            faces.append((c, ring0 + i, ring0 + i + 1))
    return verts, norms, faces


def sphere(r=1.0, rings=10, sectors=14):
    """Esfera UV centrada na origem."""
    verts, norms, faces = [], [], []
    for ri in range(rings + 1):
        phi = math.pi * ri / rings  # 0..pi
        y = math.cos(phi)
        rr = math.sin(phi)
        for si in range(sectors + 1):
            th = 2 * math.pi * si / sectors
            x, z = rr * math.cos(th), rr * math.sin(th)
            verts.append((r * x, r * y, r * z))
            norms.append((x, y, z))
    row = sectors + 1
    for ri in range(rings):
        for si in range(sectors):
            a = ri * row + si
            b = a + row
            faces.append((a, a + 1, b))
            faces.append((a + 1, b + 1, b))
    return verts, norms, faces


def leaf(rings=5, sectors=8):
    """Folha/pétala: esfera unitária (escalada depois pra ficar achatada e
    pontuda). Mantida como esfera p/ reaproveitar; o formato vem do scale."""
    return sphere(1.0, rings, sectors)


# ----------------------------------------------------------------------------
# Peças compartilhadas
# ----------------------------------------------------------------------------

def add_pot(parts, pot_color, top_r=0.5, bot_r=0.36, h=0.52, soil_color=(0.27, 0.18, 0.11)):
    """Vaso troncocônico + borda + terra. Devolve o y do topo da terra."""
    pot = Geom()
    pot.add(*cylinder(bot_r, top_r, h, seg=20, cap_top=False))
    # borda
    pot.add(*cylinder(top_r + 0.03, top_r + 0.03, 0.06, seg=20, cap_bottom=False, cap_top=False, y0=h - 0.03))
    parts.append(("Vaso", pot_color, pot, False))

    soil_y = h - 0.04
    soil = Geom()
    soil.add(*cylinder(top_r - 0.02, top_r - 0.05, 0.05, seg=20, cap_bottom=False, y0=soil_y - 0.02))
    parts.append(("Terra", soil_color, soil, False))
    return soil_y


# ----------------------------------------------------------------------------
# Modelos por categoria
# ----------------------------------------------------------------------------

GREEN = (0.30, 0.62, 0.32)
GREEN_DK = (0.20, 0.47, 0.26)
GREEN_LT = (0.46, 0.72, 0.40)
BROWN = (0.45, 0.30, 0.18)
TERRACOTTA = (0.74, 0.40, 0.26)
STONE = (0.56, 0.58, 0.60)


def model_flor():
    parts = []
    soil_y = add_pot(parts, TERRACOTTA)

    stem = Geom()
    stem.add(*cylinder(0.045, 0.03, 0.85, seg=10, cap_bottom=False, y0=soil_y))
    # duas folhas no caule
    for az, tilt in [(0.6, 1.0), (math.pi + 0.4, 1.05)]:
        R = mat_mul(rot_y(az), rot_x(-tilt))
        stem.add(*leaf(), scale=(0.06, 0.02, 0.18), rot=R, translate=(0, soil_y + 0.4, 0))
    parts.append(("Caule", GREEN_DK, stem, False))

    head_y = soil_y + 0.9
    petals = Geom()
    n = 9
    for i in range(n):
        az = 2 * math.pi * i / n
        R = mat_mul(rot_y(az), rot_x(-1.15))
        # pétala achatada e alongada, base no centro da flor, ponta pra fora
        petals.add(*leaf(rings=4, sectors=8), scale=(0.09, 0.03, 0.20), rot=R,
                   translate=(0.16 * math.cos(az), head_y, 0.16 * math.sin(az)))
    parts.append(("Petalas", (0.92, 0.42, 0.58), petals, True))

    center = Geom()
    center.add(*sphere(0.13, rings=10, sectors=14), scale=(1, 0.7, 1), translate=(0, head_y + 0.02, 0))
    parts.append(("Miolo", (0.98, 0.80, 0.22), center, False))
    return parts


def model_cacto():
    parts = []
    soil_y = add_pot(parts, TERRACOTTA, top_r=0.5, bot_r=0.38)

    body = Geom()
    # corpo coluna com topo arredondado
    body.add(*cylinder(0.27, 0.25, 1.0, seg=18, cap_top=False, y0=soil_y))
    body.add(*sphere(0.25, rings=8, sectors=18), scale=(1, 0.7, 1), translate=(0, soil_y + 1.0, 0))

    # dois braços (silhueta saguaro): cotovelo + parte vertical.
    # O segmento horizontal nasce DENTRO do corpo (x=0.1) e atravessa a parede,
    # pra fundir no tronco sem deixar vão visível.
    def arm(side, y_elbow):
        inner_x = side * 0.1
        length = 0.4
        R = rot_z(side * math.pi / 2)
        body.add(*cylinder(0.1, 0.095, length, seg=10, cap_bottom=False, cap_top=False),
                 rot=R, translate=(inner_x, y_elbow, 0))
        elbow_x = inner_x + side * length
        # joelho arredondado
        body.add(*sphere(0.1, rings=6, sectors=10), translate=(elbow_x, y_elbow, 0))
        # segmento vertical
        body.add(*cylinder(0.095, 0.085, 0.34, seg=10, cap_bottom=False, y0=0),
                 translate=(elbow_x, y_elbow, 0))
        # ponta arredondada
        body.add(*sphere(0.085, rings=6, sectors=10), translate=(elbow_x, y_elbow + 0.34, 0))

    arm(-1, soil_y + 0.55)
    arm(1, soil_y + 0.78)
    parts.append(("Corpo", GREEN, body, False))

    # florzinha no topo
    flower = Geom()
    flower.add(*sphere(0.09, rings=8, sectors=12), scale=(1, 0.6, 1), translate=(0, soil_y + 1.14, 0))
    parts.append(("Flor", (0.95, 0.45, 0.55), flower, False))
    return parts


def model_arvore():
    parts = []
    soil_y = add_pot(parts, STONE, top_r=0.5, bot_r=0.38)

    trunk = Geom()
    trunk.add(*cylinder(0.12, 0.085, 0.6, seg=12, cap_bottom=False, y0=soil_y))
    parts.append(("Tronco", BROWN, trunk, False))

    canopy = Geom()
    base = soil_y + 0.7
    blobs = [
        ((0.0, base + 0.45, 0.0), 0.42),
        ((-0.28, base + 0.22, 0.05), 0.30),
        ((0.28, base + 0.25, -0.05), 0.30),
        ((0.0, base + 0.12, 0.28), 0.26),
        ((0.05, base + 0.7, -0.05), 0.26),
    ]
    for (cx, cy, cz), r in blobs:
        canopy.add(*sphere(r, rings=10, sectors=14), translate=(cx, cy, cz))
    parts.append(("Copa", GREEN, canopy, False))
    return parts


def model_suculenta():
    parts = []
    soil_y = add_pot(parts, TERRACOTTA, top_r=0.52, bot_r=0.4, h=0.42)

    rosette = Geom()
    cy = soil_y + 0.02
    # roseta: anéis de folhas grossas e pontudas, mais deitadas por fora
    rings_def = [
        (9, 1.45, 0.34, (0.10, 0.04, 0.26)),  # externo, deitado
        (7, 1.15, 0.22, (0.085, 0.045, 0.22)),
        (5, 0.85, 0.12, (0.07, 0.05, 0.17)),
        (3, 0.45, 0.04, (0.055, 0.05, 0.12)),
    ]
    phase = 0.0
    for (count, tilt, rad, sc) in rings_def:
        for i in range(count):
            az = 2 * math.pi * i / count + phase
            R = mat_mul(rot_y(az), rot_x(-tilt))
            rosette.add(*leaf(rings=5, sectors=8), scale=sc, rot=R,
                        translate=(rad * math.cos(az), cy, rad * math.sin(az)))
        phase += 0.35
    parts.append(("Roseta", (0.49, 0.69, 0.45), rosette, True))
    return parts


def model_erva():
    parts = []
    soil_y = add_pot(parts, STONE, top_r=0.5, bot_r=0.38)

    foliage = Geom()
    cy = soil_y
    # tufo: muitas folhas/hastes finas e altas, leque irregular
    rng = _Rng(1234)
    n = 22
    for i in range(n):
        az = 2 * math.pi * (i / n) + rng.f(-0.2, 0.2)
        tilt = rng.f(0.05, 0.5)
        rad = rng.f(0.02, 0.22)
        height = rng.f(0.7, 1.05)
        R = mat_mul(rot_y(az), rot_x(-tilt))
        # folha estreita e alta (ponta pra cima)
        foliage.add(*leaf(rings=4, sectors=6), scale=(0.05, height * 0.5, 0.11), rot=R,
                    translate=(rad * math.cos(az), cy + height * 0.4, rad * math.sin(az)))
    parts.append(("Folhagem", GREEN, foliage, True))
    return parts


def model_tropical():
    parts = []
    soil_y = add_pot(parts, STONE, top_r=0.5, bot_r=0.38)

    stems = Geom()
    leaves = Geom()
    cy = soil_y
    # poucos talos com folhas largas em leque (cara de monstera/tropical)
    defs = [
        (0.3, 0.55, 0.95),
        (math.pi * 0.55, 0.62, 1.1),
        (math.pi * 1.05, 0.5, 1.0),
        (math.pi * 1.5, 0.66, 0.9),
        (math.pi * 1.85, 0.48, 1.15),
    ]
    for (az, tilt, length) in defs:
        R = mat_mul(rot_y(az), rot_x(-tilt))
        # talo
        stems.add(*cylinder(0.03, 0.022, length, seg=8, cap_bottom=False, y0=0),
                  rot=R, translate=(0, cy, 0))
        # ponta do talo (onde a folha nasce)
        tip = mat_vec(R, (0, length, 0))
        tx, ty, tz = tip[0], cy + tip[1], tip[2]
        # folha larga e achatada, levemente inclinada pra fora
        RL = mat_mul(rot_y(az), rot_x(-tilt - 0.15))
        leaves.add(*leaf(rings=6, sectors=10), scale=(0.26, 0.05, 0.36), rot=RL,
                   translate=(tx, ty, tz))
    parts.append(("Caules", GREEN_DK, stems, False))
    parts.append(("Folhas", GREEN, leaves, True))
    return parts


class _Rng:
    """LCG determinístico (sem depender do random global)."""
    def __init__(self, seed):
        self.s = seed & 0xFFFFFFFF
    def next(self):
        self.s = (1103515245 * self.s + 12345) & 0x7FFFFFFF
        return self.s / 0x7FFFFFFF
    def f(self, a, b):
        return a + (b - a) * self.next()


MODELS = {
    "flor": model_flor,
    "cacto": model_cacto,
    "arvore": model_arvore,
    "suculenta": model_suculenta,
    "erva": model_erva,
    "tropical": model_tropical,
}


# ----------------------------------------------------------------------------
# Exportação GLB
# ----------------------------------------------------------------------------

def write_glb(path, parts):
    gltf = {
        "asset": {"version": "2.0", "generator": "ecowit gen-models.py"},
        "scene": 0,
        "scenes": [{"nodes": []}],
        "nodes": [],
        "meshes": [],
        "materials": [],
        "accessors": [],
        "bufferViews": [],
        "buffers": [],
    }
    bin_blob = bytearray()

    def push_view(data, target):
        # alinha a 4 bytes
        while len(bin_blob) % 4 != 0:
            bin_blob.append(0)
        off = len(bin_blob)
        bin_blob.extend(data)
        gltf["bufferViews"].append({
            "buffer": 0, "byteOffset": off, "byteLength": len(data), "target": target,
        })
        return len(gltf["bufferViews"]) - 1

    for (name, color, geom, double_sided) in parts:
        # POSITION
        pos_data = bytearray()
        mn = [1e9, 1e9, 1e9]
        mx = [-1e9, -1e9, -1e9]
        for (x, y, z) in geom.pos:
            pos_data += struct.pack("<fff", x, y, z)
            for k, v in enumerate((x, y, z)):
                mn[k] = min(mn[k], v); mx[k] = max(mx[k], v)
        pv = push_view(pos_data, 34962)
        gltf["accessors"].append({
            "bufferView": pv, "componentType": 5126, "count": len(geom.pos),
            "type": "VEC3", "min": mn, "max": mx,
        })
        pos_acc = len(gltf["accessors"]) - 1

        # NORMAL
        nrm_data = bytearray()
        for (x, y, z) in geom.nrm:
            nrm_data += struct.pack("<fff", x, y, z)
        nv = push_view(nrm_data, 34962)
        gltf["accessors"].append({
            "bufferView": nv, "componentType": 5126, "count": len(geom.nrm), "type": "VEC3",
        })
        nrm_acc = len(gltf["accessors"]) - 1

        # INDICES
        n_idx = len(geom.idx) * 3
        use_int = len(geom.pos) > 65535
        idx_data = bytearray()
        for f in geom.idx:
            if use_int:
                idx_data += struct.pack("<III", *f)
            else:
                idx_data += struct.pack("<HHH", *f)
        iv = push_view(idx_data, 34963)
        gltf["accessors"].append({
            "bufferView": iv, "componentType": 5125 if use_int else 5123,
            "count": n_idx, "type": "SCALAR",
        })
        idx_acc = len(gltf["accessors"]) - 1

        gltf["materials"].append({
            "name": name,
            "doubleSided": bool(double_sided),
            "pbrMetallicRoughness": {
                "baseColorFactor": [color[0], color[1], color[2], 1.0],
                "metallicFactor": 0.0,
                "roughnessFactor": 0.82,
            },
        })
        mat = len(gltf["materials"]) - 1

        gltf["meshes"].append({
            "name": name,
            "primitives": [{
                "attributes": {"POSITION": pos_acc, "NORMAL": nrm_acc},
                "indices": idx_acc, "material": mat,
            }],
        })
        mesh = len(gltf["meshes"]) - 1
        gltf["nodes"].append({"name": name, "mesh": mesh})
        gltf["scenes"][0]["nodes"].append(len(gltf["nodes"]) - 1)

    gltf["buffers"].append({"byteLength": len(bin_blob)})

    json_bytes = json.dumps(gltf, separators=(",", ":")).encode("utf-8")
    while len(json_bytes) % 4 != 0:
        json_bytes += b" "
    while len(bin_blob) % 4 != 0:
        bin_blob.append(0)

    total = 12 + 8 + len(json_bytes) + 8 + len(bin_blob)
    with open(path, "wb") as f:
        f.write(struct.pack("<III", 0x46546C67, 2, total))
        f.write(struct.pack("<II", len(json_bytes), 0x4E4F534A))
        f.write(json_bytes)
        f.write(struct.pack("<II", len(bin_blob), 0x004E4942))
        f.write(bin_blob)
    return len(geom.pos)


# ----------------------------------------------------------------------------
# Exportação USDZ (USDA empacotado, p/ iOS AR Quick Look)
# ----------------------------------------------------------------------------

def write_usdz(path, parts, name):
    lines = []
    lines.append("#usda 1.0")
    lines.append("(")
    lines.append('    defaultPrim = "plant"')
    lines.append('    metersPerUnit = 1')
    lines.append('    upAxis = "Y"')
    lines.append(")")
    lines.append("")
    lines.append('def Xform "plant"')
    lines.append("{")
    for i, (pname, color, geom, double_sided) in enumerate(parts):
        safe = "".join(c if c.isalnum() else "_" for c in pname) + f"_{i}"
        pts = ", ".join(f"({x:.4f}, {y:.4f}, {z:.4f})" for (x, y, z) in geom.pos)
        nrm = ", ".join(f"({x:.4f}, {y:.4f}, {z:.4f})" for (x, y, z) in geom.nrm)
        counts = ", ".join("3" for _ in geom.idx)
        indices = ", ".join(f"{a}, {b}, {c}" for (a, b, c) in geom.idx)
        lines.append(f'    def Mesh "{safe}"')
        lines.append("    {")
        lines.append(f"        int[] faceVertexCounts = [{counts}]")
        lines.append(f"        int[] faceVertexIndices = [{indices}]")
        lines.append(f"        point3f[] points = [{pts}]")
        lines.append(f"        normal3f[] normals = [{nrm}] (")
        lines.append('            interpolation = "vertex"')
        lines.append("        )")
        lines.append(f"        color3f[] primvars:displayColor = [({color[0]:.3f}, {color[1]:.3f}, {color[2]:.3f})]")
        lines.append(f'        uniform token subdivisionScheme = "none"')
        if double_sided:
            lines.append("        uniform bool doubleSided = 1")
        lines.append(f'        rel material:binding = </plant/mat_{i}>')
        lines.append("    }")
    # materiais
    for i, (pname, color, geom, double_sided) in enumerate(parts):
        lines.append(f'    def Material "mat_{i}"')
        lines.append("    {")
        lines.append(f'        token outputs:surface.connect = </plant/mat_{i}/surface.outputs:surface>')
        lines.append(f'        def Shader "surface"')
        lines.append("        {")
        lines.append('            uniform token info:id = "UsdPreviewSurface"')
        lines.append(f"            color3f inputs:diffuseColor = ({color[0]:.3f}, {color[1]:.3f}, {color[2]:.3f})")
        lines.append("            float inputs:roughness = 0.82")
        lines.append("            float inputs:metallic = 0.0")
        lines.append("            token outputs:surface")
        lines.append("        }")
        lines.append("    }")
    lines.append("}")
    usda = ("\n".join(lines) + "\n").encode("utf-8")

    arcname = f"{name}.usda"
    # USDZ = zip sem compressão, com o primeiro arquivo alinhado a 64 bytes.
    _write_aligned_zip(path, arcname, usda)


def _write_aligned_zip(path, arcname, data, align=64):
    """Escreve um zip STORED com o conteúdo do primeiro (único) arquivo
    alinhado a `align` bytes, como exige o pacote USDZ."""
    import struct as _s
    name_b = arcname.encode("utf-8")
    crc = zipfile.crc32(data) & 0xFFFFFFFF
    # Local file header tem 30 bytes fixos + nome + extra. Calculamos o extra
    # pra empurrar o início dos dados pra um múltiplo de `align`.
    base = 30 + len(name_b)
    pad = (align - (base % align)) % align
    extra = b""
    if pad:
        # campo extra "dummy": header id (2) + size (2) + payload
        if pad < 4:
            pad += align
        extra = _s.pack("<HH", 0x1986, pad - 4) + b"\x00" * (pad - 4)
    with open(path, "wb") as f:
        # local file header
        f.write(_s.pack(
            "<IHHHHHIIIHH",
            0x04034b50, 20, 0, 0, 0, 0, crc, len(data), len(data),
            len(name_b), len(extra),
        ))
        f.write(name_b)
        f.write(extra)
        data_off = f.tell()
        assert data_off % align == 0, (data_off, align)
        f.write(data)
        cd_off = f.tell()
        # central directory header
        f.write(_s.pack(
            "<IHHHHHHIIIHHHHHII",
            0x02014b50, 20, 20, 0, 0, 0, 0, crc, len(data), len(data),
            len(name_b), len(extra), 0, 0, 0, 0, 0,
        ))
        f.write(name_b)
        f.write(extra)
        cd_size = f.tell() - cd_off
        # end of central directory
        f.write(_s.pack(
            "<IHHHHIIH",
            0x06054b50, 0, 0, 1, 1, cd_size, cd_off, 0,
        ))


# ----------------------------------------------------------------------------

def main():
    os.makedirs(OUT, exist_ok=True)
    for cat, fn in MODELS.items():
        parts = fn()
        glb_path = os.path.join(OUT, f"plant-{cat}.glb")
        usdz_path = os.path.join(OUT, f"plant-{cat}.usdz")
        write_glb(glb_path, parts)
        write_usdz(usdz_path, parts, f"plant-{cat}")
        nverts = sum(len(p[2].pos) for p in parts)
        ntris = sum(len(p[2].idx) for p in parts)
        print(f"  plant-{cat}: {len(parts)} peças, {nverts} vértices, {ntris} triângulos "
              f"-> {os.path.getsize(glb_path)//1024}KB glb / {os.path.getsize(usdz_path)//1024}KB usdz")


if __name__ == "__main__":
    print("Gerando modelos 3D de plantas...")
    main()
    print("Pronto.")
