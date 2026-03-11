import * as THREE from 'three'
import { CollisionSystem } from './collision'
import { InputController } from './Input'
import type { JoystickInput } from './Input'
import { MAP_CONFIG } from './Config'

type AnimKey = 'idle' | 'walk' | 'run' | 'jump'

const TOUCH_SENSITIVITY = 0.013
const MOUSE_SENSITIVITY = MAP_CONFIG.mouseSensitivity   // 0.003

export class CharacterController {
  private model: THREE.Object3D
  private mixer: THREE.AnimationMixer | null
  private actions: Partial<Record<AnimKey, THREE.AnimationAction>> = {}
  private currentAction: AnimKey | null = null

  private camera: THREE.PerspectiveCamera
  private collision: CollisionSystem

  position: THREE.Vector3
  private charHeight: number
  private verticalVel = 0
  private isGrounded = true

  private yaw: number
  private pitch: number
  private distance: number
  private _smoothSafeDist: number

  private dragging = false
  private dragLastX = 0
  private dragLastY = 0

  private _lookTouchId: number | null = null
  private _lookLastX = 0
  private _lookLastY = 0

  private _pinchActive = false
  private _pinchStart = 0
  private _pinchCamDist = 0
  private _pinchTargetDist = 0

  private smoothVel = new THREE.Vector3()

  private isManualOrbit = false
  private orbitTimer = 0
  private readonly ORBIT_RESUME_DELAY = 1.0
  private readonly FOLLOW_SPEED = 4.5
  private lastMoveYaw: number | null = null

  constructor(opts: {
    model: THREE.Object3D; mixer: THREE.AnimationMixer | null
    animations: THREE.AnimationClip[]; camera: THREE.PerspectiveCamera
    collision: CollisionSystem; mapBounds: THREE.Box3
    spawnPos: THREE.Vector3; charHeight: number
    isMobile?: boolean
  }) {
    this.model = opts.model
    this.mixer = opts.mixer
    this.camera = opts.camera
    this.collision = opts.collision
    this.position = opts.spawnPos.clone()
    this.charHeight = opts.charHeight
    void opts.isMobile
    void opts.mapBounds

    this.yaw = Math.PI
    this.pitch = MAP_CONFIG.cameraPitchDefault
    this.distance = Math.max(MAP_CONFIG.cameraDistance, opts.charHeight * 1.2)
    this._smoothSafeDist = this.distance
    this._pinchTargetDist = this.distance

    this._setupAnimations(opts.animations)
    this.model.position.copy(this.position)
    this.model.rotation.y = 0
    this._bindControls()
  }

