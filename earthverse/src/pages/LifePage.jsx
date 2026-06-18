import React, { useRef, useState, useEffect, useCallback, useMemo, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Html, Sky } from '@react-three/drei'
import * as THREE from 'three'
import { SECTIONS } from '../constants/sectionData'

const section = SECTIONS.find((s) => s.id === 'life')
const ACCENT = section?.color ?? '#ff6b6b'

const LIFE_MOMENTS = [
  {
    id: 0,
    title: 'Around the World',
    subtitle: 'Travel',
    period: '2022 — Present',
    tags: ['Backpacking', 'Photography', 'Culture'],
    description: 'Visited 14 countries across 3 continents. Found that getting lost is the best way to find yourself — and the best local food.',
  },
  {
    id: 1,
    title: 'Creating Things',
    subtitle: 'Hobbies',
    period: 'Always',
    tags: ['Music', 'Drawing', 'Building'],
    description: 'When not coding, I make music, sketch ideas that never become anything, and build tiny physical prototypes of things I imagine.',
  },
  {
    id: 2,
    title: 'The People',
    subtitle: 'Community',
    period: 'Lifelong',
    tags: ['Mentoring', 'Open Source', 'Friends'],
    description: 'Tech communities, open source friends, mentors who gave me time I did not deserve yet. The relationships are the real resume.',
  },
]

const CHECKPOINT_POSITIONS = [
  new THREE.Vector3(-10, 0.5, -8),
  new THREE.Vector3(12, 0.5, -4),
  new THREE.Vector3(2, 0.5, 13),
]

// Each checkpoint needs 3 wisps collected nearby before it unlocks
const WISPS_PER_CHECKPOINT = 3

const BALL_RADIUS = 0.38
const SPEED = 6.5
const GRAVITY = 18
const JUMP_VEL = 7
const FRICTION = 0.82
const ALIEN_DAMAGE = 15
const INVINCIBILITY_DURATION = 1.5

// Smooth sandy desert terrain — wider, gentler waves
function getTerrainHeight(x, z) {
  return (
    Math.sin(x * 0.1) * 1.6 +
    Math.sin(z * 0.12) * 1.3 +
    Math.cos((x - z) * 0.08) * 0.8 +
    Math.sin(x * 0.22 + z * 0.18) * 0.4 +
    Math.sin(x * 0.6 + z * 0.5) * 0.1  // micro texture
  )
}

// Vertex-colored sandy terrain
function DesertTerrain() {
  const geo = useMemo(() => {
    const SIZE = 90, SEGS = 100
    const g = new THREE.PlaneGeometry(SIZE, SIZE, SEGS, SEGS)
    g.rotateX(-Math.PI / 2)
    const pos = g.attributes.position
    const colors = []
    const sand = new THREE.Color('#c87941')
    const dune = new THREE.Color('#e89b5a')
    const hollow = new THREE.Color('#a05e2a')
    const crest = new THREE.Color('#f0b070')

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i)
      const h = getTerrainHeight(x, z)
      pos.setY(i, h)
      const t = (h + 3.0) / 6.5
      const ripple = Math.abs(Math.sin(x * 0.4 + z * 0.3)) * 0.4
      let col
      if (t < 0.2) col = hollow.clone()
      else if (t > 0.75) col = crest.clone().lerp(dune, ripple)
      else col = sand.clone().lerp(dune, ripple * 0.6)
      colors.push(col.r, col.g, col.b)
    }
    g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    g.computeVertexNormals()
    return g
  }, [])
  return (
    <mesh geometry={geo} receiveShadow>
      <meshStandardMaterial vertexColors roughness={0.92} metalness={0.0} emissive="#5a2a08" emissiveIntensity={0.04} />
    </mesh>
  )
}

