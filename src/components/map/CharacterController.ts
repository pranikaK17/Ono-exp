// src/components/map/CharacterController.ts
import * as THREE from 'three'
import { CollisionSystem } from './collision'
import { InputController } from './Input'          // ← capital I to match filename on disk
import type { JoystickInput } from './Input'
import { MAP_CONFIG } from './Config'

type AnimKey = 'idle' | 'walk' | 'run'

export class CharacterController {
  private model: THREE.Object3D
  private mixer: THREE.AnimationMixer | null
  private actions: Partial<Record<AnimKey, THREE.AnimationAction>> = {}
  private currentAction: AnimKey | null = null

  private camera: THREE.PerspectiveCamera
  private collision: CollisionSystem
  private mapBounds: THREE.Box3

  // Character physical state
  position: THREE.Vector3
  private charHeight: number
  private verticalVel = 0

  // Camera orbit
  private yaw:      number
  private pitch:    number
  private distance: number

  // Drag state (mouse + touch)
  private dragging     = false
  private dragLastX    = 0
  private dragLastY    = 0
  private touchDragId: number | null = null

  // Smoothed velocity for fluid Roblox-like movement
  private smoothVel = new THREE.Vector3()
  // Track whether user is manually orbiting camera
  private isManuallyOrbiting = false
  private orbitIdleTimer     = 0
  private speedEl: HTMLElement | null = null

  constructor(opts: {
    model:      THREE.Object3D
    mixer:      THREE.AnimationMixer | null
    animations: THREE.AnimationClip[]
    camera:     THREE.PerspectiveCamera
    collision:  CollisionSystem
    mapBounds:  THREE.Box3
    spawnPos:   THREE.Vector3
    charHeight: number
  }) {
    this.model      = opts.model
    this.mixer      = opts.mixer
    this.camera     = opts.camera
    this.collision  = opts.collision
    this.mapBounds  = opts.mapBounds
    this.position   = opts.spawnPos.clone()
    this.charHeight = opts.charHeight

    this.yaw      = Math.PI
    this.pitch    = MAP_CONFIG.cameraPitchDefault
    this.distance = MAP_CONFIG.cameraDistance

    this.speedEl = document.getElementById('speed-indicator')

    this._setupAnimations(opts.animations)
    this.model.position.copy(this.position)
    this._bindCameraControls()
  }

  // ─── Animations ────────────────────────────────────────────────────────────

  private _setupAnimations(clips: THREE.AnimationClip[]) {
    if (!this.mixer || clips.length === 0) return

    console.log('[Anim] clips found:', clips.map(c => c.name))

    // Priority-ordered name lists — first match wins per slot
    const map: Record<AnimKey, string[]> = {
      idle: ['idle', 'stand', 'rest', 'still_test', 'still'],
      walk: ['walking_test', 'walk', 'walking'],
      run:  ['walking_test', 'walk', 'walking'],  // same clip, faster timeScale
    }

    for (const clip of clips) {
      const l = clip.name.toLowerCase()
      for (const [key, terms] of Object.entries(map) as [AnimKey, string[]][]) {
        if (!this.actions[key] && terms.some(t => l === t || l.includes(t))) {
          this.actions[key] = this.mixer.clipAction(clip)
          console.log(`[Anim] mapped '${clip.name}' → ${key}`)
          break
        }
      }
    }

    // Fallbacks
    if (!this.actions.idle && clips[0]) this.actions.idle = this.mixer.clipAction(clips[0])
    if (!this.actions.run  && this.actions.walk) this.actions.run  = this.actions.walk
    if (!this.actions.walk && this.actions.run)  this.actions.walk = this.actions.run

    if (this.actions.idle) { this.actions.idle.play(); this.currentAction = 'idle' }
  }

  private _play(name: AnimKey) {
    if (!this.mixer) return
    const next = this.actions[name]
    if (!next) return

    if (this.currentAction !== name) {
      const cur = this.currentAction ? this.actions[this.currentAction] : null
      if (cur && cur !== next) cur.fadeOut(0.15)
      next.reset().fadeIn(0.15).play()
      this.currentAction = name
    }

    // Always set timeScale each frame so speed updates immediately
    // walking_test plays at 1.8× so footsteps match movement speed
    // run clip plays at 1.6× — it's already a faster clip
    // If walk and run share the same clip, run gets 2.6× to look distinct
    if (name === 'walk') {
      next.timeScale = 1.8
    } else if (name === 'run') {
      next.timeScale = 3.0   // walking_test sped up hard for sprint feel
    } else {
      next.timeScale = 1.0
    }
  }

