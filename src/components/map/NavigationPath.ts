// src/components/map/NavigationPath.ts
import * as THREE from 'three'

/**
 * Creates a thick white rounded-rectangle navigation path on the floor from path_coords.json.
 */
export async function createNavigationPath(
  scene: THREE.Scene
): Promise<{ update(t: number): void; dispose(): void }> {
  // 1. Fetch coordinates
  const resp = await fetch('/path_coords.json')
  const coords = await resp.json() as { x: number; y: number; z: number }[]

  if (!coords || coords.length < 2) {
    return { update: () => {}, dispose: () => {} }
  }

  // 2. Identify bounds
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity
  for (const c of coords) {
    if (c.x < minX) minX = c.x; if (c.x > maxX) maxX = c.x
    if (c.z < minZ) minZ = c.z; if (c.z > maxZ) maxZ = c.z
  }

  const radius = 3.5 // Smooth corners
  const shape = new THREE.Shape()
  shape.moveTo(minX + radius, minZ)
  shape.lineTo(maxX - radius, minZ)
  shape.absarc(maxX - radius, minZ + radius, radius, -Math.PI / 2, 0, false)
  shape.lineTo(maxX, maxZ - radius)
  shape.absarc(maxX - radius, maxZ - radius, radius, 0, Math.PI / 2, false)
  shape.lineTo(minX + radius, maxZ)
  shape.absarc(minX + radius, maxZ - radius, radius, Math.PI / 2, Math.PI, false)
  shape.lineTo(minX, minZ + radius)
  shape.absarc(minX + radius, minZ + radius, radius, Math.PI, Math.PI * 1.5, false)
  shape.closePath()

  const points2d = shape.getPoints(200)
  const curve = new THREE.CatmullRomCurve3(points2d.map(p => new THREE.Vector3(p.x, 0.15, p.y)), true)

  // 3. Material & Geometry
  const thickness = 0.35 // Significantly wider lines
  const geometry = new THREE.TubeGeometry(curve, 256, thickness, 8, true)
  
  const material = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.9,
    polygonOffset: true,
    polygonOffsetFactor: -20,
    depthTest: true,
  })

  const mesh = new THREE.Mesh(geometry, material)
  mesh.renderOrder = 10
  scene.add(mesh)

  return {
    update(t: number) {
      // Slow brightness pulse
      const pulse = 0.5 + 0.5 * Math.sin(t * 1.0)
      material.opacity = 0.3 + pulse * 0.7
    },
    dispose() {
      scene.remove(mesh)
      geometry.dispose()
      material.dispose()
    }
  }
}

