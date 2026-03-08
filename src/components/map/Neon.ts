// src/components/map/Neon.ts
import * as THREE from 'three'

export const createNeonGridMaterial = () => new THREE.ShaderMaterial({
  uniforms: {
    color1:  { value: new THREE.Color(0x00ffec) },
    color2:  { value: new THREE.Color(0xff00ff) },
    time:    { value: 0 },
    charPos: { value: new THREE.Vector3() },
  },

  vertexShader: /* glsl */`
    varying vec3 vWorldPos;
    uniform float time;

    void main() {
      vec3 displaced = position;
      float wave = sin(position.x * 0.12 + time * 0.7)  * 0.035
                 + cos(position.z * 0.10 + time * 0.55) * 0.030;
      displaced.y += wave;

      vec4 worldPosition = modelMatrix * vec4(displaced, 1.0);
      vWorldPos = worldPosition.xyz;
      gl_Position = projectionMatrix * viewMatrix * worldPosition;
    }
  `,

  fragmentShader: /* glsl */`
    uniform vec3  color1;
    uniform vec3  color2;
    uniform vec3  charPos;
    uniform float time;
    varying vec3  vWorldPos;

    void main() {
      vec2  coord = vWorldPos.xz * 0.5;

      // Camera-distance fog so grid looks infinite
      vec2  camOffset = vWorldPos.xz - cameraPosition.xz;
      float distSq    = dot(camOffset, camOffset);
      float fogFactor = clamp(exp(-distSq * 0.00085), 0.0, 1.0);

      // Anti-aliased grid lines
      vec2  grid      = abs(fract(coord - 0.5) - 0.5) / fwidth(coord);
      float line      = min(grid.x, grid.y);
      float core      = clamp(1.2  - line,          0.0, 1.0);
      float glow      = clamp(1.0  - line * 0.1666, 0.0, 1.0);
      float gridAlpha = core + glow * 0.4;

      // Slow colour pulse
      float pulse  = 0.92 + sin(time * 0.7) * 0.08;
      float mixVal = sin(vWorldPos.x * 0.1 + time * 0.08)
                   * cos(vWorldPos.z * 0.1 - time * 0.06) * 0.5 + 0.5;
      vec3  gridCol = mix(color1, color2, mixVal) * (2.4 * pulse);

      // Character proximity — grid lights up underfoot
      float d2char    = length(vWorldPos.xz - charPos.xz);
      float nearBoost = smoothstep(14.0, 0.0, d2char) * 1.8;

      vec3 baseCol  = vec3(0.018, 0.018, 0.028);
      vec3 boosted  = gridCol * (1.0 + nearBoost);
      vec3 finalCol = mix(vec3(0.0), mix(baseCol, boosted, gridAlpha), fogFactor);

      gl_FragColor = vec4(finalCol, 1.0);
    }
  `,

  transparent: false,
  depthWrite:  true,
})
