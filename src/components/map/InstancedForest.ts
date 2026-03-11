// src/components/map/InstancedForest.ts
// GPU-instanced tree rendering — 4 tree types, 36 coordinates, 4 draw calls total.

import * as THREE from 'three'
import type { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

const TREE_NODE_NAMES = ['tree1', 'tree2', 'tree3', 'tree4']

interface TreeInstance {
  position: [number, number, number]
  type: number       // 0–3
  rotation: number   // Y-axis radians
  scale: number      // uniform scale
}

// Load trees.glb + tree_coords.json, create 4 InstancedMesh groups,
// and add them to the scene.
//
// Returns a dispose() function for cleanup.

export async function createInstancedForest(
  scene: THREE.Scene,
  loader: GLTFLoader,
): Promise<{ dispose(): void }> {
  // Load tree model and coordinates in parallel
  const [treeGLTF, coordsResp] = await Promise.all([
    new Promise<{ scene: THREE.Group }>((res, rej) =>
      loader.load('/trees.glb', g => res(g), undefined, rej)
    ),
    fetch('/tree_coords.json').then(r => r.json() as Promise<{ x: number; y: number; z: number }[]>),
  ])

  // Extract the 4 tree meshes from the loaded GLTF
  const treeMeshes: THREE.Mesh[] = []
  for (const name of TREE_NODE_NAMES) {
    const node = treeGLTF.scene.getObjectByName(name)
    if (node) {
      node.traverse(c => {
        if ((c as THREE.Mesh).isMesh) treeMeshes.push(c as THREE.Mesh)
      })
    }
  }

  // If we couldn't find named nodes, fallback: collect all meshes
  if (treeMeshes.length === 0) {
    treeGLTF.scene.traverse(c => {
      if ((c as THREE.Mesh).isMesh) treeMeshes.push(c as THREE.Mesh)
    })
  }

  const numTypes = treeMeshes.length || 1

  // Prepare instance data: assign each coordinate a type, random rotation, random scale
  const instances: TreeInstance[] = coordsResp.map((pos, i) => ({
    position: [pos.x, pos.y, pos.z] as [number, number, number],
    type: i % numTypes,
    rotation: pseudoRandom(i * 137) * Math.PI * 2,
    scale: 0.8 + pseudoRandom(i * 251) * 0.4,
  }))

  // Group instances by tree type
  const groups: Map<number, TreeInstance[]> = new Map()
  for (const inst of instances) {
    if (!groups.has(inst.type)) groups.set(inst.type, [])
    groups.get(inst.type)!.push(inst)
  }

  // Create an InstancedMesh for each tree type
  const instancedMeshes: THREE.InstancedMesh[] = []
  const dummy = new THREE.Object3D()

  for (const [typeIdx, group] of groups) {
    const sourceMesh = treeMeshes[typeIdx]
    if (!sourceMesh) continue

    const geo = sourceMesh.geometry
    const mat = sourceMesh.material

    const im = new THREE.InstancedMesh(geo, mat, group.length)
    im.castShadow = true
    im.receiveShadow = true

    for (let i = 0; i < group.length; i++) {
      const inst = group[i]
      dummy.position.set(...inst.position)
      dummy.rotation.set(0, inst.rotation, 0)
      dummy.scale.setScalar(inst.scale)
      dummy.updateMatrix()
      im.setMatrixAt(i, dummy.matrix)
    }

    im.instanceMatrix.needsUpdate = true
    scene.add(im)
    instancedMeshes.push(im)
  }

  return {
    dispose() {
      for (const im of instancedMeshes) {
        scene.remove(im)
        im.dispose()
      }
    },
  }
}

// Simple deterministic pseudo-random using a seed (returns 0–1).
function pseudoRandom(seed: number): number {
  let x = Math.sin(seed * 9301 + 49297) * 233280
  return x - Math.floor(x)
}

