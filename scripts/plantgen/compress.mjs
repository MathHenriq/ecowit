// Comprime os GLBs das espécies: weld + dedup + quantização (KHR_mesh_quantization).
// Reduz ~45% sem decoder externo — compatível com model-viewer e Scene Viewer.
//
// Uso: node compress.mjs [arquivo.glb ...]   (sem args = todos em public/models/species)
import { NodeIO } from '@gltf-transform/core'
import { KHRMeshQuantization } from '@gltf-transform/extensions'
import { weld, dedup, prune, quantize } from '@gltf-transform/functions'
import { readdirSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../public/models/species')
const io = new NodeIO().registerExtensions([KHRMeshQuantization])

const args = process.argv.slice(2)
const files = args.length
  ? args
  : readdirSync(DIR).filter((f) => f.endsWith('.glb')).map((f) => path.join(DIR, f))

let before = 0, after = 0
for (const file of files) {
  const b = statSync(file).size
  const doc = await io.read(file)
  await doc.transform(
    weld(),
    dedup(),
    prune(),
    quantize({ quantizePosition: 14, quantizeNormal: 10, quantizeTexcoord: 12 }),
  )
  await io.write(file, doc)
  const a = statSync(file).size
  before += b; after += a
  console.log(`${path.basename(file).padEnd(26)} ${(b / 1024).toFixed(0).padStart(5)} → ${(a / 1024).toFixed(0).padStart(5)} KB`)
}
console.log(`total ${(before / 1e6).toFixed(1)} → ${(after / 1e6).toFixed(1)} MB`)
