import React, { useRef, useState, useEffect, useCallback, useMemo, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Html, Sky } from '@react-three/drei'
import * as THREE from 'three'
import { SECTIONS } from '../constants/sectionData'

const section = SECTIONS.find((s) => s.id === 'projects')
const ACCENT = section?.color ?? '#00ff88'

const PROJECTS = [
  {
    id: 0,
    name: 'EarthVerse',
    tagline: 'This very portfolio — a 3D space journey',
    tech: ['React', 'Three.js', 'R3F', 'Zustand'],
    status: 'LIVE',
    description: 'An immersive 3D portfolio replacing static pages with an interactive orbit system around a rotating Earth. Built with React Three Fiber for performant WebGL rendering.',
    github: '#',
  },
  {
    id: 1,
    name: 'Nebula AI',
    tagline: 'RAG-powered document intelligence',
    tech: ['Python', 'FastAPI', 'ChromaDB', 'Next.js'],
    status: 'SHIPPED',
    description: 'A retrieval-augmented generation pipeline for large document corpora, with a clean Next.js 14 frontend. Sub-500ms query latency on 50K document collections.',
    github: '#',
  },
  {
    id: 2,
    name: 'OrbitDB',
    tagline: 'Distributed key-value store experiment',
    tech: ['Rust', 'SQLite', 'Tauri', 'React'],
    status: 'IN PROGRESS',
    description: 'A desktop-native data layer using Rust and SQLite with sqlite-vec for vector similarity search. Built as a Tauri v2 application.',
    github: '#',
  },
  {
    id: 3,
    name: 'PulseFlow',
    tagline: 'ADHD productivity with streaks & rewards',
    tech: ['Flutter', 'Firebase', 'Supabase', 'Drift'],
    status: 'BETA',
    description: 'A cross-platform mobile app helping users with attention challenges through gamified task flows, login streaks, badge rewards, and dark-mode-first design.',
    github: '#',
  },
]

const CHECKPOINT_POSITIONS = [
  new THREE.Vector3(-10, 0.5, -8),
  new THREE.Vector3(12, 0.5, -4),
  new THREE.Vector3(-3, 0.5, 12),
  new THREE.Vector3(15, 0.5, 14),
]

// MINI-GAME: Each checkpoint has a 3-step "hack sequence" — small glowing pads
// light up in a pattern, player must step on them in order within 8 seconds
const HACK_SEQUENCES = [
  [0, 2, 1],   // pad indices for checkpoint 0
  [1, 0, 2],
  [2, 1, 0],
  [0, 1, 2],
]

const BALL_RADIUS = 0.38
const SPEED = 7
const GRAVITY = 20
const JUMP_VEL = 7.5
const FRICTION = 0.80
const ALIEN_DAMAGE = 15
const INVINCIBILITY_DURATION = 1.5

function getTerrainHeight(x, z) {
  return (
    Math.sin(x * 0.2) * 1.8 +
    Math.sin(z * 0.15) * 1.5 +
    Math.cos((x + z) * 0.1) * 1.0 +
    Math.sin(x * 0.5 + z * 0.35) * 0.5 +
    Math.cos(x * 0.8) * Math.sin(z * 0.8) * 0.25
  )
}

// Vertex-colored dark violet terrain with lava cracks
function VolcanicTerrain() {
  const geo = useMemo(() => {
    const SIZE = 90, SEGS = 110
    const g = new THREE.PlaneGeometry(SIZE, SIZE, SEGS, SEGS)
    g.rotateX(-Math.PI / 2)
    const pos = g.attributes.position
    const colors = []
    const base = new THREE.Color('#3d1a6e')
    const ridge = new THREE.Color('#5a1a8a')
    const valley = new THREE.Color('#1a0a38')
    const hotspot = new THREE.Color('#6b1a4a')

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i)
      const h = getTerrainHeight(x, z)
      pos.setY(i, h)
      const t = (h + 3.5) / 7.0
      const crack = Math.abs(Math.sin(x * 0.7) * Math.sin(z * 0.7))
      let col
      if (crack < 0.05) col = hotspot.clone().lerp(new THREE.Color('#ff4400'), 0.3)
      else if (t < 0.3) col = valley.clone()
      else if (t > 0.7) col = ridge.clone()
      else col = base.clone().lerp(hotspot, crack * 0.4)
      colors.push(col.r, col.g, col.b)
    }
    g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    g.computeVertexNormals()
    return g
  }, [])

  return (
    <mesh geometry={geo} receiveShadow>
      <meshStandardMaterial vertexColors roughness={0.88} metalness={0.08} emissive="#1a0030" emissiveIntensity={0.1} />
    </mesh>
  )
}

