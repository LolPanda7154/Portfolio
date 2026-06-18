import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'

function SatelliteTrail({ radius, tilt }) {
  // Faint trail arc behind satellite
  return (
    <mesh rotation={[tilt, 0, 0]}>
      <torusGeometry args={[radius, 0.008, 4, 120, Math.PI * 0.4]} />
      <meshBasicMaterial color="#00d4ff" transparent opacity={0.15} depthWrite={false} />
    </mesh>
  )
}

export default function Satellite() {
  const groupRef = useRef()
  const glowRef = useRef()
  const RADIUS = 2.1
  const SPEED = 0.7
  const TILT = 0.5

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    const angle = t * SPEED

    if (groupRef.current) {
      groupRef.current.position.set(
        Math.cos(angle) * RADIUS,
        Math.sin(angle) * RADIUS * Math.sin(TILT),
        Math.sin(angle) * RADIUS * Math.cos(TILT)
      )
    }

    if (glowRef.current) {
      const pulse = 0.6 + Math.sin(t * 3) * 0.2
      glowRef.current.material.opacity = pulse * 0.5
      glowRef.current.scale.setScalar(1.5 + Math.sin(t * 3) * 0.3)
    }
  })

  return (
    <>
      {/* Satellite body */}
      <group ref={groupRef}>
        {/* Core sphere */}
        <mesh>
          <sphereGeometry args={[0.045, 16, 16]} />
          <meshStandardMaterial
            color="#00d4ff"
            emissive="#00d4ff"
            emissiveIntensity={3}
            roughness={0}
            metalness={0.8}
          />
        </mesh>

        {/* Outer glow halo */}
        <mesh ref={glowRef}>
          <sphereGeometry args={[0.045, 8, 8]} />
          <meshBasicMaterial
            color="#00d4ff"
            transparent
            opacity={0.3}
            depthWrite={false}
          />
        </mesh>

        {/* Point light for local scene illumination */}
        <pointLight color="#00d4ff" intensity={1.5} distance={3} />
      </group>
    </>
  )
}