// Oasis pool (warm amber water)
function OasisPool({ position, radius = 3 }) {
  const ref = useRef()
  useFrame(({ clock }) => {
    if (ref.current) ref.current.material.opacity = 0.78 + Math.sin(clock.getElapsedTime() * 0.6 + position[0]) * 0.05
  })
  return (
    <mesh ref={ref} position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[radius, 48]} />
      <meshStandardMaterial color="#cc8822" emissive="#ffaa44" emissiveIntensity={0.25} transparent opacity={0.8} roughness={0.05} metalness={0.2} depthWrite={false} />
    </mesh>
  )
}

// Round cactus
function Cactus({ position, scale = 1 }) {
  return (
    <group position={position}>
      {/* Main trunk */}
      <mesh castShadow position={[0, scale * 0.8, 0]}>
        <cylinderGeometry args={[scale * 0.22, scale * 0.28, scale * 1.6, 10]} />
        <meshStandardMaterial color="#5a8a3a" roughness={0.85} />
      </mesh>
      {/* Bulbous top */}
      <mesh castShadow position={[0, scale * 1.75, 0]}>
        <sphereGeometry args={[scale * 0.38, 10, 10]} />
        <meshStandardMaterial color="#4a7a2a" roughness={0.82} />
      </mesh>
      {/* Arms */}
      {[-1, 1].map(side => (
        <group key={side} position={[side * scale * 0.35, scale * 1.1, 0]} rotation={[0, 0, side * 0.7]}>
          <mesh castShadow>
            <cylinderGeometry args={[scale * 0.12, scale * 0.15, scale * 0.7, 7]} />
            <meshStandardMaterial color="#5a8a3a" roughness={0.85} />
          </mesh>
          <mesh castShadow position={[0, scale * 0.4, 0]}>
            <sphereGeometry args={[scale * 0.2, 8, 8]} />
            <meshStandardMaterial color="#4a7a2a" roughness={0.8} />
          </mesh>
        </group>
      ))}
      {/* Spines */}
      {[0, 1, 2, 3].map(i => {
        const a = (i / 4) * Math.PI * 2
        return (
          <mesh key={i} position={[Math.cos(a) * scale * 0.4, scale * 0.9, Math.sin(a) * scale * 0.4]} rotation={[0, 0, Math.atan2(Math.sin(a), Math.cos(a))]}>
            <coneGeometry args={[scale * 0.02, scale * 0.22, 4]} />
            <meshStandardMaterial color="#ccbb88" roughness={0.6} />
          </mesh>
        )
      })}
    </group>
  )
}

// Fan frond plant
function FrondPlant({ position, color = '#88aa44', scale = 1 }) {
  const ref = useRef()
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.z = Math.sin(clock.getElapsedTime() * 0.4 + position[0]) * 0.07
  })
  return (
    <group ref={ref} position={position}>
      {[0, 1, 2, 3, 4].map(i => {
        const a = ((i / 4) - 0.5) * Math.PI * 0.55
        const len = scale * (1.0 + (i % 2) * 0.3)
        return (
          <mesh key={i} position={[Math.sin(a) * len * 0.3, len * 0.45, 0]} rotation={[0, 0, a - 0.2]} castShadow>
            <planeGeometry args={[scale * 0.2, len]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.06} side={THREE.DoubleSide} roughness={0.85} transparent opacity={0.9} />
          </mesh>
        )
      })}
    </group>
  )
}

// MINI-GAME: Dust devil wisps — animated spinning wisps near checkpoint
// Player rolls through them to collect; 3 collected = checkpoint unlocks
function DustWisp({ position, onCollect, collected }) {
  const ref = useRef()
  const angle = useRef(Math.random() * Math.PI * 2)

  useFrame(({ clock }) => {
    if (!ref.current || collected) return
    const t = clock.getElapsedTime()
    angle.current += 0.02
    ref.current.position.set(
      position[0] + Math.cos(angle.current) * 0.8,
      position[1] + 0.5 + Math.sin(t * 2 + position[0]) * 0.2,
      position[2] + Math.sin(angle.current) * 0.8
    )
    ref.current.rotation.y = t * 3
    ref.current.material.opacity = 0.55 + Math.sin(t * 3) * 0.2
  })

  if (collected) return null
  return (
    <mesh ref={ref} position={[position[0], position[1] + 0.5, position[2]]}>
      <cylinderGeometry args={[0.08, 0.22, 0.55, 7]} />
      <meshStandardMaterial color="#ffdd88" emissive="#ffaa22" emissiveIntensity={0.8} transparent opacity={0.6} roughness={0.2} />
    </mesh>
  )
}

