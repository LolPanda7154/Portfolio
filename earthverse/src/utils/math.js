/**
 * Orbital position on an ellipse at time t
 */
export function getOrbitPosition(radius, speed, phase, t, tilt = 0) {
  const angle = t * speed + phase
  return [
    Math.cos(angle) * radius,
    Math.sin(angle) * radius * Math.sin(tilt),
    Math.sin(angle) * radius * Math.cos(tilt),
  ]
}

/**
 * Linear interpolation
 */
export function lerp(a, b, t) {
  return a + (b - a) * t
}

/**
 * Clamp value between min and max
 */
export function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val))
}

/**
 * Distance between two 3D points [x,y,z]
 */
export function distance3D([ax, ay, az], [bx, by, bz]) {
  return Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2 + (az - bz) ** 2)
}

/**
 * Ease in-out cubic
 */
export function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2
}

/**
 * Smoothstep
 */
export function smoothstep(edge0, edge1, x) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1)
  return t * t * (3 - 2 * t)
}

/**
 * Angle between two vectors
 */
export function angleBetween(v1, v2) {
  const dot = v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2]
  const mag1 = Math.sqrt(v1[0] ** 2 + v1[1] ** 2 + v1[2] ** 2)
  const mag2 = Math.sqrt(v2[0] ** 2 + v2[1] ** 2 + v2[2] ** 2)
  return Math.acos(clamp(dot / (mag1 * mag2), -1, 1))
}