import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { GRID, PLOT_SPACING, plotToWorld, type GardenPlant } from '../lib/garden'
import { SPECIES_CATALOG, modelPathsFor } from '../lib/species'

/**
 * GardenScene — o jardim 3D do usuário (three.js).
 *
 * Uma ilha de grama cercada, com canteiros em grade onde vivem os modelos
 * 3D reais das espécies (os mesmos GLBs do AR). Órbita/zoom com o dedo,
 * toque numa planta pra cuidar, toque num canteiro vazio pra plantar.
 * Nuvens, borboletas e sombras suaves pra dar vida.
 */

interface GardenSceneProps {
  plants: GardenPlant[]
  /** speciesIds com sede (mostra gotinha flutuando). */
  thirstyIds: Set<string>
  /** Em modo plantio, canteiros vazios ficam destacados e tocáveis. */
  plantingMode: boolean
  onSelectPlant: (plant: GardenPlant) => void
  onPlotTap: (gx: number, gz: number) => void
}

const ISLAND_SIZE = GRID * PLOT_SPACING + 1.0
const ISLAND_DEPTH = 0.34

export function GardenScene({ plants, thirstyIds, plantingMode, onSelectPlant, onPlotTap }: GardenSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const apiRef = useRef<SceneApi | null>(null)
  const callbacksRef = useRef({ onSelectPlant, onPlotTap })
  callbacksRef.current = { onSelectPlant, onPlotTap }

  // Monta a cena uma única vez
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const api = buildScene(container, callbacksRef)
    apiRef.current = api
    return () => {
      api.dispose()
      apiRef.current = null
    }
  }, [])

  // Sincroniza plantas / sede / modo plantio
  useEffect(() => { apiRef.current?.syncPlants(plants) }, [plants])
  useEffect(() => { apiRef.current?.setThirsty(thirstyIds) }, [thirstyIds])
  useEffect(() => { apiRef.current?.setPlantingMode(plantingMode) }, [plantingMode])

  return <div ref={containerRef} className="absolute inset-0" style={{ touchAction: 'none' }} />
}

/* ═══ Implementação three.js ═══════════════════════════════════ */

interface SceneApi {
  syncPlants: (plants: GardenPlant[]) => void
  setThirsty: (ids: Set<string>) => void
  setPlantingMode: (on: boolean) => void
  dispose: () => void
}

const gltfLoader = new GLTFLoader()
const modelCache = new Map<string, Promise<THREE.Group>>()

function loadSpeciesModel(speciesId: string): Promise<THREE.Group> {
  let p = modelCache.get(speciesId)
  if (!p) {
    const species = SPECIES_CATALOG.find((s) => s.id === speciesId)!
    p = gltfLoader.loadAsync(modelPathsFor(species).glb).then((gltf) => {
      gltf.scene.traverse((o) => {
        if ((o as THREE.Mesh).isMesh) {
          o.castShadow = true
          o.receiveShadow = true
        }
      })
      return gltf.scene
    })
    modelCache.set(speciesId, p)
  }
  return p.then((g) => g.clone(true))
}

function canvasTexture(size: number, draw: (ctx: CanvasRenderingContext2D) => void): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  draw(canvas.getContext('2d')!)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

