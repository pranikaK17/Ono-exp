// src/components/map/Map.tsx
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { InputController, MobileJoystick } from './Input'
import { CollisionSystem } from './collision'
import { CharacterController } from './CharacterController'
import { MAP_CONFIG } from './Config'
import { NightSky } from './NightSky'
import { createNeonGridMaterial } from './Neon'

// ── Exact node names from map.glb (verified by parsing binary) ───────────────
const PIN_NAMES = ['Pin008','Pin007','Pin004','Pin002','Pin005','Pin006','Pin01','Pin003']

// Pin → building/page mapping (update as you wire more pages)
const PIN_TO_PAGE: Record<string, string> = {
  'Pin004': 'AB1',
  'Pin007': 'FootballGround',
  'Pin01': 'GrandStairs',
  'Pin008': 'CricketGround',
}

// Buildings to draw ground outlines around (exact node names)
const OUTLINE_TARGETS = ['AB1','AB2','AB3','LHCnew','Mess']

// Nodes to hide — only the flat ground plane meshes, NOT the domes
const HIDE_NAMES = ['majorfloor','base_plane','ground_plane']

// Nodes whose meshes are NOT added to collision (pins float freely)
const NOCOLLIDE_NAMES = new Set(PIN_NAMES)

// ── Neon bokeh floating lights — one Points draw call, fully GPU animated ──────
// 60 particles, all motion in vertex shader — zero CPU per frame after init
function createBokehLights(scene: THREE.Scene): { update(t: number): void; dispose(): void } {
  const N        = 60          // reduced from 80 — enough visual density
  const SPREAD_R = 260
  const HEIGHT_LO = 4
  const HEIGHT_HI = 55

  const positions = new Float32Array(N * 3)
  const phases    = new Float32Array(N)
  const speeds    = new Float32Array(N)
  const sizes     = new Float32Array(N)
  const colorIdx  = new Float32Array(N)   // 0=blue, 1=purple, 2=teal, 3=pink, 4=white
  const starFlag  = new Float32Array(N)   // 1 = render as sparkle star, 0 = soft disc

  for (let i = 0; i < N; i++) {
    const angle = Math.random() * Math.PI * 2
    const r     = Math.sqrt(Math.random()) * SPREAD_R
    positions[i*3]   = Math.cos(angle) * r
    positions[i*3+1] = HEIGHT_LO + Math.random() * (HEIGHT_HI - HEIGHT_LO)
    positions[i*3+2] = Math.sin(angle) * r
    phases[i]   = Math.random() * Math.PI * 2
    speeds[i]   = 0.08 + Math.random() * 0.16
    // Mix large discs and small stars
    starFlag[i] = Math.random() < 0.35 ? 1.0 : 0.0
    sizes[i]    = starFlag[i] > 0.5
      ? 14 + Math.random() * 22    // stars: small & sharp
      : 130 + Math.random() * 200  // discs: large & soft
    colorIdx[i] = Math.floor(Math.random() * 5)
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geo.setAttribute('phase',    new THREE.BufferAttribute(phases,   1))
  geo.setAttribute('spd',      new THREE.BufferAttribute(speeds,   1))
  geo.setAttribute('sz',       new THREE.BufferAttribute(sizes,    1))
  geo.setAttribute('cIdx',     new THREE.BufferAttribute(colorIdx, 1))
  geo.setAttribute('isStar',   new THREE.BufferAttribute(starFlag, 1))

  const mat = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 } },
    vertexShader: /* glsl */`
      uniform float time;
      attribute float phase, spd, sz, cIdx, isStar;
      varying float vAlpha, vCIdx, vStar;
      void main() {
        vec3 p = position;
        // Float up and down — main vertical drift
        p.y += sin(time * spd + phase) * 5.5;
        // Gentle horizontal wander
        p.x += cos(time * spd * 0.35 + phase * 1.2) * 2.5;
        p.z += sin(time * spd * 0.28 + phase * 0.9) * 2.5;

        // Twinkle for stars, slow pulse for discs
        float twinkle = isStar > 0.5
          ? pow(max(0.0, sin(time * spd * 4.0 + phase)), 4.0)
          : 0.4 + 0.6 * (0.5 + 0.5 * sin(time * spd * 1.3 + phase));
        vAlpha = twinkle;
        vCIdx  = cIdx;
        vStar  = isStar;

        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position  = projectionMatrix * mv;
        gl_PointSize = sz * (160.0 / -mv.z);
      }
    `,
    fragmentShader: /* glsl */`
      varying float vAlpha, vCIdx, vStar;

      vec3 neonColor(int ci) {
        if      (ci == 0) return vec3(0.20, 0.45, 1.00);  // blue
        else if (ci == 1) return vec3(0.65, 0.15, 1.00);  // purple
        else if (ci == 2) return vec3(0.00, 0.88, 0.82);  // teal
        else if (ci == 3) return vec3(1.00, 0.25, 0.70);  // pink
        else              return vec3(0.90, 0.95, 1.00);  // cool white
      }

      void main() {
        vec2  uv = gl_PointCoord - 0.5;
        float d  = length(uv);
        if (d > 0.5) discard;

        vec3 col = neonColor(int(vCIdx));
        float a;

        if (vStar > 0.5) {
          // 4-point sparkle star
          float star = max(
            smoothstep(0.06, 0.0, abs(uv.x)) * smoothstep(0.5, 0.0, abs(uv.y)),
            smoothstep(0.06, 0.0, abs(uv.y)) * smoothstep(0.5, 0.0, abs(uv.x)));
          float core = 1.0 - smoothstep(0.0, 0.12, d);
          a = (core * 0.7 + star * 0.9) * vAlpha;
        } else {
          // Soft bokeh disc
          float core = 1.0 - smoothstep(0.0, 0.14, d);
          float halo = 1.0 - smoothstep(0.0, 0.50, d);
          a = (core * 0.55 + halo * 0.32) * vAlpha * 0.48;
        }

        gl_FragColor = vec4(col, a);
      }
    `,
    transparent: true,
    depthWrite:  false,
    blending:    THREE.AdditiveBlending,
  })

  const pts = new THREE.Points(geo, mat)
  pts.frustumCulled = false
  scene.add(pts)
  return {
    update(t: number) { mat.uniforms.time.value = t },
    dispose() { scene.remove(pts); geo.dispose(); mat.dispose() }
  }
}