// Lava pool — animated emissive orange
function LavaPool({ position, radius = 3 }) {
  const ref = useRef()
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.material.emissiveIntensity = 0.7 + Math.sin(clock.getElapsedTime() * 1.2 + position[0]) * 0.3
      ref.current.material.opacity = 0.82 + Math.sin(clock.getElapsedTime() * 0.7) * 0.05
    }
  })
  return (
    <mesh ref={ref} position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[radius, 48]} />
      <meshStandardMaterial color="#cc2200" emissive="#ff4400" emissiveIntensity={0.8} transparent opacity={0.88} roughness={0.1} depthWrite={false} />
    </mesh>
  )
}

// Crystal spire
function CrystalSpire({ position, color = '#aa44ff', scale = 1 }) {
  const ref = useRef()
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.children.forEach((c, i) => {
        c.material.emissiveIntensity = 0.5 + Math.sin(clock.getElapsedTime() * 1.5 + i * 0.8 + position[0]) * 0.25
      })
    }
  })
  return (
    <group ref={ref} position={position}>
      {/* Main tall spire */}
      <mesh castShadow position={[0, scale * 1.5, 0]}>
        <octahedronGeometry args={[scale * 0.25, 0]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.55} roughness={0.1} metalness={0.5} transparent opacity={0.9} />
      </mesh>
      <mesh castShadow position={[0, scale * 0.6, 0]} scale={[1, 1.8, 1]}>
        <coneGeometry args={[scale * 0.18, scale * 2.4, 6]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.45} roughness={0.15} transparent opacity={0.85} />
      </mesh>
      {/* Side crystals */}
      {[0, 1, 2].map(i => {
        const a = (i / 3) * Math.PI * 2
        return (
          <mesh key={i} position={[Math.cos(a) * scale * 0.5, scale * 0.4, Math.sin(a) * scale * 0.5]} rotation={[0, a, 0.4]} castShadow>
            <coneGeometry args={[scale * 0.1, scale * 1.2, 5]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} roughness={0.2} transparent opacity={0.8} />
          </mesh>
        )
      })}
      <pointLight position={[0, scale * 1.5, 0]} color={color} intensity={0.6 * scale} distance={4 * scale} />
    </group>
  )
}

// Vine cluster
function VineCluster({ position, scale = 1 }) {
  return (
    <group position={position}>
      {[0, 1, 2].map(i => {
        const a = (i / 3) * Math.PI * 2 + i * 0.5
        const r = scale * 0.3
        return (
          <mesh key={i} position={[Math.cos(a) * r, scale * 0.4, Math.sin(a) * r]} rotation={[0.3 * (i % 2 === 0 ? 1 : -1), a, 0.2]}>
            <torusGeometry args={[scale * 0.22, scale * 0.055, 6, 12]} />
            <meshStandardMaterial color="#4a1a6e" emissive="#6600aa" emissiveIntensity={0.12} roughness={0.8} />
          </mesh>
        )
      })}
    </group>
  )
}

// Bioluminescent moss disc
function MossDisc({ position, color = '#00ff88' }) {
  const ref = useRef()
  useFrame(({ clock }) => {
    if (ref.current) ref.current.material.emissiveIntensity = 0.25 + Math.sin(clock.getElapsedTime() * 0.9 + position[0]) * 0.12
  })
  return (
    <mesh ref={ref} position={position} rotation={[-Math.PI / 2, 0, Math.random() * Math.PI]}>
      <circleGeometry args={[0.4 + Math.random() * 0.3, 8]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} roughness={0.9} transparent opacity={0.8} />
    </mesh>
  )
}