// Checkpoint with wisp-collection mini-game
function SolaraCheckpoint({ position, momentData, isVisited, onCollect }) {
  const beaconRef = useRef()
  const [collectedWisps, setCollectedWisps] = useState(0)
  const [wispCollected, setWispCollected] = useState([false, false, false])
  const BEACON_COLOR = '#fff0cc'

  // Wisp spawn positions around checkpoint
  const wispPositions = useMemo(() => [
    [position.x - 2.5, position.y, position.z + 1],
    [position.x + 2, position.y, position.z - 1.5],
    [position.x + 0.5, position.y, position.z + 2.8],
  ], [position.x, position.y, position.z])

  const handleWispCollect = (i) => {
    if (wispCollected[i] || isVisited) return
    const next = [...wispCollected]
    next[i] = true
    setWispCollected(next)
    const newCount = collectedWisps + 1
    setCollectedWisps(newCount)
    if (newCount >= WISPS_PER_CHECKPOINT) {
      setTimeout(() => onCollect(), 400)
    }
  }

  useFrame(({ clock }) => {
    if (beaconRef.current) {
      beaconRef.current.position.y = position.y + 0.9 + Math.sin(clock.getElapsedTime() * 1.6) * 0.18
      beaconRef.current.rotation.y += 0.02
    }
  })

  const color = isVisited ? '#aaaaaa' : BEACON_COLOR
  const unlocked = collectedWisps >= WISPS_PER_CHECKPOINT

  return (
    <group>
      <mesh position={[position.x, position.y - 0.28, position.z]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.0, 1.35, 32]} />
        <meshBasicMaterial color={color} transparent opacity={isVisited ? 0.07 : 0.28} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh position={[position.x, position.y + 2.8, position.z]}>
        <cylinderGeometry args={[0.035, 0.035, 5.6, 7]} />
        <meshBasicMaterial color={color} transparent opacity={isVisited ? 0.1 : 0.38} />
      </mesh>
      <mesh ref={beaconRef} position={[position.x, position.y + 0.9, position.z]} castShadow>
        <octahedronGeometry args={[0.38, 0]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={isVisited ? 0.3 : unlocked ? 2.5 : 1.2} roughness={0.1} metalness={0.7} transparent opacity={isVisited ? 0.45 : 0.95} />
      </mesh>
      <pointLight position={[position.x, position.y + 1, position.z]} color={color} intensity={isVisited ? 0.4 : unlocked ? 3.5 : 1.8} distance={7} />

      {/* Wisps */}
      {!isVisited && wispPositions.map((wp, i) => (
        <DustWisp key={i} position={wp} collected={wispCollected[i]} onCollect={() => handleWispCollect(i)} />
      ))}

      {!isVisited && (
        <Html position={[position.x, position.y + 2.9, position.z]} center distanceFactor={13}>
          <div style={{ fontFamily: "'Space Mono',monospace", textAlign: 'center', pointerEvents: 'none' }}>
            <div style={{ fontSize: '8px', letterSpacing: '0.18em', color: BEACON_COLOR, whiteSpace: 'nowrap', textShadow: `0 0 8px ${BEACON_COLOR}` }}>
              {momentData.title.toUpperCase()}
            </div>
            {!unlocked && (
              <div style={{ fontSize: '7px', color: 'rgba(255,220,140,0.6)', letterSpacing: '0.1em', marginTop: '2px' }}>
                COLLECT WISPS {collectedWisps}/{WISPS_PER_CHECKPOINT}
              </div>
            )}
            {unlocked && (
              <div style={{ fontSize: '7px', color: '#ffdd88', letterSpacing: '0.2em', marginTop: '2px', textShadow: '0 0 6px #ffaa22' }}>
                ✦ ROLL CLOSE TO UNLOCK
              </div>
            )}
          </div>
        </Html>
      )}
    </group>
  )
}

