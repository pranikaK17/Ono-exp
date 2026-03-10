export interface MoveVector { x: number; z: number }
export interface MouseDelta { dx: number; dy: number }
export interface JoystickInput { x: number; y: number; sprint: boolean; active: boolean }

// ─────────────────────────────────────────────────────────────────────────────
// InputController — keyboard + mouse
// ─────────────────────────────────────────────────────────────────────────────
export class InputController {
  private keys: Record<string, boolean> = {}
  private _dx = 0
  private _dy = 0
  public mouseLocked = false

  private _onKeyDown = (e: KeyboardEvent) => {
    this.keys[e.code] = true
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code))
      e.preventDefault()
  }
  private _onKeyUp = (e: KeyboardEvent) => { this.keys[e.code] = false }
  private _onMove  = (e: MouseEvent) => {
    if (this.mouseLocked) { this._dx += e.movementX; this._dy += e.movementY }
  }
  private _onLock = () => { this.mouseLocked = !!document.pointerLockElement }

  constructor() {
    window.addEventListener('keydown',  this._onKeyDown)
    window.addEventListener('keyup',    this._onKeyUp)
    window.addEventListener('mousemove', this._onMove)
    document.addEventListener('pointerlockchange', this._onLock)
  }

  isPressed(code: string) { return !!this.keys[code] }

  isSprinting() {
    return this.isPressed('ShiftLeft') || this.isPressed('ShiftRight') || this.isPressed('Shift')
  }

  getMoveVector(): MoveVector {
    let x = 0, z = 0
    if (this.isPressed('KeyW') || this.isPressed('ArrowUp'))    z -= 1
    if (this.isPressed('KeyS') || this.isPressed('ArrowDown'))  z += 1
    if (this.isPressed('KeyA') || this.isPressed('ArrowLeft'))  x -= 1
    if (this.isPressed('KeyD') || this.isPressed('ArrowRight')) x += 1
    return { x, z }
  }

  consumeMouseDelta(): MouseDelta {
    const r = { dx: this._dx, dy: this._dy }
    this._dx = 0; this._dy = 0
    return r
  }

  destroy() {
    window.removeEventListener('keydown',  this._onKeyDown)
    window.removeEventListener('keyup',    this._onKeyUp)
    window.removeEventListener('mousemove', this._onMove)
    document.removeEventListener('pointerlockchange', this._onLock)
    if (document.pointerLockElement) document.exitPointerLock()
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MobileJoystick
// ─────────────────────────────────────────────────────────────────────────────
// Modelled on Code 1's proven approach: raw values written on touchmove,
// read directly in getInput(). No smoothing, no tick(), no frame-dependency.
// Consumer is responsible for axis semantics (negate Y for forward).
// ─────────────────────────────────────────────────────────────────────────────
export class MobileJoystick {
  private _active   = false
  private _touchId: number | null = null
  private _originX  = 0
  private _originY  = 0
  private _rawX     = 0   // normalised -1..1  (right = +)
  private _rawY     = 0   // normalised -1..1  (down  = +, consumer negates)
  private _mag      = 0   // 0..1
  private readonly RADIUS           = 55
  private readonly SPRINT_THRESHOLD = 0.80

  private base: HTMLElement
  private knob: HTMLElement

  constructor(base: HTMLElement, knob: HTMLElement) {
    this.base = base
    this.knob = knob
    this._bind()
  }

  private _center() {
    const r = this.base.getBoundingClientRect()
    return { x: r.left + r.width * 0.5, y: r.top + r.height * 0.5 }
  }

  private _update(clientX: number, clientY: number) {
    const dx     = clientX - this._originX
    const dy     = clientY - this._originY
    const len    = Math.sqrt(dx * dx + dy * dy)
    const c      = Math.min(len, this.RADIUS)
    const angle  = Math.atan2(dy, dx)
    const kx     = Math.cos(angle) * c
    const ky     = Math.sin(angle) * c

    this.knob.style.transform = `translate(calc(-50% + ${kx}px), calc(-50% + ${ky}px))`
    this._mag  = c / this.RADIUS
    this._rawX = kx / this.RADIUS
    this._rawY = ky / this.RADIUS

    const sprinting = this._mag > this.SPRINT_THRESHOLD
    this.knob.style.background = sprinting ? 'rgba(255,120,50,0.95)' : ''
    this.knob.style.boxShadow  = sprinting ? '0 0 24px rgba(255,107,53,0.8)' : ''
  }

  private _release() {
    this._active = false; this._touchId = null
    this._rawX = 0; this._rawY = 0; this._mag = 0
    this.knob.style.transform  = 'translate(-50%, -50%)'
    this.knob.style.background = ''
    this.knob.style.boxShadow  = ''
  }

  private _bind() {
    this.base.addEventListener('touchstart', e => {
      e.preventDefault()
      if (this._active) return
      const t = e.changedTouches[0]
      this._active  = true
      this._touchId = t.identifier
      const c = this._center()
      this._originX = c.x
      this._originY = c.y
      this._update(t.clientX, t.clientY)
    }, { passive: false })

    window.addEventListener('touchmove', e => {
      if (!this._active || this._touchId === null) return
      for (const t of Array.from(e.changedTouches)) {
        if (t.identifier === this._touchId) { this._update(t.clientX, t.clientY); break }
      }
    }, { passive: true })

    const onEnd = (e: TouchEvent) => {
      if (this._touchId === null) return
      for (const t of Array.from(e.changedTouches)) {
        if (t.identifier === this._touchId) { this._release(); break }
      }
    }
    window.addEventListener('touchend',    onEnd, { passive: true })
    window.addEventListener('touchcancel', onEnd, { passive: true })
  }

  getInput(): JoystickInput {
    return {
      x:      this._active ? this._rawX : 0,
      y:      this._active ? this._rawY : 0,   // +y = screen-down; negate for "forward"
      sprint: this._active && this._mag > this.SPRINT_THRESHOLD,
      active: this._active,
    }
  }
}
