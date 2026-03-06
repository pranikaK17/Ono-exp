// src/components/map/config.ts

export const MAP_CONFIG = {
  mapModelPath: '/map.glb',
  characterModelPath: '/character.glb',

  // Movement
  walkSpeed: 8,
  sprintSpeed: 18,
  rotationSpeed: 10,
  gravity: -30,

  // Camera
  cameraDistance: 12,
  cameraMinDistance: 3,
  cameraMaxDistance: 50,
  cameraHeight: 3,
  cameraPitchDefault: 0.35,
  minPitch: -0.05,
  maxPitch: 1.15,
  mouseSensitivity: 0.003,
  zoomSpeed: 1.15,

  // Collision — tuned after inspecting GLB
  characterRadius: 0.5,

  fogColor: 0x87ceeb,
  fogDensity: 0.006,
  skyColor: 0x87ceeb,
  shadowMapSize: 2048,
} as const