// WispCollisionHandler — wraps checkpoint wisp check into the player
function PlayerBall({ keysRef, onCheckpoint, visitedRef, onDamage, alienPositionsRef, checkpointDataRef }) {
  const meshRef = useRef()
  const vel = useRef(new THREE.Vector3())
  const pos = useRef(new THREE.Vector3(0, 3, 5))
  const onGround = useRef(false)
  const camYaw = useRef(0)
  const invincibleUntil = useRef(0)
  const { camera } = useThree()

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05)
    const keys = keysRef.current
    const now = state.clock.getElapsedTime()

    if (keys['q'] || keys['arrowleft']) camYaw.current += dt * 1.5
    if (keys['e'] || keys['arrowright']) camYaw.current -= dt * 1.5

    const fwd = new THREE.Vector3(-Math.sin(camYaw.current), 0, -Math.cos(camYaw.current))
    const move = new THREE.Vector3()
    if (keys['w'] || keys['arrowup']) move.addScaledVector(fwd, 1)
    if (keys['s'] || keys['arrowdown']) move.addScaledVector(fwd, -1)
    if (move.lengthSq() > 0) move.normalize()

    const accel = onGround.current ? 4.5 : 1.6
    vel.current.x += move.x * SPEED * dt * accel
    vel.current.z += move.z * SPEED * dt * accel

    if ((keys[' '] || keys['space']) && onGround.current) {
      vel.current.y = JUMP_VEL
      onGround.current = false
    }

    vel.current.y -= GRAVITY * dt
    if (onGround.current) {
      vel.current.x *= Math.pow(FRICTION, dt * 60)
      vel.current.z *= Math.pow(FRICTION, dt * 60)
    }
    const hSpd = Math.hypot(vel.current.x, vel.current.z)
    if (hSpd > SPEED) {
      vel.current.x = (vel.current.x / hSpd) * SPEED
      vel.current.z = (vel.current.z / hSpd) * SPEED
    }

    pos.current.addScaledVector(vel.current, dt)
    const gY = getTerrainHeight(pos.current.x, pos.current.z) + BALL_RADIUS
    if (pos.current.y <= gY) {
      pos.current.y = gY
      if (vel.current.y < 0) vel.current.y = 0
      onGround.current = true
    } else {
      onGround.current = false
    }

    const B = 40
    if (Math.abs(pos.current.x) > B) { pos.current.x = Math.sign(pos.current.x) * B; vel.current.x *= -0.4 }
    if (Math.abs(pos.current.z) > B) { pos.current.z = Math.sign(pos.current.z) * B; vel.current.z *= -0.4 }

    const rollAxis = new THREE.Vector3(-vel.current.z, 0, vel.current.x).normalize()
    const rollDist = Math.hypot(vel.current.x, vel.current.z) * dt / BALL_RADIUS
    if (rollDist > 0.001 && meshRef.current) meshRef.current.rotateOnWorldAxis(rollAxis, rollDist)
    if (meshRef.current) meshRef.current.position.copy(pos.current)

    const camTarget = new THREE.Vector3(
      pos.current.x - Math.sin(camYaw.current) * 7,
      pos.current.y + 3.8,
      pos.current.z - Math.cos(camYaw.current) * 7,
    )
    camera.position.lerp(camTarget, dt * 6)
    camera.lookAt(pos.current.x, pos.current.y + 0.5, pos.current.z)

    // Alien collision
    if (now > invincibleUntil.current && alienPositionsRef?.current) {
      for (let i = 0; i < alienPositionsRef.current.length; i++) {
        const ap = alienPositionsRef.current[i]
        if (!ap) continue
        if (pos.current.distanceTo(ap) < 0.38 + 0.44 + 0.3) {
          onDamage(ALIEN_DAMAGE)
          invincibleUntil.current = now + INVINCIBILITY_DURATION
          const kbDir = new THREE.Vector3().subVectors(pos.current, ap).normalize()
          vel.current.x += kbDir.x * 4
          vel.current.z += kbDir.z * 4
          vel.current.y = 2.5
          break
        }
      }
    }

    if (meshRef.current) {
      const isInvincible = now < invincibleUntil.current
      meshRef.current.material.emissiveIntensity = isInvincible ? (Math.sin(now * 20) * 0.5 + 0.5) * 1.5 : 0.5
    }

    // Report ball position for wisp collision (via ref callback)
    if (checkpointDataRef?.current) {
      checkpointDataRef.current.ballPos = pos.current.clone()
    }
  })

  return (
    <mesh ref={meshRef} castShadow position={[0, 3, 5]}>
      <icosahedronGeometry args={[BALL_RADIUS, 3]} />
      <meshStandardMaterial color="#ffeecc" emissive="#ff8844" emissiveIntensity={0.5} roughness={0.2} metalness={0.5} />
      <pointLight color="#ffcc88" intensity={1.0} distance={4} />
    </mesh>
  )
}