  private _setupAnimations(clips: THREE.AnimationClip[]) {
    if (!this.mixer || !clips.length) return
    const map: Record<AnimKey, string[]> = {
      idle: ['idle', 'stand', 'rest', 'still_test', 'still'],
      walk: ['walking_test', 'walk', 'walking'],
      run: ['walking_test', 'walk', 'walking'],
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
    if (!this.actions.run && this.actions.walk) this.actions.run = this.actions.walk
    if (!this.actions.walk && this.actions.run) this.actions.walk = this.actions.run
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

  private _orbitBy(dx: number, dy: number, sensitivity: number) {
    this.yaw -= dx * sensitivity
    this.pitch = Math.max(MAP_CONFIG.minPitch,
      Math.min(MAP_CONFIG.maxPitch, this.pitch + dy * sensitivity))
    this.isManualOrbit = true
    this.orbitTimer = 0
  }

  private _bindControls() {
    window.addEventListener('mousedown', e => {
      if (e.button === 0 || e.button === 1 || e.button === 2) {
        this.dragging = true
        this.dragLastX = e.clientX
        this.dragLastY = e.clientY
        e.preventDefault()
      }
    })
    window.addEventListener('mousemove', e => {
      if (this.dragging) {
        this._orbitBy(e.clientX - this.dragLastX, e.clientY - this.dragLastY, MOUSE_SENSITIVITY)
        this.dragLastX = e.clientX
        this.dragLastY = e.clientY
      }
      if (document.pointerLockElement) {
        this._orbitBy(e.movementX, e.movementY, MOUSE_SENSITIVITY)
      }
    })
    window.addEventListener('mouseup', () => { this.dragging = false })
    window.addEventListener('mouseleave', () => { this.dragging = false })
    window.addEventListener('contextmenu', e => e.preventDefault())

    window.addEventListener('wheel', e => {
      e.preventDefault()
      const zoom = (f: number) => {
        this.distance = Math.max(MAP_CONFIG.cameraMinDistance,
          Math.min(MAP_CONFIG.cameraMaxDistance, this.distance * f))
        this._pinchTargetDist = this.distance
      }
      if (e.ctrlKey) {
        zoom(e.deltaY > 0 ? MAP_CONFIG.zoomSpeed : 1 / MAP_CONFIG.zoomSpeed)
      } else if (!e.ctrlKey && Math.abs(e.deltaX) > 1) {
        const s = MOUSE_SENSITIVITY * 1.5
        this.yaw -= e.deltaX * s
        this.pitch = Math.max(MAP_CONFIG.minPitch,
          Math.min(MAP_CONFIG.maxPitch, this.pitch + e.deltaY * s))
        this.isManualOrbit = true; this.orbitTimer = 0
      } else {
        zoom(e.deltaY > 0 ? MAP_CONFIG.zoomSpeed : 1 / MAP_CONFIG.zoomSpeed)
      }
    }, { passive: false })

    window.addEventListener('touchstart', e => {
      if ((e.target as HTMLElement).closest && (e.target as HTMLElement).closest('#joy-zone')) return

      const targetTouches = Array.from(e.touches).filter(
        t => !(t.target as HTMLElement)?.closest?.('#joy-zone')
      )

      if (targetTouches.length >= 2) {
        this._lookTouchId = null
        this._pinchActive = true
        this._pinchStart = Math.hypot(
          targetTouches[0].clientX - targetTouches[1].clientX,
          targetTouches[0].clientY - targetTouches[1].clientY
        )
        this._pinchCamDist = this.distance
        this._pinchTargetDist = this.distance
        return
      }

      const t = e.changedTouches[0]
      // Only pan if we aren't already panning and it's not a pinch
      if (this._lookTouchId === null && !this._pinchActive) {
        this._lookTouchId = t.identifier
        this._lookLastX = t.clientX
        this._lookLastY = t.clientY
      }
    }, { passive: true })

    window.addEventListener('touchmove', e => {
      const targetTouches = Array.from(e.touches).filter(
        t => !(t.target as HTMLElement)?.closest?.('#joy-zone')
      )

      if (this._pinchActive && targetTouches.length >= 2) {
        const cur = Math.hypot(
          targetTouches[0].clientX - targetTouches[1].clientX,
          targetTouches[0].clientY - targetTouches[1].clientY
        )
        if (this._pinchStart > 0) {
          const ratio = this._pinchStart / cur
          this._pinchTargetDist = Math.max(
            MAP_CONFIG.cameraMinDistance,
            Math.min(MAP_CONFIG.cameraMaxDistance, this._pinchCamDist * ratio)
          )
        }
        return
      }
      if (this._lookTouchId !== null) {
        for (const t of Array.from(e.changedTouches)) {
          if (t.identifier === this._lookTouchId) {
            this._orbitBy(
              t.clientX - this._lookLastX,
              t.clientY - this._lookLastY,
              TOUCH_SENSITIVITY
            )
            this._lookLastX = t.clientX
            this._lookLastY = t.clientY
          }
        }
      }
    }, { passive: true })

    window.addEventListener('touchend', e => {
      const remaining = Array.from(e.touches)
      if (remaining.length < 2) {
        this._pinchActive = false
        this._pinchStart = 0
      }
      for (const t of Array.from(e.changedTouches)) {
        if (t.identifier === this._lookTouchId) {
          this._lookTouchId = null
        }
      }
    }, { passive: true })
  }

  update(delta: number, input: InputController, joystick: JoystickInput) {
    input.consumeMouseDelta()

    if (Math.abs(this.distance - this._pinchTargetDist) > 0.01) {
      this.distance += (this._pinchTargetDist - this.distance) *
        Math.min(12 * delta, 1)
    }

    const kb = input.getMoveVector()

    // Joystick input: Pushing Up (negative y) moves character forward (negative mz),
    // Pushing Down (positive y) moves character backward (positive mz).
    let mx = kb.x + joystick.x
    let mz = kb.z + joystick.y


    const len = Math.sqrt(mx * mx + mz * mz)
    if (len > 1) { mx /= len; mz /= len }

    const moving = len > 0.05
    const isSprinting = (input.isSprinting() || joystick.sprint) && moving
    let speed = isSprinting ? MAP_CONFIG.sprintSpeed : MAP_CONFIG.walkSpeed

    const sinY = Math.sin(this.yaw)
    const cosY = Math.cos(this.yaw)
    const rawDir = new THREE.Vector3(
      -mz * (-sinY) + mx * cosY,
      0,
      -mz * (-cosY) + mx * (-sinY)
    )



    const targetVel = moving
      ? rawDir.clone().normalize().multiplyScalar(speed)
      : new THREE.Vector3()
    this.smoothVel.lerp(targetVel, Math.min((moving ? 30 : 35) * delta, 1))

    const dir = this.smoothVel.clone().normalize()
    const actualSpeed = this.smoothVel.length()
    const isMoving = actualSpeed > 0.5

    const moveDelta = this.smoothVel.clone().multiplyScalar(delta)
    moveDelta.y = 0
    const resolved = this.collision.resolveXZ(
      this.position, moveDelta, MAP_CONFIG.characterRadius, this.charHeight
    )

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

    if (isMoving && dir.lengthSq() > 0.001) {
      // Always just rotate to the direction we are moving towards
      let target = Math.atan2(dir.x, dir.z) + Math.PI

      let diff = target - this.model.rotation.y
      while (diff > Math.PI) diff -= 2 * Math.PI
      while (diff < -Math.PI) diff += 2 * Math.PI
      this.model.rotation.y += diff * Math.min(12 * delta, 1)

      // We want the camera to follow the *actual* movement direction, so we store
      // the raw direction for the camera to follow, not the backwards-adjusted one.
      this.lastMoveYaw = Math.atan2(dir.x, dir.z)
    }

    if (this.isManualOrbit) {
      if (isMoving) {
        this.isManualOrbit = false
        this.orbitTimer = 0
      } else {
        this.orbitTimer += delta
        if (this.orbitTimer > this.ORBIT_RESUME_DELAY) {
          this.isManualOrbit = false
          this.orbitTimer = 0
        }
      }
    }

    // Always follow when moving (camera fixed at back)
    // Only auto-follow if we are not moving backward (mz > 0) to avoid an infinite spin loop
    // where the camera chases its own tail (since movement is relative to camera).
    const isMovingBackward = mz > 0.1
    if (!this.isManualOrbit && isMoving && !isMovingBackward && this.lastMoveYaw !== null) {
      // Camera should sit behind the character's current movement direction.
      const targetYaw = this.lastMoveYaw + Math.PI
      let diff = targetYaw - this.yaw
      while (diff > Math.PI) diff -= 2 * Math.PI
      while (diff < -Math.PI) diff += 2 * Math.PI
      this.yaw += diff * Math.min(this.FOLLOW_SPEED * delta, 1)
    }

    if (this.mixer) {
      this._play(!this.isGrounded ? 'jump' : isMoving ? (isSprinting ? 'run' : 'walk') : 'idle')
      this.mixer.update(delta)
    }

    this._updateCamera(delta)

    const fov = isSprinting ? 75 : 60
    if (Math.abs(this.camera.fov - fov) > 0.1) {
      this.camera.fov += (fov - this.camera.fov) * Math.min(8 * delta, 1)
      this.camera.updateProjectionMatrix()
    }

  }

  private _updateCamera(delta: number) {
    const pivot = this.position.clone()
      .add(new THREE.Vector3(0, this.charHeight * 0.75, 0))

    const ox = this.distance * Math.sin(this.yaw) * Math.cos(this.pitch)
    const oy = this.distance * Math.sin(this.pitch)
    const oz = this.distance * Math.cos(this.yaw) * Math.cos(this.pitch)
    const desired = pivot.clone().add(new THREE.Vector3(ox, oy, oz))
    const toDesired = desired.clone().sub(pivot)
    const rayDir = toDesired.clone().normalize()
    const rayDist = toDesired.length()

    const SPHERE_R = 0.5
    const offsets = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(SPHERE_R, 0, 0),
      new THREE.Vector3(-SPHERE_R, 0, 0),
      new THREE.Vector3(0, SPHERE_R, 0),
      new THREE.Vector3(0, -SPHERE_R, 0),
    ]

    let minDist = rayDist
    for (const off of offsets) {
      this.collision.rc.set(pivot.clone().add(off), rayDir)
      this.collision.rc.near = 0.1
      this.collision.rc.far = rayDist + 1.0
      const hits = this.collision.rc.intersectObjects(this.collision.cameraCollidables, false)
      if (hits.length) {
        const closest = hits.reduce((b, h) => h.distance < b.distance ? h : b, hits[0])
        minDist = Math.min(minDist,
          Math.max(MAP_CONFIG.cameraMinDistance, closest.distance - SPHERE_R - 0.2))
      }
    }

    const inS = 1 - Math.pow(0.0001, delta)
    const outS = 1 - Math.pow(0.05, delta)
    this._smoothSafeDist += (minDist - this._smoothSafeDist) *
      (minDist < this._smoothSafeDist ? inS : outS)

    const safe = pivot.clone().add(rayDir.multiplyScalar(this._smoothSafeDist))
    safe.y = Math.max(safe.y, 0.5)
    this.camera.position.lerp(safe, 1 - Math.pow(0.01, delta))
    this.camera.lookAt(pivot)
  }
}