// ── Neon building ground outline ──────────────────────────────────────────────
function createBuildingOutline(
  scene:   THREE.Scene,
  box:     THREE.Box3,
  timeRef: { value: number }
): () => void {
  const pad = 3.0                        // generous padding around footprint
  const cx  = (box.min.x + box.max.x) / 2
  const cz  = (box.min.z + box.max.z) / 2
  const w   = (box.max.x - box.min.x) + pad * 2
  const d   = (box.max.z - box.min.z) + pad * 2

  const geo = new THREE.PlaneGeometry(w, d)
  geo.rotateX(-Math.PI / 2)

  const mat = new THREE.ShaderMaterial({
    uniforms: {
      time:  timeRef,
      sz:    { value: new THREE.Vector2(w, d) },
    },
    vertexShader: /* glsl */`
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }
    `,
    fragmentShader: /* glsl */`
      uniform float time;
      uniform vec2  sz;
      varying vec2  vUv;
      void main() {
        // Thick bold border — fixed world-space width relative to plane size
        float lw = 0.048 + 0.008 * sin(time * 1.6);   // ~4-5% of UV = thick
        float bx = min(vUv.x, 1.-vUv.x);
        float by = min(vUv.y, 1.-vUv.y);
        float bd = min(bx, by);
        if (bd > lw) discard;

        // Marching-ants arc length
        float arc;
        if (bx < by)
          arc = vUv.x < .5 ? vUv.y*sz.y : sz.x+sz.y+(1.-vUv.y)*sz.y;
        else
          arc = vUv.y < .5 ? sz.y+(1.-vUv.x)*sz.x : sz.y+sz.x+sz.y+vUv.x*sz.x;

        // Slower, spaced dashes
        float dash = fract(arc * 0.08 - time * 1.6);
        if (dash < 0.30) discard;

        float pulse = .75 + .25*sin(time*2.0);
        // Sharp inner edge, soft outer glow
        float edge  = smoothstep(lw, lw*0.05, bd);
        float glow  = smoothstep(lw, 0.0, bd) * 0.5;

        // Bright neon white-cyan
        vec3 col = mix(vec3(0.5, 1.0, 1.0), vec3(1.0, 1.0, 1.0), 0.6);
        col *= 2.2 + pulse * 0.8;          // overbright for bloom-like look
        gl_FragColor = vec4(col, (edge + glow) * pulse);
      }
    `,
    transparent: true,
    depthWrite:  false,
    blending:    THREE.AdditiveBlending,
    side:        THREE.DoubleSide,
  })

  const mesh = new THREE.Mesh(geo, mat)
  mesh.position.set(cx, 0.04, cz)
  mesh.renderOrder = 1
  scene.add(mesh)
  return () => { scene.remove(mesh); geo.dispose(); mat.dispose() }
}

