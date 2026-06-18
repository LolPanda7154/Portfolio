import React, { useRef, useState, useEffect, useCallback, useMemo, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Html, Sky } from '@react-three/drei'
import * as THREE from 'three'
import { SECTIONS } from '../constants/sectionData'

const section = SECTIONS.find((s) => s.id === 'education')
const ACCENT = section?.color ?? '#ffaa00'

const EDUCATION = [
  {
    id: 0,
    degree: 'B.Sc. Computer Science',
    institution: 'University of Technology',
    period: '2021 — 2025',
    tags: ['Algorithms', 'Systems', 'AI'],
    description: 'Graduated with First Class Honours. Thesis on efficient transformer inference. Coursework spanning algorithms, distributed systems, and ML theory.',
    // Quiz question to unlock — player must answer correctly
    quiz: {
      question: 'What does Big-O O(log n) represent?',
      options: ['Linear time', 'Logarithmic time', 'Quadratic time', 'Constant time'],
      answer: 1,
    },
  },
  {
    id: 1,
    degree: 'ML Specialization',
    institution: 'Coursera / Stanford Online',
    period: '2023',
    tags: ['Neural Networks', 'Backprop', 'PyTorch'],
    description: 'Completed Andrew Ng\'s machine learning specialization with 3 deep-dive courses. Built neural networks from scratch, including attention mechanisms.',
    quiz: {
      question: 'What does gradient descent minimize?',
      options: ['Accuracy', 'Loss function', 'Learning rate', 'Weight count'],
      answer: 1,
    },
  },
  {
    id: 2,
    degree: 'AWS Certified Dev',
    institution: 'Amazon Web Services',
    period: '2024',
    tags: ['Cloud', 'Lambda', 'DevOps'],
    description: 'Passed the AWS Certified Developer – Associate exam. Architected serverless pipelines, managed IAM at scale, and deployed multi-region applications.',
    quiz: {
      question: 'Which AWS service runs serverless functions?',
      options: ['EC2', 'S3', 'Lambda', 'RDS'],
      answer: 2,
    },
  },
]

const CHECKPOINT_POSITIONS = [
  new THREE.Vector3(-10, 0.5, -8),
  new THREE.Vector3(12, 0.5, -4),
  new THREE.Vector3(2, 0.5, 13),
]

const BALL_RADIUS = 0.38
const SPEED = 6.5
const GRAVITY = 18
const JUMP_VEL = 6.8
const FRICTION = 0.82
const ALIEN_DAMAGE = 15
const INVINCIBILITY_DURATION = 1.5

// Stone-green, overcast misty terrain
function getTerrainHeight(x, z) {
  return (
    Math.sin(x * 0.17) * 1.5 +
    Math.sin(z * 0.2) * 1.2 +
    Math.cos((x + z) * 0.13) * 0.9 +
    Math.sin(x * 0.4 + z * 0.32) * 0.45 +
    Math.sin(x * 1.1) * Math.cos(z * 0.9) * 0.18
  )
}

function AncientTerrain() {
  const geo = useMemo(() => {
    const SIZE = 90, SEGS = 100
    const g = new THREE.PlaneGeometry(SIZE, SIZE, SEGS, SEGS)
    g.rotateX(-Math.PI / 2)
    const pos = g.attributes.position
    const colors = []
    const base = new THREE.Color('#5a7a5a')
    const moss = new THREE.Color('#3a5a3a')
    const rock = new THREE.Color('#7a8a6a')
    const stone = new THREE.Color('#4a5a4a')

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i)
      const h = getTerrainHeight(x, z)
      pos.setY(i, h)
      const t = (h + 2.5) / 5.5
      const rocky = Math.abs(Math.sin(x * 0.6) * Math.cos(z * 0.5)) * 0.5
      let col
      if (t < 0.2) col = moss.clone()
      else if (t > 0.7) col = rock.clone().lerp(stone, rocky)
      else col = base.clone().lerp(rock, rocky * 0.6)
      colors.push(col.r, col.g, col.b)
    }
    g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    g.computeVertexNormals()
    return g
  }, [])
  return (
    <mesh geometry={geo} receiveShadow>
      <meshStandardMaterial vertexColors roughness={0.95} metalness={0.02} emissive="#1a2a1a" emissiveIntensity={0.05} />
    </mesh>
  )
}

