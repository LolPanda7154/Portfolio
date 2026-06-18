import React, { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Custom shader so each star twinkles independently using a per-star
// random phase/speed, instead of animating one global opacity value
// (which would just make every star pulse in sync).
const twinkleVertexShader = `
  attribute float size;
  attribute vec3 starColor;
  attribute float phase;
  attribute float speed;
  varying vec3 vColor;
  varying float vTwinkle;
  uniform float uTime;

  void main() {
    vColor = starColor;
    vTwinkle = 0.55 + 0.45 * sin(uTime * speed + phase);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * vTwinkle * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`

const twinkleFragmentShader = `
  varying vec3 vColor;
  varying float vTwinkle;

  void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    float alpha = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(vColor, alpha * vTwinkle * 0.9);
  }
`

function StarField({ count = 3000, radius = 120 }) {
  const materialRef = useRef()

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = radius * (0.5 + Math.random() * 0.5)
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      arr[i * 3 + 2] = r * Math.cos(phi)
    }
    return arr
  }, [count, radius])

  const sizes = useMemo(() => {
    const arr = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      arr[i] = Math.random() * 1.8 + 0.2
    }
    return arr
  }, [count])

  const colors = useMemo(() => {
    const arr = new Float32Array(count * 3)
    const palette = [
      [1, 1, 1],
      [0.8, 0.9, 1],
      [1, 0.95, 0.8],
      [0.7, 0.85, 1],
      [0.9, 0.8, 1],
    ]
    for (let i = 0; i < count; i++) {
      const c = palette[Math.floor(Math.random() * palette.length)]
      arr[i * 3] = c[0]
      arr[i * 3 + 1] = c[1]
      arr[i * 3 + 2] = c[2]
    }
    return arr
  }, [count])

  // Per-star random twinkle phase + speed so stars don't pulse in unison
  const phases = useMemo(() => {
    const arr = new Float32Array(count)
    for (let i = 0; i < count; i++) arr[i] = Math.random() * Math.PI * 2
    return arr
  }, [count])

  const speeds = useMemo(() => {
    const arr = new Float32Array(count)
    for (let i = 0; i < count; i++) arr[i] = 0.5 + Math.random() * 1.8
    return arr
  }, [count])

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.getElapsedTime()
    }
  })

  return (
    <points renderOrder={-10}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-starColor" args={[colors, 3]} />
        <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
        <bufferAttribute attach="attributes-phase" args={[phases, 1]} />
        <bufferAttribute attach="attributes-speed" args={[speeds, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={twinkleVertexShader}
        fragmentShader={twinkleFragmentShader}
        uniforms={{ uTime: { value: 0 } }}
        transparent
        depthWrite={false}
        depthTest={false}
      />
    </points>
  )
}

function NebulaClouds() {
  const meshRef = useRef()

  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = clock.getElapsedTime() * 0.005
    }
  })

  const nebulaData = useMemo(() => [
    { pos: [40, 20, -60], color: '#0a1a4a', scale: 25, opacity: 0.12 },
    { pos: [-50, -15, -40], color: '#1a0a3a', scale: 20, opacity: 0.10 },
    { pos: [20, -30, -70], color: '#0a2a1a', scale: 30, opacity: 0.08 },
  ], [])

  return (
    <group ref={meshRef}>
      {nebulaData.map((n, i) => (
        <mesh key={i} position={n.pos} scale={n.scale}>
          <sphereGeometry args={[1, 8, 8]} />
          <meshBasicMaterial
            color={n.color}
            transparent
            opacity={n.opacity}
            side={THREE.BackSide}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  )
}

function OrbitRings() {
  const rings = [
    { radius: 4.2, color: '#00d4ff', opacity: 0.06 },
    { radius: 5.5, color: '#004466', opacity: 0.04 },
  ]

  return (
    <>
      {rings.map((ring, i) => (
        <mesh key={i} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[ring.radius - 0.015, ring.radius + 0.015, 128]} />
          <meshBasicMaterial
            color={ring.color}
            transparent
            opacity={ring.opacity}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ))}
    </>
  )
}

export default function SpaceBackground() {
  return (
    <>
      <StarField count={3500} radius={120} />
      <StarField count={500} radius={60} />
      <NebulaClouds />
      <OrbitRings />
      {/* Void sphere - deep space backdrop */}
      <mesh renderOrder={-20}>
        <sphereGeometry args={[150, 16, 16]} />
        <meshBasicMaterial color="#010308" side={THREE.BackSide} />
      </mesh>
    </>
  )
}