// ── Sparkle particles that orbit a fixed world position — fully GPU driven ────
function createPinSparkles(
  scene:    THREE.Scene,
  worldPos: THREE.Vector3
): { update(t: number): void; dispose(): void } {
  const N  = 40   // reduced from 55 — GPU handles motion, no CPU loop needed
  const ph = new Float32Array(N)
  const sp = new Float32Array(N)
  const r  = new Float32Array(N)
  const bh = new Float32Array(N)
  const tw = new Float32Array(N)
  // Bake world position into per-particle base so GPU can offset directly
  const base = new Float32Array(N * 3)

  for (let i = 0; i < N; i++) {
    ph[i]       = (i/N)*Math.PI*2 + Math.random()*.4
    sp[i]       = .4 + Math.random()*.8
    r[i]        = .5 + Math.random()*1.2
    bh[i]       = Math.random()*3.2
    tw[i]       = Math.random()*Math.PI*2
    base[i*3]   = worldPos.x
    base[i*3+1] = worldPos.y
    base[i*3+2] = worldPos.z
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(base, 3))   // static base pos
  geo.setAttribute('phase',    new THREE.BufferAttribute(ph, 1))
  geo.setAttribute('spd',      new THREE.BufferAttribute(sp, 1))
  geo.setAttribute('orb',      new THREE.BufferAttribute(r,  1))
  geo.setAttribute('bh',       new THREE.BufferAttribute(bh, 1))
  geo.setAttribute('tw',       new THREE.BufferAttribute(tw, 1))

  const mat = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 } },
    vertexShader: /* glsl */`
      uniform float time;
      attribute float phase, spd, orb, bh, tw;
      varying float vA;
      void main() {
        float t   = time * spd + phase;
        float dr  = mod(time * 0.22 + phase * 0.5, 3.2);
        float twk = pow(max(0.0, sin(time * 3.1 + tw)), 5.0);
        vA = twk * (1.0 - dr / 3.2) * 0.95 + 0.04;
        // Orbit around baked world-space base position
        vec3 p = vec3(
          position.x + cos(t) * orb,
          position.y - bh + dr,
          position.z + sin(t) * orb
        );
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position  = projectionMatrix * mv;
        gl_PointSize = (2.0 + twk * 8.0) * (200.0 / -mv.z);
      }
    `,
    fragmentShader: /* glsl */`
      varying float vA;
      void main() {
        vec2 uv = gl_PointCoord - 0.5;
        float d = length(uv);
        if (d > 0.5) discard;
        float star = max(
          smoothstep(.07, .0, abs(uv.x)) * smoothstep(.5, .0, abs(uv.y)),
          smoothstep(.07, .0, abs(uv.y)) * smoothstep(.5, .0, abs(uv.x)));
        float a = (1.0 - smoothstep(0.0, .22, d)) * .8
                + (1.0 - smoothstep(.1,  .5,  d)) * .25
                + star * .6;
        gl_FragColor = vec4(0.9, 0.96, 1.0, a * vA);
      }
    `,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  })

  const pts = new THREE.Points(geo, mat)
  pts.frustumCulled = false
  scene.add(pts)

  return {
    update(t: number) { mat.uniforms.time.value = t },   // one uniform write — no CPU loop
    dispose() { scene.remove(pts); geo.dispose(); mat.dispose() }
  }
}