// Mossy stone pool
function StonePool({ position, radius = 2.5 }) {
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[radius, 24]} />
      <meshStandardMaterial color="#3a5a4a" emissive="#2a4a3a" emissiveIntensity={0.15} transparent opacity={0.7} roughness={0.3} depthWrite={false} />
    </mesh>
  )
}

// Thin reed
function Reed({ position, scale = 1 }) {
  const ref = useRef()
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.z = Math.sin(clock.getElapsedTime() * 0.4 + position[0]) * 0.08
  })
  return (
    <group ref={ref} position={position}>
      <mesh castShadow>
        <cylinderGeometry args={[scale * 0.04, scale * 0.06, scale * 2.2, 6]} />
        <meshStandardMaterial color="#8a9a6a" roughness={0.9} />
      </mesh>
      {/* Seed head */}
      <mesh position={[0, scale * 1.2, 0]} castShadow>
        <sphereGeometry args={[scale * 0.14, 7, 7]} />
        <meshStandardMaterial color="#6a7a5a" roughness={0.85} />
      </mesh>
    </group>
  )
}

// Mossy icosahedron boulder cluster
function MossyBoulder({ position, scale = 1 }) {
  return (
    <group position={position}>
      {[[0, 0, 0, scale], [-scale * 0.6, 0, scale * 0.4, scale * 0.7], [scale * 0.5, 0, -scale * 0.3, scale * 0.75]].map(([x, y, z, s], i) => (
        <mesh key={i} position={[x, y + s * 0.4, z]} castShadow>
          <icosahedronGeometry args={[s * 0.5, 1]} />
          <meshStandardMaterial color={i === 0 ? '#4a6a4a' : '#3a5a3a'} roughness={0.95} emissive="#2a4a2a" emissiveIntensity={0.05} />
        </mesh>
      ))}
    </group>
  )
}

// MINI-GAME: Knowledge Orb — floats and drifts upward in loops
// When player is close, show quiz; correct answer absorbs the orb
function KnowledgeOrb({ position, orbIndex, checkpointIndex, isAbsorbed, onAbsorb }) {
  const ref = useRef()
  const [showQuiz, setShowQuiz] = useState(false)
  const [answered, setAnswered] = useState(false)
  const [wrong, setWrong] = useState(false)
  const quiz = EDUCATION[checkpointIndex].quiz

  useFrame(({ clock }) => {
    if (!ref.current || isAbsorbed) return
    const t = clock.getElapsedTime() + orbIndex * 1.4
    ref.current.position.set(
      position[0] + Math.sin(t * 0.7 + orbIndex) * 1.2,
      position[1] + 1.2 + Math.sin(t * 0.9) * 0.45,
      position[2] + Math.cos(t * 0.7 + orbIndex) * 1.2
    )
    ref.current.material.emissiveIntensity = 0.4 + Math.sin(t * 2) * 0.2
    ref.current.scale.setScalar(1 + Math.sin(t * 2.5) * 0.08)
  })

  const handleAnswer = (i) => {
    if (i === quiz.answer) {
      setAnswered(true)
      setShowQuiz(false)
      setTimeout(() => onAbsorb(orbIndex), 300)
    } else {
      setWrong(true)
      setTimeout(() => setWrong(false), 800)
    }
  }

  if (isAbsorbed) return null
  return (
    <group>
      <mesh
        ref={ref}
        position={[position[0], position[1] + 1.2, position[2]]}
        onClick={() => setShowQuiz(true)}
      >
        <sphereGeometry args={[0.28, 12, 12]} />
        <meshStandardMaterial
          color={answered ? '#aaffaa' : '#ffdd66'}
          emissive={answered ? '#44ff44' : '#ffaa00'}
          emissiveIntensity={0.5}
          roughness={0.1}
          metalness={0.3}
          transparent
          opacity={0.88}
        />
        <pointLight color="#ffaa00" intensity={0.4} distance={3} />
      </mesh>

      {showQuiz && !answered && (
        <Html position={[position[0], position[1] + 3.2, position[2]]} center distanceFactor={9}>
          <div style={{
            background: 'rgba(10,15,10,0.95)', border: `1px solid ${ACCENT}77`,
            borderRadius: '6px', padding: '12px 14px', width: '220px',
            fontFamily: "'Space Mono',monospace", pointerEvents: 'auto',
          }}>
            <div style={{ fontSize: '7px', color: ACCENT, letterSpacing: '0.2em', marginBottom: '8px' }}>
              ◎ KNOWLEDGE CHECK
            </div>
            <div style={{ fontSize: '10px', color: '#e8f4ff', lineHeight: 1.4, marginBottom: '10px' }}>
              {quiz.question}
            </div>
            {quiz.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleAnswer(i)}
                style={{
                  display: 'block', width: '100%', marginBottom: '4px',
                  background: wrong ? 'rgba(255,68,68,0.2)' : 'rgba(255,170,0,0.1)',
                  border: `1px solid ${wrong ? '#ff4444' : ACCENT}44`,
                  color: wrong ? '#ff9999' : 'rgba(255,255,255,0.75)',
                  fontFamily: "'Space Mono',monospace", fontSize: '9px',
                  padding: '5px 8px', cursor: 'pointer', textAlign: 'left',
                  borderRadius: '3px', letterSpacing: '0.05em',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = `${ACCENT}22`}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,170,0,0.1)'}
              >
                {opt}
              </button>
            ))}
            <button onClick={() => setShowQuiz(false)} style={{ marginTop: '4px', fontSize: '7px', color: 'rgba(255,255,255,0.35)', background: 'transparent', border: 'none', cursor: 'pointer', letterSpacing: '0.1em', fontFamily: "'Space Mono',monospace" }}>
              CANCEL
            </button>
          </div>
        </Html>
      )}
    </group>
  )
}

