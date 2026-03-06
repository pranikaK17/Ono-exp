// src/components/map/collision.ts
import * as THREE from 'three'

export class CollisionSystem {
  private collidables: THREE.Mesh[] = []
  private rc = new THREE.Raycaster()

  constructor(root: THREE.Object3D) {
    root.traverse(c => {
      const m = c as THREE.Mesh
      if (m.isMesh && m.geometry) {
        // Ensure world matrix is current
        m.updateWorldMatrix(true, false)
        this.collidables.push(m)
      }
    })
    console.log(`[Collision] ${this.collidables.length} collidable meshes`)
  }

  /**
   * Ground detection: cast downward from well above the character.
   * Returns the Y of the first surface hit, or null.
   */
  getGroundY(pos: THREE.Vector3, charHeight: number): number | null {
    // Cast from 20 units above to handle steep terrain & large scales
    const castFrom = new THREE.Vector3(pos.x, pos.y + 20, pos.z)
    this.rc.set(castFrom, new THREE.Vector3(0, -1, 0))
    this.rc.far = 40 + charHeight
    this.rc.near = 0

    const hits = this.rc.intersectObjects(this.collidables, false)
    if (hits.length === 0) return null

    // Return highest hit point (topmost surface)
    return hits.reduce((best, h) => h.point.y > best ? h.point.y : best, -Infinity)
  }

  /**
   * Wall detection: cast horizontally at multiple heights.
   */
  checkWall(pos: THREE.Vector3, dir: THREE.Vector3, radius: number, charHeight: number): boolean {
    if (dir.lengthSq() < 1e-6) return false
    const d = dir.clone().normalize()
    const heights = [charHeight * 0.15, charHeight * 0.5, charHeight * 0.85]

    for (const h of heights) {
      const o = new THREE.Vector3(pos.x, pos.y + h, pos.z)
      this.rc.set(o, d)
      this.rc.far  = radius + 0.1
      this.rc.near = 0
      if (this.rc.intersectObjects(this.collidables, false).length > 0) return true
    }
    return false
  }

  /**
   * Resolve horizontal movement with wall sliding.
   * Does NOT modify Y — that is handled by gravity/ground separately.
   */
  resolveXZ(pos: THREE.Vector3, delta: THREE.Vector3, radius: number, charHeight: number): THREE.Vector3 {
    const out = pos.clone()
    if (delta.lengthSq() < 1e-8) return out

    const xzDelta = new THREE.Vector3(delta.x, 0, delta.z)

    // Full move
    if (!this.checkWall(pos, xzDelta.clone().normalize(), radius, charHeight)) {
      out.x += xzDelta.x
      out.z += xzDelta.z
      return out
    }

    // Slide X
    const xd = new THREE.Vector3(delta.x, 0, 0)
    if (Math.abs(delta.x) > 1e-4 && !this.checkWall(pos, xd.clone().normalize(), radius, charHeight)) {
      out.x += delta.x
      return out
    }

    // Slide Z
    const zd = new THREE.Vector3(0, 0, delta.z)
    if (Math.abs(delta.z) > 1e-4 && !this.checkWall(pos, zd.clone().normalize(), radius, charHeight)) {
      out.z += delta.z
      return out
    }

    return out
  }
}