// ── Neon ground donut rings below each pin ────────────────────────────────────
// Flat RingGeometry on the ground. Fragment uses world-space radius to produce
// a clean filled outer band (neon white) with an empty hole in the centre.
function createPinGroundRings(
  scene:    THREE.Scene,
  worldPos: THREE.Vector3,
  timeRef:  { value: number }
): () => void {
  // Each donut: inner hole radius, outer filled-band radius
  const RINGS = [
    { inner: 1.4, outer: 2.6 },
    { inner: 3.6, outer: 4.6 },
    { inner: 6.0, outer: 7.0 },
  ]
  const meshes: THREE.Mesh[]         = []
  const mats:   THREE.ShaderMaterial[] = []

  for (const ring of RINGS) {
    // Extra geometry segments so the circular edges are smooth
    const geo  = new THREE.RingGeometry(ring.inner, ring.outer, 80, 1)

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        time:    timeRef,
        innerR:  { value: ring.inner },
        outerR:  { value: ring.outer },
        centre:  { value: new THREE.Vector2(worldPos.x, worldPos.z) },
      },
      vertexShader: /* glsl */`
        varying vec2 vWorld;
        void main() {
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vWorld = wp.xz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */`
        uniform float time, innerR, outerR;
        uniform vec2  centre;
        varying vec2  vWorld;

        void main() {
          float d     = length(vWorld - centre);          // world-space radius
          float band  = outerR - innerR;

          // Hard discard outside the ring
          if (d < innerR || d > outerR) discard;

          // Radial gradient: 0 at inner edge → 1 at outer edge
          float t = (d - innerR) / band;

          // Filled solid band, brightest at outer rim, fades slightly inward
          float fill = smoothstep(0.0, 0.25, t);          // sharp inner cutoff
          float rim  = 1.0 - smoothstep(0.72, 1.0, t);   // soft outer glow falloff

          // Rotating dash pattern (circumferential)
          float angle  = atan(vWorld.y - centre.y, vWorld.x - centre.x);
          float dashes = fract(angle / (3.14159 * 2.0) * 12.0 - time * 0.4);
          float dash   = smoothstep(0.20, 0.32, dashes);  // soft dash edges

          float pulse = 0.70 + 0.30 * sin(time * 1.8);
          float alpha = fill * rim * dash * pulse * 0.95;

          // Neon white, very slightly blue-tinted
          vec3 col = vec3(0.92, 0.97, 1.00) * (2.0 + pulse * 0.4);
          gl_FragColor = vec4(col, alpha);
        }
      `,
      transparent: true,
      depthWrite:  false,
      blending:    THREE.AdditiveBlending,
      side:        THREE.DoubleSide,
    })

    const mesh = new THREE.Mesh(geo, mat)
    mesh.rotation.x = -Math.PI / 2
    mesh.position.set(worldPos.x, 0.04, worldPos.z)
    mesh.renderOrder = 2
    scene.add(mesh)
    meshes.push(mesh)
    mats.push(mat)
  }

  return () => {
    for (const m of meshes) { scene.remove(m); m.geometry.dispose() }
    for (const m of mats)   m.dispose()
  }
}

// ─────────────────────────────────────────────────────────────────────────────
export default function Map({ onPinClick, activePage }: { onPinClick?: (page: string) => void; activePage?: string | null }) {
  const mountRef = useRef<HTMLDivElement>(null)
  const activePageRef = useRef(activePage)
  activePageRef.current = activePage

  useEffect(() => {
    const mount = mountRef.current; if (!mount) return

    // ── Renderer ──────────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias:true, powerPreference:'high-performance' })
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
    renderer.setSize(innerWidth, innerHeight)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type    = THREE.PCFSoftShadowMap
    renderer.outputColorSpace  = THREE.SRGBColorSpace
    renderer.toneMapping       = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.1
    mount.appendChild(renderer.domElement)

    // ── Scene ─────────────────────────────────────────────────────────────────
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(MAP_CONFIG.skyColor)
    scene.fog = new THREE.FogExp2(MAP_CONFIG.fogColor, MAP_CONFIG.fogDensity * 0.55)

    // ── Camera ────────────────────────────────────────────────────────────────
    const camera = new THREE.PerspectiveCamera(60, innerWidth/innerHeight, 0.1, 1200)
    camera.position.set(0, 20, 40)

    // ── Lights ────────────────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xddeeff, 0.75))
    const sun = new THREE.DirectionalLight(0xe0f0ff, 1.9)
    sun.position.set(60, 120, 60); sun.castShadow = true
    sun.shadow.mapSize.set(MAP_CONFIG.shadowMapSize, MAP_CONFIG.shadowMapSize)
    sun.shadow.camera.near = 0.5; sun.shadow.camera.far = 500
    sun.shadow.camera.left = sun.shadow.camera.bottom = -150
    sun.shadow.camera.right = sun.shadow.camera.top   =  150
    sun.shadow.bias = -0.0004
    scene.add(sun)
    const fill = new THREE.DirectionalLight(0xadd8ff, 0.55)
    fill.position.set(-60, 50, -60); scene.add(fill)

    // ── Neon grid floor — 2000×2000 so it looks infinite ─────────────────────
    const neonMat = createNeonGridMaterial()
    const floorGeo = new THREE.PlaneGeometry(2000, 2000, 1, 1)
    const floorMesh = new THREE.Mesh(floorGeo, neonMat)
    floorMesh.rotation.x = -Math.PI / 2
    floorMesh.position.y = 0
    scene.add(floorMesh)
    // Shared time uniform so building outlines pulse in sync with the floor
    const sharedTime = neonMat.uniforms.time as { value: number }

    // ── Loading helpers ───────────────────────────────────────────────────────
    const barEl  = document.getElementById('map-bar')
    const textEl = document.getElementById('map-text')
    const setProg = (p: number, msg?: string) => {
      if (barEl)  barEl.style.width  = p + '%'
      if (msg && textEl) textEl.textContent = msg
    }

    const gltfLoader = new GLTFLoader()
    const loadGLTF = (url: string, a: number, b: number, label: string) =>
      new Promise<{ scene: THREE.Group; animations: THREE.AnimationClip[] }>((res,rej) =>
        gltfLoader.load(url,
          g  => { setProg(b, label+' loaded'); res(g) },
          xhr=> { if(xhr.lengthComputable) setProg(a+(xhr.loaded/xhr.total)*(b-a)) },
          rej
        )
      )

    // ── Runtime ───────────────────────────────────────────────────────────────
    let raf = 0
    let inputCtrl: InputController | null = null
    let charCtrl:  CharacterController   | null = null
    let joystick:  MobileJoystick        | null = null
    const clock    = new THREE.Clock()
    const nightSky = new NightSky(scene)

    type Sparkle = ReturnType<typeof createPinSparkles>
    type PinEntry = { obj: THREE.Object3D; baseY: number; phase: number; name: string }
    const pins:     PinEntry[]     = []
    const sparkles: Sparkle[]      = []
    const outlines: (() => void)[] = []
    const pinRings: (() => void)[] = []

    // ── Pin proximity interaction ──────────────────────────────────────────
    const INTERACT_RADIUS = 12  // world units — show prompt
    const AUTO_CLOSE_RADIUS = 20  // world units — auto-close page
    const pinWorldPositions: { name: string; pos: THREE.Vector3 }[] = []
    let nearbyPin: string | null = null
    const promptEl = document.getElementById('pin-prompt')

    const pinKeyHandler = (e: KeyboardEvent) => {
      if (e.code === 'KeyE' || e.key === 'e' || e.key === 'E') {
        if (!onPinClick) return
        // If a page is currently open, close it
        if (activePageRef.current) {
          onPinClick(activePageRef.current)
          return
        }
        // Otherwise open the nearby pin's page
        if (nearbyPin) {
          const page = PIN_TO_PAGE[nearbyPin]
          if (page) onPinClick(page)
        }
      }
    }
    window.addEventListener('keydown', pinKeyHandler)

    // Create bokeh lights immediately — they fill the whole scene
    const bokeh = createBokehLights(scene)

    // World Y axis — reused every frame for pin spin
    const WORLD_Y = new THREE.Vector3(0, 1, 0)

    const tick = () => {
      raf = requestAnimationFrame(tick)
      const dt = Math.min(clock.getDelta(), 0.05)
      const t  = clock.getElapsedTime()

      // Advance neon floor time
      sharedTime.value += dt
      // Push character position into floor shader for proximity glow
      if (charCtrl) (neonMat.uniforms.charPos as { value: THREE.Vector3 }).value.copy(charCtrl.position)

      // ── Pins: churn-spin around WORLD Y (like a planet rotating on its axis)
      // rotateOnWorldAxis ignores the baked quaternion — always spins around world Y
      for (const p of pins) {
        p.obj.rotateOnWorldAxis(WORLD_Y, dt * 0.28)
        p.obj.position.y = p.baseY + Math.sin(t * 1.1 + p.phase) * 0.09
      }

      for (const sp of sparkles) sp.update(t)
      bokeh.update(t)

      if (charCtrl && inputCtrl && joystick)
        charCtrl.update(dt, inputCtrl, joystick.getInput())

      // ── Pin proximity check ──────────────────────────────────────────────
      if (charCtrl && promptEl) {
        let closest: string | null = null
        let closestDist = Infinity
        for (const pw of pinWorldPositions) {
          const dx = charCtrl.position.x - pw.pos.x
          const dz = charCtrl.position.z - pw.pos.z
          const dist = Math.sqrt(dx * dx + dz * dz)
          if (dist < INTERACT_RADIUS && dist < closestDist && PIN_TO_PAGE[pw.name]) {
            closest = pw.name
            closestDist = dist
          }
        }
        nearbyPin = closest
        if (nearbyPin) {
          promptEl.style.opacity = '1'
          promptEl.style.transform = 'translate(-50%, 0) scale(1)'
        } else {
          promptEl.style.opacity = '0'
          promptEl.style.transform = 'translate(-50%, 8px) scale(0.95)'
        }

        // Auto-close page if character walks too far from the active pin
        if (activePageRef.current && onPinClick) {
          let stillNear = false
          for (const pw of pinWorldPositions) {
            if (PIN_TO_PAGE[pw.name] !== activePageRef.current) continue
            const dx2 = charCtrl.position.x - pw.pos.x
            const dz2 = charCtrl.position.z - pw.pos.z
            if (Math.sqrt(dx2 * dx2 + dz2 * dz2) < AUTO_CLOSE_RADIUS) {
              stillNear = true
              break
            }
          }
          if (!stillNear) onPinClick(activePageRef.current)
        }
      }

      nightSky.update(dt, camera.position)
      renderer.render(scene, camera)
    }

    ;(async () => {
      try {
        setProg(5, 'Loading map…')
        const mapGLTF = await loadGLTF(MAP_CONFIG.mapModelPath, 5, 55, 'Map')

        // Per-building world-space bounding boxes accumulated during traverse
        const bldBoxMap: Record<string, THREE.Box3> = {}

        mapGLTF.scene.traverse(c => {
          const obj = c as THREE.Mesh
          const name = obj.name
          const nl   = name.toLowerCase()

          // ── Hide unwanted meshes ────────────────────────────────────────────
          if (HIDE_NAMES.some(n => name === n || nl.includes(n.toLowerCase()))) {
            obj.visible = false
            console.log(`[Map] hidden '${name}'`)
            return
          }

          // ── Fix negative scales from Blender ───────────────────────────────
          const s = obj.scale
          if (s.x < 0 || s.y < 0 || s.z < 0) {
            if (obj.isMesh && obj.geometry) {
              obj.geometry = obj.geometry.clone()
              obj.geometry.applyMatrix4(new THREE.Matrix4().makeScale(
                s.x<0?-1:1, s.y<0?-1:1, s.z<0?-1:1))
              const nor = obj.geometry.attributes.normal
              if (nor) {
                for (let i=0;i<nor.count;i++){
                  if(s.x<0)nor.setX(i,-nor.getX(i))
                  if(s.y<0)nor.setY(i,-nor.getY(i))
                  if(s.z<0)nor.setZ(i,-nor.getZ(i))
                }
                nor.needsUpdate=true
              }
            }
            s.set(Math.abs(s.x), Math.abs(s.y), Math.abs(s.z))
          }

          if (obj.isMesh) {
            obj.castShadow = obj.receiveShadow = true

            // Accumulate outline boxes for named buildings
            for (const bn of OUTLINE_TARGETS) {
              if (name === bn || nl === bn.toLowerCase()) {
                obj.updateWorldMatrix(true, false)
                const mb = new THREE.Box3().setFromObject(obj)
                if (!bldBoxMap[bn]) bldBoxMap[bn] = mb.clone()
                else bldBoxMap[bn].union(mb)
              }
            }
          }
        })

        mapGLTF.scene.updateMatrixWorld(true)
        scene.add(mapGLTF.scene)
        mapGLTF.scene.updateMatrixWorld(true)

        // ── Building outlines ─────────────────────────────────────────────────
        for (const [bn, box] of Object.entries(bldBoxMap)) {
          outlines.push(createBuildingOutline(scene, box, sharedTime))
          console.log(`[Outline] '${bn}'`, box.min.toArray().map((v: number) => v.toFixed(1)), '→', box.max.toArray().map((v: number) => v.toFixed(1)))
        }

        const mapBox  = new THREE.Box3().setFromObject(mapGLTF.scene)
        const mapSize = mapBox.getSize(new THREE.Vector3())
        console.log('[Map] size', mapSize)

        // ── Pins — matched by exact node name ─────────────────────────────────
        mapGLTF.scene.traverse(c => {
          if (!PIN_NAMES.includes(c.name)) return
          c.updateWorldMatrix(true, false)
          const wp = new THREE.Vector3(); c.getWorldPosition(wp)
          pins.push({ obj: c, baseY: c.position.y, phase: Math.random()*Math.PI*2, name: c.name })
          pinWorldPositions.push({ name: c.name, pos: wp.clone() })
          sparkles.push(createPinSparkles(scene, wp))
          pinRings.push(createPinGroundRings(scene, wp, sharedTime))
          console.log(`[Pin] '${c.name}' at`, wp.toArray().map((v: number) => v.toFixed(1)))
        })
        console.log(`[Pins] ${pins.length} registered`)

        // ── Character ─────────────────────────────────────────────────────────
        setProg(55, 'Loading character…')
        const charGLTF = await loadGLTF(MAP_CONFIG.characterModelPath, 55, 90, 'Character')
        charGLTF.scene.traverse(c=>{
          const m=c as THREE.Mesh; if(m.isMesh){m.castShadow=m.receiveShadow=true}
        })
        charGLTF.scene.updateMatrixWorld(true)

        const rawH   = new THREE.Box3().setFromObject(charGLTF.scene).getSize(new THREE.Vector3()).y || 1
        const target = Math.max(mapSize.x, mapSize.z) * 0.015
        charGLTF.scene.scale.setScalar(target / rawH)
        charGLTF.scene.updateMatrixWorld(true)
        const charHeight = new THREE.Box3().setFromObject(charGLTF.scene).getSize(new THREE.Vector3()).y
        scene.add(charGLTF.scene)
        console.log(`[Char] height=${charHeight.toFixed(2)}`)

        // ── Collision — exclude only pins (they float freely) ────────────────
        // Mess is now fully solid for both character AND camera
        const collision = new CollisionSystem(
          mapGLTF.scene,
          name => !NOCOLLIDE_NAMES.has(name),   // character: blocks all except pins
          name => !NOCOLLIDE_NAMES.has(name)    // camera:    blocks all except pins
        )

        // ── World boundary — tight to map extents ─────────────────────────────
        const INSET = 2
        collision.setBoundary(
          new THREE.Vector2(mapBox.min.x + INSET, mapBox.min.z + INSET),
          new THREE.Vector2(mapBox.max.x - INSET, mapBox.max.z - INSET)
        )
        console.log('[Boundary]', mapBox.min.x+INSET, mapBox.min.z+INSET, '→', mapBox.max.x-INSET, mapBox.max.z-INSET)

        // Spawn: raycast from sky at origin, land on whatever is there
        const spawnProbe = new THREE.Vector3(0, 50, 0)
        const groundY    = collision.getGroundY(spawnProbe, charHeight)
        const spawnPos   = new THREE.Vector3(0, groundY, 0)
        console.log('[Spawn] groundY=', groundY)

        inputCtrl = new InputController()
        // Only create joystick on touch devices — pointer:coarse = touchscreen
        const isTouchDevice = window.matchMedia('(pointer: coarse)').matches
        const joyBase   = document.getElementById('joy-base')
        const joyKnob   = document.getElementById('joy-knob')
        if (isTouchDevice && joyBase && joyKnob) {
          joystick = new MobileJoystick(joyBase, joyKnob, document.createElement('div'))
        } else {
          joystick = new MobileJoystick(
            document.createElement('div'),
            document.createElement('div'),
            document.createElement('div'),
          )
        }

        charCtrl = new CharacterController({
          model:      charGLTF.scene,
          mixer:      charGLTF.animations.length ? new THREE.AnimationMixer(charGLTF.scene) : null,
          animations: charGLTF.animations,
          camera, collision, mapBounds: mapBox, spawnPos, charHeight,
        })

        setProg(100, 'Ready!')
        const loadEl = document.getElementById('map-loading')
        if (loadEl) setTimeout(()=>{ loadEl.style.opacity='0'; setTimeout(()=>loadEl.remove(),700) },300)
        const hint = document.getElementById('map-hint')
        setTimeout(()=>{ if(hint) hint.style.opacity='0' },6000)

        tick()
      } catch(err) {
        console.error('[Map] load error:', err)
        if (textEl) textEl.textContent = 'Error loading — see console.'
      }
    })()

    const onResize = () => {
      camera.aspect = innerWidth/innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(innerWidth, innerHeight)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('keydown', pinKeyHandler)
      inputCtrl?.destroy()
      nightSky.destroy()
      neonMat.dispose(); floorGeo.dispose()
      sparkles.forEach(s => s.dispose())
      pinRings.forEach(d => d())
      bokeh.dispose()
      outlines.forEach(d => d())
      renderer.dispose()
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement)
    }
  }, [])

  return (
    <>
      <style>{`
        *,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
        html,body,#root{width:100%;height:100%;overflow:hidden;background:#000;touch-action:none}

        /* ════════════════════════════════════════════════════════════════
           SCREENTONE — three layered CSS effects:
           1. Halftone dot grid        (radial-gradient repeat)
           2. Diagonal hatch lines     (repeating-linear-gradient)
           3. Radial vignette          (::before pseudo)
           All use mix-blend-mode:multiply so they darken without washing out
           the neon colours beneath.
        ════════════════════════════════════════════════════════════════ */
        #screentone{
          position:fixed;inset:0;pointer-events:none;z-index:50;
          /* dot grid */
          background-image:radial-gradient(circle, rgba(0,0,0,0.22) 1px, transparent 1px);
          background-size:4px 4px;
          mix-blend-mode:multiply;
        }
        /* diagonal hatch */
        #screentone::after{
          content:'';position:absolute;inset:0;
          background-image:repeating-linear-gradient(
            -45deg, transparent, transparent 3px,
            rgba(0,0,0,0.055) 3px, rgba(0,0,0,0.055) 4px
          );
          mix-blend-mode:multiply;
        }
        /* vignette */
        #screentone::before{
          content:'';position:absolute;inset:0;
          background:radial-gradient(ellipse at 50% 40%, transparent 35%, rgba(0,0,0,0.62) 100%);
        }

        /* ── Loading ── */
        #map-loading{
          position:fixed;inset:0;background:#08080f;
          display:flex;flex-direction:column;align-items:center;justify-content:center;
          z-index:9999;transition:opacity .7s ease;
        }
        #map-loading h1{
          color:#e4ddd4;font-size:1.9rem;font-weight:300;letter-spacing:.45em;
          text-transform:uppercase;font-family:system-ui,sans-serif;margin-bottom:2rem;
        }
        #map-bar-wrap{width:260px;height:2px;background:#1a1a2a;border-radius:2px;overflow:hidden}
        #map-bar{height:100%;width:0%;background:linear-gradient(90deg,#00ffec,#ff00ff);
          border-radius:2px;transition:width .25s ease}
        #map-text{margin-top:1rem;color:#44445a;font-size:.72rem;letter-spacing:.22em;
          text-transform:uppercase;font-family:system-ui,sans-serif}

        /* ── HUD ── */
        #map-hint{
          position:fixed;top:20px;left:50%;transform:translateX(-50%);
          background:rgba(0,0,0,.55);backdrop-filter:blur(8px);
          border:1px solid rgba(255,255,255,.10);border-radius:8px;
          padding:8px 22px;color:rgba(255,255,255,.72);
          font-size:.72rem;letter-spacing:.13em;text-transform:uppercase;
          font-family:system-ui,sans-serif;pointer-events:none;
          transition:opacity 1.2s ease;z-index:100;white-space:nowrap;
        }
        #speed-indicator{
          position:fixed;top:20px;right:20px;
          background:rgba(0,0,0,.55);backdrop-filter:blur(8px);
          border:1px solid rgba(255,255,255,.10);border-radius:8px;
          padding:8px 14px;color:rgba(255,255,255,.6);
          font-size:.7rem;letter-spacing:.12em;text-transform:uppercase;
          font-family:system-ui,sans-serif;pointer-events:none;
          display:flex;align-items:center;gap:8px;
          opacity:0;transition:opacity .3s,color .3s,border-color .3s;z-index:100;
        }
        #speed-indicator.sprinting{opacity:1;color:#ff6b35;border-color:rgba(255,107,53,.35)}
        .spd-dot{width:6px;height:6px;border-radius:50%;background:currentColor;
          animation:sdp .6s ease-in-out infinite alternate}
        @keyframes sdp{from{transform:scale(1);opacity:1}to{transform:scale(1.6);opacity:.4}}

        /* ── Mobile joystick — hidden by default, shown only on touch devices ── */
        #joy-zone { display: none }
        @media (pointer: coarse) {
          #joy-zone {
            display: block;
            position: fixed; bottom: 0; left: 0; width: 200px; height: 200px;
            pointer-events: all; z-index: 100;
          }
          #joy-base {
            position: absolute; bottom: 30px; left: 30px;
            width: 110px; height: 110px; border-radius: 50%;
            background: rgba(255,255,255,.07); border: 2px solid rgba(255,255,255,.18);
            backdrop-filter: blur(4px);
          }
          #joy-knob {
            width: 44px; height: 44px; border-radius: 50%;
            background: rgba(255,107,53,.82);
            border: 2px solid rgba(255,200,150,.55);
            position: absolute; left: 50%; top: 50%;
            transform: translate(-50%,-50%);
            box-shadow: 0 0 18px rgba(255,107,53,.35);
            cursor: grab; touch-action: none;
          }
        }
        #sprint-btn, #jump-btn { display: none !important }

        /* ── Pin interaction prompt ── */
        #pin-prompt{
          position:fixed;bottom:80px;left:50%;transform:translate(-50%, 8px) scale(0.95);
          background:rgba(0,0,0,.7);backdrop-filter:blur(12px);
          border:1px solid rgba(77,216,230,.35);border-radius:10px;
          padding:10px 28px;color:rgba(255,255,255,.85);
          font-size:.82rem;letter-spacing:.1em;text-transform:uppercase;
          font-family:'Orbitron',system-ui,sans-serif;pointer-events:none;
          opacity:0;transition:opacity .3s ease, transform .3s ease;
          z-index:100;white-space:nowrap;
          box-shadow:0 0 20px rgba(77,216,230,.12);
        }
        #pin-prompt kbd{
          display:inline-block;padding:2px 10px;margin:0 4px;
          background:rgba(77,216,230,.18);border:1px solid rgba(77,216,230,.45);
          border-radius:5px;color:#4dd8e6;font-weight:700;
          font-family:'Orbitron',monospace;font-size:.9rem;
        }
      `}</style>

      <div style={{position:'fixed',inset:0,width:'100vw',height:'100vh'}}>
        <div ref={mountRef} style={{width:'100%',height:'100%'}} />

        {/* Screentone — manga halftone + diagonal hatch + vignette */}
        <div id="screentone" />

        <div id="map-loading">
          <h1>World</h1>
          <div id="map-bar-wrap"><div id="map-bar" /></div>
          <div id="map-text">Loading assets…</div>
        </div>

        <div id="map-hint">WASD · Space jump · Shift sprint · Drag to orbit</div>
        <div id="speed-indicator"><span className="spd-dot" />Sprinting</div>

        {/* Pin interaction prompt */}
        <div id="pin-prompt">Press <kbd>E</kbd> to interact</div>

        {/* Joystick — CSS hides on non-touch via @media(hover:hover)and(pointer:fine) */}
        <div id="joy-zone"><div id="joy-base"><div id="joy-knob" /></div></div>
      </div>
    </>
  )
}
