export interface MoveVector  { x: number; z: number }
export interface MouseDelta  { dx: number; dy: number }
export interface JoystickInput { x: number; y: number; sprint: boolean }

// ─────────────────────────────────────────────────────────────────────────────
// InputController
// ─────────────────────────────────────────────────────────────────────────────
export class InputController {
  private _keys: Record<string, boolean> = {}
  private _dx = 0
  private _dy = 0
  public  mouseLocked = false

  private _onKeyDown = (e: KeyboardEvent) => {
    this._keys[e.code] = true
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))
      e.preventDefault()
  }
  private _onKeyUp   = (e: KeyboardEvent) => { this._keys[e.code] = false }
  private _onMove    = (e: MouseEvent)    => {
    if (this.mouseLocked) { this._dx += e.movementX; this._dy += e.movementY }
  }
  private _onLock    = () => { this.mouseLocked = !!document.pointerLockElement }

  constructor() {
    window.addEventListener('keydown',           this._onKeyDown)
    window.addEventListener('keyup',             this._onKeyUp)
    window.addEventListener('mousemove',         this._onMove)
    document.addEventListener('pointerlockchange', this._onLock)
  }

  isPressed(code: string) { return !!this._keys[code] }

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
    window.removeEventListener('keydown',            this._onKeyDown)
    window.removeEventListener('keyup',              this._onKeyUp)
    window.removeEventListener('mousemove',          this._onMove)
    document.removeEventListener('pointerlockchange', this._onLock)
    if (document.pointerLockElement) document.exitPointerLock()
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MobileJoystick
// ─────────────────────────────────────────────────────────────────────────────
// Key design decisions:
//   • Listens on base element for touchstart, window for touchmove/touchend
//   • Origin is snapped at touchstart from getBoundingClientRect() center
//   • Raw _delta is clamped to [-1,1] range immediately — no smoothing needed
//     for responsiveness; smoothing is light and opt-in via tick()
//   • Sprint fires when push > SPRINT_THRESHOLD (82% of radius)
//   • getInput() returns raw _delta when active (not smoothed) for instant response
// ─────────────────────────────────────────────────────────────────────────────
export class MobileJoystick {
  private _active   = false
  private _touchId: number | null = null
  private _origin   = { x: 0, y: 0 }
  private _rawDelta = { x: 0, y: 0 }   // raw, updated on every touchmove
  private _smDelta  = { x: 0, y: 0 }   // smoothed, updated by tick()
  private _mag      = 0                 // 0–1
  private RADIUS    = 55
  private SPRINT_THRESHOLD = 0.82

  private base: HTMLElement
  private knob: HTMLElement

  constructor(base: HTMLElement, knob: HTMLElement) {
    this.base = base
    this.knob = knob
    this._bind()
  }

  private _center() {
    const r = this.base.getBoundingClientRect()
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
  }

  private _move(cx: number, cy: number) {
    const dx  = cx - this._origin.x
    const dy  = cy - this._origin.y
    const len = Math.sqrt(dx * dx + dy * dy)
    const clamped = Math.min(len, this.RADIUS)
    const angle   = Math.atan2(dy, dx)
    const kx      = Math.cos(angle) * clamped
    const ky      = Math.sin(angle) * clamped

    // Move knob visually
    this.knob.style.transform = `translate(calc(-50% + ${kx}px), calc(-50% + ${ky}px))`

    this._mag      = clamped / this.RADIUS
    this._rawDelta = { x: kx / this.RADIUS, y: ky / this.RADIUS }

    // Visual sprint feedback
    const sprinting = this._mag > this.SPRINT_THRESHOLD
    this.knob.style.background = sprinting
      ? 'radial-gradient(circle at 35% 35%, #f0abfc 0%, #a855f7 40%, #6b21a8 100%)'
      : 'radial-gradient(circle at 35% 35%, #c084fc 0%, #7c3aed 40%, #4c1d95 75%, #1e0a3c 100%)'
    this.knob.style.boxShadow = sprinting
      ? '0 0 20px rgba(216,180,254,1), 0 0 50px rgba(168,85,247,.8)'
      : '0 0 12px rgba(168,85,247,.80), 0 0 30px rgba(124,58,237,.50)'
  }

  private _reset() {
    this._active   = false
    this._touchId  = null
    this._rawDelta = { x: 0, y: 0 }
    this._smDelta  = { x: 0, y: 0 }
    this._mag      = 0
    this.knob.style.transform  = 'translate(-50%, -50%)'
    this.knob.style.background = 'radial-gradient(circle at 35% 35%, #c084fc 0%, #7c3aed 40%, #4c1d95 75%, #1e0a3c 100%)'
    this.knob.style.boxShadow  = '0 0 12px rgba(168,85,247,.80), 0 0 30px rgba(124,58,237,.50)'
  }

  private _bind() {
    // ── touchstart on the base element only ───────────────────────────────────
    this.base.addEventListener('touchstart', e => {
      e.preventDefault()   // stops scroll + prevents ghost click
      e.stopPropagation()  // don't let CharacterController steal this touch
      if (this._active) return
      const t = e.changedTouches[0]
      this._active  = true
      this._touchId = t.identifier
      this._origin  = this._center()
      this._move(t.clientX, t.clientY)
    }, { passive: false })

    // ── touchmove on window so knob tracks even if finger slides off base ─────
    window.addEventListener('touchmove', e => {
      if (!this._active) return
      for (const t of Array.from(e.changedTouches)) {
        if (t.identifier === this._touchId) {
          this._move(t.clientX, t.clientY)
          break
        }
      }
    }, { passive: true })

    // ── touchend / touchcancel ────────────────────────────────────────────────
    const onEnd = (e: TouchEvent) => {
      for (const t of Array.from(e.changedTouches)) {
        if (t.identifier === this._touchId) { this._reset(); break }
      }
    }
    window.addEventListener('touchend',    onEnd, { passive: true })
    window.addEventListener('touchcancel', onEnd, { passive: true })
  }

  // Call once per frame with delta time to smooth output
  tick(dt: number) {
    if (!this._active) {
      // Snap to zero when released
      this._smDelta.x = 0
      this._smDelta.y = 0
      return
    }
    const s = Math.min(0.25 * dt * 60, 1)  // ~25% lerp per frame @60fps
    this._smDelta.x += (this._rawDelta.x - this._smDelta.x) * s
    this._smDelta.y += (this._rawDelta.y - this._smDelta.y) * s
  }

  getInput(): JoystickInput {
    if (!this._active) return { x: 0, y: 0, sprint: false }
    // Return raw delta for instant response — smoother feel on mobile
    return {
      x:      this._rawDelta.x,
      y:      this._rawDelta.y,
      sprint: this._mag > this.SPRINT_THRESHOLD,
    }
  }
}
