// src/components/map/input.ts

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
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) e.preventDefault()
  }
  private _onKeyUp   = (e: KeyboardEvent) => { this.keys[e.code] = false }
  private _onMove    = (e: MouseEvent)    => { if (this.mouseLocked) { this._dx += e.movementX; this._dy += e.movementY } }
  private _onLock    = ()                 => { this.mouseLocked = !!document.pointerLockElement }
  private _onClick   = (e: MouseEvent)    => {
    const t = e.target as HTMLElement
    if (t.tagName === 'CANVAS' && !this.mouseLocked) t.requestPointerLock()
  }

  constructor() {
    window.addEventListener('keydown', this._onKeyDown)
    window.addEventListener('keyup',   this._onKeyUp)
    window.addEventListener('mousemove', this._onMove)
    document.addEventListener('pointerlockchange', this._onLock)
    window.addEventListener('click', this._onClick)
  }

  isPressed(code: string)   { return !!this.keys[code] }
  isSprinting()             { return this.isPressed('ShiftLeft') || this.isPressed('ShiftRight') }

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
    window.removeEventListener('keydown', this._onKeyDown)
    window.removeEventListener('keyup',   this._onKeyUp)
    window.removeEventListener('mousemove', this._onMove)
    document.removeEventListener('pointerlockchange', this._onLock)
    window.removeEventListener('click', this._onClick)
    if (document.pointerLockElement) document.exitPointerLock()
  }
}

export class MobileJoystick {
  private _active  = false
  private _touchId: number | null = null
  private _origin  = { x: 0, y: 0 }
  private _delta   = { x: 0, y: 0 }
  private _sprint  = false
  private RADIUS   = 55
  private base: HTMLElement
  private knob: HTMLElement
  private btn:  HTMLElement

  constructor(base: HTMLElement, knob: HTMLElement, btn: HTMLElement) {
    this.base = base
    this.knob = knob
    this.btn  = btn
    this._bind()
  }

  private center() {
    const r = this.base.getBoundingClientRect()
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
  }

  private move(cx: number, cy: number) {
    const dx = cx - this._origin.x, dy = cy - this._origin.y
    const d  = Math.sqrt(dx*dx + dy*dy)
    const c  = Math.min(d, this.RADIUS)
    const a  = Math.atan2(dy, dx)
    const kx = Math.cos(a)*c, ky = Math.sin(a)*c
    this.knob.style.transform = `translate(calc(-50% + ${kx}px), calc(-50% + ${ky}px))`
    this._delta = { x: kx/this.RADIUS, y: ky/this.RADIUS }
  }

  private _bind() {
    this.base.addEventListener('touchstart', e => {
      e.preventDefault()
      if (this._active) return
      const t = e.changedTouches[0]
      this._active = true; this._touchId = t.identifier
      this._origin = this.center(); this.move(t.clientX, t.clientY)
    }, { passive: false })

    window.addEventListener('touchmove', e => {
      if (!this._active) return
      for (const t of Array.from(e.changedTouches))
        if (t.identifier === this._touchId) this.move(t.clientX, t.clientY)
    }, { passive: false })

    window.addEventListener('touchend', e => {
      for (const t of Array.from(e.changedTouches)) {
        if (t.identifier === this._touchId) {
          this._active = false; this._touchId = null; this._delta = { x:0, y:0 }
          this.knob.style.transform = 'translate(-50%, -50%)'
        }
      }
    })

    this.btn.addEventListener('touchstart', e => { e.preventDefault(); this._sprint = true;  this.btn.classList.add('active') }, { passive: false })
    this.btn.addEventListener('touchend',   ()  => { this._sprint = false; this.btn.classList.remove('active') })
  }

  getInput(): JoystickInput {
    return { x: this._active ? this._delta.x : 0, y: this._active ? this._delta.y : 0, sprint: this._sprint }
  }
}