  // ─── Camera Controls ───────────────────────────────────────────────────────

  private _bindCameraControls() {
    window.addEventListener('mousedown', (e) => {
      if (e.button === 2 || e.button === 1 || (e.button === 0 && !document.pointerLockElement)) {
        this.dragging  = true
        this.dragLastX = e.clientX
        this.dragLastY = e.clientY
        e.preventDefault()
      }
    })
    window.addEventListener('mousemove', (e) => {
      if (!this.dragging) return
      this._orbitBy(e.clientX - this.dragLastX, e.clientY - this.dragLastY)
      this.dragLastX = e.clientX
      this.dragLastY = e.clientY
    })
    window.addEventListener('mouseup',    () => { this.dragging = false })
    window.addEventListener('mouseleave', () => { this.dragging = false })
    window.addEventListener('contextmenu', e => e.preventDefault())

    window.addEventListener('mousemove', (e) => {
      if (document.pointerLockElement) this._orbitBy(e.movementX, e.movementY)
    })

    window.addEventListener('wheel', (e) => {
      e.preventDefault()

      // ── Laptop trackpad two-finger pan ────────────────────────────────────
      // Trackpad pan fires WheelEvent with deltaX + deltaY and NO ctrlKey.
      // Pinch-to-zoom fires WheelEvent with ctrlKey = true.
      // A mouse scroll wheel has deltaX ≈ 0 and larger deltaY steps.
      const isTrackpadPan  = !e.ctrlKey && Math.abs(e.deltaX) > 1
      const isTrackpadZoom =  e.ctrlKey                              // pinch gesture

      if (isTrackpadZoom) {
        // Pinch: zoom in/out
        const factor = e.deltaY > 0 ? MAP_CONFIG.zoomSpeed : 1 / MAP_CONFIG.zoomSpeed
        this.distance = Math.max(
          MAP_CONFIG.cameraMinDistance,
          Math.min(MAP_CONFIG.cameraMaxDistance, this.distance * factor)
        )
      } else if (isTrackpadPan) {
        // Two-finger swipe: orbit camera (pan sensitivity slightly higher than mouse)
        const panSensitivity = MAP_CONFIG.mouseSensitivity * 1.5
        this.yaw   -= e.deltaX * panSensitivity
        this.pitch  = Math.max(MAP_CONFIG.minPitch, Math.min(MAP_CONFIG.maxPitch,
          this.pitch + e.deltaY * panSensitivity))
      } else {
        // Regular mouse scroll wheel: zoom only
        const factor = e.deltaY > 0 ? MAP_CONFIG.zoomSpeed : 1 / MAP_CONFIG.zoomSpeed
        this.distance = Math.max(
          MAP_CONFIG.cameraMinDistance,
          Math.min(MAP_CONFIG.cameraMaxDistance, this.distance * factor)
        )
      }
    }, { passive: false })

    window.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1 && this.touchDragId === null) {
        const t = e.touches[0]
        if (t.clientX > window.innerWidth * 0.42) {
          this.touchDragId = t.identifier
          this.dragLastX   = t.clientX
          this.dragLastY   = t.clientY
        }
      }
      if (e.touches.length === 2) {
        this._pinchStartDist    = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        )
        this._pinchStartCamDist = this.distance
      }
    }, { passive: true })

    window.addEventListener('touchmove', (e) => {
      if (this.touchDragId !== null) {
        for (const t of Array.from(e.touches)) {
          if (t.identifier === this.touchDragId) {
            this._orbitBy(t.clientX - this.dragLastX, t.clientY - this.dragLastY)
            this.dragLastX = t.clientX
            this.dragLastY = t.clientY
          }
        }
      }
      if (e.touches.length === 2 && this._pinchStartDist > 0) {
        const d = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        )
        this.distance = Math.max(
          MAP_CONFIG.cameraMinDistance,
          Math.min(MAP_CONFIG.cameraMaxDistance, this._pinchStartCamDist * (this._pinchStartDist / d))
        )
      }
    }, { passive: true })

    window.addEventListener('touchend', (e) => {
      for (const t of Array.from(e.changedTouches)) {
        if (t.identifier === this.touchDragId) this.touchDragId = null
      }
      if (e.touches.length < 2) this._pinchStartDist = 0
    }, { passive: true })
  }

  private _pinchStartDist    = 0
  private _pinchStartCamDist = 0

  private _orbitBy(dx: number, dy: number) {
    this.yaw   -= dx * MAP_CONFIG.mouseSensitivity
    this.pitch  = Math.max(MAP_CONFIG.minPitch, Math.min(MAP_CONFIG.maxPitch,
      this.pitch + dy * MAP_CONFIG.mouseSensitivity))
    // User is manually controlling — suppress auto-follow briefly
    this.isManuallyOrbiting = true
    this.orbitIdleTimer     = 0
  }

  // ─── Main update ────────────────────────────────────────────────────────────

  update(delta: number, input: InputController, joystick: JoystickInput) {
    input.consumeMouseDelta()

    // ── Input ────────────────────────────────────────────────────────────────
    const kb          = input.getMoveVector()
    const isSprinting = input.isSprinting() || joystick.sprint
    const speed       = isSprinting ? MAP_CONFIG.sprintSpeed * 1.8 : MAP_CONFIG.walkSpeed

    let mx = kb.x + joystick.x
    let mz = kb.z + joystick.y
    const inputLen = Math.sqrt(mx * mx + mz * mz)
    if (inputLen > 1) { mx /= inputLen; mz /= inputLen }
    const moving = inputLen > 0.05

    // ── Direction relative to camera yaw ─────────────────────────────────────
    const sinY = Math.sin(this.yaw)
    const cosY = Math.cos(this.yaw)
    const fwd   = new THREE.Vector3(-sinY, 0, -cosY)
    const right = new THREE.Vector3( cosY,  0, -sinY)

    const rawDir = new THREE.Vector3()
    rawDir.addScaledVector(fwd,  -mz)
    rawDir.addScaledVector(right, mx)

    // ── Smooth velocity — Roblox-like fluid acceleration / deceleration ───────
    // Accelerate toward target velocity, decelerate smoothly to zero.
    const targetVel = moving
      ? rawDir.clone().normalize().multiplyScalar(speed)
      : new THREE.Vector3(0, 0, 0)

    const accel     = moving ? 30 : 35   // higher = snappier, lower = floatier
    this.smoothVel.lerp(targetVel, Math.min(accel * delta, 1))

    const dir = this.smoothVel.clone().normalize()   // facing direction
    const actualSpeed = this.smoothVel.length()
    const isActuallyMoving = actualSpeed > 0.5

    // ── Horizontal movement + collision ──────────────────────────────────────
    const moveDelta = this.smoothVel.clone().multiplyScalar(delta)
    moveDelta.y     = 0
    const resolved  = this.collision.resolveXZ(
      this.position, moveDelta, MAP_CONFIG.characterRadius, this.charHeight
    )

    // ── Clamp to map bounds ───────────────────────────────────────────────────
    const pad = MAP_CONFIG.characterRadius
    resolved.x = Math.max(this.mapBounds.min.x + pad, Math.min(this.mapBounds.max.x - pad, resolved.x))
    resolved.z = Math.max(this.mapBounds.min.z + pad, Math.min(this.mapBounds.max.z - pad, resolved.z))

    // ── Gravity & ground snapping ─────────────────────────────────────────────
    this.verticalVel += MAP_CONFIG.gravity * delta
    resolved.y        = this.position.y + this.verticalVel * delta

    const groundY = this.collision.getGroundY(resolved, this.charHeight)
    if (groundY !== null && resolved.y <= groundY + 0.05) {
      resolved.y       = groundY
      this.verticalVel = 0
    } else if (resolved.y < this.mapBounds.min.y - 5) {
      resolved.y       = this.mapBounds.min.y
      this.verticalVel = 0
    }

    this.position.copy(resolved)
    this.model.position.copy(this.position)

    // ── Character rotation — smooth turn toward movement direction ────────────
    if (isActuallyMoving && dir.lengthSq() > 0.001) {
      const target = Math.atan2(dir.x, dir.z) + Math.PI
      let diff = target - this.model.rotation.y
      while (diff >  Math.PI) diff -= 2 * Math.PI
      while (diff < -Math.PI) diff += 2 * Math.PI
      // Smooth rotation — higher multiplier = snappier turn
      this.model.rotation.y += diff * Math.min(12 * delta, 1)
    }

    // ── Roblox-style camera auto-follow ───────────────────────────────────────
    // When user manually orbits, respect that. After a short idle window
    // (0.8 s), if the character starts moving, smoothly swing the camera
    // back behind the character.
    if (this.isManuallyOrbiting) {
      this.orbitIdleTimer += delta
      if (this.orbitIdleTimer > 0.8) this.isManuallyOrbiting = false
    }

    if (isActuallyMoving && !this.isManuallyOrbiting) {
      // Target yaw = behind the character (model faces travel dir, camera is opposite)
      const charFacing  = this.model.rotation.y - Math.PI   // where char is going
      const targetYaw   = charFacing + Math.PI               // camera is behind = +PI
      let   yawDiff     = targetYaw - this.yaw
      while (yawDiff >  Math.PI) yawDiff -= 2 * Math.PI
      while (yawDiff < -Math.PI) yawDiff += 2 * Math.PI
      // Lazy follow — slow enough to feel organic, fast enough to catch up
      this.yaw += yawDiff * Math.min(3.5 * delta, 1)
    }

    // ── Animations ────────────────────────────────────────────────────────────
    if (this.mixer) {
      this._play(!isActuallyMoving ? 'idle' : isSprinting ? 'run' : 'walk')
      this.mixer.update(delta)
    }

    // ── Camera ────────────────────────────────────────────────────────────────
    this._updateCamera(delta)

    // ── Sprint HUD ────────────────────────────────────────────────────────────
    if (this.speedEl) this.speedEl.classList.toggle('sprinting', isActuallyMoving && isSprinting)
  }

  // Smoothed safe distance — prevents flicker when occlusion hits flap each frame
  private _smoothSafeDist: number = MAP_CONFIG.cameraDistance

  private _updateCamera(delta: number) {
    const pivot = this.position.clone().add(new THREE.Vector3(0, MAP_CONFIG.cameraHeight, 0))

    const ox = this.distance * Math.sin(this.yaw)   * Math.cos(this.pitch)
    const oy = this.distance * Math.sin(this.pitch)
    const oz = this.distance * Math.cos(this.yaw)   * Math.cos(this.pitch)
    const desired = pivot.clone().add(new THREE.Vector3(ox, oy, oz))

    // ── Occlusion raycast — uses cameraCollidables (excludes dome/skybox) ─────
    const toDesired = desired.clone().sub(pivot)
    const rayDir    = toDesired.clone().normalize()
    const rayDist   = toDesired.length()

    this.collision.rc.set(pivot, rayDir)
    this.collision.rc.near = 0.1
    this.collision.rc.far  = rayDist

    const hits = this.collision.rc.intersectObjects(this.collision.cameraCollidables, false)

    const targetSafeDist = hits.length > 0
      ? Math.max(MAP_CONFIG.cameraMinDistance,
          hits.reduce((best, h) => h.distance < best.distance ? h : best, hits[0]).distance - 0.3)
      : rayDist

    // Smooth the safe distance — snap IN fast (avoid clipping), ease OUT slow
    const inSpeed  = 1 - Math.pow(0.001, delta)   // ~very fast
    const outSpeed = 1 - Math.pow(0.04,  delta)   // ~slow ease back
    this._smoothSafeDist = targetSafeDist < this._smoothSafeDist
      ? this._smoothSafeDist + (targetSafeDist - this._smoothSafeDist) * inSpeed
      : this._smoothSafeDist + (targetSafeDist - this._smoothSafeDist) * outSpeed

    const safe = pivot.clone().add(rayDir.multiplyScalar(this._smoothSafeDist))

    // Prevent camera underground
    const minCamY = (this.collision.getGroundY(safe, 0.5) ?? this.mapBounds.min.y) + 0.5
    safe.y = Math.max(safe.y, minCamY)

    // Frame-rate independent lerp: same feel at 30fps and 120fps
    const camLerp = 1 - Math.pow(0.01, delta)
    this.camera.position.lerp(safe, camLerp)
    this.camera.lookAt(pivot)
  }
}
