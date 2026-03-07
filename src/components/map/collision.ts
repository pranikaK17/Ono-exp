// src/components/map/collision.ts
import * as THREE from 'three'

export class CollisionSystem {
  collidables:     THREE.Mesh[] = []  // used for movement + wall collision
  cameraCollidables: THREE.Mesh[] = [] // smaller set — excludes large domes/skies
  rc = new THREE.Raycaster()

  constructor(root: THREE.Object3D) {
    root.traverse(c => {
      const m = c as THREE.Mesh
      if (!m.isMesh || !m.geometry) return
      m.updateWorldMatrix(true, false)

      // Compute world-space bounding sphere to detect huge meshes like skybox domes
      const sphere = new THREE.Sphere()
      m.geometry.computeBoundingSphere()
      if (m.geometry.boundingSphere) {
        sphere.copy(m.geometry.boundingSphere).applyMatrix4(m.matrixWorld)
      }
      const radius = sphere.radius

      this.collidables.push(m)

      // Exclude meshes whose world-space radius exceeds 40 units — these are
      // skybox domes or ground planes that should never block the camera
      if (radius < 40) {
        this.cameraCollidables.push(m)
      } else {
        console.log(`[Collision] excluding '${m.name}' from camera (radius=${radius.toFixed(1)})`)
      }
    })
    console.log(`[Collision] ${this.collidables.length} movement meshes, ${this.cameraCollidables.length} camera meshes`)
  }

  /**
   * Ground detection: cast downward, return the LOWEST hit point that is
   * still above (pos.y - searchDown). This prevents the character from
   * landing on a rooftop when the true ground floor is lower.
   *
   * Strategy:
   *  1. Cast from high above.
   *  2. Collect ALL hits.
   *  3. Prefer the lowest hit that is above a minimum floor threshold,
   *     so the character spawns on open ground rather than a building roof.
   */
  getGroundY(pos: THREE.Vector3, charHeight: number): number | null {
    const castHeight = 60
    const castFrom   = new THREE.Vector3(pos.x, pos.y + castHeight, pos.z)
    this.rc.set(castFrom, new THREE.Vector3(0, -1, 0))
    this.rc.far  = castHeight + charHeight + 40
    this.rc.near = 0

    const hits = this.rc.intersectObjects(this.collidables, false)
    if (hits.length === 0) return null

    // Return the highest surface directly beneath the probe point —
    // this is whatever the character is standing on (ground, floor, etc.)
    return hits.reduce((best, h) => h.point.y > best ? h.point.y : best, -Infinity)
  }

  /**
   * Wall detection: cast horizontally at multiple heights with a slightly
   * larger look-ahead to catch thin walls reliably.
   */
  checkWall(pos: THREE.Vector3, dir: THREE.Vector3, radius: number, charHeight: number): boolean {
    if (dir.lengthSq() < 1e-6) return false
    const d = dir.clone().normalize()

    // FIX: more sample heights + slightly larger probe radius to stop phasing
    const heights = [
      charHeight * 0.1,
      charHeight * 0.3,
      charHeight * 0.5,
      charHeight * 0.7,
      charHeight * 0.9,
    ]
    const probeRadius = radius + 0.15   // small margin so we stop before touching

    for (const h of heights) {
      const o = new THREE.Vector3(pos.x, pos.y + h, pos.z)
      this.rc.set(o, d)
      this.rc.far  = probeRadius
      this.rc.near = 0
      if (this.rc.intersectObjects(this.collidables, false).length > 0) return true
    }
    return false
  }

  /**
   * Resolve horizontal movement with wall sliding.
   * Does NOT modify Y — gravity/ground are handled separately.
   */
  resolveXZ(
    pos: THREE.Vector3,
    delta: THREE.Vector3,
    radius: number,
    charHeight: number
  ): THREE.Vector3 {
    const out = pos.clone()
    if (delta.lengthSq() < 1e-8) return out

    const xzDelta = new THREE.Vector3(delta.x, 0, delta.z)

    // Full diagonal move
    if (!this.checkWall(pos, xzDelta.clone().normalize(), radius, charHeight)) {
      out.x += xzDelta.x
      out.z += xzDelta.z
      return out
    }

    // Slide along X only
    const xd = new THREE.Vector3(delta.x, 0, 0)
    if (Math.abs(delta.x) > 1e-4 && !this.checkWall(pos, xd.clone().normalize(), radius, charHeight)) {
      out.x += delta.x
      return out
    }

    // Slide along Z only
    const zd = new THREE.Vector3(0, 0, delta.z)
    if (Math.abs(delta.z) > 1e-4 && !this.checkWall(pos, zd.clone().normalize(), radius, charHeight)) {
      out.z += delta.z
      return out
    }

    // Fully blocked
    return out
  }
}