// Fat round sandy alien blob
function SandBlob({ index, orbitCenter, orbitRadius, orbitSpeed, phase, color, size = 0.42, alienPositionsRef }) {
  const groupRef = useRef()
  const bodyRef = useRef()

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    const ang = t * orbitSpeed + phase
    const wx = orbitCenter[0] + Math.cos(ang) * orbitRadius
    const wz = orbitCenter[2] + Math.sin(ang) * orbitRadius
    const wy = getTerrainHeight(wx, wz) + size * 0.75

    if (groupRef.current) groupRef.current.position.set(wx, wy, wz)
    if (alienPositionsRef?.current) alienPositionsRef.current[index] = new THREE.Vector3(wx, wy, wz)
    if (bodyRef.current) {
      const wobble = Math.sin(t * 1.8 + phase)
      bodyRef.current.scale.set(1 + wobble * 0.07, 1 - wobble * 0.06, 1 + wobble * 0.07)
    }
  })

  return (
    <group ref={groupRef}>
      <mesh ref={bodyRef} castShadow>
        <sphereGeometry args={[size, 12, 10]} />
        <meshStandardMaterial color={color} roughness={0.75} emissive={color} emissiveIntensity={0.08} />
      </mesh>
      {/* Little round eyes */}
      {[-1, 1].map(side => (
        <group key={side}>
          <mesh position={[side * size * 0.32, size * 0.3, size * 0.78]}>
            <sphereGeometry args={[size * 0.18, 7, 7]} />
            <meshStandardMaterial color="#fff5dd" roughness={0.3} />
          </mesh>
          <mesh position={[side * size * 0.32, size * 0.3, size * 0.92]}>
            <sphereGeometry args={[size * 0.09, 6, 6]} />
            <meshStandardMaterial color="#2a1a00" roughness={0.1} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

// Wisp proximity check happens inside scene so player ball pos is accessible
function WispProximityChecker({ ballPosRef, wispWorldPositions, onWispHit }) {
  useFrame(() => {
    if (!ballPosRef?.current) return
    const bp = ballPosRef.current
    wispWorldPositions.forEach((wp, i) => {
      if (!wp) return
      const dx = bp.x - wp.x, dz = bp.z - wp.z
      if (Math.sqrt(dx * dx + dz * dz) < 1.1) onWispHit(i)
    })
  })
  return null
}

function SolaraScene({ keysRef, onCheckpoint, visitedRef, visited, onDamage, alienPositionsRef }) {
  const CACTI = useMemo(() => [
    [-6, -10, 1.2], [5, -12, 0.9], [14, 6, 1.4], [-14, 4, 1.0],
    [1, 18, 1.1], [-10, 16, 0.85], [18, -12, 1.3], [-2, -20, 1.0],
    [8, -18, 1.0], [-18, 10, 1.1], [22, 8, 0.95], [-20, -12, 1.15],
  ], [])

  const FRONDS = useMemo(() => [
    [-4, 6, '#6a8a3a', 1.1], [9, -3, '#88aa44', 0.9], [-8, -7, '#7a9a3a', 0.8],
    [5, 14, '#88aa44', 1.0], [-12, 2, '#6a8a3a', 0.9], [15, 10, '#7a9a3a', 1.1],
  ], [])

  const POOLS = useMemo(() => [
    [[-7, -0.3, 3], 3.0], [[9, -0.3, -9], 2.5], [[-13, -0.3, -7], 1.8],
    [[5, -0.3, 15], 2.8], [[-2, -0.3, -15], 2.0],
  ], [])

  // 3 fat slow blobs
  const ALIENS = useMemo(() => [
    { center: [0, 0, 0], r: 6, spd: 0.25, ph: 0, color: '#d4a264', sz: 0.46 },
    { center: [-7, 0, 6], r: 4, spd: 0.32, ph: Math.PI, color: '#c89050', sz: 0.40 },
    { center: [10, 0, -5], r: 4.5, spd: 0.28, ph: Math.PI * 0.5, color: '#e8b878', sz: 0.44 },
  ], [])

  return (
    <>
      <Sky distance={450000} sunPosition={[0.6, 0.12, -0.3]} turbidity={5} rayleigh={2.5} mieCoefficient={0.005} mieDirectionalG={0.88} />
      <ambientLight intensity={1.4} color="#ffe8c0" />
      <directionalLight position={[25, 35, 15]} intensity={2.5} color="#ffeecc" castShadow shadow-mapSize={[1024, 1024]} shadow-camera-far={120} shadow-camera-left={-40} shadow-camera-right={40} shadow-camera-top={40} shadow-camera-bottom={-40} />
      <directionalLight position={[-15, 8, -20]} intensity={0.8} color="#ff9944" />
      <hemisphereLight skyColor="#ffe0a0" groundColor="#c87941" intensity={0.6} />

      <DesertTerrain />
      {POOLS.map(([pos, r], i) => <OasisPool key={i} position={pos} radius={r} />)}

      {CACTI.map(([x, z, sc], i) => (
        <Cactus key={i} position={[x, getTerrainHeight(x, z), z]} scale={sc} />
      ))}
      {FRONDS.map(([x, z, col, sc], i) => (
        <FrondPlant key={i} position={[x, getTerrainHeight(x, z) + 0.1, z]} color={col} scale={sc} />
      ))}

      {ALIENS.map((a, i) => (
        <SandBlob key={i} index={i} orbitCenter={a.center} orbitRadius={a.r} orbitSpeed={a.spd} phase={a.ph} color={a.color} size={a.sz} alienPositionsRef={alienPositionsRef} />
      ))}

      {CHECKPOINT_POSITIONS.map((cp, i) => (
        <SolaraCheckpoint key={i} position={cp} momentData={LIFE_MOMENTS[i]} isVisited={visited[i]} onCollect={() => onCheckpoint(i)} />
      ))}

      <PlayerBall keysRef={keysRef} onCheckpoint={onCheckpoint} visitedRef={visitedRef} onDamage={onDamage} alienPositionsRef={alienPositionsRef} />
    </>
  )
}

function MomentPopup({ moment, onClose }) {
  const [vis, setVis] = useState(false)
  useEffect(() => { const t = setTimeout(() => setVis(true), 30); return () => clearTimeout(t) }, [])
  if (!moment) return null
  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, background: 'rgba(40,20,0,0.5)', backdropFilter: 'blur(7px)', opacity: vis ? 1 : 0, transition: 'opacity 0.35s ease' }}>
      <div style={{ width: 'min(520px,90vw)', background: 'rgba(255,248,235,0.97)', border: `2px solid ${ACCENT}88`, borderRadius: '12px', padding: '32px 36px', boxShadow: `0 8px 60px ${ACCENT}44`, transform: vis ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.97)', transition: 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1)', fontFamily: "'Space Mono',monospace" }}>
        <div style={{ fontSize: '9px', letterSpacing: '0.35em', color: ACCENT, marginBottom: '12px' }}>✦ MEMORY UNLOCKED — {moment.period}</div>
        <div style={{ fontSize: '11px', color: '#aa5522', letterSpacing: '0.25em', marginBottom: '4px' }}>{moment.subtitle.toUpperCase()}</div>
        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '28px', fontWeight: 700, color: '#2a1200', marginBottom: '18px' }}>{moment.title}</div>
        <p style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '14px', color: '#5a3010', lineHeight: 1.7, marginBottom: '20px' }}>{moment.description}</p>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '26px' }}>
          {moment.tags.map(tag => (
            <span key={tag} style={{ fontSize: '9px', letterSpacing: '0.1em', color: '#2a1200', background: `${ACCENT}22`, border: `1px solid ${ACCENT}55`, padding: '4px 10px', borderRadius: '3px' }}>{tag}</span>
          ))}
        </div>
        <button onClick={onClose} style={{ background: ACCENT, border: 'none', color: '#ffffff', fontFamily: "'Space Mono',monospace", fontSize: '10px', letterSpacing: '0.2em', padding: '11px 28px', borderRadius: '4px', cursor: 'pointer' }}>
          CONTINUE EXPLORING →
        </button>
      </div>
    </div>
  )
}

