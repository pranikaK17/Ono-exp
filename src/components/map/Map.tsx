// src/components/map/Map.tsx
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { InputController, MobileJoystick } from './Input'   // ← capital I
import { CollisionSystem } from './collision'
import { CharacterController } from './CharacterController'
import { MAP_CONFIG } from './Config'

export default function Map() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    // ── Renderer ──────────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.shadowMap.enabled   = true
    renderer.shadowMap.type      = THREE.PCFSoftShadowMap
    renderer.outputColorSpace    = THREE.SRGBColorSpace
    renderer.toneMapping         = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.1
    mount.appendChild(renderer.domElement)

    // ── Scene ─────────────────────────────────────────────────────────────────
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(MAP_CONFIG.skyColor)
    scene.fog        = new THREE.FogExp2(MAP_CONFIG.fogColor, MAP_CONFIG.fogDensity)

    // ── Camera ────────────────────────────────────────────────────────────────
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000)
    camera.position.set(0, 10, 20)

    // ── Lights ────────────────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xffeedd, 0.7))

    const sun = new THREE.DirectionalLight(0xfff5e0, 1.8)
    sun.position.set(50, 100, 50)
    sun.castShadow = true
    sun.shadow.mapSize.set(MAP_CONFIG.shadowMapSize, MAP_CONFIG.shadowMapSize)
    sun.shadow.camera.near   = 0.5
    sun.shadow.camera.far    = 400
    sun.shadow.camera.left   = -120
    sun.shadow.camera.right  = 120
    sun.shadow.camera.top    = 120
    sun.shadow.camera.bottom = -120
    sun.shadow.bias          = -0.0005
    scene.add(sun)

    const fillLight = new THREE.DirectionalLight(0xadd8ff, 0.3)
    fillLight.position.set(-50, 40, -50)
    scene.add(fillLight)

    // ── Progress helpers ──────────────────────────────────────────────────────
    const barEl  = document.getElementById('map-bar')
    const textEl = document.getElementById('map-text')
    const setProg = (pct: number, msg?: string) => {
      if (barEl)         barEl.style.width   = pct + '%'
      if (msg && textEl) textEl.textContent  = msg
    }

    const loader = new GLTFLoader()
    const loadGLTF = (url: string, from: number, to: number, label: string) =>
      new Promise<{ scene: THREE.Group; animations: THREE.AnimationClip[] }>((res, rej) =>
        loader.load(url,
          g  => { setProg(to, `${label} loaded`); res(g) },
          xhr => { if (xhr.lengthComputable) setProg(from + (xhr.loaded / xhr.total) * (to - from)) },
          rej
        )
      )

    // ── Runtime ───────────────────────────────────────────────────────────────
    let raf = 0
    let inputCtrl: InputController | null = null
    let charCtrl:  CharacterController   | null = null
    let joystick:  MobileJoystick        | null = null
    const clock = new THREE.Clock()

    const tick = () => {
      raf = requestAnimationFrame(tick)
      const delta = Math.min(clock.getDelta(), 0.05)
      if (charCtrl && inputCtrl && joystick) {
        charCtrl.update(delta, inputCtrl, joystick.getInput())
      }
      renderer.render(scene, camera)
    }

    ;(async () => {
      try {
        // ── Load map ──────────────────────────────────────────────────────────
        setProg(5, 'Loading map...')
        const mapGLTF = await loadGLTF(MAP_CONFIG.mapModelPath, 5, 55, 'Map')

        // ── Fix negative scales ───────────────────────────────────────────────
        // Nodes like 'majorfloor' and 'building subpart' have negative scale
        // components exported from Blender. Negative scale in Three.js causes
        // inside-out normals, z-fighting, and objects appearing to float.
        // Fix: flip each negative scale axis to positive and compensate by
        // rotating the geometry 180° on that axis so it looks identical.
        mapGLTF.scene.traverse(c => {
          const obj = c as THREE.Mesh
          const s   = obj.scale

          // Fix each negative axis independently
          if (s.x < 0 || s.y < 0 || s.z < 0) {
            console.log(`[Map] fixing negative scale on '${obj.name}':`, s.x, s.y, s.z)

            // Absorb the negative scale into the geometry so the world matrix
            // stays clean — apply scale to geometry positions directly
            if (obj.isMesh && obj.geometry) {
              // Clone geometry so we don't mutate shared resources
              obj.geometry = obj.geometry.clone()
              obj.geometry.applyMatrix4(
                new THREE.Matrix4().makeScale(
                  s.x < 0 ? -1 : 1,
                  s.y < 0 ? -1 : 1,
                  s.z < 0 ? -1 : 1
                )
              )
              // Flip normals so lighting is correct after the scale flip
              const pos = obj.geometry.attributes.position
              const nor = obj.geometry.attributes.normal
              if (nor) {
                for (let i = 0; i < nor.count; i++) {
                  if (s.x < 0) nor.setX(i, -nor.getX(i))
                  if (s.y < 0) nor.setY(i, -nor.getY(i))
                  if (s.z < 0) nor.setZ(i, -nor.getZ(i))
                }
                nor.needsUpdate  = true
              }
              if (pos) pos.needsUpdate = true
            }

            // Make scale positive
            s.set(Math.abs(s.x), Math.abs(s.y), Math.abs(s.z))
          }

          if (obj.isMesh) {
            obj.castShadow    = true
            obj.receiveShadow = true
          }
        })

        // Force full world matrix recompute AFTER fixing scales
        mapGLTF.scene.updateMatrixWorld(true)
        scene.add(mapGLTF.scene)
        // Second update after adding to scene so all parent transforms are final
        mapGLTF.scene.updateMatrixWorld(true)

        const mapBox  = new THREE.Box3().setFromObject(mapGLTF.scene)
        const mapSize = mapBox.getSize(new THREE.Vector3())
        console.log('[Map] bounds:', mapBox.min, mapBox.max, 'size:', mapSize)

        // ── Load character ────────────────────────────────────────────────────
        setProg(55, 'Loading character...')
        const charGLTF = await loadGLTF(MAP_CONFIG.characterModelPath, 55, 90, 'Character')

        charGLTF.scene.traverse(c => {
          const m = c as THREE.Mesh
          if (m.isMesh) { m.castShadow = true; m.receiveShadow = true }
        })
        charGLTF.scene.updateMatrixWorld(true)

        const rawCharBox  = new THREE.Box3().setFromObject(charGLTF.scene)
        const rawCharSize = rawCharBox.getSize(new THREE.Vector3())

        const targetHeight = Math.max(mapSize.x, mapSize.z) * 0.015
        const rawHeight    = rawCharSize.y > 0 ? rawCharSize.y : 1
        const charScale    = targetHeight / rawHeight
        charGLTF.scene.scale.setScalar(charScale)
        charGLTF.scene.updateMatrixWorld(true)

        const scaledCharSize = new THREE.Box3().setFromObject(charGLTF.scene).getSize(new THREE.Vector3())
        const charHeight     = scaledCharSize.y
        console.log(`[Char] scale=${charScale.toFixed(3)}, height=${charHeight.toFixed(2)}`)

        scene.add(charGLTF.scene)

        // ── Build collision AFTER scene is fully added ────────────────────────
        const collision = new CollisionSystem(mapGLTF.scene)

        // ── Spawn at Blender origin (0, 0) ───────────────────────────────────
        // Raycast straight down at X=0, Z=0 to find the ground surface
        // at the point you set as origin in Blender.
        const originProbe = new THREE.Vector3(0, mapBox.max.y + 10, 0)
        const originGY    = collision.getGroundY(originProbe, charHeight) ?? mapBox.min.y
        const spawnPos    = new THREE.Vector3(0, originGY, 0)
        console.log('[Spawn] origin ground Y:', originGY, '→', spawnPos)

        // ── Controllers ───────────────────────────────────────────────────────
        inputCtrl = new InputController()

        const joyBase   = document.getElementById('joy-base')
        const joyKnob   = document.getElementById('joy-knob')
        const sprintBtn = document.getElementById('sprint-btn')
        joystick = (joyBase && joyKnob && sprintBtn)
          ? new MobileJoystick(joyBase, joyKnob, sprintBtn)
          : new MobileJoystick(
              document.createElement('div'),
              document.createElement('div'),
              document.createElement('div')
            )

        charCtrl = new CharacterController({
          model:      charGLTF.scene,
          mixer:      charGLTF.animations.length ? new THREE.AnimationMixer(charGLTF.scene) : null,
          animations: charGLTF.animations,
          camera,
          collision,
          mapBounds:  mapBox,
          spawnPos,
          charHeight,
        })

        // ── Hide loading ───────────────────────────────────────────────────────
        setProg(100, 'Ready!')
        const loadEl = document.getElementById('map-loading')
        if (loadEl) setTimeout(() => {
          loadEl.style.opacity = '0'
          setTimeout(() => loadEl.remove(), 700)
        }, 300)

        const hint = document.getElementById('map-hint')
        setTimeout(() => { if (hint) hint.style.opacity = '0' }, 6000)

        tick()

      } catch (err) {
        console.error('[Map] load error:', err)
        if (textEl) textEl.textContent = 'Error loading — see console.'
      }
    })()

    // ── Resize ────────────────────────────────────────────────────────────────
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      inputCtrl?.destroy()
      renderer.dispose()
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement)
    }
  }, [])

  // ── JSX ───────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
        html, body, #root {
          width:100%; height:100%; overflow:hidden;
          background:#000; touch-action:none;
        }

        /* Loading */
        #map-loading {
          position:fixed; inset:0; background:#0a0a0f;
          display:flex; flex-direction:column;
          align-items:center; justify-content:center;
          z-index:9999; transition:opacity 0.7s ease;
        }
        #map-loading h1 {
          color:#e8e0d0; font-size:2rem; font-weight:300;
          letter-spacing:0.4em; text-transform:uppercase;
          font-family:system-ui,sans-serif; margin-bottom:2rem;
        }
        #map-bar-wrap { width:280px; height:2px; background:#222; border-radius:2px; overflow:hidden; }
        #map-bar {
          height:100%; width:0%;
          background:linear-gradient(90deg,#ff6b35,#f7c59f);
          border-radius:2px; transition:width 0.3s ease;
        }
        #map-text {
          margin-top:1rem; color:#555;
          font-size:0.75rem; letter-spacing:0.2em;
          text-transform:uppercase; font-family:system-ui,sans-serif;
        }

        /* HUD */
        #map-hint {
          position:fixed; top:20px; left:50%; transform:translateX(-50%);
          background:rgba(0,0,0,0.55); backdrop-filter:blur(8px);
          border:1px solid rgba(255,255,255,0.1); border-radius:8px;
          padding:8px 20px; color:rgba(255,255,255,0.75);
          font-size:0.73rem; letter-spacing:0.12em; text-transform:uppercase;
          font-family:system-ui,sans-serif; pointer-events:none;
          transition:opacity 1.2s ease; z-index:100; white-space:nowrap;
        }
        #speed-indicator {
          position:fixed; top:20px; right:20px;
          background:rgba(0,0,0,0.55); backdrop-filter:blur(8px);
          border:1px solid rgba(255,255,255,0.1); border-radius:8px;
          padding:8px 14px; color:rgba(255,255,255,0.6);
          font-size:0.7rem; letter-spacing:0.12em; text-transform:uppercase;
          font-family:system-ui,sans-serif; pointer-events:none;
          display:flex; align-items:center; gap:8px;
          opacity:0; transition:opacity 0.3s,color 0.3s,border-color 0.3s; z-index:100;
        }
        #speed-indicator.sprinting { opacity:1; color:#ff6b35; border-color:rgba(255,107,53,0.35); }
        .spd-dot {
          width:6px; height:6px; border-radius:50%; background:currentColor;
          animation:sdp 0.6s ease-in-out infinite alternate;
        }
        @keyframes sdp { from{transform:scale(1);opacity:1} to{transform:scale(1.6);opacity:0.4} }

        /* Mobile joystick */
        #joy-zone {
          position:fixed; bottom:0; left:0; width:200px; height:200px;
          pointer-events:all; z-index:100;
        }
        #joy-base {
          position:absolute; bottom:30px; left:30px;
          width:110px; height:110px; border-radius:50%;
          background:rgba(255,255,255,0.07);
          border:2px solid rgba(255,255,255,0.18);
          backdrop-filter:blur(4px);
        }
        #joy-knob {
          width:44px; height:44px; border-radius:50%;
          background:rgba(255,107,53,0.82);
          border:2px solid rgba(255,200,150,0.55);
          position:absolute; left:50%; top:50%;
          transform:translate(-50%,-50%);
          box-shadow:0 0 18px rgba(255,107,53,0.35);
          cursor:grab; touch-action:none;
        }
        #sprint-btn {
          position:fixed; bottom:50px; right:40px;
          width:70px; height:70px; border-radius:50%;
          background:rgba(255,107,53,0.18);
          border:2px solid rgba(255,107,53,0.45);
          color:#ff6b35; font-size:0.65rem; font-weight:600;
          letter-spacing:0.1em; text-transform:uppercase;
          font-family:system-ui,sans-serif;
          display:flex; align-items:center; justify-content:center;
          cursor:pointer; pointer-events:all; backdrop-filter:blur(4px);
          user-select:none; -webkit-tap-highlight-color:transparent;
          transition:background 0.15s,transform 0.1s; z-index:100;
        }
        #sprint-btn.active { background:rgba(255,107,53,0.5); transform:scale(0.93); }

        @media (hover:hover) and (pointer:fine) {
          #joy-zone, #sprint-btn { display:none !important; }
        }
      `}</style>

      <div style={{ position:'fixed', inset:0, width:'100vw', height:'100vh' }}>
        <div ref={mountRef} style={{ width:'100%', height:'100%' }} />

        <div id="map-loading">
          <h1>World</h1>
          <div id="map-bar-wrap"><div id="map-bar" /></div>
          <div id="map-text">Loading assets...</div>
        </div>

        <div id="map-hint">
          WASD · Shift sprint · Right-click drag or scroll to orbit/zoom
        </div>

        <div id="speed-indicator">
          <span className="spd-dot" /> Sprinting
        </div>

        <div id="joy-zone">
          <div id="joy-base"><div id="joy-knob" /></div>
        </div>
        <button id="sprint-btn">Sprint</button>
      </div>
    </>
  )
}
