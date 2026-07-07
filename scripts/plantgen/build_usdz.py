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
from pxr import Gf, Sdf, Usd, UsdGeom, UsdShade, UsdUtils, Vt

sys.path.insert(0, str(Path(__file__).parent))
from plants import BUILDERS  # noqa: E402

OUT_DIR = Path(__file__).resolve().parents[2] / 'public' / 'models' / 'species'


def export_usdz(species_id: str, out_path: Path):
    rng = np.random.default_rng(zlib.crc32(species_id.encode()) % (2 ** 32))
    m = BUILDERS[species_id](rng)
    V, F, C = m['V'], m['F'], m['C']

    with tempfile.TemporaryDirectory() as td:
        usdc = Path(td) / 'plant.usdc'
        stage = Usd.Stage.CreateNew(str(usdc))
        UsdGeom.SetStageUpAxis(stage, UsdGeom.Tokens.y)
        UsdGeom.SetStageMetersPerUnit(stage, 1.0)

        root = UsdGeom.Xform.Define(stage, '/Plant')
        stage.SetDefaultPrim(root.GetPrim())
        mesh = UsdGeom.Mesh.Define(stage, '/Plant/Geom')
        mesh.CreatePointsAttr(Vt.Vec3fArray.FromNumpy(V.astype(np.float32)))
        mesh.CreateFaceVertexIndicesAttr(Vt.IntArray.FromNumpy(F.reshape(-1).astype(np.int32)))
        mesh.CreateFaceVertexCountsAttr(Vt.IntArray.FromNumpy(np.full(len(F), 3, dtype=np.int32)))
        mesh.CreateSubdivisionSchemeAttr(UsdGeom.Tokens.none)
        mesh.CreateDoubleSidedAttr(True)

        # cor por vértice (sRGB -> linear, como no glTF)
        rgb = (C[:, :3].astype(np.float64) / 255.0) ** 2.2
        pv = UsdGeom.PrimvarsAPI(mesh).CreatePrimvar(
            'displayColor', Sdf.ValueTypeNames.Color3fArray, UsdGeom.Tokens.vertex)
        pv.Set(Vt.Vec3fArray.FromNumpy(rgb.astype(np.float32)))

        # material PBR lendo a cor por vértice (Quick Look / RealityKit)
        mat = UsdShade.Material.Define(stage, '/Plant/Mat')
        reader = UsdShade.Shader.Define(stage, '/Plant/Mat/PrimvarReader')
        reader.CreateIdAttr('UsdPrimvarReader_float3')
        reader.CreateInput('varname', Sdf.ValueTypeNames.Token).Set('displayColor')
        reader.CreateOutput('result', Sdf.ValueTypeNames.Float3)
        pbr = UsdShade.Shader.Define(stage, '/Plant/Mat/PBR')
        pbr.CreateIdAttr('UsdPreviewSurface')
        pbr.CreateInput('diffuseColor', Sdf.ValueTypeNames.Color3f).ConnectToSource(
            reader.GetOutput('result'))
        pbr.CreateInput('roughness', Sdf.ValueTypeNames.Float).Set(0.85)
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
