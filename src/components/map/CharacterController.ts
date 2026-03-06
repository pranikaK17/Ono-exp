// src/components/map/CharacterController.ts
import * as THREE from 'three'
import { CollisionSystem } from './collision'
import { InputController } from './input'
import type { JoystickInput } from './input'
import { MAP_CONFIG } from './config'

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

  private speedEl: HTMLElement | null

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
    this.model     = opts.model
    this.mixer     = opts.mixer
    this.camera    = opts.camera
    this.collision = opts.collision
    this.mapBounds = opts.mapBounds
    this.position  = opts.spawnPos.clone()
    this.charHeight = opts.charHeight

    this.yaw      = 0
    this.pitch    = MAP_CONFIG.cameraPitchDefault
    this.distance = MAP_CONFIG.cameraDistance

    this.speedEl  = document.getElementById('speed-indicator')

    this._setupAnimations(opts.animations)
    this.model.position.copy(this.position)
    this._bindCameraControls()
  }

  // ─── Animations ────────────────────────────────────────────────────────────

  private _setupAnimations(clips: THREE.AnimationClip[]) {
    if (!this.mixer || clips.length === 0) return

    const map: Record<AnimKey, string[]> = {
      idle: ['idle', 'stand', 'rest', 'still'],
      walk: ['walk', 'walking', 'walking_test'],
      run:  ['run', 'running', 'sprint', 'jog'],
    }

    for (const clip of clips) {
      const l = clip.name.toLowerCase()
      for (const [key, terms] of Object.entries(map) as [AnimKey, string[]][]) {
        if (!this.actions[key] && terms.some(t => l.includes(t))) {
          this.actions[key] = this.mixer.clipAction(clip)
          break
        }
      }
    }

    if (!this.actions.idle && clips[0]) this.actions.idle = this.mixer.clipAction(clips[0])
    if (!this.actions.run  && this.actions.walk) this.actions.run = this.actions.walk
    if (!this.actions.walk && this.actions.run)  this.actions.walk = this.actions.run

    if (this.actions.idle) { this.actions.idle.play(); this.currentAction = 'idle' }
  }

  private _play(name: AnimKey) {
    if (!this.mixer || this.currentAction === name) return
    const next = this.actions[name]
    if (!next) return
    const cur = this.currentAction ? this.actions[this.currentAction] : null
    if (cur && cur !== next) cur.fadeOut(0.15)
    next.reset().fadeIn(0.15).play()
    next.timeScale = (name === 'run' && this.actions.walk === next) ? 1.6 : 1
    this.currentAction = name
  }

  // ─── Camera Controls (mouse drag + touch drag + scroll zoom) ───────────────

  private _bindCameraControls() {
    // ── Mouse drag (right-button OR left-button when not pointer-locked) ──────
    window.addEventListener('mousedown', (e) => {
      // Right-click drag or middle-click always orbits
      // Left-click only orbits when pointer is NOT locked
      if (e.button === 2 || e.button === 1 || (e.button === 0 && !document.pointerLockElement)) {
        this.dragging  = true
        this.dragLastX = e.clientX
        this.dragLastY = e.clientY
        e.preventDefault()
      }
    })

    window.addEventListener('mousemove', (e) => {
      if (!this.dragging) return
      const dx = e.clientX - this.dragLastX
      const dy = e.clientY - this.dragLastY
      this.dragLastX = e.clientX
      this.dragLastY = e.clientY
      this._orbitBy(dx, dy)
    })

    window.addEventListener('mouseup',    () => { this.dragging = false })
    window.addEventListener('mouseleave', () => { this.dragging = false })

    // Prevent context menu on right-click
    window.addEventListener('contextmenu', e => e.preventDefault())

    // ── Pointer-locked mouse look ──────────────────────────────────────────────
    window.addEventListener('mousemove', (e) => {
      if (document.pointerLockElement) {
        this._orbitBy(e.movementX, e.movementY)
      }
    })

    // ── Scroll zoom ────────────────────────────────────────────────────────────
    window.addEventListener('wheel', (e) => {
      e.preventDefault()
      const factor = e.deltaY > 0 ? MAP_CONFIG.zoomSpeed : 1 / MAP_CONFIG.zoomSpeed
      this.distance = Math.max(
        MAP_CONFIG.cameraMinDistance,
        Math.min(MAP_CONFIG.cameraMaxDistance, this.distance * factor)
      )
    }, { passive: false })

    // ── Touch orbit (one finger, right half) ───────────────────────────────────
    window.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1 && this.touchDragId === null) {
        const t = e.touches[0]
        // Only use right half for camera orbit (left half = joystick)
        if (t.clientX > window.innerWidth * 0.42) {
          this.touchDragId = t.identifier
          this.dragLastX   = t.clientX
          this.dragLastY   = t.clientY
        }
      }
      // Two-finger pinch zoom
      if (e.touches.length === 2) {
        this._pinchStartDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        )
        this._pinchStartCamDist = this.distance
      }
    }, { passive: true })

    window.addEventListener('touchmove', (e) => {
      // Orbit
      if (this.touchDragId !== null) {
        for (const t of Array.from(e.touches)) {
          if (t.identifier === this.touchDragId) {
            this._orbitBy(t.clientX - this.dragLastX, t.clientY - this.dragLastY)
            this.dragLastX = t.clientX
            this.dragLastY = t.clientY
          }
        }
      }
      // Pinch zoom
      if (e.touches.length === 2 && this._pinchStartDist > 0) {
        const d = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        )
        const ratio = this._pinchStartDist / d
        this.distance = Math.max(
          MAP_CONFIG.cameraMinDistance,
          Math.min(MAP_CONFIG.cameraMaxDistance, this._pinchStartCamDist * ratio)
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
    this.pitch  = Math.max(MAP_CONFIG.minPitch, Math.min(MAP_CONFIG.maxPitch, this.pitch + dy * MAP_CONFIG.mouseSensitivity))
  }

  // ─── Main update ────────────────────────────────────────────────────────────

  update(delta: number, input: InputController, joystick: JoystickInput) {
    // Pointer-locked mouse look is handled in _bindCameraControls via mousemove
    // but InputController also buffers it — drain it here to keep input clean
    input.consumeMouseDelta()

    // ── Input ────────────────────────────────────────────────────────────────
    const kb         = input.getMoveVector()
    const isSprinting = input.isSprinting() || joystick.sprint
    const speed       = isSprinting ? MAP_CONFIG.sprintSpeed : MAP_CONFIG.walkSpeed

    let mx = kb.x + joystick.x
    let mz = kb.z + joystick.y
    const inputLen = Math.sqrt(mx*mx + mz*mz)
    if (inputLen > 1) { mx /= inputLen; mz /= inputLen }
    const moving = inputLen > 0.05

    // ── Direction relative to camera yaw ─────────────────────────────────────
    const fwd   = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw))
    const right = new THREE.Vector3( Math.cos(this.yaw), 0, -Math.sin(this.yaw))
    const dir   = new THREE.Vector3()
    dir.addScaledVector(fwd,  -mz)
    dir.addScaledVector(right, mx)

    // ── Horizontal movement + collision ──────────────────────────────────────
    const moveDelta = dir.clone().multiplyScalar(speed * delta)
    const resolved  = this.collision.resolveXZ(this.position, moveDelta, MAP_CONFIG.characterRadius, this.charHeight)

    // ── Clamp to map bounding box ─────────────────────────────────────────────
    const pad = MAP_CONFIG.characterRadius
    resolved.x = Math.max(this.mapBounds.min.x + pad, Math.min(this.mapBounds.max.x - pad, resolved.x))
    resolved.z = Math.max(this.mapBounds.min.z + pad, Math.min(this.mapBounds.max.z - pad, resolved.z))

    // ── Gravity & ground snapping ─────────────────────────────────────────────
    this.verticalVel += MAP_CONFIG.gravity * delta
    resolved.y = this.position.y + this.verticalVel * delta

    const groundY = this.collision.getGroundY(resolved, this.charHeight)

    if (groundY !== null && resolved.y <= groundY + 0.05) {
      resolved.y       = groundY
      this.verticalVel = 0
    } else {
      // Hard floor fallback
      if (resolved.y < this.mapBounds.min.y - 5) {
        resolved.y       = this.mapBounds.min.y
        this.verticalVel = 0
      }
    }

    this.position.copy(resolved)
    this.model.position.copy(this.position)

    // ── Character faces movement direction ────────────────────────────────────
    if (moving && dir.lengthSq() > 0.001) {
      const target = Math.atan2(dir.x, dir.z)
      let diff = target - this.model.rotation.y
      while (diff >  Math.PI) diff -= 2 * Math.PI
      while (diff < -Math.PI) diff += 2 * Math.PI
      this.model.rotation.y += diff * Math.min(MAP_CONFIG.rotationSpeed * delta, 1)
    }

    // ── Animations ────────────────────────────────────────────────────────────
    if (this.mixer) {
      this._play(!moving ? 'idle' : isSprinting ? 'run' : 'walk')
      this.mixer.update(delta)
    }

    // ── Camera ────────────────────────────────────────────────────────────────
    this._updateCamera()

    // ── Sprint HUD ────────────────────────────────────────────────────────────
    if (this.speedEl) this.speedEl.classList.toggle('sprinting', moving && isSprinting)
  }

  private _updateCamera() {
    const h     = MAP_CONFIG.cameraHeight
    const dist  = this.distance
    const pitch = this.pitch
    const yaw   = this.yaw

    // Camera orbits around a point slightly above character feet
    const pivot = this.position.clone().add(new THREE.Vector3(0, h, 0))

    // Spherical coordinates
    const ox = dist * Math.sin(yaw) * Math.cos(pitch)
    const oy = dist * Math.sin(pitch)
    const oz = dist * Math.cos(yaw) * Math.cos(pitch)

    const desired = pivot.clone().add(new THREE.Vector3(ox, oy, oz))

    // Prevent camera going underground
    const minCamY = (this.collision.getGroundY(desired, 0.5) ?? this.mapBounds.min.y) + 0.5
    desired.y = Math.max(desired.y, minCamY)

    this.camera.position.lerp(desired, 0.1)
    this.camera.lookAt(pivot)
  }
}
