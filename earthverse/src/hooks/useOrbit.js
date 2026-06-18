import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { getOrbitPosition } from '../utils/math'

/**
 * Animates an object along an orbit path.
 * Returns a ref to attach to the mesh.
 */
export function useOrbit({ radius, speed, phase = 0, tilt = 0.3, paused = false }) {
  const ref = useRef()

  useFrame(({ clock }) => {
    if (!ref.current || paused) return
    const t = clock.getElapsedTime()
    const [x, y, z] = getOrbitPosition(radius, speed, phase, t, tilt)
    ref.current.position.set(x, y, z)
  })

  return ref
}

/**
 * Continuous self-rotation hook
 */
export function useSpin({ speedX = 0, speedY = 0.1, speedZ = 0 }) {
  const ref = useRef()

  useFrame((_, delta) => {
    if (!ref.current) return
    ref.current.rotation.x += speedX * delta
    ref.current.rotation.y += speedY * delta
    ref.current.rotation.z += speedZ * delta
  })

  return ref
}