// Angular blob alien
function AngularAlien({ index, orbitCenter, orbitRadius, orbitSpeed, phase, color, size = 0.38, alienPositionsRef }) {
  const groupRef = useRef()
  const bodyRef = useRef()

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    const ang = t * orbitSpeed + phase
    const wx = orbitCenter[0] + Math.cos(ang) * orbitRadius
    const wz = orbitCenter[2] + Math.sin(ang) * orbitRadius
    const wy = getTerrainHeight(wx, wz) + size * 0.9

    if (groupRef.current) {
      groupRef.current.position.set(wx, wy, wz)
      groupRef.current.rotation.y = ang * 2
    }
    if (alienPositionsRef?.current) alienPositionsRef.current[index] = new THREE.Vector3(wx, wy, wz)
    if (bodyRef.current) {
      const pulse = Math.sin(t * 3 + phase)
      bodyRef.current.scale.setScalar(1 + pulse * 0.08)
    }
  })

  return (
    <group ref={groupRef}>
      <mesh ref={bodyRef} castShadow>
        <octahedronGeometry args={[size, 1]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.35} roughness={0.3} metalness={0.4} />
      </mesh>
      {[0, 1, 2, 3].map(i => {
        const a = (i / 4) * Math.PI * 2
        return (
          <mesh key={i} position={[Math.cos(a) * size * 0.7, 0, Math.sin(a) * size * 0.7]} castShadow>
            <tetrahedronGeometry args={[size * 0.25, 0]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} roughness={0.2} />
          </mesh>
        )
      })}
      <pointLight color={color} intensity={0.5} distance={3} />
    </group>
  )
}

// MINI-GAME: Hack Pad — a glowing pressure pad
function HackPad({ position, padIndex, isActive, isCompleted, onStep }) {
  const ref = useRef()
  useFrame(({ clock }) => {
    if (!ref.current) return
    if (isActive) {
      ref.current.material.emissiveIntensity = 0.6 + Math.sin(clock.getElapsedTime() * 8) * 0.4
    } else if (isCompleted) {
      ref.current.material.emissiveIntensity = 0.8
    } else {
      ref.current.material.emissiveIntensity = 0.1
    }
  })
  const col = isCompleted ? '#00ffcc' : isActive ? '#ffffff' : '#334466'
  return (
    <mesh ref={ref} position={position} rotation={[-Math.PI / 2, 0, 0]} onClick={onStep}>
      <circleGeometry args={[0.55, 6]} />
      <meshStandardMaterial color={col} emissive={col} emissiveIntensity={0.1} roughness={0.3} />
    </mesh>
  )
}

