import * as THREE from 'three'
import { CollisionSystem } from './collision'
import { InputController } from './Input'
import type { JoystickInput } from './Input'
import { MAP_CONFIG } from './Config'

type AnimKey = 'idle' | 'walk' | 'run' | 'jump'

const MOUSE_SENSITIVITY = MAP_CONFIG.mouseSensitivity ?? 0.003
const TOUCH_SENSITIVITY = 0.013

// ─────────────────────────────────────────────────────────────────────────────
// CharacterController
//
// Movement follows Code 1's proven pattern exactly:
//   1. Read raw joystick x/y (screen-space axes)
//   2. Merge with keyboard input
//   3. Build camera-forward and camera-right vectors from camYaw
//   4. Move = forward*inputY + right*inputX  (normalised)
//   5. Position updated, then camera orbits around new position
//
// This is the same math as Code 1's tick() and it definitely works.
// ─────────────────────────────────────────────────────────────────────────────
export class CharacterController {
  // ── Public position — read by Map for trail, proximity checks, etc. ────────
  position: THREE.Vector3

  private model:      THREE.Object3D
  private mixer:      THREE.AnimationMixer | null
  private actions:    Partial<Record<AnimKey, THREE.AnimationAction>> = {}
  private curAnim:    AnimKey | null = null

  private camera:     THREE.PerspectiveCamera
  private collision:  CollisionSystem

  private charHeight: number

  // ── Gravity / jump ─────────────────────────────────────────────────────────
  private verticalVel = 0
  private isGrounded  = true
  private jumpBuffer  = false

  // ── Camera orbit state (yaw/pitch/distance) ────────────────────────────────
  private camYaw:   number   // horizontal angle around character
  private camPitch: number   // vertical angle
  private camDist:  number   // current distance (lerped)
  private _targetDist: number

  // smooth safe distance for occlusion
  private _safeDist: number

  // ── Mouse drag ─────────────────────────────────────────────────────────────
  private _dragging  = false
  private _dragLastX = 0
  private _dragLastY = 0

  // ── Touch look (right half of screen) ─────────────────────────────────────
  private _lookId:   number | null = null
  private _lookLastX = 0
  private _lookLastY = 0

  // ── Pinch zoom ─────────────────────────────────────────────────────────────
  private _pinchActive = false
  private _pinchStart  = 0
  private _pinchBase   = 0

  // ── Scratch vectors — allocated once, reused every frame ──────────────────
  private _fwd   = new THREE.Vector3()
  private _right = new THREE.Vector3()
  private _moveDir = new THREE.Vector3()
  private _UP    = new THREE.Vector3(0, 1, 0)
  private _camTarget = new THREE.Vector3()
  private _camDesired = new THREE.Vector3()

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
    this.model      = opts.model
    this.mixer      = opts.mixer
    this.camera     = opts.camera
    this.collision  = opts.collision
    this.position   = opts.spawnPos.clone()
    this.charHeight = opts.charHeight

    this.camYaw   = Math.PI   // start looking at character from behind
    this.camPitch = MAP_CONFIG.cameraPitchDefault ?? 0.35
    this.camDist  = MAP_CONFIG.cameraDistance ?? 18
    this._targetDist = this.camDist
    this._safeDist   = this.camDist

    this.speedEl = document.getElementById('speed-indicator')
    this._setupAnimations(opts.animations)
    this.model.position.copy(this.position)
    this._bindControls()

