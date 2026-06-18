import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'

function AtmosphereGlow() {
  const meshRef = useRef()

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const t = clock.getElapsedTime()
      meshRef.current.material.opacity = 0.35 + Math.sin(t * 0.5) * 0.05
    }
  })

  return (
    <mesh ref={meshRef} scale={1.08}>
      <sphereGeometry args={[1, 64, 64]} />
      <meshBasicMaterial
        color="#1a6bb5"
        transparent
        opacity={0.35}
        side={THREE.BackSide}
        depthWrite={false}
      />
    </mesh>
  )
}

function AtmosphereRim() {
  return (
    <mesh scale={1.15}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshBasicMaterial
        color="#0044aa"
        transparent
        opacity={0.08}
        side={THREE.BackSide}
        depthWrite={false}
      />
    </mesh>
  )
}

// Bumped from 1 -> 1.8 base radius so Earth reads as the clear anchor
// of the scene now that orbit nodes are bigger too. Tune here, not
// in the geometry below, so atmosphere layers stay proportionate.
export default function Earth({ scale = 1.8 }) {
  const earthRef = useRef()
  const cloudsRef = useRef()

  let earthTexture = null
  let cloudsTexture = null

  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    earthTexture = useTexture('/src/assets/textures/earth.jpg')
  } catch {}

  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    cloudsTexture = useTexture('/src/assets/textures/clouds.png')
  } catch {}

  useFrame((_, delta) => {
    if (earthRef.current) {
      earthRef.current.rotation.y += delta * 0.08
    }
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += delta * 0.095
      cloudsRef.current.rotation.x += delta * 0.005
    }
  })

  return (
    <group scale={scale}>
      {/* Earth sphere */}
      <mesh ref={earthRef} castShadow receiveShadow>
        <sphereGeometry args={[1, 64, 64]} />
        {earthTexture ? (
          <meshStandardMaterial
            map={earthTexture}
            roughness={0.8}
            metalness={0.1}
          />
        ) : (
          <meshStandardMaterial
            color="#1a5c8a"
            roughness={0.7}
            metalness={0.15}
            emissive="#021a30"
            emissiveIntensity={0.2}
          />
        )}
      </mesh>

      {/* Cloud layer */}
      <mesh ref={cloudsRef} scale={1.005}>
        <sphereGeometry args={[1, 48, 48]} />
        {cloudsTexture ? (
          <meshStandardMaterial
            map={cloudsTexture}
            transparent
            opacity={0.4}
            depthWrite={false}
          />
        ) : (
          <meshStandardMaterial
            color="#aaccee"
            transparent
            opacity={0.12}
            roughness={1}
            depthWrite={false}
          />
        )}
      </mesh>

      <AtmosphereGlow />
      <AtmosphereRim />
    </group>
  )
}