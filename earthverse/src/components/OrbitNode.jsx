import React, { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import useNodeSelection from '../hooks/useNodeSelection'
import { setNodeWorldPosition } from '../utils/nodePositionRegistry'

function NodeLabel({ section, visible }) {
  if (!visible) return null
  return (
    <Html center distanceFactor={8}>
      <div style={{
        textAlign: 'center',
        pointerEvents: 'none',
        userSelect: 'none',
        animation: 'float-up 0.3s ease forwards',
      }}>
        <div style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: '9px',
          letterSpacing: '0.25em',
          color: section.color,
          opacity: 0.9,
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
          marginBottom: '4px',
        }}>
          {section.name}
        </div>
        <div style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: '8px',
          color: 'rgba(232, 244, 255, 0.5)',
          whiteSpace: 'nowrap',
        }}>
          {section.subtitle}
        </div>
      </div>
    </Html>
  )
}

// Bigger base size than the old flat 0.12, and scales up gently with
// orbit radius so far-out nodes don't look smaller/harder to hit than
// close ones. minRadius/maxRadius should roughly match the spread of
// orbitRadius values across SECTIONS.
function getNodeScale(orbitRadius, { base = 0.32, growth = 0.025, minRadius = 3, maxRadius = 6 } = {}) {
  const clamped = Math.min(Math.max(orbitRadius, minRadius), maxRadius)
  const t = (clamped - minRadius) / (maxRadius - minRadius || 1)
  return base + t * growth * (maxRadius - minRadius)
}

export default function OrbitNode({ section }) {
  const meshRef = useRef()
  const ringRef = useRef()
  const outerRingRef = useRef()
  const [hovered, setHovered] = useState(false)

  const { selectedSection, selectNode, selectHover, clearHover } = useNodeSelection()
  const isSelected = selectedSection?.id === section.id

  const nodeRadius = getNodeScale(section.orbitRadius)

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    const angle = t * section.orbitSpeed + section.orbitPhase
    const tilt = 0.3

    if (meshRef.current) {
      const x = Math.cos(angle) * section.orbitRadius
      const y = Math.sin(angle) * section.orbitRadius * Math.sin(tilt)
      const z = Math.sin(angle) * section.orbitRadius * Math.cos(tilt)
      meshRef.current.position.set(x, y, z)
      meshRef.current.rotation.y += 0.01
      setNodeWorldPosition(section.id, x, y, z)
    }

    if (ringRef.current) {
      const scale = isSelected
        ? 2.0 + Math.sin(t * 3) * 0.3
        : hovered
        ? 1.7 + Math.sin(t * 4) * 0.2
        : 1.4 + Math.sin(t * 2) * 0.1
      ringRef.current.scale.setScalar(scale)
      ringRef.current.rotation.z = t * 0.5
      ringRef.current.material.opacity = isSelected ? 0.7 : hovered ? 0.5 : 0.25
    }

    if (outerRingRef.current) {
      outerRingRef.current.scale.setScalar(2.2 + Math.sin(t * 1.5 + 1) * 0.15)
      outerRingRef.current.rotation.z = -t * 0.3
      outerRingRef.current.material.opacity = isSelected ? 0.3 : 0.08
    }
  })

  return (
    <group ref={meshRef}>
      {/* Invisible larger hit-sphere makes hovering/clicking easier
          without inflating the visible planet mesh itself */}
      <mesh
        visible={false}
        onPointerEnter={(e) => {
          e.stopPropagation()
          setHovered(true)
          selectHover(section.id)
        }}
        onPointerLeave={(e) => {
          e.stopPropagation()
          setHovered(false)
          clearHover()
        }}
        onClick={(e) => {
          e.stopPropagation()
          selectNode(section.id)
        }}
      >
        <sphereGeometry args={[nodeRadius * 1.8, 12, 12]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Core node sphere (visible planet) */}
      <mesh>
        <icosahedronGeometry args={[nodeRadius, 2]} />
        <meshStandardMaterial
          color={section.color}
          emissive={section.color}
          emissiveIntensity={isSelected ? 2.5 : hovered ? 1.8 : 1.2}
          roughness={0.1}
          metalness={0.9}
        />
      </mesh>

      {/* Inner ring */}
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[nodeRadius * 1.15, nodeRadius * 1.3, 32]} />
        <meshBasicMaterial
          color={section.color}
          transparent
          opacity={0.25}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Outer ring */}
      <mesh ref={outerRingRef} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[nodeRadius * 1.65, nodeRadius * 1.85, 32]} />
        <meshBasicMaterial
          color={section.color}
          transparent
          opacity={0.08}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Point light */}
      <pointLight
        color={section.color}
        intensity={isSelected ? 2 : hovered ? 1.2 : 0.5}
        distance={2 + nodeRadius * 4}
      />

      {/* Label */}
      <NodeLabel section={section} visible={hovered || isSelected} />
    </group>
  )
}