#!/usr/bin/env python3
"""Renderiza prévias PNG dos modelos (rasterizador próprio, Python puro).
Só pra inspeção visual — não faz parte do build."""
import math, struct, zlib, os, importlib.util

HERE = os.path.dirname(__file__)
spec = importlib.util.spec_from_file_location("gm", os.path.join(HERE, "gen-models.py"))
gm = importlib.util.module_from_spec(spec); spec.loader.exec_module(gm)

W = H = 360
LIGHT = gm.normalize((0.4, 0.9, 0.5))


def render(parts, path):
    zbuf = [1e9] * (W * H)
    img = bytearray([20, 26, 38] * (W * H))  # fundo navy

    # câmera 3/4: rotaciona cena e projeta ortográfico
    Ry = gm.rot_y(math.radians(28))
    Rx = gm.rot_x(math.radians(-18))
    R = gm.mat_mul(Rx, Ry)

    # auto-frame
    allp = [p for (_, _, g, _) in parts for p in g.pos]
    cx = sum(p[0] for p in allp) / len(allp)
    cy = sum(p[1] for p in allp) / len(allp)
    cz = sum(p[2] for p in allp) / len(allp)
    tp = [gm.mat_vec(R, (p[0]-cx, p[1]-cy, p[2]-cz)) for p in allp]
    maxr = max(max(abs(p[0]), abs(p[1])) for p in tp) * 1.15
    scale = (W / 2) / maxr

    def project(p):
        v = gm.mat_vec(R, (p[0]-cx, p[1]-cy, p[2]-cz))
        sx = W/2 + v[0]*scale
        sy = H/2 - v[1]*scale
        return sx, sy, v[2]

    def shade(color, n):
        nt = gm.mat_vec(R, n)
        d = max(0.0, nt[0]*LIGHT[0] + nt[1]*LIGHT[1] + nt[2]*LIGHT[2])
        amb = 0.35
        f = amb + (1-amb)*d
        return (min(255, int(color[0]*255*f)), min(255, int(color[1]*255*f)), min(255, int(color[2]*255*f)))

    for (_, color, g, _) in parts:
        for (a, b, c) in g.idx:
            pa, pb, pc = project(g.pos[a]), project(g.pos[b]), project(g.pos[c])
            # normal média da face (em world) p/ shading
            na, nb, nc = g.nrm[a], g.nrm[b], g.nrm[c]
            nf = gm.normalize(((na[0]+nb[0]+nc[0])/3, (na[1]+nb[1]+nc[1])/3, (na[2]+nb[2]+nc[2])/3))
            col = shade(color, nf)
            _tri(img, zbuf, pa, pb, pc, col)

    _write_png(path, img)


def _tri(img, zbuf, p0, p1, p2, col):
    x0, y0, z0 = p0; x1, y1, z1 = p1; x2, y2, z2 = p2
    minx = max(0, int(min(x0, x1, x2))); maxx = min(W-1, int(max(x0, x1, x2))+1)
    miny = max(0, int(min(y0, y1, y2))); maxy = min(H-1, int(max(y0, y1, y2))+1)
    area = (x1-x0)*(y2-y0) - (x2-x0)*(y1-y0)
    if abs(area) < 1e-6:
        return
    for y in range(miny, maxy+1):
        for x in range(minx, maxx+1):
            px, py = x+0.5, y+0.5
            w0 = ((x1-px)*(y2-py) - (x2-px)*(y1-py)) / area
            w1 = ((x2-px)*(y0-py) - (x0-px)*(y2-py)) / area
            w2 = 1 - w0 - w1
            if w0 < 0 or w1 < 0 or w2 < 0:
                continue
            z = w0*z0 + w1*z1 + w2*z2
            idx = y*W + x
            if z < zbuf[idx]:
                zbuf[idx] = z
                o = idx*3
                img[o] = col[0]; img[o+1] = col[1]; img[o+2] = col[2]


def _write_png(path, rgb):
    raw = bytearray()
    for y in range(H):
        raw.append(0)
        raw.extend(rgb[y*W*3:(y+1)*W*3])
    comp = zlib.compress(bytes(raw), 9)

    def chunk(typ, data):
        c = struct.pack(">I", len(data)) + typ + data
        return c + struct.pack(">I", zlib.crc32(typ + data) & 0xFFFFFFFF)

    with open(path, "wb") as f:
        f.write(b"\x89PNG\r\n\x1a\n")
        f.write(chunk(b"IHDR", struct.pack(">IIBBBBB", W, H, 8, 2, 0, 0, 0)))
        f.write(chunk(b"IDAT", comp))
        f.write(chunk(b"IEND", b""))


if __name__ == "__main__":
    outdir = os.environ.get("PREVIEW_OUT", "/tmp/claude-0/-home-user-ecowit/f76f6eb4-8959-5d65-8909-b4543df4d073/scratchpad")
    os.makedirs(outdir, exist_ok=True)
    for cat, fn in gm.MODELS.items():
        p = os.path.join(outdir, f"preview-{cat}.png")
        render(fn(), p)
        print("wrote", p)