// Checkpoint with hack mini-game
function HackCheckpoint({ position, projData, isVisited, onCollect, beaconColor = '#00ffcc' }) {
  const beaconRef = useRef()
  const [hackState, setHackState] = useState('idle') // idle | playing | success | fail
  const [currentStep, setCurrentStep] = useState(0)
  const [timeLeft, setTimeLeft] = useState(8)
  const [completedPads, setCompletedPads] = useState([])
  const [showGame, setShowGame] = useState(false)
  const sequence = HACK_SEQUENCES[projData.id]
  const ballNearRef = useRef(false)

  // Pad positions relative to checkpoint
  const padOffsets = [
    new THREE.Vector3(position.x - 1.8, position.y - 0.28, position.z),
    new THREE.Vector3(position.x, position.y - 0.28, position.z - 1.8),
    new THREE.Vector3(position.x + 1.8, position.y - 0.28, position.z),
  ]

  useEffect(() => {
    if (hackState !== 'playing') return
    if (timeLeft <= 0) { setHackState('fail'); return }
    const t = setInterval(() => setTimeLeft(tl => tl - 0.1), 100)
    return () => clearInterval(t)
  }, [hackState, timeLeft])

  useFrame(() => {
    if (beaconRef.current) {
      beaconRef.current.rotation.y += 0.025
      beaconRef.current.position.y = position.y + 0.9 + Math.sin(Date.now() * 0.002) * 0.15
    }
  })

  const startHack = () => {
    if (isVisited || hackState === 'playing') return
    setHackState('playing')
    setCurrentStep(0)
    setTimeLeft(8)
    setCompletedPads([])
    setShowGame(true)
  }

  const handlePadStep = (padIdx) => {
    if (hackState !== 'playing') return
    const expected = sequence[currentStep]
    if (padIdx === expected) {
      const newCompleted = [...completedPads, padIdx]
      setCompletedPads(newCompleted)
      if (currentStep + 1 >= sequence.length) {
        setHackState('success')
        setTimeout(() => { onCollect(); setShowGame(false) }, 600)
      } else {
        setCurrentStep(currentStep + 1)
      }
    } else {
      setHackState('fail')
    }
  }

  const resetHack = () => {
    setHackState('idle')
    setCurrentStep(0)
    setCompletedPads([])
    setShowGame(false)
  }

  const color = isVisited ? '#445566' : beaconColor

  return (
    <group>
      {/* Ring */}
      <mesh position={[position.x, position.y - 0.28, position.z]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.0, 1.35, 32]} />
        <meshBasicMaterial color={color} transparent opacity={isVisited ? 0.07 : 0.28} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      {/* Beam */}
      <mesh position={[position.x, position.y + 2.8, position.z]}>
        <cylinderGeometry args={[0.035, 0.035, 5.6, 7]} />
        <meshBasicMaterial color={color} transparent opacity={isVisited ? 0.1 : 0.38} />
      </mesh>
      {/* Octahedron beacon */}
      <mesh ref={beaconRef} position={[position.x, position.y + 0.9, position.z]} castShadow>
        <octahedronGeometry args={[0.38, 0]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={isVisited ? 0.3 : 1.8} roughness={0.1} metalness={0.7} transparent opacity={isVisited ? 0.45 : 0.95} />
      </mesh>
      <pointLight position={[position.x, position.y + 1, position.z]} color={color} intensity={isVisited ? 0.4 : 2.2} distance={7} />

      {/* Hack pads */}
      {!isVisited && padOffsets.map((padPos, i) => (
        <HackPad
          key={i}
          position={padPos}
          padIndex={i}
          isActive={hackState === 'playing' && sequence[currentStep] === i}
          isCompleted={completedPads.includes(i) || (hackState === 'success')}
          onStep={() => handlePadStep(i)}
        />
      ))}

      {!isVisited && (
        <Html position={[position.x, position.y + 2.8, position.z]} center distanceFactor={13}>
          <div style={{ fontFamily: "'Space Mono',monospace", textAlign: 'center', pointerEvents: 'auto' }}>
            {hackState === 'idle' && (
              <div>
                <div style={{ fontSize: '8px', letterSpacing: '0.18em', color: beaconColor, whiteSpace: 'nowrap', textShadow: `0 0 8px ${beaconColor}` }}>
                  ◆ {projData.name.toUpperCase()}
                </div>
                <button
                  onClick={startHack}
                  style={{ marginTop: '4px', fontSize: '7px', letterSpacing: '0.2em', color: '#ffffff', background: `${beaconColor}44`, border: `1px solid ${beaconColor}`, padding: '2px 8px', cursor: 'pointer', borderRadius: '2px' }}
                >
                  HACK
                </button>
              </div>
            )}
            {hackState === 'playing' && (
              <div style={{ background: 'rgba(0,10,20,0.8)', padding: '6px 10px', borderRadius: '4px', border: `1px solid ${beaconColor}66` }}>
                <div style={{ fontSize: '7px', color: beaconColor, letterSpacing: '0.2em', marginBottom: '2px' }}>
                  STEP {currentStep + 1}/{sequence.length}
                </div>
                <div style={{ width: '60px', height: '3px', background: '#333', borderRadius: '2px' }}>
                  <div style={{ height: '100%', width: `${(timeLeft / 8) * 100}%`, background: timeLeft > 3 ? beaconColor : '#ff4444', borderRadius: '2px', transition: 'width 0.1s' }} />
                </div>
                <div style={{ fontSize: '6px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>
                  STEP ON GLOWING PAD
                </div>
              </div>
            )}
            {hackState === 'fail' && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '8px', color: '#ff4444', letterSpacing: '0.2em' }}>SEQUENCE FAILED</div>
                <button onClick={resetHack} style={{ marginTop: '4px', fontSize: '7px', color: '#ff4444', background: 'rgba(255,68,68,0.2)', border: '1px solid #ff4444', padding: '2px 8px', cursor: 'pointer', borderRadius: '2px', letterSpacing: '0.1em' }}>
                  RETRY
                </button>
              </div>
            )}
          </div>
        </Html>
      )}
    </group>
  )
}