function buildScene(
  container: HTMLDivElement,
  callbacks: React.RefObject<{ onSelectPlant: (p: GardenPlant) => void; onPlotTap: (gx: number, gz: number) => void }>,
): SceneApi {
  /* — Renderer / cena / câmera — */
  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(container.clientWidth, container.clientHeight)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.08
  container.appendChild(renderer.domElement)

  const scene = new THREE.Scene()
  scene.background = canvasTexture(64, (ctx) => {
    const g = ctx.createLinearGradient(0, 0, 0, 64)
    g.addColorStop(0, '#aeddff')
    g.addColorStop(0.62, '#dbf0f7')
    g.addColorStop(1, '#f2f7e8')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 64, 64)
  })
  scene.fog = new THREE.Fog(0xe4f1e6, 8, 14)

  const camera = new THREE.PerspectiveCamera(46, container.clientWidth / container.clientHeight, 0.1, 40)
  camera.position.setFromSphericalCoords(4.6, THREE.MathUtils.degToRad(56), THREE.MathUtils.degToRad(35))
  camera.position.y += 0.25

  const controls = new OrbitControls(camera, renderer.domElement)
  controls.target.set(0, 0.12, 0)
  controls.enableDamping = true
  controls.dampingFactor = 0.08
  controls.enablePan = false
  controls.minDistance = 2.0
  controls.maxDistance = 7
  controls.minPolarAngle = THREE.MathUtils.degToRad(22)
  controls.maxPolarAngle = THREE.MathUtils.degToRad(74)
  controls.autoRotate = true
  controls.autoRotateSpeed = 0.5
  renderer.domElement.addEventListener('pointerdown', () => { controls.autoRotate = false }, { once: true })

  /* — Luz — */
  scene.add(new THREE.HemisphereLight(0xcfe8ff, 0x86a56f, 1.0))
  const sun = new THREE.DirectionalLight(0xfff1d6, 2.0)
  sun.position.set(2.6, 4.2, 1.6)
  sun.castShadow = true
  sun.shadow.mapSize.set(2048, 2048)
  sun.shadow.camera.left = sun.shadow.camera.bottom = -2.8
  sun.shadow.camera.right = sun.shadow.camera.top = 2.8
  sun.shadow.camera.far = 12
  sun.shadow.bias = -0.0004
  scene.add(sun)

  /* — Ilha de grama — */
  const half = ISLAND_SIZE / 2
  const r = 0.42 // cantos arredondados
  const shape = new THREE.Shape()
  shape.moveTo(-half + r, -half)
  shape.lineTo(half - r, -half); shape.quadraticCurveTo(half, -half, half, -half + r)
  shape.lineTo(half, half - r);  shape.quadraticCurveTo(half, half, half - r, half)
  shape.lineTo(-half + r, half); shape.quadraticCurveTo(-half, half, -half, half - r)
  shape.lineTo(-half, -half + r); shape.quadraticCurveTo(-half, -half, -half + r, -half)

  const grassTex = canvasTexture(256, (ctx) => {
    ctx.fillStyle = '#5da24f'
    ctx.fillRect(0, 0, 256, 256)
    const tones = ['#529547', '#68b058', '#4c8c42', '#74bd63', '#5da24f']
    for (let i = 0; i < 2400; i++) {
      ctx.fillStyle = tones[(Math.random() * tones.length) | 0]
      ctx.fillRect(Math.random() * 256, Math.random() * 256, 2, 2 + Math.random() * 2)
    }
  })
  grassTex.wrapS = grassTex.wrapT = THREE.RepeatWrapping
  grassTex.repeat.set(0.9, 0.9)

  const islandGeo = new THREE.ExtrudeGeometry(shape, { depth: ISLAND_DEPTH, bevelEnabled: false })
  islandGeo.rotateX(-Math.PI / 2)
  islandGeo.translate(0, -ISLAND_DEPTH, 0) // topo da grama em y=0
  const grassMat = new THREE.MeshStandardMaterial({ map: grassTex, roughness: 1 })
  const dirtMat = new THREE.MeshStandardMaterial({ color: 0x6e4a2c, roughness: 1 })
  const island = new THREE.Mesh(islandGeo, [grassMat, dirtMat])
  island.receiveShadow = true
  scene.add(island)

  /* — Tufos de grama e florzinhas espalhados — */
  const tuftMat = new THREE.MeshStandardMaterial({ color: 0x4c8c42, roughness: 1, side: THREE.DoubleSide })
  const tuftGeo = new THREE.ConeGeometry(0.012, 0.07, 4)
  const daisyMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 })
  const daisyCenterMat = new THREE.MeshStandardMaterial({ color: 0xf5c518, roughness: 0.9 })
  const rng = mulberry32(7)
  for (let i = 0; i < 90; i++) {
    const x = (rng() - 0.5) * (ISLAND_SIZE - 0.3)
    const z = (rng() - 0.5) * (ISLAND_SIZE - 0.3)
    // não nasce dentro dos canteiros
    const { x: nx, z: nz } = nearestPlot(x, z)
    if (Math.hypot(x - nx, z - nz) < 0.3) continue
    if (rng() < 0.12) {
      const daisy = new THREE.Group()
      const petals = new THREE.Mesh(new THREE.CircleGeometry(0.022, 7), daisyMat)
      petals.rotation.x = -Math.PI / 2
      const center = new THREE.Mesh(new THREE.SphereGeometry(0.008, 6, 4), daisyCenterMat)
      center.position.y = 0.004
      daisy.add(petals, center)
      daisy.position.set(x, 0.012, z)
      scene.add(daisy)
    } else {
      const tuft = new THREE.Mesh(tuftGeo, tuftMat)
      tuft.position.set(x, 0.03, z)
      tuft.rotation.y = rng() * Math.PI
      tuft.scale.setScalar(0.7 + rng() * 0.9)
      scene.add(tuft)
    }
  }

  /* — Cerca de madeira (com portãozinho na frente) — */
  const woodMat = new THREE.MeshStandardMaterial({ color: 0xb9855a, roughness: 0.95 })
  const fence = new THREE.Group()
  const postGeo = new THREE.BoxGeometry(0.05, 0.3, 0.05)
  const fh = half - 0.09
  const postsPerSide = 8
  for (let side = 0; side < 4; side++) {
    for (let i = 0; i <= postsPerSide; i++) {
      const t = i / postsPerSide
      // portão: pula o meio do lado da frente (side 2, z+)
      if (side === 2 && t > 0.36 && t < 0.64) continue
      const a = -fh + t * 2 * fh
      const pos =
        side === 0 ? [a, 0.15, -fh] :
        side === 1 ? [fh, 0.15, a] :
        side === 2 ? [a, 0.15, fh] : [-fh, 0.15, a]
      const post = new THREE.Mesh(postGeo, woodMat)
      post.position.set(pos[0], pos[1], pos[2])
      post.castShadow = true
      fence.add(post)
    }
    // 2 travessas por lado (com vão do portão na frente)
    for (const y of [0.1, 0.22]) {
      const segs = side === 2 ? [[0, 0.36], [0.64, 1]] : [[0, 1]]
      for (const [t0, t1] of segs) {
        const len = (t1 - t0) * 2 * fh
        const rail = new THREE.Mesh(new THREE.BoxGeometry(len, 0.035, 0.028), woodMat)
        const mid = -fh + ((t0 + t1) / 2) * 2 * fh
        if (side === 0) rail.position.set(mid, y, -fh)
        else if (side === 2) rail.position.set(mid, y, fh)
        else {
          rail.rotation.y = Math.PI / 2
          rail.position.set(side === 1 ? fh : -fh, y, mid)
        }
        rail.castShadow = true
        fence.add(rail)
      }
    }
  }
  scene.add(fence)

  /* — Pedrinhas do caminho até o portão — */
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0xb8bdb2, roughness: 1 })
  for (let i = 0; i < 3; i++) {
    const stone = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.1, 0.02, 9), stoneMat)
    stone.position.set(0.02 * (i % 2 ? 1 : -1), 0.012, fh - 0.28 - i * 0.3)
    stone.rotation.y = i
    stone.receiveShadow = true
    scene.add(stone)
  }
  // pedras decorativas
  for (const [x, z, s] of [[-half + 0.28, -half + 0.34, 1], [half - 0.3, half - 0.42, 0.7]] as const) {
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.07 * s, 0), stoneMat)
    rock.position.set(x, 0.045 * s, z)
    rock.scale.y = 0.65
    rock.castShadow = true
    scene.add(rock)
  }

  /* — Canteiros (terra) — */
  const soilMat = new THREE.MeshStandardMaterial({ color: 0x4a3320, roughness: 1 })
  const soilRimMat = new THREE.MeshStandardMaterial({ color: 0x5c4128, roughness: 1 })
  const plots: THREE.Mesh[] = []
  for (let gx = 0; gx < GRID; gx++) {
    for (let gz = 0; gz < GRID; gz++) {
      const { x, z } = plotToWorld(gx, gz)
      const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.23, 0.05, 18), soilRimMat)
      rim.position.set(x, 0.025, z)
      rim.receiveShadow = true
      const soil = new THREE.Mesh(new THREE.CylinderGeometry(0.185, 0.185, 0.052, 18), soilMat)
      soil.position.set(x, 0.028, z)
      soil.receiveShadow = true
      soil.userData = { gx, gz }
      scene.add(rim, soil)
      plots.push(soil)
    }
  }

  /* — Destaques de plantio (anel + "+") p/ canteiros vazios — */
  const highlightGroup = new THREE.Group()
  highlightGroup.visible = false
  scene.add(highlightGroup)
  const ringGeo = new THREE.TorusGeometry(0.22, 0.014, 8, 32)
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x2ecc71 })
  const plusTex = canvasTexture(64, (ctx) => {
    ctx.fillStyle = '#2ecc71'
    ctx.beginPath(); ctx.arc(32, 32, 26, 0, Math.PI * 2); ctx.fill()
    ctx.strokeStyle = 'white'; ctx.lineWidth = 8; ctx.lineCap = 'round'
    ctx.beginPath(); ctx.moveTo(32, 18); ctx.lineTo(32, 46); ctx.moveTo(18, 32); ctx.lineTo(46, 32); ctx.stroke()
  })

  /* — Nuvens — */
  const cloudTex = canvasTexture(128, (ctx) => {
    ctx.fillStyle = 'rgba(255,255,255,0.92)'
    for (const [cx, cy, cr] of [[40, 74, 26], [66, 60, 30], [92, 74, 24], [64, 80, 30]]) {
      ctx.beginPath(); ctx.arc(cx, cy, cr, 0, Math.PI * 2); ctx.fill()
    }
  })
  const clouds: THREE.Sprite[] = []
  for (let i = 0; i < 3; i++) {
    const cloud = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloudTex, transparent: true, opacity: 0.9, fog: false }))
    cloud.scale.set(1.6, 0.8, 1)
    cloud.position.set(-3 + i * 2.6, 2.3 + (i % 2) * 0.5, -2.4 - i * 0.4)
    scene.add(cloud)
    clouds.push(cloud)
  }

  /* — Borboletas — */
  const butterflies: { group: THREE.Group; wingL: THREE.Mesh; wingR: THREE.Mesh; seed: number }[] = []
  for (const color of [0xffa63e, 0x9ec7ff]) {
    const wingGeo = new THREE.CircleGeometry(0.035, 6)
    const wingMat = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, fog: false })
    const wingL = new THREE.Mesh(wingGeo, wingMat)
    const wingR = new THREE.Mesh(wingGeo, wingMat)
    wingL.position.x = -0.03
    wingR.position.x = 0.03
    const group = new THREE.Group()
    group.add(wingL, wingR)
    scene.add(group)
    butterflies.push({ group, wingL, wingR, seed: Math.random() * 100 })
  }

  /* — Gotinha de sede (sprite) — */
  const dropTex = canvasTexture(64, (ctx) => {
    ctx.fillStyle = '#3ba7ff'
    ctx.beginPath()
    ctx.moveTo(32, 6)
    ctx.bezierCurveTo(46, 26, 52, 36, 52, 44)
    ctx.arc(32, 44, 20, 0, Math.PI, false)
    ctx.bezierCurveTo(12, 36, 18, 26, 32, 6)
    ctx.fill()
    ctx.fillStyle = 'rgba(255,255,255,0.55)'
    ctx.beginPath(); ctx.ellipse(25, 40, 5, 8, -0.4, 0, Math.PI * 2); ctx.fill()
  })

  /* — Plantas — */
  interface PlantEntry {
    group: THREE.Group
    plant: GardenPlant
    drop: THREE.Sprite | null
    growStart: number | null
    height: number
  }
  const entries = new Map<string, PlantEntry>()
  const keyOf = (p: GardenPlant) => `${p.gx},${p.gz}`
  let initialized = false // plantas do primeiro sync não "crescem" — já estavam lá

  function syncPlants(list: GardenPlant[]) {
    const wasInitialized = initialized
    initialized = true
    for (const p of list) {
      const key = keyOf(p)
      if (entries.has(key)) continue
      const isNew = wasInitialized
      const entry: PlantEntry = { group: new THREE.Group(), plant: p, drop: null, growStart: null, height: 0.3 }
      const { x, z } = plotToWorld(p.gx, p.gz)
      entry.group.position.set(x, 0.05, z)
      entry.group.rotation.y = hash2(p.gx, p.gz) * Math.PI * 2
      entry.group.visible = false
      scene.add(entry.group)
      entries.set(key, entry)
      loadSpeciesModel(p.speciesId).then((model) => {
        const box = new THREE.Box3().setFromObject(model)
        // plantas muito baixas ganham um empurrãozinho pra não sumirem na cena
        const h = Math.max(0.05, box.max.y)
        const norm = h < 0.26 ? Math.min(1.5, 0.26 / h) : 1
        model.scale.setScalar(norm)
        entry.height = Math.max(0.22, h * norm)
        entry.group.add(model)
        entry.group.visible = true
        entry.growStart = isNew ? performance.now() : null
        if (isNew) entry.group.scale.setScalar(0.01)
        refreshHighlights()
      })
    }
    refreshHighlights()
  }

  function setThirsty(ids: Set<string>) {
    for (const entry of entries.values()) {
      const thirsty = ids.has(entry.plant.speciesId)
      if (thirsty && !entry.drop) {
        const drop = new THREE.Sprite(new THREE.SpriteMaterial({ map: dropTex, transparent: true }))
        drop.scale.setScalar(0.13)
        entry.group.add(drop)
        entry.drop = drop
      } else if (!thirsty && entry.drop) {
        entry.group.remove(entry.drop)
        entry.drop = null
      }
    }
  }

  let planting = false
  function refreshHighlights() {
    highlightGroup.clear()
    if (!planting) return
    for (const soil of plots) {
      const { gx, gz } = soil.userData as { gx: number; gz: number }
      if (entries.has(`${gx},${gz}`)) continue
      const ring = new THREE.Mesh(ringGeo, ringMat)
      ring.rotation.x = Math.PI / 2
      ring.position.copy(soil.position).setY(0.06)
      const plus = new THREE.Sprite(new THREE.SpriteMaterial({ map: plusTex, transparent: true, depthTest: false }))
      plus.scale.setScalar(0.14)
      plus.position.copy(soil.position).setY(0.24)
      highlightGroup.add(ring, plus)
    }
  }
  function setPlantingMode(on: boolean) {
    planting = on
    highlightGroup.visible = on
    refreshHighlights()
  }

  /* — Toque: raycast (só quando não arrastou) — */
  const raycaster = new THREE.Raycaster()
  const pointer = new THREE.Vector2()
  let downAt: { x: number; y: number } | null = null
  const onDown = (e: PointerEvent) => { downAt = { x: e.clientX, y: e.clientY } }
  const onUp = (e: PointerEvent) => {
    if (!downAt) return
    const moved = Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y)
    downAt = null
    if (moved > 8) return
    const rect = renderer.domElement.getBoundingClientRect()
    pointer.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1)
    raycaster.setFromCamera(pointer, camera)
    if (planting) {
      const hits = raycaster.intersectObjects(plots, false)
      if (hits.length) {
        const { gx, gz } = hits[0].object.userData as { gx: number; gz: number }
        if (!entries.has(`${gx},${gz}`)) callbacks.current.onPlotTap(gx, gz)
      }
      return
    }
    const groups = [...entries.values()].map((en) => en.group)
    const hits = raycaster.intersectObjects(groups, true)
    if (hits.length) {
      let obj: THREE.Object3D | null = hits[0].object
      while (obj && !groups.includes(obj as THREE.Group)) obj = obj.parent
      const entry = [...entries.values()].find((en) => en.group === obj)
      if (entry) {
        popStart = { entry, t: performance.now() }
        callbacks.current.onSelectPlant(entry.plant)
      }
    }
  }
  renderer.domElement.addEventListener('pointerdown', onDown)
  renderer.domElement.addEventListener('pointerup', onUp)

  /* — Loop — */
  let popStart: { entry: PlantEntry; t: number } | null = null
  let raf = 0
  const clock = new THREE.Clock()
  function animate() {
    raf = requestAnimationFrame(animate)
    const t = clock.getElapsedTime()
    controls.update()

    // nuvens à deriva
    for (let i = 0; i < clouds.length; i++) {
      clouds[i].position.x += 0.0006 + i * 0.0002
      if (clouds[i].position.x > 4) clouds[i].position.x = -4
    }
    // borboletas
    for (const b of butterflies) {
      const s = b.seed
      b.group.position.set(
        Math.sin(t * 0.32 + s) * (half - 0.4),
        0.55 + Math.sin(t * 0.9 + s * 2) * 0.18,
        Math.cos(t * 0.24 + s * 1.7) * (half - 0.5),
      )
      b.group.rotation.y = Math.atan2(Math.cos(t * 0.32 + s), -Math.sin(t * 0.24 + s * 1.7))
      const flap = Math.sin(t * 14 + s) * 0.9
      b.wingL.rotation.y = flap
      b.wingR.rotation.y = -flap
    }
    // gotinhas bobbing
    for (const entry of entries.values()) {
      if (entry.drop) {
        entry.drop.position.y = entry.height + 0.12 + Math.sin(t * 2.4 + entry.plant.gx) * 0.02
      }
      // crescimento
      if (entry.growStart !== null) {
        const k = Math.min(1, (performance.now() - entry.growStart) / 750)
        const e = backOut(k)
        entry.group.scale.setScalar(Math.max(0.01, e))
        if (k >= 1) entry.growStart = null
      }
    }
    // pop de seleção
    if (popStart) {
      const k = (performance.now() - popStart.t) / 260
      if (k >= 1) { popStart.entry.group.scale.setScalar(1); popStart = null }
      else popStart.entry.group.scale.setScalar(1 + Math.sin(k * Math.PI) * 0.1)
    }
    // pulso dos anéis de plantio
    if (highlightGroup.visible) {
      const pulse = 1 + Math.sin(t * 3.4) * 0.07
      highlightGroup.children.forEach((c) => { if ((c as THREE.Mesh).geometry === ringGeo) c.scale.setScalar(pulse) })
    }

    renderer.render(scene, camera)
  }
  animate()

  /* — Resize — */
  const ro = new ResizeObserver(() => {
    const w = container.clientWidth
    const h = container.clientHeight
    if (!w || !h) return
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    renderer.setSize(w, h)
  })
  ro.observe(container)

  return {
    syncPlants,
    setThirsty: (ids) => setThirsty(ids),
    setPlantingMode,
    dispose() {
      cancelAnimationFrame(raf)
      ro.disconnect()
      renderer.domElement.removeEventListener('pointerdown', onDown)
      renderer.domElement.removeEventListener('pointerup', onUp)
      controls.dispose()
      renderer.dispose()
      container.removeChild(renderer.domElement)
    },
  }
}

/* — Helpers — */

function nearestPlot(x: number, z: number): { x: number; z: number } {
  const half = ((GRID - 1) / 2) * PLOT_SPACING
  const gx = Math.round((x + half) / PLOT_SPACING)
  const gz = Math.round((z + half) / PLOT_SPACING)
  return plotToWorld(
    Math.min(GRID - 1, Math.max(0, gx)),
    Math.min(GRID - 1, Math.max(0, gz)),
  )
}

function backOut(k: number): number {
  const s = 1.4
  const t = k - 1
  return t * t * ((s + 1) * t + s) + 1
}

function hash2(a: number, b: number): number {
  const n = Math.sin(a * 127.1 + b * 311.7) * 43758.5453
  return n - Math.floor(n)
}

function mulberry32(seed: number): () => number {
  let a = seed
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