// Checkpoint with knowledge orb quiz
function AethonCheckpoint({ position, eduData, isVisited, onCollect }) {
  const beaconRef = useRef()
  const ORBS_COUNT = 3
  const [absorbedOrbs, setAbsorbedOrbs] = useState([])
  const BEACON_COLOR = '#ffdd66'

  const handleOrbAbsorb = (i) => {
    const next = [...absorbedOrbs, i]
    setAbsorbedOrbs(next)
    if (next.length >= ORBS_COUNT) {
      setTimeout(() => onCollect(), 500)
    }
  }

  const orbBasePositions = useMemo(() => {
    return Array.from({ length: ORBS_COUNT }, (_, i) => {
      const a = (i / ORBS_COUNT) * Math.PI * 2
      return new THREE.Vector3(
        position.x + Math.cos(a) * 2.2,
        position.y,
        position.z + Math.sin(a) * 2.2
      )
    })
  }, [position.x, position.y, position.z])

  useFrame(({ clock }) => {
    if (beaconRef.current) {
      beaconRef.current.position.y = position.y + 0.9 + Math.sin(clock.getElapsedTime() * 1.4) * 0.18
      beaconRef.current.rotation.y += 0.018
    }
  })

  const color = isVisited ? '#888866' : BEACON_COLOR
  const allAbsorbed = absorbedOrbs.length >= ORBS_COUNT

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
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={isVisited ? 0.3 : allAbsorbed ? 2.5 : 1.4} roughness={0.1} metalness={0.6} transparent opacity={isVisited ? 0.45 : 0.95} />
      </mesh>
      <pointLight position={[position.x, position.y + 1, position.z]} color={color} intensity={isVisited ? 0.4 : allAbsorbed ? 3.5 : 1.8} distance={7} />

      {/* Knowledge orbs */}
      {!isVisited && orbBasePositions.map((orbPos, i) => (
        <KnowledgeOrb
          key={i}
          position={orbPos}
          orbIndex={i}
          checkpointIndex={eduData.id}
          isAbsorbed={absorbedOrbs.includes(i)}
          onAbsorb={handleOrbAbsorb}
        />
      ))}

      {!isVisited && (
        <Html position={[position.x, position.y + 3.2, position.z]} center distanceFactor={13}>
          <div style={{ fontFamily: "'Space Mono',monospace", textAlign: 'center', pointerEvents: 'none' }}>
            <div style={{ fontSize: '8px', letterSpacing: '0.18em', color: BEACON_COLOR, whiteSpace: 'nowrap', textShadow: `0 0 8px ${BEACON_COLOR}` }}>
              {eduData.degree.toUpperCase()}
            </div>
            {!allAbsorbed && (
              <div style={{ fontSize: '7px', color: 'rgba(255,220,100,0.6)', letterSpacing: '0.1em', marginTop: '2px' }}>
                ABSORB ORBS {absorbedOrbs.length}/{ORBS_COUNT}
              </div>
            )}
            {allAbsorbed && (
              <div style={{ fontSize: '7px', color: BEACON_COLOR, letterSpacing: '0.18em', marginTop: '2px', textShadow: `0 0 6px ${BEACON_COLOR}` }}>
                ◎ KNOWLEDGE ABSORBED
              </div>
            )}
          </div>
        </Html>
      )}
    </group>
  )
}

