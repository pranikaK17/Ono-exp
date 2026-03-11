import * as THREE from 'three'

export class CollisionSystem {
  collidables: THREE.Mesh[] = []
  cameraCollidables: THREE.Mesh[] = []
  rc = new THREE.Raycaster()

  private bMin = new THREE.Vector2(-9999, -9999)
  private bMax = new THREE.Vector2(9999, 9999)

  constructor(
    root: THREE.Object3D,
    meshFilter?: (name: string) => boolean,
    cameraFilter?: (name: string) => boolean
  ) {
    root.traverse(c => {
      const m = c as THREE.Mesh
      if (!m.isMesh || !m.geometry) return
      m.updateWorldMatrix(true, false)

      if (!meshFilter || meshFilter(m.name))
        this.collidables.push(m)

      const camOk = cameraFilter ? cameraFilter(m.name) : (!meshFilter || meshFilter(m.name))
      if (camOk) this.cameraCollidables.push(m)
    })
    console.log(`[Collision] ${this.collidables.length} move / ${this.cameraCollidables.length} cam`)
  }

  setBoundary(min: THREE.Vector2, max: THREE.Vector2) {
    this.bMin.copy(min); this.bMax.copy(max)
  }

  /**
   * Returns ground Y beneath pos.
   * CRITICAL: only accepts surfaces that are AT OR BELOW the character's current
   * feet (pos.y + small step-up). This prevents the downward ray from hitting a
   * rooftop and snapping the character up to roof level.
   */
  getGroundY(pos: THREE.Vector3, _charHeight: number): number {
    const STEP_UP = 0.35          // max automatic step-up (tiny kerbs only)
    const origin = new THREE.Vector3(pos.x, pos.y + 4, pos.z)  // cast from just above feet
    this.rc.set(origin, new THREE.Vector3(0, -1, 0))
    this.rc.near = 0
    this.rc.far = 4 + STEP_UP + 0.5   // only reach surfaces within step-up band below feet
    const hits = this.rc.intersectObjects(this.collidables, false)
      .filter(h => h.point.y >= -0.2)
    if (!hits.length) return 0
    return hits.reduce((best, h) => h.point.y > best ? h.point.y : best, 0)
  }

  /**
   * Wall check — probes FULL character height (not just half) in multiple slices.
   * Dynamic PROBE distance ensures we don't tunnel through walls at high speeds.
   */
  private checkWall(
    pos: THREE.Vector3, dir: THREE.Vector3,
    radius: number, charHeight: number,
    moveDist: number
  ): boolean {
    if (dir.lengthSq() < 1e-6) return false
    const d = dir.clone().normalize()
    // Dynamic probe: radius + how far we move this frame + safety margin
    const PROBE = radius + moveDist + 0.12
    
    // Side offset for "boxier" collision coverage
    const side = new THREE.Vector3(-d.z, 0, d.x).multiplyScalar(radius * 0.7)
    
    const heights = [0.12, 0.35, 0.60, 0.85] // 4 slices is enough for full body
    for (const hFrac of heights) {
      const h = hFrac * charHeight
      const pCenter = new THREE.Vector3(pos.x, pos.y + h, pos.z)
      
      // Test center ray
      this.rc.set(pCenter, d)
      this.rc.near = 0; this.rc.far = PROBE
      if (this.rc.intersectObjects(this.collidables, false).length > 0) return true
      
      // Test side rays for better coverage at angles
      this.rc.set(pCenter.clone().add(side), d)
      if (this.rc.intersectObjects(this.collidables, false).length > 0) return true
      this.rc.set(pCenter.clone().sub(side), d)
      if (this.rc.intersectObjects(this.collidables, false).length > 0) return true
    }
    return false
  }

  resolveXZ(
    pos: THREE.Vector3,
    delta: THREE.Vector3,
    radius: number,
    charHeight: number
  ): THREE.Vector3 {
    const out = pos.clone()
    const dLen = delta.length()
    if (dLen < 1e-8) return out

    // Hard boundary clamp first
    const nx = pos.x + delta.x
    const nz = pos.z + delta.z
    const cx = Math.max(this.bMin.x, Math.min(this.bMax.x, nx))
    const cz = Math.max(this.bMin.y, Math.min(this.bMax.y, nz))
    const cdx = cx - pos.x
    const cdz = cz - pos.z

    const move = new THREE.Vector3(cdx, 0, cdz)
    const mLen = move.length()
    if (mLen < 1e-8) return out

    // Try full diagonal
    if (!this.checkWall(pos, move, radius, charHeight, mLen)) {
      out.x += move.x; out.z += move.z; return out
    }
    // Try X only
    const mx = new THREE.Vector3(move.x, 0, 0)
    if (Math.abs(move.x) > 1e-4 && !this.checkWall(pos, mx, radius, charHeight, Math.abs(move.x))) {
      out.x += move.x; return out
    }
    // Try Z only
    const mz = new THREE.Vector3(0, 0, move.z)
    if (Math.abs(move.z) > 1e-4 && !this.checkWall(pos, mz, radius, charHeight, Math.abs(move.z))) {
      out.z += move.z; return out
    }
    return out  // fully blocked
  }
}
