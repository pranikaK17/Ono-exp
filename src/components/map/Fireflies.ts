// src/components/map/Fireflies.ts
import * as THREE from 'three'

/**
 * Creates a system of colorful, floating neon fireflies throughout the map.
 * Uses THREE.Points for high performance (GPU instancing).
 */
export function createFireflies(
  scene: THREE.Scene
): { update(t: number): void; dispose(): void } {
  const COUNT = 120
  const SPREAD = 250
  const HEIGHT_MIN = 3
  const HEIGHT_MAX = 25

  const positions = new Float32Array(COUNT * 3)
  const colors = new Float32Array(COUNT * 3)
  const phases = new Float32Array(COUNT)
  const speeds = new Float32Array(COUNT)

  const NEON_PALETTE = [
    new THREE.Color(0x00ffff), // Cyan
    new THREE.Color(0xff00ff), // Pink
    new THREE.Color(0xaa44ff), // Purple
    new THREE.Color(0xffe48a), // Light Gold
    new THREE.Color(0xffffff), // White
    new THREE.Color(0xffffff), // White (More white)
  ]

  for (let i = 0; i < COUNT; i++) {
    // Random position within bounds
    positions[i * 3] = (Math.random() - 0.5) * SPREAD * 1.5
    positions[i * 3 + 1] = HEIGHT_MIN + Math.random() * (HEIGHT_MAX - HEIGHT_MIN)
    positions[i * 3 + 2] = (Math.random() - 0.5) * SPREAD * 1.5

    // Random neon color
    const color = NEON_PALETTE[Math.floor(Math.random() * NEON_PALETTE.length)]
    colors[i * 3] = color.r
    colors[i * 3 + 1] = color.g
    colors[i * 3 + 2] = color.b

    // Animation properties
    phases[i] = Math.random() * Math.PI * 2
    speeds[i] = 0.5 + Math.random() * 1.0
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geometry.setAttribute('phase', new THREE.BufferAttribute(phases, 1))
  geometry.setAttribute('speed', new THREE.BufferAttribute(speeds, 1))

  const material = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 }
    },
    vertexShader: `
      uniform float time;
      attribute vec3 color;
      attribute float phase;
      attribute float speed;
      varying vec3 vColor;
      varying float vOpacity;
      void main() {
        vColor = color;
        vec3 pos = position;
        
        // Gentle floating motion
        pos.y += sin(time * speed * 0.7 + phase) * 2.0;
        pos.x += cos(time * speed * 0.4 + phase) * 1.5;
        pos.z += sin(time * speed * 0.3 + phase) * 1.5;
        
        // Flickering opacity
        vOpacity = 0.4 + 0.6 * (0.5 + 0.5 * sin(time * speed * 2.5 + phase));
        
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_PointSize = (6.0 + 5.0 * vOpacity) * (300.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      varying float vOpacity;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        float strength = 1.0 - smoothstep(0.0, 0.5, d);
        gl_FragColor = vec4(vColor, strength * vOpacity * 0.8);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  })

  const points = new THREE.Points(geometry, material)
  points.frustumCulled = false
  scene.add(points)

  return {
    update(t: number) {
      material.uniforms.time.value = t
    },
    dispose() {
      scene.remove(points)
      geometry.dispose()
      material.dispose()
    }
  }
}
