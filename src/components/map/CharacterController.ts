// src/components/map/CharacterController.ts
import * as THREE from 'three'
import { CollisionSystem } from './collision'
import { InputController } from './Input'
import type { JoystickInput } from './Input'
import { MAP_CONFIG } from './Config'

type AnimKey = 'idle' | 'walk' | 'run' | 'jump'

export class CharacterController {
  private model:   THREE.Object3D
  private mixer:   THREE.AnimationMixer | null
  private actions: Partial<Record<AnimKey, THREE.AnimationAction>> = {}
  private currentAction: AnimKey | null = null

  private camera:    THREE.PerspectiveCamera
  private collision: CollisionSystem

  position:           THREE.Vector3
  private charHeight: number
  private verticalVel = 0
  private isGrounded  = true
  private jumpBuffer  = false

  private yaw:      number
  private pitch:    number
  private distance: number
  private _smoothSafeDist: number

  private dragging    = false
  private dragLastX   = 0
  private dragLastY   = 0
  private touchDragId: number | null = null
  private _pinchStart = 0
  private _pinchCamDist = 0

  private smoothVel = new THREE.Vector3()
  private isManualOrbit = false
  private orbitTimer    = 0
  private lastMoveYaw: number | null = null

  private speedEl: HTMLElement | null = null

  constructor(opts: {
    model: THREE.Object3D; mixer: THREE.AnimationMixer | null
    animations: THREE.AnimationClip[]; camera: THREE.PerspectiveCamera
    collision: CollisionSystem; mapBounds: THREE.Box3
    spawnPos: THREE.Vector3; charHeight: number
  }) {
    this.model      = opts.model
    this.mixer      = opts.mixer
    this.camera     = opts.camera
    this.collision  = opts.collision
    this.position   = opts.spawnPos.clone()
    this.charHeight = opts.charHeight
    // mapBounds intentionally unused — boundary handled by CollisionSystem
    void opts.mapBounds

    this.yaw      = Math.PI
    this.pitch    = MAP_CONFIG.cameraPitchDefault
    this.distance = Math.max(MAP_CONFIG.cameraDistance, opts.charHeight * 1.2)
    this._smoothSafeDist = this.distance

    this.speedEl = document.getElementById('speed-indicator')
    this._setupAnimations(opts.animations)
    this.model.position.copy(this.position)
    this.model.rotation.y = 0
    this._bindControls()

    window.addEventListener('keydown', e => {
      if (e.code === 'Space') { e.preventDefault(); this.jumpBuffer = true }
    })
  }

