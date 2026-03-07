// src/components/map/config.ts
export const MAP_CONFIG = {
  mapModelPath:      '/map.glb',
  characterModelPath: '/character.glb',

  // Movement — tuned for map ~90×109 units
  walkSpeed:      14,    // was 8  — feels natural on larger map
  sprintSpeed:    28,    // was 18 — 2× walk, noticeably faster
  rotationSpeed:  10,
  gravity:       -30,

  // Camera
  cameraDistance:    14,
  cameraMinDistance:  3,
  cameraMaxDistance: 60,
  cameraHeight:       2,
  cameraPitchDefault: 0.35,
  minPitch:          -0.05,
  maxPitch:           1.15,
  mouseSensitivity:   0.003,
  zoomSpeed:          1.15,

  // Collision
  characterRadius: 0.4,

  fogColor:      0x87ceeb,
  fogDensity:    0.004,   // slightly less fog on larger map
  skyColor:      0x87ceeb,
  shadowMapSize: 2048,
} as const
