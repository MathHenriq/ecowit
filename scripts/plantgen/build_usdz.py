"""
Gera public/models/species/<id>.usdz (AR Quick Look no iOS) a partir dos
mesmos construtores usados nos GLBs.

Uso: python3 build_usdz.py [id ...]   (sem args = todas)
"""
from __future__ import annotations

import sys
import tempfile
import unicodedata
import zlib
from pathlib import Path

import numpy as np
from PIL import Image
from pxr import Sdf, Usd, UsdGeom, UsdShade, UsdUtils, Vt

sys.path.insert(0, str(Path(__file__).parent))
from bake import bake_mesh  # noqa: E402
from plants import BUILDERS  # noqa: E402

OUT_DIR = Path(__file__).resolve().parents[2] / 'public' / 'models' / 'species'


def export_usdz(species_id: str, out_path: Path):
    rng = np.random.default_rng(zlib.crc32(species_id.encode()) % (2 ** 32))
    m = BUILDERS[species_id](rng)

    # Mesma textura de cor do GLB — Quick Look não renderiza cor por vértice
    # de forma confiável (o modelo ficava preto no AR).
    baked = bake_mesh(m)
    P = baked['positions']
    idx = baked['indices'].reshape(-1).astype(np.int32)
    st = baked['uvs'].copy()
    st[:, 1] = 1.0 - st[:, 1]  # USD: origem no canto inferior (t pra cima)

    with tempfile.TemporaryDirectory() as td:
        tex_name = 'albedo.png'
        Image.fromarray(baked['image'], mode='RGB').save(Path(td) / tex_name)

        usdc = Path(td) / 'plant.usdc'
        stage = Usd.Stage.CreateNew(str(usdc))
        UsdGeom.SetStageUpAxis(stage, UsdGeom.Tokens.y)
        UsdGeom.SetStageMetersPerUnit(stage, 1.0)

        root = UsdGeom.Xform.Define(stage, '/Plant')
        stage.SetDefaultPrim(root.GetPrim())
        mesh = UsdGeom.Mesh.Define(stage, '/Plant/Geom')
        mesh.CreatePointsAttr(Vt.Vec3fArray.FromNumpy(P.astype(np.float32)))
        mesh.CreateFaceVertexIndicesAttr(Vt.IntArray.FromNumpy(idx))
        mesh.CreateFaceVertexCountsAttr(Vt.IntArray.FromNumpy(np.full(len(baked['indices']), 3, dtype=np.int32)))
        mesh.CreateSubdivisionSchemeAttr(UsdGeom.Tokens.none)
        mesh.CreateDoubleSidedAttr(True)

        # UV por vértice
        stpv = UsdGeom.PrimvarsAPI(mesh).CreatePrimvar(
            'st', Sdf.ValueTypeNames.TexCoord2fArray, UsdGeom.Tokens.vertex)
        stpv.Set(Vt.Vec2fArray.FromNumpy(st.astype(np.float32)))

        # material PBR com baseColorTexture (Quick Look / RealityKit)
        mat = UsdShade.Material.Define(stage, '/Plant/Mat')
        streader = UsdShade.Shader.Define(stage, '/Plant/Mat/stReader')
        streader.CreateIdAttr('UsdPrimvarReader_float2')
        streader.CreateInput('varname', Sdf.ValueTypeNames.Token).Set('st')
        streader.CreateOutput('result', Sdf.ValueTypeNames.Float2)

        tex = UsdShade.Shader.Define(stage, '/Plant/Mat/Albedo')
        tex.CreateIdAttr('UsdUVTexture')
        tex.CreateInput('file', Sdf.ValueTypeNames.Asset).Set(f'./{tex_name}')
        tex.CreateInput('st', Sdf.ValueTypeNames.Float2).ConnectToSource(streader.GetOutput('result'))
        tex.CreateInput('sourceColorSpace', Sdf.ValueTypeNames.Token).Set('sRGB')
        tex.CreateInput('wrapS', Sdf.ValueTypeNames.Token).Set('clamp')
        tex.CreateInput('wrapT', Sdf.ValueTypeNames.Token).Set('clamp')
        tex.CreateOutput('rgb', Sdf.ValueTypeNames.Float3)

        pbr = UsdShade.Shader.Define(stage, '/Plant/Mat/PBR')
        pbr.CreateIdAttr('UsdPreviewSurface')
        pbr.CreateInput('diffuseColor', Sdf.ValueTypeNames.Color3f).ConnectToSource(tex.GetOutput('rgb'))
        pbr.CreateInput('roughness', Sdf.ValueTypeNames.Float).Set(0.9)
        pbr.CreateInput('metallic', Sdf.ValueTypeNames.Float).Set(0.0)
        mat.CreateSurfaceOutput().ConnectToSource(
            pbr.CreateOutput('surface', Sdf.ValueTypeNames.Token))
        UsdShade.MaterialBindingAPI.Apply(mesh.GetPrim()).Bind(mat)

        stage.GetRootLayer().Save()
        UsdUtils.CreateNewUsdzPackage(str(usdc), str(out_path))


def main():
    ids = sys.argv[1:] or list(BUILDERS)
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for sid in ids:
        slug = unicodedata.normalize('NFKD', sid).encode('ascii', 'ignore').decode()
        out = OUT_DIR / f'{slug}.usdz'
        export_usdz(sid, out)
        print(f'{sid:24s} {out.stat().st_size / 1024:8.1f} KB')


if __name__ == '__main__':
    main()
