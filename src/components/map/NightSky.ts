import * as THREE from 'three'

export class NightSky {
    private group: THREE.Group
    private stars: THREE.Points
    private clock: THREE.Clock

    constructor(scene: THREE.Scene) {
        this.group = new THREE.Group()
        this.clock = new THREE.Clock()
        scene.add(this.group)

        // 1. Sky Dome Shader (Deep night gradient)
        const domeGeo = new THREE.SphereGeometry(400, 32, 32)
        const domeMat = new THREE.ShaderMaterial({
            uniforms: {
                topColor: { value: new THREE.Color(0x02020a) }, // Deep space black/purple
                bottomColor: { value: new THREE.Color(0x1a1a3a) }, // Dark blue/purple horizon
                offset: { value: 0 },
                exponent: { value: 0.6 }
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
            fog: false
        })
        const domeMesh = new THREE.Mesh(domeGeo, domeMat)
        // Make sure dome renders behind everything
        domeMesh.frustumCulled = false
        domeMesh.renderOrder = -1
        this.group.add(domeMesh)

        // 2. Stars
        const starsCount = 5000
        const starGeo = new THREE.BufferGeometry()
        const positions = new Float32Array(starsCount * 3)
        const colors = new Float32Array(starsCount * 3)
        const sizes = new Float32Array(starsCount)

        const color1 = new THREE.Color(0xffffff) // White
        const color2 = new THREE.Color(0xcceeff) // Light blue
        const color3 = new THREE.Color(0xfff0cc) // Warm white/yellow

        for (let i = 0; i < starsCount; i++) {
            // distribute stars uniformly on a sphere
            const r = 350 + Math.random() * 40
            const theta = 2 * Math.PI * Math.random()
            const phi = Math.acos(2 * Math.random() - 1) // 0 to PI

            // Correct Y-up calculation
            const x = r * Math.sin(phi) * Math.cos(theta)
            const y = r * Math.cos(phi)
            const z = r * Math.sin(phi) * Math.sin(theta)

            positions[i * 3] = x
            positions[i * 3 + 1] = y
            positions[i * 3 + 2] = z

            // varied star colors
            const randColor = Math.random()
            let c = color1
            if (randColor > 0.8) c = color2
            else if (randColor > 0.6) c = color3

            colors[i * 3] = c.r
            colors[i * 3 + 1] = c.g
            colors[i * 3 + 2] = c.b

            // varied sizes
            sizes[i] = Math.random() * 2.5 + 1.0 // Slightly bumped minimum size so they don't vanish
        }

        starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
        starGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
        starGeo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

        // A shader material to allow varied sizes, colors, and a slight twinkle effect
        const starMat = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 }
            },
            vertexShader: `
        attribute float size;
        attribute vec3 color;
        varying vec3 vColor;
        varying float vOpacity;
        uniform float time;
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          
          // Twinkle effect based on position and time
          float twinkle = sin(time * 1.5 + position.x * 100.0) * 0.5 + 0.5;
          vOpacity = 0.4 + twinkle * 0.6; // opacity oscillates between 0.4 and 1.0
          
          gl_PointSize = size * (300.0 / -mvPosition.z) * vOpacity;
        }
      `,
            fragmentShader: `
        varying vec3 vColor;
        varying float vOpacity;
        void main() {
          // Circular particles
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          
          // Soft edge for glow
          float alpha = (0.5 - dist) * 2.0 * vOpacity;
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            fog: false
        })

        this.stars = new THREE.Points(starGeo, starMat)
        this.stars.frustumCulled = false
        this.stars.renderOrder = 0 // render after dome
        this.group.add(this.stars)
    }

    public update(delta: number, cameraPos?: THREE.Vector3) {
        if (cameraPos) {
            // Snap the sky to the camera so the player can never walk "out" of the sky dome
            this.group.position.copy(cameraPos)
        }

        // Rotate stars slowly to simulate Earth's rotation
        this.stars.rotation.y -= delta * 0.005
        this.stars.rotation.x += delta * 0.001

        // Update twinkle time
        const time = this.clock.getElapsedTime()
            ; (this.stars.material as THREE.ShaderMaterial).uniforms.time.value = time
    }

    public destroy() {
        this.group.parent?.remove(this.group)
        // Clean up
        this.stars.geometry.dispose()
            ; (this.stars.material as THREE.Material).dispose()
        this.group.children.forEach(c => {
            if ((c as THREE.Mesh).geometry) {
                ; (c as THREE.Mesh).geometry.dispose()
                    ; ((c as THREE.Mesh).material as THREE.Material).dispose()
            }
        })
    }
}