  private _setupAnimations(clips: THREE.AnimationClip[]) {
    if (!this.mixer || !clips.length) return
    const map: Record<AnimKey, string[]> = {
      idle: ['idle','stand','rest','still_test','still'],
      walk: ['walking_test','walk','walking'],
      run:  ['walking_test','walk','walking'],
      jump: ['jump','leap','air'],
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
    if (!this.actions.run  && this.actions.walk) this.actions.run  = this.actions.walk
    if (!this.actions.walk && this.actions.run)  this.actions.walk = this.actions.run
    this.actions.idle?.play()
    this.currentAction = 'idle'
  }

  private _play(name: AnimKey) {
    if (!this.mixer) return
    const next = this.actions[name]; if (!next) return
    if (this.currentAction !== name) {
      const cur = this.currentAction ? this.actions[this.currentAction] : null
      if (cur && cur !== next) cur.fadeOut(0.12)
      next.reset().fadeIn(0.12).play()
      this.currentAction = name
    }
    next.timeScale = name === 'walk' ? 1.3 : name === 'run' ? 2.0 : 1.0
  }

  private _orbitBy(dx: number, dy: number) {
    this.yaw  -= dx * MAP_CONFIG.mouseSensitivity
    this.pitch = Math.max(MAP_CONFIG.minPitch,
      Math.min(MAP_CONFIG.maxPitch, this.pitch + dy * MAP_CONFIG.mouseSensitivity))
    this.isManualOrbit = true; this.orbitTimer = 0
  }

  private _bindControls() {
    window.addEventListener('mousedown', e => {
      if (e.button === 2 || e.button === 1 || e.button === 0) {
        this.dragging = true; this.dragLastX = e.clientX; this.dragLastY = e.clientY
        e.preventDefault()
      }
    })
    window.addEventListener('mousemove', e => {
      if (this.dragging) {
        this._orbitBy(e.clientX - this.dragLastX, e.clientY - this.dragLastY)
        this.dragLastX = e.clientX; this.dragLastY = e.clientY
      }
      if (document.pointerLockElement) this._orbitBy(e.movementX, e.movementY)
    })
    window.addEventListener('mouseup',    () => { this.dragging = false })
    window.addEventListener('mouseleave', () => { this.dragging = false })
    window.addEventListener('contextmenu', e => e.preventDefault())

    window.addEventListener('wheel', e => {
      e.preventDefault()
      const zoom = (f: number) => {
        this.distance = Math.max(MAP_CONFIG.cameraMinDistance,
          Math.min(MAP_CONFIG.cameraMaxDistance, this.distance * f))
      }
      if (e.ctrlKey) {
        zoom(e.deltaY > 0 ? MAP_CONFIG.zoomSpeed : 1/MAP_CONFIG.zoomSpeed)
      } else if (!e.ctrlKey && Math.abs(e.deltaX) > 1) {
        const s = MAP_CONFIG.mouseSensitivity * 1.5
        this.yaw -= e.deltaX * s
        this.pitch = Math.max(MAP_CONFIG.minPitch, Math.min(MAP_CONFIG.maxPitch, this.pitch + e.deltaY * s))
        this.isManualOrbit = true; this.orbitTimer = 0
      } else {
        zoom(e.deltaY > 0 ? MAP_CONFIG.zoomSpeed : 1/MAP_CONFIG.zoomSpeed)
      }
    }, { passive: false })

    window.addEventListener('touchstart', e => {
      if (e.touches.length === 1 && this.touchDragId === null) {
        const t = e.touches[0]
        if (t.clientX > window.innerWidth * 0.42) {
          this.touchDragId = t.identifier; this.dragLastX = t.clientX; this.dragLastY = t.clientY
        }
      }
      if (e.touches.length === 2) {
        this._pinchStart = Math.hypot(e.touches[0].clientX-e.touches[1].clientX, e.touches[0].clientY-e.touches[1].clientY)
        this._pinchCamDist = this.distance
      }
    }, { passive: true })

    window.addEventListener('touchmove', e => {
      if (this.touchDragId !== null)
        for (const t of Array.from(e.touches))
          if (t.identifier === this.touchDragId) {
            this._orbitBy(t.clientX-this.dragLastX, t.clientY-this.dragLastY)
            this.dragLastX = t.clientX; this.dragLastY = t.clientY
          }
      if (e.touches.length === 2 && this._pinchStart > 0) {
        const d = Math.hypot(e.touches[0].clientX-e.touches[1].clientX, e.touches[0].clientY-e.touches[1].clientY)
        this.distance = Math.max(MAP_CONFIG.cameraMinDistance,
          Math.min(MAP_CONFIG.cameraMaxDistance, this._pinchCamDist*(this._pinchStart/d)))
      }
    }, { passive: true })

    window.addEventListener('touchend', e => {
      for (const t of Array.from(e.changedTouches))
        if (t.identifier === this.touchDragId) this.touchDragId = null
      if (e.touches.length < 2) this._pinchStart = 0
    }, { passive: true })
  }

  update(delta: number, input: InputController, joystick: JoystickInput) {
    input.consumeMouseDelta()

    // ── Input ──────────────────────────────────────────────────────────────
    const kb = input.getMoveVector()
    let mx = kb.x + joystick.x, mz = kb.z + joystick.y
    const len = Math.sqrt(mx*mx + mz*mz)
    if (len > 1) { mx /= len; mz /= len }
    const moving      = len > 0.05
    const isSprinting = (input.isSprinting() || joystick.sprint) && moving
    const speed       = isSprinting ? MAP_CONFIG.sprintSpeed : MAP_CONFIG.walkSpeed

    const sinY = Math.sin(this.yaw), cosY = Math.cos(this.yaw)
    const rawDir = new THREE.Vector3(
      -mz * (-sinY) + mx * cosY,
      0,
      -mz * (-cosY) + mx * (-sinY)
    )

    const targetVel = moving ? rawDir.clone().normalize().multiplyScalar(speed) : new THREE.Vector3()
    this.smoothVel.lerp(targetVel, Math.min((moving ? 30 : 35) * delta, 1))

    const dir = this.smoothVel.clone().normalize()
    const actualSpeed = this.smoothVel.length()
    const isMoving = actualSpeed > 0.5

    // ── XZ movement ───────────────────────────────────────────────────────
    const moveDelta = this.smoothVel.clone().multiplyScalar(delta)
    moveDelta.y = 0
    const resolved = this.collision.resolveXZ(
      this.position, moveDelta, MAP_CONFIG.characterRadius, this.charHeight
    )

    // ── Jump ──────────────────────────────────────────────────────────────
    if (this.jumpBuffer && this.isGrounded) {
      this.verticalVel = MAP_CONFIG.jumpSpeed ?? 14
      this.isGrounded  = false
    }
    this.jumpBuffer = false

    // ── Gravity ───────────────────────────────────────────────────────────
    this.verticalVel += MAP_CONFIG.gravity * delta
    resolved.y = this.position.y + this.verticalVel * delta

    const gY = this.collision.getGroundY(resolved, this.charHeight)
    if (resolved.y <= gY + 0.05) {
      resolved.y = gY; this.verticalVel = 0; this.isGrounded = true
    } else {
      this.isGrounded = false
    }

    if (resolved.y < 0) { resolved.y = 0; this.verticalVel = 0; this.isGrounded = true }

    this.position.copy(resolved)
    this.model.position.copy(this.position)

    // ── Rotation ──────────────────────────────────────────────────────────
    if (isMoving && dir.lengthSq() > 0.001) {
      const target = Math.atan2(dir.x, dir.z) + Math.PI
      let diff = target - this.model.rotation.y
      while (diff >  Math.PI) diff -= 2*Math.PI
      while (diff < -Math.PI) diff += 2*Math.PI
      this.model.rotation.y += diff * Math.min(12*delta, 1)
      this.lastMoveYaw = Math.atan2(dir.x, dir.z)
    }

    // ── Camera auto-follow ────────────────────────────────────────────────
    if (this.isManualOrbit) {
      this.orbitTimer += delta
      if (this.orbitTimer > 0.8) this.isManualOrbit = false
    }
    if (!this.isManualOrbit && isMoving && this.lastMoveYaw !== null) {
      let diff = (this.lastMoveYaw + Math.PI) - this.yaw
      while (diff >  Math.PI) diff -= 2*Math.PI
      while (diff < -Math.PI) diff += 2*Math.PI
      this.yaw += diff * Math.min(2.5*delta, 1)
    }

    // ── Animations ────────────────────────────────────────────────────────
    if (this.mixer) {
      this._play(!this.isGrounded ? 'jump' : isMoving ? (isSprinting ? 'run' : 'walk') : 'idle')
      this.mixer.update(delta)
    }

    this._updateCamera(delta)

    const fov = isSprinting ? 75 : 60
    if (Math.abs(this.camera.fov - fov) > 0.1) {
      this.camera.fov += (fov - this.camera.fov) * Math.min(8*delta, 1)
      this.camera.updateProjectionMatrix()
    }
    this.speedEl?.classList.toggle('sprinting', isMoving && isSprinting)
  }

  private _updateCamera(delta: number) {
    const pivot = this.position.clone()
      .add(new THREE.Vector3(0, this.charHeight * 0.75, 0))

    const ox = this.distance * Math.sin(this.yaw)   * Math.cos(this.pitch)
    const oy = this.distance * Math.sin(this.pitch)
    const oz = this.distance * Math.cos(this.yaw)   * Math.cos(this.pitch)
    const desired   = pivot.clone().add(new THREE.Vector3(ox, oy, oz))
    const toDesired = desired.clone().sub(pivot)
    const rayDir    = toDesired.clone().normalize()
    const rayDist   = toDesired.length()

    // ── Sphere-sweep camera occlusion ─────────────────────────────────────────
    // Cast 5 rays approximating a sphere sweep so the camera never clips geometry.
    // Use cameraCollidables (all non-pin meshes) — every model blocks the camera.
    const SPHERE_R = 0.5
    const offsets = [
      new THREE.Vector3(0,        0,       0      ),
      new THREE.Vector3( SPHERE_R, 0,       0      ),
      new THREE.Vector3(-SPHERE_R, 0,       0      ),
      new THREE.Vector3(0,        SPHERE_R, 0      ),
      new THREE.Vector3(0,       -SPHERE_R, 0      ),
    ]

    let minDist = rayDist
    for (const off of offsets) {
      this.collision.rc.set(pivot.clone().add(off), rayDir)
      this.collision.rc.near = 0.1
      this.collision.rc.far  = rayDist + 1.0
      // cameraCollidables = every mesh except pins — guaranteed to block camera
      const hits = this.collision.rc.intersectObjects(this.collision.cameraCollidables, false)
      if (hits.length) {
        const closest = hits.reduce((b, h) => h.distance < b.distance ? h : b, hits[0])
        minDist = Math.min(minDist, Math.max(MAP_CONFIG.cameraMinDistance, closest.distance - SPHERE_R - 0.2))
      }
    }

    // Snap in fast when blocked, ease out slowly when clearing
    const inS  = 1 - Math.pow(0.0001, delta)   // near-instant pull-in
    const outS = 1 - Math.pow(0.05,   delta)   // slow ease-out
    this._smoothSafeDist += (minDist - this._smoothSafeDist) *
      (minDist < this._smoothSafeDist ? inS : outS)

    const safe = pivot.clone().add(rayDir.multiplyScalar(this._smoothSafeDist))
    safe.y = Math.max(safe.y, 0.5)
    this.camera.position.lerp(safe, 1 - Math.pow(0.01, delta))
    this.camera.lookAt(pivot)
  }
}