// Tiny erratic blob — zigzag
function ErraticBlob({ index, startPos, color, size = 0.28, alienPositionsRef }) {
  const groupRef = useRef()
  const pos = useRef(new THREE.Vector3(startPos[0], 0, startPos[2]))
  const dir = useRef(new THREE.Vector2(Math.random() - 0.5, Math.random() - 0.5).normalize())
  const nextChange = useRef(Math.random() * 2.5)
  const elapsed = useRef(0)

  useFrame((_, delta) => {
    elapsed.current += delta
    if (elapsed.current > nextChange.current) {
      dir.current.set(Math.random() - 0.5, Math.random() - 0.5).normalize()
      nextChange.current = elapsed.current + 1.5 + Math.random() * 1.5
    }
    const speed = 3.5
    pos.current.x += dir.current.x * speed * delta
    pos.current.z += dir.current.y * speed * delta
    const B = 35
    if (Math.abs(pos.current.x) > B) { pos.current.x = Math.sign(pos.current.x) * B; dir.current.x *= -1 }
    if (Math.abs(pos.current.z) > B) { pos.current.z = Math.sign(pos.current.z) * B; dir.current.y *= -1 }

    const wy = getTerrainHeight(pos.current.x, pos.current.z) + size * 0.85
    pos.current.y = wy

    if (groupRef.current) groupRef.current.position.copy(pos.current)
    if (alienPositionsRef?.current) alienPositionsRef.current[index] = pos.current.clone()
  })

  return (
    <group ref={groupRef}>
      <mesh castShadow>
        <sphereGeometry args={[size, 9, 8]} />
        <meshStandardMaterial color={color} roughness={0.85} emissive={color} emissiveIntensity={0.1} />
      </mesh>
      {[-1, 1].map(s => (
        <group key={s}>
          <mesh position={[s * size * 0.3, size * 0.25, size * 0.72]}>
            <sphereGeometry args={[size * 0.2, 6, 6]} />
            <meshStandardMaterial color="#e8e8d0" roughness={0.3} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function PlayerBall({ keysRef, onCheckpoint, visitedRef, onDamage, alienPositionsRef }) {
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
        if (pos.current.distanceTo(ap) < 0.38 + 0.35 + 0.3) {
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
      <meshStandardMaterial color="#e8eedd" emissive="#ffdd66" emissiveIntensity={0.5} roughness={0.2} metalness={0.5} />
      <pointLight color="#ffdd66" intensity={1.0} distance={4} />
    </mesh>
  )
}

function AethonScene({ keysRef, onCheckpoint, visitedRef, visited, onDamage, alienPositionsRef }) {
  const REEDS = useMemo(() => [
    [-5, -9, 0.9], [6, -11, 1.0], [13, 5, 0.85], [-13, 3, 1.1],
    [2, 17, 0.9], [-9, 15, 0.85], [17, -11, 1.0], [-3, -19, 0.9],
    [9, -17, 1.1], [-17, 9, 0.85], [20, 12, 0.9], [-19, -10, 0.95],
  ], [])

  const BOULDERS = useMemo(() => [
    [-7, -5, 0.9], [9, 4, 1.1], [-11, 6, 0.8], [4, 13, 1.0],
    [-5, 16, 0.9], [13, -7, 0.75], [-15, 1, 1.0], [0, -14, 1.1],
    [18, 5, 0.85], [-18, -7, 0.9],
  ], [])

  const POOLS = useMemo(() => [
    [[-6, -0.3, 2], 2.8], [[8, -0.3, -8], 2.2], [[-12, -0.3, -6], 1.8],
    [[4, -0.3, 14], 2.5], [[-1, -0.3, -14], 2.0],
  ], [])

  // 2-3 erratic tiny grey-green blobs
  const ALIENS = useMemo(() => [
    { start: [3, 0, 3], color: '#7a9a6a', sz: 0.28 },
    { start: [-9, 0, -5], color: '#6a8a5a', sz: 0.30 },
    { start: [11, 0, 8], color: '#8a9a7a', sz: 0.26 },
  ], [])

  return (
    <>
      <Sky distance={450000} sunPosition={[0.4, 0.3, 0.1]} turbidity={12} rayleigh={1.5} mieCoefficient={0.006} mieDirectionalG={0.8} />
      <ambientLight intensity={0.7} color="#b0c8a0" />
      <directionalLight position={[20, 25, 10]} intensity={1.1} color="#d0ddc0" castShadow shadow-mapSize={[1024, 1024]} shadow-camera-far={120} shadow-camera-left={-40} shadow-camera-right={40} shadow-camera-top={40} shadow-camera-bottom={-40} />
      <directionalLight position={[-15, 10, -15]} intensity={0.4} color="#aabbaa" />
      <hemisphereLight skyColor="#90aa80" groundColor="#5a7a5a" intensity={0.55} />
      <fog attach="fog" color="#8a9e7a" near={20} far={60} />

      <AncientTerrain />
      {POOLS.map(([pos, r], i) => <StonePool key={i} position={pos} radius={r} />)}

      {REEDS.map(([x, z, sc], i) => (
        <Reed key={i} position={[x, getTerrainHeight(x, z), z]} scale={sc} />
      ))}
      {BOULDERS.map(([x, z, sc], i) => (
        <MossyBoulder key={i} position={[x, getTerrainHeight(x, z), z]} scale={sc} />
      ))}

      {ALIENS.map((a, i) => (
        <ErraticBlob key={i} index={i} startPos={a.start} color={a.color} size={a.sz} alienPositionsRef={alienPositionsRef} />
      ))}

      {CHECKPOINT_POSITIONS.map((cp, i) => (
        <AethonCheckpoint
          key={i}
          position={cp}
          eduData={EDUCATION[i]}
          isVisited={visited[i]}
          onCollect={() => onCheckpoint(i)}
        />
      ))}

      <PlayerBall keysRef={keysRef} onCheckpoint={onCheckpoint} visitedRef={visitedRef} onDamage={onDamage} alienPositionsRef={alienPositionsRef} />
    </>
  )
}

function EduPopup({ edu, onClose }) {
  const [vis, setVis] = useState(false)
  useEffect(() => { const t = setTimeout(() => setVis(true), 30); return () => clearTimeout(t) }, [])
  if (!edu) return null
  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, background: 'rgba(10,20,10,0.55)', backdropFilter: 'blur(7px)', opacity: vis ? 1 : 0, transition: 'opacity 0.35s ease' }}>
      <div style={{ width: 'min(520px,90vw)', background: 'rgba(236,242,228,0.97)', border: `2px solid ${ACCENT}88`, borderRadius: '12px', padding: '32px 36px', boxShadow: `0 8px 60px ${ACCENT}44`, transform: vis ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.97)', transition: 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1)', fontFamily: "'Space Mono',monospace" }}>
        <div style={{ fontSize: '9px', letterSpacing: '0.35em', color: ACCENT, marginBottom: '12px' }}>◎ KNOWLEDGE ACQUIRED — {edu.period}</div>
        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '24px', fontWeight: 700, color: '#1a2a1a', marginBottom: '4px' }}>{edu.degree}</div>
        <div style={{ fontSize: '11px', color: ACCENT, letterSpacing: '0.12em', marginBottom: '18px' }}>{edu.institution}</div>
        <p style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '14px', color: '#2a3a2a', lineHeight: 1.7, marginBottom: '20px' }}>{edu.description}</p>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '26px' }}>
          {edu.tags.map(tag => (
            <span key={tag} style={{ fontSize: '9px', letterSpacing: '0.1em', color: '#1a2a1a', background: `${ACCENT}22`, border: `1px solid ${ACCENT}55`, padding: '4px 10px', borderRadius: '3px' }}>{tag}</span>
          ))}
        </div>
        <button onClick={onClose} style={{ background: ACCENT, border: 'none', color: '#1a2a1a', fontFamily: "'Space Mono',monospace", fontSize: '10px', letterSpacing: '0.2em', padding: '11px 28px', borderRadius: '4px', cursor: 'pointer' }}>
          CONTINUE EXPLORING →
        </button>
      </div>
    </div>
  )
}

