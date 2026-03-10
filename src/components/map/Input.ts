export interface MoveVector { x: number; z: number }
export interface MouseDelta { dx: number; dy: number }
export interface JoystickInput { x: number; y: number; sprint: boolean }

export class InputController {
  private keys: Record<string, boolean> = {}
  private _dx = 0
  private _dy = 0
  public mouseLocked = false

  private _onKeyDown = (e: KeyboardEvent) => {
    this.keys[e.code] = true
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault()
  }
  private _onKeyUp   = (e: KeyboardEvent) => { this.keys[e.code] = false }
  private _onMove    = (e: MouseEvent)    => { if (this.mouseLocked) { this._dx += e.movementX; this._dy += e.movementY } }
  private _onLock    = ()                 => { this.mouseLocked = !!document.pointerLockElement }

  constructor() {
    window.addEventListener('keydown', this._onKeyDown)
    window.addEventListener('keyup',   this._onKeyUp)
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

export class MobileJoystick {
  private _active   = false
  private _touchId: number | null = null
  private _origin   = { x: 0, y: 0 }
  private _delta    = { x: 0, y: 0 }
  private _mag      = 0
  private RADIUS    = 60
  private SPRINT_THRESHOLD = 0.82

  private base: HTMLElement
  private knob: HTMLElement

  // REMOVED: _smoothDelta and SMOOTH — tick() was never called in the render
  // loop so _smoothDelta never advanced, keeping getInput() permanently at {0,0}.
  // We now return _delta directly; it's updated on every touchmove event so
  // it is already effectively frame-rate independent.

  constructor(base: HTMLElement, knob: HTMLElement) {
    this.base = base
    this.knob = knob
    this._bind()
  }

  private center() {
    const r = this.base.getBoundingClientRect()
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
  }

  private move(cx: number, cy: number) {
    const dx = cx - this._origin.x
    const dy = cy - this._origin.y
    const d  = Math.sqrt(dx * dx + dy * dy)
    const c  = Math.min(d, this.RADIUS)
    const a  = Math.atan2(dy, dx)
    const kx = Math.cos(a) * c
    const ky = Math.sin(a) * c

    this.knob.style.transform = `translate(calc(-50% + ${kx}px), calc(-50% + ${ky}px))`
    this._mag   = c / this.RADIUS
    this._delta = { x: kx / this.RADIUS, y: ky / this.RADIUS }

    if (this._mag > this.SPRINT_THRESHOLD) {
      this.knob.style.background = 'rgba(255,107,53,0.95)'
      this.knob.style.boxShadow  = '0 0 24px rgba(255,107,53,0.6)'
    } else {
      this.knob.style.background = 'rgba(255,107,53,0.82)'
      this.knob.style.boxShadow  = '0 0 18px rgba(255,107,53,0.35)'
    }
  }

  private _bind() {
    this.base.addEventListener('touchstart', e => {
      e.preventDefault()
      if (this._active) return
      const t = e.changedTouches[0]
      this._active  = true
      this._touchId = t.identifier
      this._origin  = this.center()
      this.move(t.clientX, t.clientY)
    }, { passive: false })

    window.addEventListener('touchmove', e => {
      if (!this._active) return
      for (const t of Array.from(e.changedTouches)) {
        if (t.identifier === this._touchId) {
          this.move(t.clientX, t.clientY)
        }
      }
    }, { passive: false })

    window.addEventListener('touchend', e => {
      for (const t of Array.from(e.changedTouches)) {
        if (t.identifier === this._touchId) {
          this._active  = false
          this._touchId = null
          this._delta   = { x: 0, y: 0 }
          this._mag     = 0
          this.knob.style.transform  = 'translate(-50%, -50%)'
          this.knob.style.background = 'rgba(255,107,53,0.82)'
          this.knob.style.boxShadow  = '0 0 18px rgba(255,107,53,0.35)'
        }
      }
    })

    window.addEventListener('touchcancel', e => {
      for (const t of Array.from(e.changedTouches)) {
        if (t.identifier === this._touchId) {
          this._active  = false
          this._touchId = null
          this._delta   = { x: 0, y: 0 }
          this._mag     = 0
          this.knob.style.transform  = 'translate(-50%, -50%)'
          this.knob.style.background = 'rgba(255,107,53,0.82)'
          this.knob.style.boxShadow  = '0 0 18px rgba(255,107,53,0.35)'
        }
      }
    })
  }

  // tick() removed — no longer needed since we return _delta directly
  getInput(): JoystickInput {
    return {
      x:      this._active ? this._delta.x : 0,
      y:      this._active ? this._delta.y : 0,
      sprint: this._active && this._mag > this.SPRINT_THRESHOLD,
    }
  }
}
