import * as THREE from 'three'

export class NightSky {
  private group: THREE.Group
  private stars: THREE.Points
  private clock: THREE.Clock

  constructor(scene: THREE.Scene) {
    this.group = new THREE.Group()
    this.clock = new THREE.Clock()
    scene.add(this.group)

    // ── Sky dome ──────────────────────────────────────────────────────────────
    const domeGeo = new THREE.SphereGeometry(400, 32, 32)
    const domeMat = new THREE.ShaderMaterial({
      uniforms: {
        topColor:    { value: new THREE.Color(0x02020a) },
        bottomColor: { value: new THREE.Color(0x0a0a25) },
        exponent:    { value: 0.5 },
      },
      vertexShader: `
        varying vec3 vPosition;
        void main() {
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform float exponent;
        varying vec3 vPosition;
        void main() {
          float h = normalize(vPosition).y;
          gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(abs(h), exponent), 0.0)), 1.0);
        }
      `,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
    })
    const domeMesh = new THREE.Mesh(domeGeo, domeMat)
    domeMesh.frustumCulled = false
    domeMesh.renderOrder = -1
    this.group.add(domeMesh)

    // ── Stars ─────────────────────────────────────────────────────────────────
    const starsCount = 8000   // more stars for denser sky
    const starGeo = new THREE.BufferGeometry()
    const positions = new Float32Array(starsCount * 3)
    const colors    = new Float32Array(starsCount * 3)
    const sizes     = new Float32Array(starsCount)

    // Brighter, more varied color palette
    const colorPalette = [
      new THREE.Color(1.0,  1.0,  1.0),   // pure white
      new THREE.Color(0.8,  0.9,  1.0),   // cool blue-white
      new THREE.Color(1.0,  0.95, 0.8),   // warm yellow-white
      new THREE.Color(0.9,  0.8,  1.0),   // soft violet
      new THREE.Color(0.7,  1.0,  1.0),   // cyan-white
    ]

    for (let i = 0; i < starsCount; i++) {
      // Distribute only in the upper hemisphere + sides (not below horizon)
      const r     = 350 + Math.random() * 40
      const theta = 2 * Math.PI * Math.random()
      // phi range: 0 (top) to ~2.0 rad (just below horizon) — avoids underground stars
      const phi   = Math.acos(1 - Math.random() * 1.6)

      positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.cos(phi)
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta)

      const c = colorPalette[Math.floor(Math.random() * colorPalette.length)]
      colors[i * 3]     = c.r
      colors[i * 3 + 1] = c.g
      colors[i * 3 + 2] = c.b

      // Bigger size range — some stars are noticeably large
      sizes[i] = Math.random() < 0.05
        ? 4.0 + Math.random() * 3.0   // 5% are bright prominent stars
        : 1.5 + Math.random() * 2.5   // rest are normal
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    starGeo.setAttribute('color',    new THREE.BufferAttribute(colors,    3))
    starGeo.setAttribute('size',     new THREE.BufferAttribute(sizes,     1))

    const starMat = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 } },
      vertexShader: `
        attribute float size;
        attribute vec3  color;
        varying vec3    vColor;
        varying float   vOpacity;
        uniform float   time;

        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mvPosition;

          // Twinkle: oscillate between 0.6 and 1.0 (brighter floor than before)
          float twinkle = sin(time * 1.8 + position.x * 73.1 + position.z * 31.7) * 0.5 + 0.5;
          vOpacity = 0.6 + twinkle * 0.4;

          gl_PointSize = size * (350.0 / -mvPosition.z) * (0.8 + twinkle * 0.4);
        }
      `,
      fragmentShader: `
        varying vec3  vColor;
        varying float vOpacity;

        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;

          // Soft glow: brighter core, fade at edge
          float core = 1.0 - smoothstep(0.0, 0.25, dist);
          float halo = 1.0 - smoothstep(0.1, 0.5, dist);
          float alpha = (core * 0.9 + halo * 0.4) * vOpacity;

          gl_FragColor = vec4(vColor * (1.0 + core * 0.6), alpha);
        }
      `,
      transparent: true,
      depthWrite:  false,
      blending:    THREE.AdditiveBlending,
      fog:         false,
    })

    this.stars = new THREE.Points(starGeo, starMat)
    this.stars.frustumCulled = false
    this.stars.renderOrder = 0
    this.group.add(this.stars)
  }

  public update(delta: number, cameraPos?: THREE.Vector3) {
    if (cameraPos) this.group.position.copy(cameraPos)

    this.stars.rotation.y -= delta * 0.005
    this.stars.rotation.x += delta * 0.001

    const time = this.clock.getElapsedTime()
    ;(this.stars.material as THREE.ShaderMaterial).uniforms.time.value = time
  }

  public destroy() {
    this.group.parent?.remove(this.group)
    this.stars.geometry.dispose()
    ;(this.stars.material as THREE.Material).dispose()
    this.group.children.forEach(c => {
      const m = c as THREE.Mesh
      if (m.geometry) { m.geometry.dispose(); (m.material as THREE.Material).dispose() }
    })
  }
}
