export const MAP_CONFIG = {
  mapModelPath: '/map.glb',
  characterModelPath: '/character.glb',

  walkSpeed: 26,
  sprintSpeed: 46,
  jumpSpeed: 14,
  gravity: -30,

  cameraDistance: 18,
  cameraMinDistance: 3,
  cameraMaxDistance: 55,
  cameraPitchDefault: 0.28,
  minPitch: -0.05,
  maxPitch: 1.15,
  mouseSensitivity: 0.003,
  zoomSpeed: 1.15,

  characterRadius: 0.4,
  fogColor: 0x02020b,
  fogDensity: 0.004,
  skyColor: 0x02020b,
  shadowMapSize: 2048,
} as const