function PlayerBall({ keysRef, onCheckpoint, visitedRef, onDamage, alienPositionsRef, onNearCheckpoint }) {
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
        if (pos.current.distanceTo(ap) < 0.38 + 0.48 + 0.3) {
          onDamage(ALIEN_DAMAGE)
          invincibleUntil.current = now + INVINCIBILITY_DURATION
          const kbDir = new THREE.Vector3().subVectors(pos.current, ap).normalize()
          vel.current.x += kbDir.x * 5
          vel.current.z += kbDir.z * 5
          vel.current.y = 3
          break
        }
      }
    }

    if (meshRef.current) {
      const isInvincible = now < invincibleUntil.current
      meshRef.current.material.emissiveIntensity = isInvincible ? (Math.sin(now * 20) * 0.5 + 0.5) * 1.5 : 0.5
    }
  })

  return (
    <mesh ref={meshRef} castShadow position={[0, 3, 5]}>
      <icosahedronGeometry args={[BALL_RADIUS, 3]} />
      <meshStandardMaterial color="#ffffff" emissive="#00ff88" emissiveIntensity={0.5} roughness={0.2} metalness={0.7} />
      <pointLight color="#00ffcc" intensity={1.2} distance={4} />
    </mesh>
  )
}

function VexScene({ keysRef, onCheckpoint, visitedRef, visited, onDamage, alienPositionsRef }) {
  const CRYSTALS = useMemo(() => [
    [-6, -10, '#aa44ff', 1.2], [5, -12, '#00ffcc', 0.9], [14, 6, '#ff44aa', 1.4],
    [-14, 4, '#7744ff', 1.0], [1, 18, '#44aaff', 1.1], [-10, 16, '#aa44ff', 0.85],
    [18, -12, '#00ffcc', 1.3], [-2, -20, '#7744ff', 1.0], [8, -18, '#ff44aa', 0.9],
    [-18, 10, '#44aaff', 1.1], [20, 15, '#aa44ff', 0.8], [-20, -8, '#00ffcc', 1.15],
  ], [])

  const VINES = useMemo(() => [
    [-4, -6, 0.9], [8, 4, 1.0], [-10, 8, 0.8], [5, 14, 1.1],
    [-6, 18, 0.9], [12, -8, 0.75], [-16, 2, 1.0],
  ], [])

  const MOSS = useMemo(() => [
    [-3, -5, '#00ff88'], [6, 2, '#00ffcc'], [-8, 6, '#88ff44'],
    [4, 12, '#00ff88'], [-12, -4, '#44ffaa'], [9, -10, '#00ffcc'],
    [2, -16, '#88ff44'], [-5, 15, '#00ff88'],
  ], [])

  const LAVA = useMemo(() => [
    [[-7, -0.3, 3], 3.2], [[9, -0.3, -9], 2.6], [[-13, -0.3, -8], 1.8],
    [[5, -0.3, 16], 2.5], [[-2, -0.3, -15], 2.0], [[16, -0.3, 6], 1.6],
  ], [])

  // 4 faster angular aliens
  const ALIENS = useMemo(() => [
    { center: [0, 0, 0], r: 5, spd: 0.55, ph: 0, color: '#aa44ff', sz: 0.36 },
    { center: [-8, 0, 6], r: 3.5, spd: 0.68, ph: Math.PI, color: '#6600cc', sz: 0.30 },
    { center: [10, 0, -4], r: 4, spd: 0.6, ph: Math.PI * 0.5, color: '#440088', sz: 0.40 },
    { center: [4, 0, 14], r: 3, spd: 0.72, ph: Math.PI * 1.3, color: '#8800cc', sz: 0.32 },
  ], [])

  return (
    <>
      <Sky distance={450000} sunPosition={[0.5, 0.08, 0.3]} turbidity={8} rayleigh={4} mieCoefficient={0.008} mieDirectionalG={0.85} />
      <ambientLight intensity={0.5} color="#3a0a5a" />
      <directionalLight position={[20, 30, 10]} intensity={1.2} color="#cc88ff" castShadow shadow-mapSize={[1024, 1024]} shadow-camera-far={120} shadow-camera-left={-40} shadow-camera-right={40} shadow-camera-top={40} shadow-camera-bottom={-40} />
      <directionalLight position={[-10, 5, -20]} intensity={1.8} color="#ff4400" />
      <hemisphereLight skyColor="#2a0040" groundColor="#3d1a6e" intensity={0.7} />
      <fog attach="fog" color="#1a0030" near={35} far={80} />

      <VolcanicTerrain />
      {LAVA.map(([pos, r], i) => <LavaPool key={i} position={pos} radius={r} />)}

      {CRYSTALS.map(([x, z, col, sc], i) => (
        <CrystalSpire key={i} position={[x, getTerrainHeight(x, z), z]} color={col} scale={sc} />
      ))}
      {VINES.map(([x, z, sc], i) => (
        <VineCluster key={i} position={[x, getTerrainHeight(x, z), z]} scale={sc} />
      ))}
      {MOSS.map(([x, z, col], i) => (
        <MossDisc key={i} position={[x, getTerrainHeight(x, z) + 0.02, z]} color={col} />
      ))}

      {ALIENS.map((a, i) => (
        <AngularAlien
          key={i}
          index={i}
          orbitCenter={a.center}
          orbitRadius={a.r}
          orbitSpeed={a.spd}
          phase={a.ph}
          color={a.color}
          size={a.sz}
          alienPositionsRef={alienPositionsRef}
        />
      ))}

      {CHECKPOINT_POSITIONS.map((cp, i) => (
        <HackCheckpoint
          key={i}
          position={cp}
          projData={PROJECTS[i]}
          isVisited={visited[i]}
          onCollect={() => onCheckpoint(i)}
          beaconColor="#00ffcc"
        />
      ))}

      <PlayerBall
        keysRef={keysRef}
        onCheckpoint={onCheckpoint}
        visitedRef={visitedRef}
        onDamage={onDamage}
        alienPositionsRef={alienPositionsRef}
      />
    </>
  )
}

