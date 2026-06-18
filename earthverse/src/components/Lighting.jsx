import React from 'react'

export default function Lighting() {
  return (
    <>
      {/* Deep space ambient - very dim */}
      <ambientLight intensity={0.15} color="#0a1628" />

      {/* Sun light - primary directional from upper right */}
      <directionalLight
        position={[8, 4, 3]}
        intensity={2.2}
        color="#fff8f0"
        castShadow
      />

      {/* Rim light from behind Earth - creates atmosphere glow edge */}
      <directionalLight
        position={[-6, -2, -4]}
        intensity={0.4}
        color="#1a4a8a"
      />

      {/* Subtle fill light from below */}
      <pointLight
        position={[0, -6, 2]}
        intensity={0.3}
        color="#001133"
        distance={20}
      />

      {/* Cyan accent for node area */}
      <pointLight
        position={[0, 0, 6]}
        intensity={0.2}
        color="#00d4ff"
        distance={15}
      />
    </>
  )
}