    window.addEventListener('keydown', e => {
      if (e.code === 'Space') { e.preventDefault(); this.jumpBuffer = true }
    })
  }

  // ── Animation setup ────────────────────────────────────────────────────────
  private _setupAnimations(clips: THREE.AnimationClip[]) {
    if (!this.mixer || !clips.length) return
    const map: Record<AnimKey, string[]> = {
      idle: ['idle', 'stand', 'rest', 'still_test', 'still'],
      walk: ['walking_test', 'walk', 'walking'],
      run:  ['walking_test', 'walk', 'walking'],
      jump: ['jump', 'leap', 'air'],
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
    this.curAnim = 'idle'
  }

  private _play(name: AnimKey) {
    if (!this.mixer || this.curAnim === name) return
    const next = this.actions[name]; if (!next) return
    const cur  = this.curAnim ? this.actions[this.curAnim] : null
    if (cur && cur !== next) cur.fadeOut(0.12)
    next.reset().fadeIn(0.12).play()
    next.timeScale = name === 'run' ? 2.0 : name === 'walk' ? 1.3 : 1.0
    this.curAnim = name
  }

  // ── Camera orbit helper ────────────────────────────────────────────────────
  private _orbitBy(dx: number, dy: number, sens: number) {
    this.camYaw  -= dx * sens
    this.camPitch = Math.max(
      MAP_CONFIG.minPitch ?? 0.05,
      Math.min(MAP_CONFIG.maxPitch ?? 1.2, this.camPitch + dy * sens)
    )
  }

  // ── Input binding ──────────────────────────────────────────────────────────
  private _bindControls() {
    // Mouse drag
    window.addEventListener('mousedown', e => {
      if (e.button === 0 || e.button === 2) {
        this._dragging = true; this._dragLastX = e.clientX; this._dragLastY = e.clientY
        e.preventDefault()
      }
    })
    window.addEventListener('mousemove', e => {
      if (this._dragging)
        this._orbitBy(e.clientX - this._dragLastX, e.clientY - this._dragLastY, MOUSE_SENSITIVITY)
      this._dragLastX = e.clientX; this._dragLastY = e.clientY
    })
    window.addEventListener('mouseup',    () => { this._dragging = false })
    window.addEventListener('mouseleave', () => { this._dragging = false })
    window.addEventListener('contextmenu', e => e.preventDefault())

    // Scroll zoom
    window.addEventListener('wheel', e => {
      e.preventDefault()
      const factor = e.deltaY > 0 ? (MAP_CONFIG.zoomSpeed ?? 1.1) : 1 / (MAP_CONFIG.zoomSpeed ?? 1.1)
      this._targetDist = Math.max(
        MAP_CONFIG.cameraMinDistance ?? 4,
        Math.min(MAP_CONFIG.cameraMaxDistance ?? 60, this._targetDist * factor)
      )
    }, { passive: false })

    // Touch: right-half = look, pinch = zoom
    window.addEventListener('touchstart', e => {
      const touches = Array.from(e.touches)
      if (touches.length >= 2) {
        this._lookId = null
        this._pinchActive = true
        this._pinchStart  = Math.hypot(
          touches[0].clientX - touches[1].clientX,
          touches[0].clientY - touches[1].clientY
        )
        this._pinchBase = this._targetDist
        return
      }
      const t = e.changedTouches[0]
      if (this._lookId === null && t.clientX > window.innerWidth * 0.42) {
        this._lookId    = t.identifier
        this._lookLastX = t.clientX
        this._lookLastY = t.clientY
      }
    }, { passive: true })

    window.addEventListener('touchmove', e => {
      if (this._pinchActive && e.touches.length >= 2) {
        const cur = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        )
        if (this._pinchStart > 0) {
          this._targetDist = Math.max(
            MAP_CONFIG.cameraMinDistance ?? 4,
            Math.min(MAP_CONFIG.cameraMaxDistance ?? 60, this._pinchBase * (this._pinchStart / cur))
          )
        }
        return
      }
      if (this._lookId !== null) {
        for (const t of Array.from(e.changedTouches)) {
          if (t.identifier === this._lookId) {
            this._orbitBy(t.clientX - this._lookLastX, t.clientY - this._lookLastY, TOUCH_SENSITIVITY)
            this._lookLastX = t.clientX; this._lookLastY = t.clientY
          }
        }
      }
    }, { passive: true })

    window.addEventListener('touchend', e => {
      if (Array.from(e.touches).length < 2) { this._pinchActive = false; this._pinchStart = 0 }
      for (const t of Array.from(e.changedTouches)) {
        if (t.identifier === this._lookId) this._lookId = null
      }
    }, { passive: true })
  }

  // ── Main update — called every frame ──────────────────────────────────────
  update(delta: number, input: InputController, joystick: JoystickInput) {
    input.consumeMouseDelta()

    // ── Smooth camera distance toward pinch/scroll target ─────────────────
    if (Math.abs(this.camDist - this._targetDist) > 0.01)
      this.camDist += (this._targetDist - this.camDist) * Math.min(12 * delta, 1)

    // ── Gather raw input ───────────────────────────────────────────────────
    // Keyboard
    const kb = input.getMoveVector()

    // Joystick: joyX = strafe (right=+), joyY = screen-down (+), so negate Y for forward
    // This matches Code 1 exactly:  inputY = kbY !== 0 ? kbY : -joyVec.y
    const inputX = kb.x !== 0 ? kb.x : joystick.x
    const inputY = kb.z !== 0 ? -kb.z : -joystick.y   // forward = negative Z = negative screen Y

    const moving = (inputX * inputX + inputY * inputY) > 0.01
    const isSprinting = moving && (input.isSprinting() || joystick.sprint)
    const speed = isSprinting ? (MAP_CONFIG.sprintSpeed ?? 14) : (MAP_CONFIG.walkSpeed ?? 6)

    // ── Camera-relative movement (identical to Code 1) ────────────────────
    if (moving) {
      // Forward = direction camera is pointing (XZ plane)
      this._fwd.set(-Math.sin(this.camYaw), 0, -Math.cos(this.camYaw)).normalize()
      // Right = cross(fwd, up)
      this._right.crossVectors(this._fwd, this._UP).normalize()

      // World-space move direction from camera-relative input
      this._moveDir
        .set(0, 0, 0)
        .addScaledVector(this._fwd,   inputY)
        .addScaledVector(this._right, inputX)

      if (this._moveDir.lengthSq() > 0.0001) this._moveDir.normalize()

      // Try to move; collision resolves XZ
      const moveDelta = this._moveDir.clone().multiplyScalar(speed * delta)
      moveDelta.y = 0
      const resolved = this.collision.resolveXZ(
        this.position, moveDelta,
        MAP_CONFIG.characterRadius ?? 0.5, this.charHeight
      )

      // Face direction of travel
      const targetYaw = Math.atan2(this._moveDir.x, this._moveDir.z)
      let diff = targetYaw - this.model.rotation.y
      while (diff >  Math.PI) diff -= Math.PI * 2
      while (diff < -Math.PI) diff += Math.PI * 2
      this.model.rotation.y += diff * Math.min(10 * delta, 1)

      this.position.x = resolved.x
      this.position.z = resolved.z
    }

    // ── Jump ───────────────────────────────────────────────────────────────
    if (this.jumpBuffer && this.isGrounded) {
      this.verticalVel = MAP_CONFIG.jumpSpeed ?? 14
      this.isGrounded  = false
    }
    this.jumpBuffer = false

    // ── Gravity ────────────────────────────────────────────────────────────
    this.verticalVel += (MAP_CONFIG.gravity ?? -28) * delta
    const nextY = this.position.y + this.verticalVel * delta
    const gY    = this.collision.getGroundY(this.position, this.charHeight)
    if (nextY <= gY + 0.05) {
      this.position.y = gY; this.verticalVel = 0; this.isGrounded = true
    } else {
      this.position.y = Math.max(nextY, 0)
      this.isGrounded  = nextY <= 0.05
    }

    this.model.position.copy(this.position)

    // ── Animations ─────────────────────────────────────────────────────────
    if (this.mixer) {
      this._play(!this.isGrounded ? 'jump' : moving ? (isSprinting ? 'run' : 'walk') : 'idle')
      this.mixer.update(delta)
    }

    // ── Camera update ──────────────────────────────────────────────────────
    this._updateCamera(delta)

    // ── Dynamic FOV ────────────────────────────────────────────────────────
    const targetFov = isSprinting ? 75 : 60
    if (Math.abs(this.camera.fov - targetFov) > 0.1) {
      this.camera.fov += (targetFov - this.camera.fov) * Math.min(8 * delta, 1)
      this.camera.updateProjectionMatrix()
    }

    this.speedEl?.classList.toggle('sprinting', moving && isSprinting)
  }

  // ── Camera orbit + occlusion ───────────────────────────────────────────────
  private _updateCamera(delta: number) {
    // Pivot at character head height
    this._camTarget.set(
      this.position.x,
      this.position.y + this.charHeight * 0.75,
      this.position.z
    )

    // Desired camera position from yaw/pitch/distance
    const cosP = Math.cos(this.camPitch)
    this._camDesired.set(
      this._camTarget.x + Math.sin(this.camYaw) * this.camDist * cosP,
      this._camTarget.y + Math.sin(this.camPitch) * this.camDist,
      this._camTarget.z + Math.cos(this.camYaw) * this.camDist * cosP
    )

    const toDesired = this._camDesired.clone().sub(this._camTarget)
    const rayDir    = toDesired.clone().normalize()
    const rayDist   = toDesired.length()

    // Occlusion: sphere-sweep from pivot toward desired position
    const SPHERE_R = 0.45
    const offsets  = [
      new THREE.Vector3(0,         0, 0),
      new THREE.Vector3( SPHERE_R, 0, 0),
      new THREE.Vector3(-SPHERE_R, 0, 0),
      new THREE.Vector3(0,  SPHERE_R, 0),
      new THREE.Vector3(0, -SPHERE_R, 0),
    ]
    let minDist = rayDist
    for (const off of offsets) {
      this.collision.rc.set(this._camTarget.clone().add(off), rayDir)
      this.collision.rc.near = 0.1
      this.collision.rc.far  = rayDist + 1.0
      const hits = this.collision.rc.intersectObjects(this.collision.cameraCollidables, false)
      if (hits.length) {
        const nearest = hits.reduce((b, h) => h.distance < b.distance ? h : b, hits[0])
        minDist = Math.min(minDist, Math.max(
          MAP_CONFIG.cameraMinDistance ?? 4,
          nearest.distance - SPHERE_R - 0.2
        ))
      }
    }

    // Snap in fast, ease out slowly
    this._safeDist += (minDist - this._safeDist) *
      (minDist < this._safeDist
        ? (1 - Math.pow(0.0001, delta))   // instant snap inward
        : (1 - Math.pow(0.05,   delta)))  // slow ease outward

    const safePos = this._camTarget.clone()
      .add(rayDir.multiplyScalar(this._safeDist))
    safePos.y = Math.max(safePos.y, 0.5)

    this.camera.position.lerp(safePos, 1 - Math.pow(0.01, delta))
    this.camera.lookAt(this._camTarget)
  }
}