const STATUS_COLORS = {
  'LIVE': '#00ff88', 'SHIPPED': '#00d4ff', 'IN PROGRESS': '#ffaa00', 'BETA': '#ff6b6b',
}

function ProjectPopup({ proj, onClose }) {
  const [vis, setVis] = useState(false)
  useEffect(() => { const t = setTimeout(() => setVis(true), 30); return () => clearTimeout(t) }, [])
  if (!proj) return null
  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, background: 'rgba(10,0,25,0.65)', backdropFilter: 'blur(8px)', opacity: vis ? 1 : 0, transition: 'opacity 0.35s ease' }}>
      <div style={{ width: 'min(540px,90vw)', background: 'rgba(15,5,30,0.97)', border: `2px solid ${ACCENT}66`, borderRadius: '12px', padding: '32px 36px', boxShadow: `0 8px 60px ${ACCENT}33`, transform: vis ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.97)', transition: 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1)', fontFamily: "'Space Mono',monospace" }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div style={{ fontSize: '9px', letterSpacing: '0.35em', color: ACCENT }}>◆ PROJECT UNLOCKED</div>
          <span style={{ fontSize: '8px', color: STATUS_COLORS[proj.status], border: `1px solid ${STATUS_COLORS[proj.status]}44`, padding: '3px 10px', letterSpacing: '0.15em' }}>{proj.status}</span>
        </div>
        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '26px', fontWeight: 700, color: '#e8f4ff', marginBottom: '4px' }}>{proj.name}</div>
        <div style={{ fontSize: '10px', color: ACCENT, opacity: 0.7, letterSpacing: '0.1em', marginBottom: '18px' }}>{proj.tagline}</div>
        <p style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '14px', color: 'rgba(232,244,255,0.7)', lineHeight: 1.7, marginBottom: '20px' }}>{proj.description}</p>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
          {proj.tech.map(t => (
            <span key={t} style={{ fontSize: '9px', letterSpacing: '0.1em', color: ACCENT, background: `${ACCENT}12`, border: `1px solid ${ACCENT}44`, padding: '4px 10px', borderRadius: '3px' }}>{t}</span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <a href={proj.github} style={{ fontSize: '9px', letterSpacing: '0.2em', color: '#ffffff', background: ACCENT, padding: '10px 22px', borderRadius: '4px', textDecoration: 'none', fontFamily: "'Space Mono',monospace" }}>
            VIEW ON GITHUB ↗
          </a>
          <button onClick={onClose} style={{ background: 'transparent', border: `1px solid ${ACCENT}44`, color: ACCENT, fontFamily: "'Space Mono',monospace", fontSize: '9px', letterSpacing: '0.2em', padding: '10px 22px', borderRadius: '4px', cursor: 'pointer' }}>
            CONTINUE →
          </button>
        </div>
      </div>
    </div>
  )
}

function HealthBar({ health }) {
  const pct = Math.max(0, health) / 100
  const color = pct > 0.6 ? '#00ff88' : pct > 0.3 ? '#ffcc00' : '#ff4444'
  return (
    <div style={{ position: 'fixed', top: '24px', left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', zIndex: 100, pointerEvents: 'none' }}>
      <div style={{ fontFamily: "'Space Mono',monospace", fontSize: '8px', letterSpacing: '0.25em', color: '#6600aa' }}>SIGNAL INTEGRITY</div>
      <div style={{ width: '160px', height: '10px', border: '1px solid rgba(102,0,170,0.5)', borderRadius: '3px', overflow: 'hidden', background: 'rgba(10,0,20,0.5)' }}>
        <div style={{ height: '100%', width: `${pct * 100}%`, background: color, boxShadow: `0 0 8px ${color}`, transition: 'width 0.2s ease, background 0.4s ease', borderRadius: '2px' }} />
      </div>
      <div style={{ fontFamily: "'Space Mono',monospace", fontSize: '8px', color, letterSpacing: '0.1em' }}>{Math.max(0, health)} HP</div>
    </div>
  )
}

function DeathScreen({ onRespawn }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(10,0,20,0.9)', backdropFilter: 'blur(8px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: "'Space Mono',monospace" }}>
      <div style={{ fontSize: '9px', letterSpacing: '0.5em', color: '#ff4444', marginBottom: '16px' }}>⚠ SIGNAL LOST</div>
      <div style={{ fontSize: '42px', fontWeight: 700, color: '#aa44ff', letterSpacing: '0.04em', fontFamily: "'Space Grotesk',sans-serif", marginBottom: '32px' }}>SYSTEM CRASHED</div>
      <button onClick={onRespawn} style={{ background: 'transparent', border: '2px solid #00ffcc', color: '#00ffcc', fontFamily: "'Space Mono',monospace", fontSize: '11px', letterSpacing: '0.3em', padding: '14px 40px', cursor: 'pointer', borderRadius: '4px', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#00ffcc22'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
        REBOOT
      </button>
    </div>
  )
}

function GameHUD({ visitedCount, total }) {
  return (
    <>
      <div style={{ position: 'fixed', bottom: '28px', right: '28px', fontFamily: "'Space Mono',monospace", fontSize: '10px', letterSpacing: '0.2em', color: '#6600aa', zIndex: 100, pointerEvents: 'none' }}>
        ◆ {visitedCount} / {total} HACKED
      </div>
      <div style={{ position: 'fixed', bottom: '28px', left: '28px', fontFamily: "'Space Mono',monospace", fontSize: '9px', color: 'rgba(180,100,255,0.45)', letterSpacing: '0.15em', lineHeight: 1.9, zIndex: 100, pointerEvents: 'none' }}>
        W / S — MOVE &nbsp;·&nbsp; Q / E — ORBIT CAM<br />
        SPACE — JUMP &nbsp;·&nbsp; HACK BEACONS TO UNLOCK
      </div>
    </>
  )
}

export default function ProjectsPage() {
  const navigate = useNavigate()
  const keysRef = useRef({})
  const visitedRef = useRef(CHECKPOINT_POSITIONS.map(() => false))
  const alienPositionsRef = useRef([null, null, null, null])
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
    <div style={{ width: '100%', height: '100vh', background: '#1a0030', position: 'relative' }}>
      <button onClick={() => navigate('/')} style={{ position: 'fixed', top: '24px', left: '28px', background: 'rgba(30,0,50,0.75)', border: `1px solid ${ACCENT}66`, color: ACCENT, fontFamily: "'Space Mono',monospace", fontSize: '10px', letterSpacing: '0.2em', padding: '8px 16px', cursor: 'pointer', zIndex: 100, borderRadius: '4px', backdropFilter: 'blur(4px)' }}>
        ← ORBIT
      </button>
      <div style={{ position: 'fixed', top: '24px', right: '28px', fontFamily: "'Space Mono',monospace", textAlign: 'right', zIndex: 100, pointerEvents: 'none' }}>
        <div style={{ fontSize: '9px', color: ACCENT, letterSpacing: '0.3em', fontWeight: 700 }}>PROJECTS</div>
        <div style={{ fontSize: '9px', color: '#aa44ff', letterSpacing: '0.15em', marginTop: '2px' }}>PLANET VEX-9</div>
      </div>

      <Canvas key={isDead ? 'dead' : 'alive'} camera={{ position: [0, 5, 12], fov: 60, near: 0.1, far: 500 }} shadows style={{ background: '#1a0030' }}>
        <Suspense fallback={null}>
          <VexScene
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
      {activePopup !== null && <ProjectPopup proj={PROJECTS[activePopup]} onClose={closePopup} />}
      {isDead && <DeathScreen onRespawn={handleRespawn} />}
    </div>
  )
}