function HealthBar({ health }) {
  const pct = Math.max(0, health) / 100
  const color = pct > 0.6 ? '#ffaa44' : pct > 0.3 ? '#ffcc00' : '#ff4444'
  return (
    <div style={{ position: 'fixed', top: '24px', left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', zIndex: 100, pointerEvents: 'none' }}>
      <div style={{ fontFamily: "'Space Mono',monospace", fontSize: '8px', letterSpacing: '0.25em', color: '#aa5522' }}>VITALITY</div>
      <div style={{ width: '160px', height: '10px', border: '1px solid rgba(170,85,34,0.5)', borderRadius: '3px', overflow: 'hidden', background: 'rgba(40,15,0,0.35)' }}>
        <div style={{ height: '100%', width: `${pct * 100}%`, background: color, boxShadow: `0 0 8px ${color}`, transition: 'width 0.2s ease, background 0.4s ease', borderRadius: '2px' }} />
      </div>
      <div style={{ fontFamily: "'Space Mono',monospace", fontSize: '8px', color, letterSpacing: '0.1em' }}>{Math.max(0, health)} HP</div>
    </div>
  )
}

function DeathScreen({ onRespawn }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(40,15,0,0.88)', backdropFilter: 'blur(8px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: "'Space Mono',monospace" }}>
      <div style={{ fontSize: '9px', letterSpacing: '0.5em', color: '#ff4444', marginBottom: '16px' }}>⚠ SIGNAL LOST</div>
      <div style={{ fontSize: '42px', fontWeight: 700, color: '#ffaa44', letterSpacing: '0.04em', fontFamily: "'Space Grotesk',sans-serif", marginBottom: '32px' }}>LOST IN THE DUNES</div>
      <button onClick={onRespawn} style={{ background: 'transparent', border: '2px solid #ffaa44', color: '#ffaa44', fontFamily: "'Space Mono',monospace", fontSize: '11px', letterSpacing: '0.3em', padding: '14px 40px', cursor: 'pointer', borderRadius: '4px', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#ffaa4422'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
        FIND YOUR WAY BACK
      </button>
    </div>
  )
}

function GameHUD({ visitedCount, total }) {
  return (
    <>
      <div style={{ position: 'fixed', bottom: '28px', right: '28px', fontFamily: "'Space Mono',monospace", fontSize: '10px', letterSpacing: '0.2em', color: '#aa5522', zIndex: 100, pointerEvents: 'none' }}>
        ✦ {visitedCount} / {total} REMEMBERED
      </div>
      <div style={{ position: 'fixed', bottom: '28px', left: '28px', fontFamily: "'Space Mono',monospace", fontSize: '9px', color: 'rgba(120,70,20,0.5)', letterSpacing: '0.15em', lineHeight: 1.9, zIndex: 100, pointerEvents: 'none' }}>
        W / S — MOVE &nbsp;·&nbsp; Q / E — ORBIT CAM<br />
        SPACE — JUMP &nbsp;·&nbsp; COLLECT WISPS TO UNLOCK
      </div>
    </>
  )
}

export default function LifePage() {
  const navigate = useNavigate()
  const keysRef = useRef({})
  const visitedRef = useRef(CHECKPOINT_POSITIONS.map(() => false))
  const alienPositionsRef = useRef([null, null, null])
  const [visited, setVisited] = useState(CHECKPOINT_POSITIONS.map(() => false))
  const [activePopup, setActivePopup] = useState(null)
  const [health, setHealth] = useState(100)
  const [isDead, setIsDead] = useState(false)

  useEffect(() => {
    const down = (e) => {
      keysRef.current[e.key.toLowerCase()] = true
      if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(e.key.toLowerCase())) e.preventDefault()
    }
    const up = (e) => { keysRef.current[e.key.toLowerCase()] = false }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up) }
  }, [])

  const handleCheckpoint = useCallback((index) => {
    visitedRef.current[index] = true
    setVisited(v => { const n = [...v]; n[index] = true; return n })
    setActivePopup(index)
  }, [])

  const handleDamage = useCallback((amount) => {
    setHealth(h => {
      const next = h - amount
      if (next <= 0) { setIsDead(true); return 0 }
      return next
    })
  }, [])

  const handleRespawn = useCallback(() => { setHealth(100); setIsDead(false) }, [])
  const closePopup = useCallback(() => setActivePopup(null), [])

  return (
    <div style={{ width: '100%', height: '100vh', background: '#c87941', position: 'relative' }}>
      <button onClick={() => navigate('/')} style={{ position: 'fixed', top: '24px', left: '28px', background: 'rgba(255,235,190,0.75)', border: `1px solid ${ACCENT}88`, color: '#5a2a08', fontFamily: "'Space Mono',monospace", fontSize: '10px', letterSpacing: '0.2em', padding: '8px 16px', cursor: 'pointer', zIndex: 100, borderRadius: '4px', backdropFilter: 'blur(4px)' }}>
        ← ORBIT
      </button>
      <div style={{ position: 'fixed', top: '24px', right: '28px', fontFamily: "'Space Mono',monospace", textAlign: 'right', zIndex: 100, pointerEvents: 'none' }}>
        <div style={{ fontSize: '9px', color: '#aa5522', letterSpacing: '0.3em', fontWeight: 700 }}>LIFE</div>
        <div style={{ fontSize: '9px', color: '#cc7744', letterSpacing: '0.15em', marginTop: '2px' }}>PLANET SOLARA</div>
      </div>

      <Canvas key={isDead ? 'dead' : 'alive'} camera={{ position: [0, 5, 12], fov: 60, near: 0.1, far: 500 }} shadows style={{ background: '#c87941' }}>
        <Suspense fallback={null}>
          <SolaraScene
            keysRef={keysRef}
            onCheckpoint={handleCheckpoint}
            visitedRef={visitedRef}
            visited={visited}
            onDamage={handleDamage}
            alienPositionsRef={alienPositionsRef}
          />
        </Suspense>
      </Canvas>

      <HealthBar health={health} />
      <GameHUD visitedCount={visited.filter(Boolean).length} total={CHECKPOINT_POSITIONS.length} />
      {activePopup !== null && <MomentPopup moment={LIFE_MOMENTS[activePopup]} onClose={closePopup} />}
      {isDead && <DeathScreen onRespawn={handleRespawn} />}
    </div>
  )
}