function HealthBar({ health }) {
  const pct = Math.max(0, health) / 100
  const color = pct > 0.6 ? '#88cc66' : pct > 0.3 ? '#ffcc00' : '#ff4444'
  return (
    <div style={{ position: 'fixed', top: '24px', left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', zIndex: 100, pointerEvents: 'none' }}>
      <div style={{ fontFamily: "'Space Mono',monospace", fontSize: '8px', letterSpacing: '0.25em', color: '#4a6a4a' }}>KNOWLEDGE INTEGRITY</div>
      <div style={{ width: '160px', height: '10px', border: '1px solid rgba(74,106,74,0.5)', borderRadius: '3px', overflow: 'hidden', background: 'rgba(10,20,10,0.4)' }}>
        <div style={{ height: '100%', width: `${pct * 100}%`, background: color, boxShadow: `0 0 8px ${color}`, transition: 'width 0.2s ease, background 0.4s ease', borderRadius: '2px' }} />
      </div>
      <div style={{ fontFamily: "'Space Mono',monospace", fontSize: '8px', color, letterSpacing: '0.1em' }}>{Math.max(0, health)} HP</div>
    </div>
  )
}

function DeathScreen({ onRespawn }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(10,20,10,0.9)', backdropFilter: 'blur(8px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: "'Space Mono',monospace" }}>
      <div style={{ fontSize: '9px', letterSpacing: '0.5em', color: '#ff4444', marginBottom: '16px' }}>⚠ SIGNAL LOST</div>
      <div style={{ fontSize: '42px', fontWeight: 700, color: '#88cc66', letterSpacing: '0.04em', fontFamily: "'Space Grotesk',sans-serif", marginBottom: '32px' }}>LOST IN THE MIST</div>
      <button onClick={onRespawn} style={{ background: 'transparent', border: '2px solid #ffdd66', color: '#ffdd66', fontFamily: "'Space Mono',monospace", fontSize: '11px', letterSpacing: '0.3em', padding: '14px 40px', cursor: 'pointer', borderRadius: '4px', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#ffdd6622'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
        REAWAKEN
      </button>
    </div>
  )
}

function GameHUD({ visitedCount, total }) {
  return (
    <>
      <div style={{ position: 'fixed', bottom: '28px', right: '28px', fontFamily: "'Space Mono',monospace", fontSize: '10px', letterSpacing: '0.2em', color: '#4a6a4a', zIndex: 100, pointerEvents: 'none' }}>
        ◎ {visitedCount} / {total} LEARNED
      </div>
      <div style={{ position: 'fixed', bottom: '28px', left: '28px', fontFamily: "'Space Mono',monospace", fontSize: '9px', color: 'rgba(60,90,60,0.5)', letterSpacing: '0.15em', lineHeight: 1.9, zIndex: 100, pointerEvents: 'none' }}>
        W / S — MOVE &nbsp;·&nbsp; Q / E — ORBIT CAM<br />
        SPACE — JUMP &nbsp;·&nbsp; CLICK ORBS TO QUIZ
      </div>
    </>
  )
}

export default function EducationPage() {
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
    <div style={{ width: '100%', height: '100vh', background: '#3a4a3a', position: 'relative' }}>
      <button onClick={() => navigate('/')} style={{ position: 'fixed', top: '24px', left: '28px', background: 'rgba(200,215,185,0.7)', border: `1px solid ${ACCENT}88`, color: '#1a2a1a', fontFamily: "'Space Mono',monospace", fontSize: '10px', letterSpacing: '0.2em', padding: '8px 16px', cursor: 'pointer', zIndex: 100, borderRadius: '4px', backdropFilter: 'blur(4px)' }}>
        ← ORBIT
      </button>
      <div style={{ position: 'fixed', top: '24px', right: '28px', fontFamily: "'Space Mono',monospace", textAlign: 'right', zIndex: 100, pointerEvents: 'none' }}>
        <div style={{ fontSize: '9px', color: ACCENT, letterSpacing: '0.3em', fontWeight: 700 }}>EDUCATION</div>
        <div style={{ fontSize: '9px', color: '#88aa66', letterSpacing: '0.15em', marginTop: '2px' }}>PLANET AETHON</div>
      </div>

      <Canvas key={isDead ? 'dead' : 'alive'} camera={{ position: [0, 5, 12], fov: 60, near: 0.1, far: 500 }} shadows style={{ background: '#3a4a3a' }}>
        <Suspense fallback={null}>
          <AethonScene
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
      {activePopup !== null && <EduPopup edu={EDUCATION[activePopup]} onClose={closePopup} />}
      {isDead && <DeathScreen onRespawn={handleRespawn} />}
    </div>
  )
}