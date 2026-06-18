// import React, { useRef, useState, useEffect, useCallback, useMemo, Suspense } from 'react'
// import { useNavigate } from 'react-router-dom'
// import { Canvas, useFrame, useThree } from '@react-three/fiber'
// import { Html, Sky } from '@react-three/drei'
// import * as THREE from 'three'
// import { SECTIONS } from '../constants/sectionData'

// const section = SECTIONS.find((s) => s.id === 'work')
// const ACCENT = section?.color ?? '#00d4ff'

// const EXPERIENCES = [
//   {
//     id: 0,
//     role: 'Software Engineering Intern',
//     company: 'Tech Company Alpha',
//     period: 'Jun 2024 — Aug 2024',
//     tags: ['React', 'Python', 'AWS'],
//     description: 'Built internal tooling that reduced deployment time by 40%. Shipped a real-time monitoring dashboard used by 50+ engineers daily.',
//   },
//   {
//     id: 1,
//     role: 'Full Stack Developer',
//     company: 'Startup Beta',
//     period: 'Jan 2024 — May 2024',
//     tags: ['Next.js', 'PostgreSQL', 'Docker'],
//     description: 'Architected and launched a SaaS analytics platform from zero to first 200 customers in three months.',
//   },
//   {
//     id: 2,
//     role: 'Research Assistant',
//     company: 'University Lab',
//     period: 'Sep 2023 — Dec 2023',
//     tags: ['Python', 'ML', 'Research'],
//     description: 'Trained NLP models for low-resource language detection. Published findings presented at a departmental symposium.',
//   },
// ]

// const CHECKPOINT_POSITIONS = [
//   new THREE.Vector3(-10, 0.5, -8),
//   new THREE.Vector3(12,  0.5, -4),
//   new THREE.Vector3(2,   0.5, 14),
// ]

// function getTerrainHeight(x, z) {
//   return (
//     Math.sin(x * 0.18) * 1.1 +
//     Math.sin(z * 0.22) * 0.9 +
//     Math.cos((x - z) * 0.14) * 0.7 +
//     Math.sin(x * 0.45 + z * 0.3) * 0.35
//   )
// }

// function AlienTerrain() {
//   const geo = useMemo(() => {
//     const SIZE = 90, SEGS = 90
//     const g = new THREE.PlaneGeometry(SIZE, SIZE, SEGS, SEGS)
//     g.rotateX(-Math.PI / 2)
//     const pos = g.attributes.position
//     for (let i = 0; i < pos.count; i++) {
//       const x = pos.getX(i), z = pos.getZ(i)
//       pos.setY(i, getTerrainHeight(x, z))
//     }
//     g.computeVertexNormals()
//     return g
//   }, [])
//   return (
//     <mesh geometry={geo} receiveShadow>
//       <meshStandardMaterial color="#3ab5c8" roughness={0.85} metalness={0.0} emissive="#1a6e80" emissiveIntensity={0.08} />
//     </mesh>
//   )
// }

// function WaterPool({ position, radius = 3.5 }) {
//   const ref = useRef()
//   useFrame(({ clock }) => {
//     if (ref.current) ref.current.material.opacity = 0.72 + Math.sin(clock.getElapsedTime() * 0.8) * 0.06
//   })
//   return (
//     <mesh ref={ref} position={position} rotation={[-Math.PI / 2, 0, 0]}>
//       <circleGeometry args={[radius, 48]} />
//       <meshStandardMaterial color="#1ad4f5" emissive="#00aacc" emissiveIntensity={0.35} transparent opacity={0.75} roughness={0.05} metalness={0.3} depthWrite={false} />
//     </mesh>
//   )
// }

// function AlienTree({ position, scale = 1, colorStem = '#2ec4b6', colorCap = '#ff79c6' }) {
//   const capRef = useRef()
//   useFrame(({ clock }) => {
//     if (capRef.current) {
//       const t = clock.getElapsedTime() + position[0]
//       capRef.current.rotation.y = t * 0.25
//       capRef.current.position.y = scale * 1.65 + Math.sin(t * 0.6) * 0.05 * scale
//     }
//   })
//   return (
//     <group position={position}>
//       <mesh castShadow>
//         <cylinderGeometry args={[scale * 0.18, scale * 0.28, scale * 1.6, 8]} />
//         <meshStandardMaterial color={colorStem} roughness={0.7} />
//       </mesh>
//       <mesh ref={capRef} position={[0, scale * 1.65, 0]} castShadow>
//         <sphereGeometry args={[scale * 0.72, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.52]} />
//         <meshStandardMaterial color={colorCap} roughness={0.5} emissive={colorCap} emissiveIntensity={0.12} side={THREE.DoubleSide} />
//       </mesh>
//       {[0, 1, 2].map(i => {
//         const a = (i / 3) * Math.PI * 2
//         return (
//           <mesh key={i} position={[Math.cos(a) * scale * 0.38, scale * 1.72, Math.sin(a) * scale * 0.38]} castShadow>
//             <sphereGeometry args={[scale * 0.1, 8, 8]} />
//             <meshStandardMaterial color="#fffbe6" roughness={0.6} />
//           </mesh>
//         )
//       })}
//     </group>
//   )
// }

// function SpikePlant({ position, scale = 1 }) {
//   const groupRef = useRef()
//   useFrame(({ clock }) => {
//     if (groupRef.current) groupRef.current.rotation.z = Math.sin(clock.getElapsedTime() * 0.7 + position[0]) * 0.06
//   })
//   const spikes = useMemo(() => Array.from({ length: 5 }, (_, i) => {
//     const a = (i / 5) * Math.PI * 2
//     const r = scale * (0.18 + (i % 2) * 0.12)
//     return { x: Math.cos(a) * r, z: Math.sin(a) * r, h: scale * (0.9 + (i * 0.13)) }
//   }), [scale, position[0]])
//   return (
//     <group ref={groupRef} position={position}>
//       {spikes.map((s, i) => (
//         <group key={i} position={[s.x, 0, s.z]}>
//           <mesh castShadow>
//             <coneGeometry args={[scale * 0.07, s.h, 5]} />
//             <meshStandardMaterial color="#4fffb0" emissive="#00ff88" emissiveIntensity={0.35} roughness={0.4} />
//           </mesh>
//           <pointLight position={[0, s.h * 0.5, 0]} color="#00ff99" intensity={0.3} distance={2.5} />
//         </group>
//       ))}
//     </group>
//   )
// }

// function AlienBush({ position, color = '#26c9a8' }) {
//   return (
//     <group position={position}>
//       {[[0,0.22,0,0.32],[-0.28,0.15,0.1,0.24],[0.26,0.14,-0.08,0.22],[0.08,0.14,-0.3,0.2]].map(([x,y,z,r],i) => (
//         <mesh key={i} position={[x,y,z]} castShadow>
//           <sphereGeometry args={[r, 8, 8]} />
//           <meshStandardMaterial color={color} roughness={0.8} emissive={color} emissiveIntensity={0.05} />
//         </mesh>
//       ))}
//     </group>
//   )
// }

// function BlobAlien({ orbitCenter, orbitRadius, orbitSpeed, phase, color, size = 0.38 }) {
//   const groupRef = useRef()
//   const bodyRef  = useRef()
//   const shadowRef= useRef()

//   useFrame(({ clock }) => {
//     const t   = clock.getElapsedTime()
//     const ang = t * orbitSpeed + phase
//     const wx  = orbitCenter[0] + Math.cos(ang) * orbitRadius
//     const wz  = orbitCenter[2] + Math.sin(ang) * orbitRadius
//     const wy  = getTerrainHeight(wx, wz) + size * 0.82

//     if (groupRef.current) {
//       groupRef.current.position.set(wx, wy, wz)
//       groupRef.current.rotation.y = -ang + Math.PI * 0.5
//     }
//     if (bodyRef.current) {
//       const bounce = Math.abs(Math.sin(t * orbitSpeed * 6 + phase))
//       bodyRef.current.scale.set(1 + bounce * 0.12, 1 - bounce * 0.1, 1 + bounce * 0.12)
//     }
//     if (shadowRef.current) {
//       const bounce = Math.abs(Math.sin(t * orbitSpeed * 6 + phase))
//       shadowRef.current.position.set(wx, getTerrainHeight(wx, wz) + 0.02, wz)
//       shadowRef.current.scale.setScalar(size * (1.2 + bounce * 0.1))
//     }
//   })

//   return (
//     <>
//       <mesh ref={shadowRef} rotation={[-Math.PI / 2, 0, 0]}>
//         <circleGeometry args={[1, 16]} />
//         <meshBasicMaterial color="#000000" transparent opacity={0.15} depthWrite={false} />
//       </mesh>
//       <group ref={groupRef}>
//         <mesh ref={bodyRef} castShadow>
//           <sphereGeometry args={[size, 14, 10]} />
//           <meshStandardMaterial color={color} roughness={0.4} emissive={color} emissiveIntensity={0.2} />
//         </mesh>
//         {/* Left eye */}
//         <mesh position={[-size*0.35, size*0.42, size*0.72]}>
//           <sphereGeometry args={[size*0.22, 8, 8]} />
//           <meshStandardMaterial color="#ffffff" roughness={0.2} />
//         </mesh>
//         <mesh position={[-size*0.35, size*0.42, size*0.9]}>
//           <sphereGeometry args={[size*0.11, 8, 8]} />
//           <meshStandardMaterial color="#111122" roughness={0.1} />
//         </mesh>
//         {/* Right eye */}
//         <mesh position={[size*0.35, size*0.42, size*0.72]}>
//           <sphereGeometry args={[size*0.22, 8, 8]} />
//           <meshStandardMaterial color="#ffffff" roughness={0.2} />
//         </mesh>
//         <mesh position={[size*0.35, size*0.42, size*0.9]}>
//           <sphereGeometry args={[size*0.11, 8, 8]} />
//           <meshStandardMaterial color="#111122" roughness={0.1} />
//         </mesh>
//         {/* Antenna */}
//         <mesh position={[0, size*0.82, 0]}>
//           <cylinderGeometry args={[size*0.04, size*0.04, size*0.32, 5]} />
//           <meshStandardMaterial color="#cccccc" roughness={0.5} />
//         </mesh>
//         <mesh position={[0, size*1.08, 0]}>
//           <sphereGeometry args={[size*0.13, 7, 7]} />
//           <meshStandardMaterial color="#ffe066" emissive="#ffcc00" emissiveIntensity={0.7} roughness={0.2} />
//         </mesh>
//       </group>
//     </>
//   )
// }

// function Checkpoint({ position, expData, isVisited }) {
//   const beaconRef = useRef()
//   const ringRef   = useRef()
//   useFrame(({ clock }) => {
//     const t = clock.getElapsedTime()
//     if (beaconRef.current) {
//       beaconRef.current.position.y = position.y + 0.9 + Math.sin(t * 1.6) * 0.18
//       beaconRef.current.rotation.y = t * 1.4
//     }
//     if (ringRef.current) {
//       ringRef.current.rotation.z = t * 0.5
//       ringRef.current.material.opacity = isVisited ? 0.07 : 0.28 + Math.sin(t * 2.2) * 0.12
//     }
//   })
//   const color = isVisited ? '#aacccc' : '#ffe066'
//   return (
//     <group>
//       <mesh ref={ringRef} position={[position.x, position.y - 0.28, position.z]} rotation={[-Math.PI / 2, 0, 0]}>
//         <ringGeometry args={[1.0, 1.35, 32]} />
//         <meshBasicMaterial color={color} transparent opacity={0.28} side={THREE.DoubleSide} depthWrite={false} />
//       </mesh>
//       <mesh position={[position.x, position.y + 2.8, position.z]}>
//         <cylinderGeometry args={[0.035, 0.035, 5.6, 7]} />
//         <meshBasicMaterial color={color} transparent opacity={isVisited ? 0.1 : 0.38} />
//       </mesh>
//       <mesh ref={beaconRef} position={[position.x, position.y + 0.9, position.z]} castShadow>
//         <octahedronGeometry args={[0.38, 0]} />
//         <meshStandardMaterial color={color} emissive={color} emissiveIntensity={isVisited ? 0.3 : 1.8} roughness={0.1} metalness={0.7} transparent opacity={isVisited ? 0.45 : 0.95} />
//       </mesh>
//       <pointLight position={[position.x, position.y + 1, position.z]} color={color} intensity={isVisited ? 0.4 : 2.2} distance={7} />
//       {!isVisited && (
//         <Html position={[position.x, position.y + 2.6, position.z]} center distanceFactor={13}>
//           <div style={{ fontFamily:"'Space Mono',monospace", fontSize:'8px', letterSpacing:'0.18em', color:'#ffe066', whiteSpace:'nowrap', pointerEvents:'none', textShadow:'0 0 8px #ffcc00' }}>
//             ★ {expData.company.toUpperCase()}
//           </div>
//         </Html>
//       )}
//     </group>
//   )
// }

// const BALL_RADIUS = 0.38
// const SPEED = 7
// const GRAVITY = 20
// const JUMP_VEL = 7.5
// const FRICTION = 0.80

// function PlayerBall({ keysRef, onCheckpoint, visitedRef }) {
//   const meshRef  = useRef()
//   const vel      = useRef(new THREE.Vector3())
//   const pos      = useRef(new THREE.Vector3(0, 3, 5))
//   const onGround = useRef(false)
//   const camYaw   = useRef(0)
//   const { camera } = useThree()

//   useFrame((_, delta) => {
//     const dt = Math.min(delta, 0.05)
//     const keys = keysRef.current

//     if (keys['q'] || keys['arrowleft'])  camYaw.current += dt * 1.5
//     if (keys['e'] || keys['arrowright']) camYaw.current -= dt * 1.5

//     const fwd  = new THREE.Vector3(-Math.sin(camYaw.current), 0, -Math.cos(camYaw.current))
//     const move = new THREE.Vector3()
//     if (keys['w'] || keys['arrowup'])   move.addScaledVector(fwd,  1)
//     if (keys['s'] || keys['arrowdown']) move.addScaledVector(fwd, -1)
//     if (move.lengthSq() > 0) move.normalize()

//     const accel = onGround.current ? 4.5 : 1.6
//     vel.current.x += move.x * SPEED * dt * accel
//     vel.current.z += move.z * SPEED * dt * accel

//     if ((keys[' '] || keys['space']) && onGround.current) {
//       vel.current.y = JUMP_VEL
//       onGround.current = false
//     }

//     vel.current.y -= GRAVITY * dt

//     if (onGround.current) {
//       vel.current.x *= Math.pow(FRICTION, dt * 60)
//       vel.current.z *= Math.pow(FRICTION, dt * 60)
//     }

//     const hSpd = Math.hypot(vel.current.x, vel.current.z)
//     if (hSpd > SPEED) {
//       vel.current.x = (vel.current.x / hSpd) * SPEED
//       vel.current.z = (vel.current.z / hSpd) * SPEED
//     }

//     pos.current.addScaledVector(vel.current, dt)
//     const gY = getTerrainHeight(pos.current.x, pos.current.z) + BALL_RADIUS
//     if (pos.current.y <= gY) {
//       pos.current.y = gY
//       if (vel.current.y < 0) vel.current.y = 0
//       onGround.current = true
//     } else {
//       onGround.current = false
//     }

//     const B = 40
//     if (Math.abs(pos.current.x) > B) { pos.current.x = Math.sign(pos.current.x) * B; vel.current.x *= -0.4 }
//     if (Math.abs(pos.current.z) > B) { pos.current.z = Math.sign(pos.current.z) * B; vel.current.z *= -0.4 }

//     const rollAxis = new THREE.Vector3(-vel.current.z, 0, vel.current.x).normalize()
//     const rollDist = Math.hypot(vel.current.x, vel.current.z) * dt / BALL_RADIUS
//     if (rollDist > 0.001 && meshRef.current) meshRef.current.rotateOnWorldAxis(rollAxis, rollDist)
//     if (meshRef.current) meshRef.current.position.copy(pos.current)

//     const camTarget = new THREE.Vector3(
//       pos.current.x - Math.sin(camYaw.current) * 7,
//       pos.current.y + 3.8,
//       pos.current.z - Math.cos(camYaw.current) * 7,
//     )
//     camera.position.lerp(camTarget, dt * 6)
//     camera.lookAt(pos.current.x, pos.current.y + 0.5, pos.current.z)

//     CHECKPOINT_POSITIONS.forEach((cp, i) => {
//       if (visitedRef.current[i]) return
//       if (pos.current.distanceTo(cp) < 1.65) {
//         visitedRef.current[i] = true
//         onCheckpoint(i)
//       }
//     })
//   })

//   return (
//     <mesh ref={meshRef} castShadow position={[0, 3, 5]}>
//       <icosahedronGeometry args={[BALL_RADIUS, 3]} />
//       <meshStandardMaterial color="#ffffff" emissive="#ffaa44" emissiveIntensity={0.5} roughness={0.2} metalness={0.7} />
//       <pointLight color="#ffcc88" intensity={1.0} distance={4} />
//     </mesh>
//   )
// }

// function AlienScene({ keysRef, onCheckpoint, visitedRef, visited }) {
//   const TREES = useMemo(() => [
//     [-6,-10,1.2,'#2ec4b6','#ff79c6'],[5,-12,0.9,'#1aad96','#f72585'],
//     [14,6,1.4,'#2dd4bf','#c77dff'],[-14,4,1.0,'#26a69a','#ff9ef5'],
//     [1,18,1.1,'#22d3ee','#ff6eb4'],[-10,16,0.85,'#2ec4b6','#e040fb'],
//     [18,-12,1.3,'#1de9b6','#ff4fc8'],[-2,-20,1.0,'#26c6da','#ba68c8'],
//     [8,-18,1.0,'#2ec4b6','#f06292'],[-18,10,1.1,'#1de9b6','#ce93d8'],
//   ], [])

//   const SPIKES = useMemo(() => [
//     [-4,-5,0.9],[8,5,1.1],[-12,-2,0.8],[3,10,1.0],[16,-6,1.2],[-7,14,0.7],[12,14,0.9],[-16,-10,1.0],
//   ], [])

//   const BUSHES = useMemo(() => [
//     [-3,-8,'#26c9a8'],[6,3,'#4fffb0'],[-9,7,'#00e5cc'],[11,12,'#2af5b0'],
//     [-15,-6,'#00ddb3'],[3,-14,'#1de9b6'],[17,2,'#26c9a8'],[-5,17,'#00e5cc'],
//     [7,-7,'#4fffb0'],[-11,12,'#26c9a8'],
//   ], [])

//   const POOLS = useMemo(() => [
//     [[-7,-0.3,3],3.2],[[9,-0.3,-9],2.6],[[-13,-0.3,-8],2.0],[[5,-0.3,16],2.8],[[-2,-0.3,-16],2.2],
//   ], [])

//   const ALIENS = useMemo(() => [
//     { center:[0,0,0],    r:6,   spd:0.35, ph:0,              color:'#ff79c6', sz:0.38 },
//     { center:[-8,0,5],   r:3,   spd:0.55, ph:Math.PI,        color:'#c77dff', sz:0.30 },
//     { center:[10,0,-5],  r:4,   spd:0.42, ph:Math.PI*0.5,    color:'#ffd166', sz:0.42 },
//     { center:[3,0,12],   r:3.5, spd:0.48, ph:Math.PI*1.2,    color:'#06d6a0', sz:0.34 },
//     { center:[-12,0,-3], r:2.8, spd:0.60, ph:Math.PI*0.7,    color:'#f4a261', sz:0.29 },
//     { center:[6,0,8],    r:2.5, spd:0.50, ph:Math.PI*1.8,    color:'#48cae4', sz:0.36 },
//     { center:[-5,0,-12], r:3.2, spd:0.38, ph:Math.PI*0.3,    color:'#ff9ef5', sz:0.40 },
//     { center:[14,0,8],   r:2.2, spd:0.65, ph:Math.PI*1.5,    color:'#ffe066', sz:0.28 },
//   ], [])

//   return (
//     <>
//       <Sky distance={450000} sunPosition={[1,0.6,0.2]} turbidity={3} rayleigh={0.6} mieCoefficient={0.003} mieDirectionalG={0.9} />
//       <ambientLight intensity={1.2} color="#c8f0f8" />
//       <directionalLight position={[30,45,20]} intensity={2.2} color="#fffde7" castShadow shadow-mapSize={[1024,1024]} shadow-camera-far={120} shadow-camera-left={-40} shadow-camera-right={40} shadow-camera-top={40} shadow-camera-bottom={-40} />
//       <directionalLight position={[-25,20,-30]} intensity={0.5} color="#ffcc88" />
//       <hemisphereLight skyColor="#b2f0f8" groundColor="#3ab5c8" intensity={0.6} />

//       <AlienTerrain />
//       {POOLS.map(([pos,r],i) => <WaterPool key={i} position={pos} radius={r} />)}

//       {TREES.map(([x,z,sc,sc2,cc],i) => (
//         <AlienTree key={i} position={[x, getTerrainHeight(x,z)+sc*0.1, z]} scale={sc} colorStem={sc2} colorCap={cc} />
//       ))}
//       {SPIKES.map(([x,z,sc],i) => (
//         <SpikePlant key={i} position={[x, getTerrainHeight(x,z), z]} scale={sc} />
//       ))}
//       {BUSHES.map(([x,z,col],i) => (
//         <AlienBush key={i} position={[x, getTerrainHeight(x,z), z]} color={col} />
//       ))}

//       {ALIENS.map((a,i) => (
//         <BlobAlien key={i} orbitCenter={a.center} orbitRadius={a.r} orbitSpeed={a.spd} phase={a.ph} color={a.color} size={a.sz} />
//       ))}

//       {CHECKPOINT_POSITIONS.map((cp,i) => (
//         <Checkpoint key={i} position={cp} expData={EXPERIENCES[i]} isVisited={visited[i]} onCollect={() => onCheckpoint(i)} />
//       ))}

//       <PlayerBall keysRef={keysRef} onCheckpoint={onCheckpoint} visitedRef={visitedRef} />
//     </>
//   )
// }

// function ExperiencePopup({ exp, onClose }) {
//   const [vis, setVis] = useState(false)
//   useEffect(() => { const t = setTimeout(() => setVis(true), 30); return () => clearTimeout(t) }, [])
//   if (!exp) return null
//   return (
//     <div style={{ position:'fixed', inset:0, display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, background:'rgba(0,40,60,0.45)', backdropFilter:'blur(6px)', opacity:vis?1:0, transition:'opacity 0.35s ease' }}>
//       <div style={{ width:'min(520px,90vw)', background:'rgba(230,250,255,0.97)', border:`2px solid ${ACCENT}88`, borderRadius:'12px', padding:'32px 36px', boxShadow:`0 8px 60px ${ACCENT}44`, transform:vis?'translateY(0) scale(1)':'translateY(24px) scale(0.97)', transition:'transform 0.4s cubic-bezier(0.34,1.56,0.64,1)', fontFamily:"'Space Mono',monospace" }}>
//         <div style={{ fontSize:'9px', letterSpacing:'0.35em', color:ACCENT, marginBottom:'16px' }}>★ CHECKPOINT — {exp.period}</div>
//         <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:'22px', fontWeight:700, color:'#0a2a3a', marginBottom:'4px' }}>{exp.role}</div>
//         <div style={{ fontSize:'11px', color:ACCENT, letterSpacing:'0.12em', marginBottom:'18px' }}>{exp.company}</div>
//         <p style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:'14px', color:'#1a4a5a', lineHeight:1.7, marginBottom:'20px' }}>{exp.description}</p>
//         <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', marginBottom:'26px' }}>
//           {exp.tags.map(tag => (
//             <span key={tag} style={{ fontSize:'9px', letterSpacing:'0.1em', color:'#0a2a3a', background:`${ACCENT}22`, border:`1px solid ${ACCENT}55`, padding:'4px 10px', borderRadius:'3px' }}>{tag}</span>
//           ))}
//         </div>
//         <button onClick={onClose} style={{ background:ACCENT, border:'none', color:'#ffffff', fontFamily:"'Space Mono',monospace", fontSize:'10px', letterSpacing:'0.2em', padding:'11px 28px', borderRadius:'4px', cursor:'pointer', transition:'opacity 0.2s' }} onMouseEnter={e=>e.currentTarget.style.opacity='0.82'} onMouseLeave={e=>e.currentTarget.style.opacity='1'}>
//           CONTINUE EXPLORING →
//         </button>
//       </div>
//     </div>
//   )
// }

// function GameHUD({ visitedCount, total }) {
//   return (
//     <>
//       <div style={{ position:'fixed', bottom:'28px', right:'28px', fontFamily:"'Space Mono',monospace", fontSize:'10px', letterSpacing:'0.2em', color:'#005f75', zIndex:100, pointerEvents:'none' }}>
//         ★ {visitedCount} / {total} FOUND
//       </div>
//       <div style={{ position:'fixed', bottom:'28px', left:'28px', fontFamily:"'Space Mono',monospace", fontSize:'9px', color:'rgba(5,40,60,0.55)', letterSpacing:'0.15em', lineHeight:1.9, zIndex:100, pointerEvents:'none' }}>
//         W / S — MOVE &nbsp;·&nbsp; Q / E — ORBIT CAM<br />
//         SPACE — JUMP &nbsp;·&nbsp; REACH THE BEACONS
//       </div>
//     </>
//   )
// }

// export default function WorkPage() {
//   const navigate   = useNavigate()
//   const keysRef    = useRef({})
//   const visitedRef = useRef(CHECKPOINT_POSITIONS.map(() => false))
//   const [visited,     setVisited]    = useState(CHECKPOINT_POSITIONS.map(() => false))
//   const [activePopup, setActivePopup] = useState(null)

//   useEffect(() => {
//     const down = (e) => {
//       keysRef.current[e.key.toLowerCase()] = true
//       if ([' ','arrowup','arrowdown','arrowleft','arrowright'].includes(e.key.toLowerCase())) e.preventDefault()
//     }
//     const up = (e) => { keysRef.current[e.key.toLowerCase()] = false }
//     window.addEventListener('keydown', down)
//     window.addEventListener('keyup', up)
//     return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up) }
//   }, [])

//   const handleCheckpoint = useCallback((index) => {
//     visitedRef.current[index] = true
//     setVisited(v => { const n=[...v]; n[index]=true; return n })
//     setActivePopup(index)
//   }, [])

//   const closePopup = useCallback(() => setActivePopup(null), [])

//   return (
//     <div style={{ width:'100%', height:'100vh', background:'#a8edf5', position:'relative' }}>
//       <button onClick={() => navigate('/')} style={{ position:'fixed', top:'24px', left:'28px', background:'rgba(255,255,255,0.75)', border:`1px solid ${ACCENT}88`, color:'#0a4a5a', fontFamily:"'Space Mono',monospace", fontSize:'10px', letterSpacing:'0.2em', padding:'8px 16px', cursor:'pointer', zIndex:100, borderRadius:'4px', backdropFilter:'blur(4px)' }} onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.95)'} onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.75)'}>
//         ← ORBIT
//       </button>
//       <div style={{ position:'fixed', top:'24px', right:'28px', fontFamily:"'Space Mono',monospace", textAlign:'right', zIndex:100, pointerEvents:'none' }}>
//         <div style={{ fontSize:'9px', color:'#005f75', letterSpacing:'0.3em', fontWeight:700 }}>WORK</div>
//         <div style={{ fontSize:'9px', color:'#338899', letterSpacing:'0.15em', marginTop:'2px' }}>PLANET KEPLER-W</div>
//       </div>
//       <Canvas camera={{ position:[0,5,12], fov:60, near:0.1, far:500 }} shadows style={{ background:'#a8edf5' }}>
//         <Suspense fallback={null}>
//           <AlienScene keysRef={keysRef} onCheckpoint={handleCheckpoint} visitedRef={visitedRef} visited={visited} />
//         </Suspense>
//       </Canvas>
//       <GameHUD visitedCount={visited.filter(Boolean).length} total={CHECKPOINT_POSITIONS.length} />
//       {activePopup !== null && <ExperiencePopup exp={EXPERIENCES[activePopup]} onClose={closePopup} />}
//     </div>
//   )
// }
import React, { useRef, useState, useEffect, useCallback, useMemo, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Html, Sky } from '@react-three/drei'
import * as THREE from 'three'
import { SECTIONS } from '../constants/sectionData'

const section = SECTIONS.find((s) => s.id === 'work')
const ACCENT = section?.color ?? '#00d4ff'

const EXPERIENCES = [
  {
    id: 0,
    role: 'Software Engineering Intern',
    company: 'Tech Company Alpha',
    period: 'Jun 2024 — Aug 2024',
    tags: ['React', 'Python', 'AWS'],
    description: 'Built internal tooling that reduced deployment time by 40%. Shipped a real-time monitoring dashboard used by 50+ engineers daily.',
  },
  {
    id: 1,
    role: 'Full Stack Developer',
    company: 'Startup Beta',
    period: 'Jan 2024 — May 2024',
    tags: ['Next.js', 'PostgreSQL', 'Docker'],
    description: 'Architected and launched a SaaS analytics platform from zero to first 200 customers in three months.',
  },
  {
    id: 2,
    role: 'Research Assistant',
    company: 'University Lab',
    period: 'Sep 2023 — Dec 2023',
    tags: ['Python', 'ML', 'Research'],
    description: 'Trained NLP models for low-resource language detection. Published findings presented at a departmental symposium.',
  },
]

const CHECKPOINT_POSITIONS = [
  new THREE.Vector3(-10, 0.5, -8),
  new THREE.Vector3(12, 0.5, -4),
  new THREE.Vector3(2, 0.5, 14),
]

const BALL_RADIUS = 0.38
const SPEED = 7
const GRAVITY = 20
const JUMP_VEL = 7.5
const FRICTION = 0.80
const ALIEN_DAMAGE = 15
const INVINCIBILITY_DURATION = 1.5

// Richer terrain: layered sine waves + ridge noise + micro-bumps
function getTerrainHeight(x, z) {
  return (
    Math.sin(x * 0.15) * 1.4 +
    Math.sin(z * 0.18) * 1.1 +
    Math.cos((x - z) * 0.12) * 0.85 +
    Math.sin(x * 0.38 + z * 0.27) * 0.45 +
    Math.cos(x * 0.55) * Math.sin(z * 0.55) * 0.3 +
    Math.sin(x * 0.9 + z * 1.1) * 0.12   // micro-bumps
  )
}

// Vertex-colored terrain with biome zones
function AlienTerrain() {
  const geo = useMemo(() => {
    const SIZE = 90, SEGS = 110
    const g = new THREE.PlaneGeometry(SIZE, SIZE, SEGS, SEGS)
    g.rotateX(-Math.PI / 2)
    const pos = g.attributes.position
    const colors = []
    const colorA = new THREE.Color('#3ab5c8')   // base cerulean
    const colorB = new THREE.Color('#1a7a90')   // deeper teal valleys
    const colorC = new THREE.Color('#5cd6e8')   // bright ridges
    const colorD = new THREE.Color('#2ec9a0')   // mint patches

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i)
      const h = getTerrainHeight(x, z)
      pos.setY(i, h)

      // Blend color by height + position noise
      const t = (h + 2.5) / 5.0
      const patch = Math.sin(x * 0.3) * Math.cos(z * 0.3)
      let col
      if (t < 0.25) col = colorB.clone()
      else if (t < 0.55) col = colorA.clone().lerp(colorD, patch * 0.5 + 0.5)
      else col = colorA.clone().lerp(colorC, (t - 0.55) / 0.45)

      colors.push(col.r, col.g, col.b)
    }
    g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    g.computeVertexNormals()
    return g
  }, [])

  return (
    <mesh geometry={geo} receiveShadow>
      <meshStandardMaterial
        vertexColors
        roughness={0.82}
        metalness={0.05}
        emissive="#0d4a55"
        emissiveIntensity={0.06}
      />
    </mesh>
  )
}

function WaterPool({ position, radius = 3.5 }) {
  const ref = useRef()
  useFrame(({ clock }) => {
    if (ref.current) ref.current.material.opacity = 0.72 + Math.sin(clock.getElapsedTime() * 0.8) * 0.06
  })
  return (
    <mesh ref={ref} position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[radius, 48]} />
      <meshStandardMaterial color="#1ad4f5" emissive="#00aacc" emissiveIntensity={0.35} transparent opacity={0.75} roughness={0.05} metalness={0.3} depthWrite={false} />
    </mesh>
  )
}

// Improved mushroom tree: better cap shape, layered frills, glowing spores
function AlienTree({ position, scale = 1, colorStem = '#2ec4b6', colorCap = '#ff79c6' }) {
  const capRef = useRef()
  const sporesRef = useRef([])
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() + position[0]
    if (capRef.current) {
      capRef.current.rotation.y = t * 0.18
    }
    sporesRef.current.forEach((s, i) => {
      if (s) {
        const st = t + i * 1.1
        s.position.y = scale * 2.2 + ((st * 0.4) % (scale * 1.5))
        s.material.opacity = Math.sin(st * 2) * 0.4 + 0.4
      }
    })
  })
  return (
    <group position={position}>
      {/* Tapered trunk with slight curve feel */}
      <mesh castShadow>
        <cylinderGeometry args={[scale * 0.14, scale * 0.32, scale * 1.8, 10]} />
        <meshStandardMaterial color={colorStem} roughness={0.75} />
      </mesh>
      {/* Under-gills ring */}
      <mesh position={[0, scale * 1.72, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[scale * 0.3, scale * 0.85, 24]} />
        <meshStandardMaterial color={colorCap} emissive={colorCap} emissiveIntensity={0.25} side={THREE.DoubleSide} transparent opacity={0.65} />
      </mesh>
      {/* Main dome cap */}
      <mesh ref={capRef} position={[0, scale * 1.82, 0]} castShadow>
        <sphereGeometry args={[scale * 0.88, 18, 10, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
        <meshStandardMaterial color={colorCap} roughness={0.45} emissive={colorCap} emissiveIntensity={0.15} side={THREE.DoubleSide} />
      </mesh>
      {/* Spot dots on cap */}
      {[0, 1, 2, 3].map(i => {
        const a = (i / 4) * Math.PI * 2 + 0.4
        const r = scale * 0.42
        return (
          <mesh key={i} position={[Math.cos(a) * r, scale * 2.05, Math.sin(a) * r]} castShadow>
            <sphereGeometry args={[scale * 0.085, 7, 7]} />
            <meshStandardMaterial color="#fffbe6" emissive="#fffbe6" emissiveIntensity={0.5} roughness={0.4} />
          </mesh>
        )
      })}
      {/* Floating spores */}
      {[0, 1, 2].map((i, idx) => {
        const a = (i / 3) * Math.PI * 2
        return (
          <mesh
            key={`sp${i}`}
            ref={el => sporesRef.current[idx] = el}
            position={[Math.cos(a) * scale * 0.5, scale * 2.2, Math.sin(a) * scale * 0.5]}
          >
            <sphereGeometry args={[scale * 0.055, 6, 6]} />
            <meshStandardMaterial color={colorCap} emissive={colorCap} emissiveIntensity={1.2} transparent opacity={0.7} />
          </mesh>
        )
      })}
      <pointLight position={[0, scale * 1.8, 0]} color={colorCap} intensity={0.4 * scale} distance={3.5 * scale} />
    </group>
  )
}

function SpikePlant({ position, scale = 1 }) {
  const groupRef = useRef()
  useFrame(({ clock }) => {
    if (groupRef.current) groupRef.current.rotation.z = Math.sin(clock.getElapsedTime() * 0.7 + position[0]) * 0.06
  })
  const spikes = useMemo(() => Array.from({ length: 6 }, (_, i) => {
    const a = (i / 6) * Math.PI * 2
    const r = scale * (0.16 + (i % 3) * 0.09)
    return { x: Math.cos(a) * r, z: Math.sin(a) * r, h: scale * (0.7 + i * 0.15) }
  }), [scale, position[0]])
  return (
    <group ref={groupRef} position={position}>
      {spikes.map((s, i) => (
        <group key={i} position={[s.x, 0, s.z]}>
          <mesh castShadow>
            <coneGeometry args={[scale * 0.065, s.h, 5]} />
            <meshStandardMaterial color="#4fffb0" emissive="#00ff88" emissiveIntensity={0.4} roughness={0.35} />
          </mesh>
        </group>
      ))}
      <pointLight position={[0, scale * 0.5, 0]} color="#00ff99" intensity={0.25} distance={2.5} />
    </group>
  )
}

function AlienBush({ position, color = '#26c9a8' }) {
  return (
    <group position={position}>
      {[[0, 0.22, 0, 0.32], [-0.28, 0.15, 0.1, 0.24], [0.26, 0.14, -0.08, 0.22], [0.08, 0.14, -0.3, 0.2]].map(([x, y, z, r], i) => (
        <mesh key={i} position={[x, y, z]} castShadow>
          <sphereGeometry args={[r, 8, 8]} />
          <meshStandardMaterial color={color} roughness={0.8} emissive={color} emissiveIntensity={0.08} />
        </mesh>
      ))}
    </group>
  )
}

// Coral fan — extra flora for Kepler-W
function CoralFan({ position, color = '#ff79c6', scale = 1 }) {
  const ref = useRef()
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.z = Math.sin(clock.getElapsedTime() * 0.5 + position[0]) * 0.08
  })
  return (
    <group ref={ref} position={position}>
      {[0, 1, 2, 3, 4].map(i => {
        const a = ((i / 4) - 0.5) * Math.PI * 0.7
        return (
          <mesh key={i} position={[Math.sin(a) * scale * 0.3, scale * 0.5, 0]} rotation={[0, 0, a]} castShadow>
            <planeGeometry args={[scale * 0.18, scale * 1.1]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.2} side={THREE.DoubleSide} transparent opacity={0.85} />
          </mesh>
        )
      })}
    </group>
  )
}

// Alien blob — reduced to 3, writes position to shared ref
function BlobAlien({ index, orbitCenter, orbitRadius, orbitSpeed, phase, color, size = 0.38, alienPositionsRef }) {
  const groupRef = useRef()
  const bodyRef = useRef()
  const shadowRef = useRef()

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    const ang = t * orbitSpeed + phase
    const wx = orbitCenter[0] + Math.cos(ang) * orbitRadius
    const wz = orbitCenter[2] + Math.sin(ang) * orbitRadius
    const wy = getTerrainHeight(wx, wz) + size * 0.82

    if (groupRef.current) {
      groupRef.current.position.set(wx, wy, wz)
      groupRef.current.rotation.y = -ang + Math.PI * 0.5
    }
    // Write world position to shared ref for collision detection
    if (alienPositionsRef?.current) {
      alienPositionsRef.current[index] = new THREE.Vector3(wx, wy, wz)
    }
    const bounce = Math.abs(Math.sin(t * orbitSpeed * 6 + phase))
    if (bodyRef.current) bodyRef.current.scale.set(1 + bounce * 0.12, 1 - bounce * 0.1, 1 + bounce * 0.12)
    if (shadowRef.current) {
      shadowRef.current.position.set(wx, getTerrainHeight(wx, wz) + 0.02, wz)
      shadowRef.current.scale.setScalar(size * (1.2 + bounce * 0.1))
    }
  })

  return (
    <>
      <mesh ref={shadowRef} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1, 16]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.15} depthWrite={false} />
      </mesh>
      <group ref={groupRef}>
        <mesh ref={bodyRef} castShadow>
          <sphereGeometry args={[size, 14, 10]} />
          <meshStandardMaterial color={color} roughness={0.4} emissive={color} emissiveIntensity={0.22} />
        </mesh>
        <mesh position={[-size * 0.35, size * 0.42, size * 0.72]}>
          <sphereGeometry args={[size * 0.22, 8, 8]} />
          <meshStandardMaterial color="#ffffff" roughness={0.2} />
        </mesh>
        <mesh position={[-size * 0.35, size * 0.42, size * 0.9]}>
          <sphereGeometry args={[size * 0.11, 8, 8]} />
          <meshStandardMaterial color="#111122" roughness={0.1} />
        </mesh>
        <mesh position={[size * 0.35, size * 0.42, size * 0.72]}>
          <sphereGeometry args={[size * 0.22, 8, 8]} />
          <meshStandardMaterial color="#ffffff" roughness={0.2} />
        </mesh>
        <mesh position={[size * 0.35, size * 0.42, size * 0.9]}>
          <sphereGeometry args={[size * 0.11, 8, 8]} />
          <meshStandardMaterial color="#111122" roughness={0.1} />
        </mesh>
        <mesh position={[0, size * 0.82, 0]}>
          <cylinderGeometry args={[size * 0.04, size * 0.04, size * 0.32, 5]} />
          <meshStandardMaterial color="#cccccc" roughness={0.5} />
        </mesh>
        <mesh position={[0, size * 1.08, 0]}>
          <sphereGeometry args={[size * 0.13, 7, 7]} />
          <meshStandardMaterial color="#ffe066" emissive="#ffcc00" emissiveIntensity={0.7} roughness={0.2} />
        </mesh>
      </group>
    </>
  )
}

function Checkpoint({ position, expData, isVisited }) {
  const beaconRef = useRef()
  const ringRef = useRef()
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    if (beaconRef.current) {
      beaconRef.current.position.y = position.y + 0.9 + Math.sin(t * 1.6) * 0.18
      beaconRef.current.rotation.y = t * 1.4
    }
    if (ringRef.current) {
      ringRef.current.rotation.z = t * 0.5
      ringRef.current.material.opacity = isVisited ? 0.07 : 0.28 + Math.sin(t * 2.2) * 0.12
    }
  })
  const color = isVisited ? '#aacccc' : '#ffe066'
  return (
    <group>
      <mesh ref={ringRef} position={[position.x, position.y - 0.28, position.z]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.0, 1.35, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.28} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh position={[position.x, position.y + 2.8, position.z]}>
        <cylinderGeometry args={[0.035, 0.035, 5.6, 7]} />
        <meshBasicMaterial color={color} transparent opacity={isVisited ? 0.1 : 0.38} />
      </mesh>
      <mesh ref={beaconRef} position={[position.x, position.y + 0.9, position.z]} castShadow>
        <octahedronGeometry args={[0.38, 0]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={isVisited ? 0.3 : 1.8} roughness={0.1} metalness={0.7} transparent opacity={isVisited ? 0.45 : 0.95} />
      </mesh>
      <pointLight position={[position.x, position.y + 1, position.z]} color={color} intensity={isVisited ? 0.4 : 2.2} distance={7} />
      {!isVisited && (
        <Html position={[position.x, position.y + 2.6, position.z]} center distanceFactor={13}>
          <div style={{ fontFamily: "'Space Mono',monospace", fontSize: '8px', letterSpacing: '0.18em', color: '#ffe066', whiteSpace: 'nowrap', pointerEvents: 'none', textShadow: '0 0 8px #ffcc00' }}>
            ★ {expData.company.toUpperCase()}
          </div>
        </Html>
      )}
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

    // Checkpoint collision
    CHECKPOINT_POSITIONS.forEach((cp, i) => {
      if (visitedRef.current[i]) return
      if (pos.current.distanceTo(cp) < 1.65) {
        visitedRef.current[i] = true
        onCheckpoint(i)
      }
    })

    // Alien collision with invincibility window
    if (now > invincibleUntil.current && alienPositionsRef?.current) {
      for (let i = 0; i < alienPositionsRef.current.length; i++) {
        const ap = alienPositionsRef.current[i]
        if (!ap) continue
        if (pos.current.distanceTo(ap) < 0.38 + 0.42 + 0.3) {
          onDamage(ALIEN_DAMAGE)
          invincibleUntil.current = now + INVINCIBILITY_DURATION
          // Knockback
          const kbDir = new THREE.Vector3().subVectors(pos.current, ap).normalize()
          vel.current.x += kbDir.x * 5
          vel.current.z += kbDir.z * 5
          vel.current.y = 3
          break
        }
      }
    }

    // Flash ball when invincible
    if (meshRef.current) {
      const isInvincible = now < invincibleUntil.current
      meshRef.current.material.emissiveIntensity = isInvincible ? (Math.sin(now * 20) * 0.5 + 0.5) * 1.5 : 0.5
    }
  })

  return (
    <mesh ref={meshRef} castShadow position={[0, 3, 5]}>
      <icosahedronGeometry args={[BALL_RADIUS, 3]} />
      <meshStandardMaterial color="#ffffff" emissive="#ffaa44" emissiveIntensity={0.5} roughness={0.2} metalness={0.7} />
      <pointLight color="#ffcc88" intensity={1.0} distance={4} />
    </mesh>
  )
}

function AlienScene({ keysRef, onCheckpoint, visitedRef, visited, onDamage, alienPositionsRef }) {
  const TREES = useMemo(() => [
    [-6, -10, 1.2, '#2ec4b6', '#ff79c6'], [5, -12, 0.9, '#1aad96', '#f72585'],
    [14, 6, 1.4, '#2dd4bf', '#c77dff'], [-14, 4, 1.0, '#26a69a', '#ff9ef5'],
    [1, 18, 1.1, '#22d3ee', '#ff6eb4'], [-10, 16, 0.85, '#2ec4b6', '#e040fb'],
    [18, -12, 1.3, '#1de9b6', '#ff4fc8'], [-2, -20, 1.0, '#26c6da', '#ba68c8'],
    [8, -18, 1.0, '#2ec4b6', '#f06292'], [-18, 10, 1.1, '#1de9b6', '#ce93d8'],
    [-20, -14, 1.25, '#22d3ee', '#ff79c6'], [22, 8, 0.95, '#2dd4bf', '#c77dff'],
  ], [])

  const CORALS = useMemo(() => [
    [-3, 8, '#ff79c6', 0.9], [7, -3, '#c77dff', 0.7], [-9, -6, '#4fffb0', 0.8],
    [12, 10, '#ff6eb4', 1.0], [-15, 12, '#00e5cc', 0.75],
  ], [])

  const SPIKES = useMemo(() => [
    [-4, -5, 0.9], [8, 5, 1.1], [-12, -2, 0.8], [3, 10, 1.0], [16, -6, 1.2],
    [-7, 14, 0.7], [12, 14, 0.9], [-16, -10, 1.0],
  ], [])

  const BUSHES = useMemo(() => [
    [-3, -8, '#26c9a8'], [6, 3, '#4fffb0'], [-9, 7, '#00e5cc'], [11, 12, '#2af5b0'],
    [-15, -6, '#00ddb3'], [3, -14, '#1de9b6'], [17, 2, '#26c9a8'], [-5, 17, '#00e5cc'],
    [7, -7, '#4fffb0'], [-11, 12, '#26c9a8'],
  ], [])

  const POOLS = useMemo(() => [
    [[-7, -0.3, 3], 3.2], [[9, -0.3, -9], 2.6], [[-13, -0.3, -8], 2.0],
    [[5, -0.3, 16], 2.8], [[-2, -0.3, -16], 2.2],
  ], [])

  // Only 3 aliens now
  const ALIENS = useMemo(() => [
    { center: [0, 0, 0], r: 6, spd: 0.35, ph: 0, color: '#ff79c6', sz: 0.42 },
    { center: [-8, 0, 5], r: 4, spd: 0.48, ph: Math.PI, color: '#c77dff', sz: 0.38 },
    { center: [10, 0, -5], r: 4.5, spd: 0.42, ph: Math.PI * 0.5, color: '#ffd166', sz: 0.44 },
  ], [])

  return (
    <>
      <Sky distance={450000} sunPosition={[1, 0.65, 0.2]} turbidity={2.5} rayleigh={0.55} mieCoefficient={0.002} mieDirectionalG={0.92} />
      <ambientLight intensity={1.2} color="#c8f0f8" />
      <directionalLight position={[30, 45, 20]} intensity={2.2} color="#fffde7" castShadow shadow-mapSize={[1024, 1024]} shadow-camera-far={120} shadow-camera-left={-40} shadow-camera-right={40} shadow-camera-top={40} shadow-camera-bottom={-40} />
      <directionalLight position={[-25, 20, -30]} intensity={0.5} color="#ffcc88" />
      <hemisphereLight skyColor="#b2f0f8" groundColor="#3ab5c8" intensity={0.6} />

      <AlienTerrain />
      {POOLS.map(([pos, r], i) => <WaterPool key={i} position={pos} radius={r} />)}

      {TREES.map(([x, z, sc, sc2, cc], i) => (
        <AlienTree key={i} position={[x, getTerrainHeight(x, z) + sc * 0.1, z]} scale={sc} colorStem={sc2} colorCap={cc} />
      ))}
      {CORALS.map(([x, z, col, sc], i) => (
        <CoralFan key={i} position={[x, getTerrainHeight(x, z) + 0.1, z]} color={col} scale={sc} />
      ))}
      {SPIKES.map(([x, z, sc], i) => (
        <SpikePlant key={i} position={[x, getTerrainHeight(x, z), z]} scale={sc} />
      ))}
      {BUSHES.map(([x, z, col], i) => (
        <AlienBush key={i} position={[x, getTerrainHeight(x, z), z]} color={col} />
      ))}

      {ALIENS.map((a, i) => (
        <BlobAlien
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
        <Checkpoint key={i} position={cp} expData={EXPERIENCES[i]} isVisited={visited[i]} onCollect={() => onCheckpoint(i)} />
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

function ExperiencePopup({ exp, onClose }) {
  const [vis, setVis] = useState(false)
  useEffect(() => { const t = setTimeout(() => setVis(true), 30); return () => clearTimeout(t) }, [])
  if (!exp) return null
  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, background: 'rgba(0,40,60,0.45)', backdropFilter: 'blur(6px)', opacity: vis ? 1 : 0, transition: 'opacity 0.35s ease' }}>
      <div style={{ width: 'min(520px,90vw)', background: 'rgba(230,250,255,0.97)', border: `2px solid ${ACCENT}88`, borderRadius: '12px', padding: '32px 36px', boxShadow: `0 8px 60px ${ACCENT}44`, transform: vis ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.97)', transition: 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1)', fontFamily: "'Space Mono',monospace" }}>
        <div style={{ fontSize: '9px', letterSpacing: '0.35em', color: ACCENT, marginBottom: '16px' }}>★ CHECKPOINT — {exp.period}</div>
        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '22px', fontWeight: 700, color: '#0a2a3a', marginBottom: '4px' }}>{exp.role}</div>
        <div style={{ fontSize: '11px', color: ACCENT, letterSpacing: '0.12em', marginBottom: '18px' }}>{exp.company}</div>
        <p style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '14px', color: '#1a4a5a', lineHeight: 1.7, marginBottom: '20px' }}>{exp.description}</p>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '26px' }}>
          {exp.tags.map(tag => (
            <span key={tag} style={{ fontSize: '9px', letterSpacing: '0.1em', color: '#0a2a3a', background: `${ACCENT}22`, border: `1px solid ${ACCENT}55`, padding: '4px 10px', borderRadius: '3px' }}>{tag}</span>
          ))}
        </div>
        <button onClick={onClose} style={{ background: ACCENT, border: 'none', color: '#ffffff', fontFamily: "'Space Mono',monospace", fontSize: '10px', letterSpacing: '0.2em', padding: '11px 28px', borderRadius: '4px', cursor: 'pointer', transition: 'opacity 0.2s' }} onMouseEnter={e => e.currentTarget.style.opacity = '0.82'} onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
          CONTINUE EXPLORING →
        </button>
      </div>
    </div>
  )
}

// Health bar HUD
function HealthBar({ health }) {
  const pct = Math.max(0, health) / 100
  const color = pct > 0.6 ? '#00ff88' : pct > 0.3 ? '#ffcc00' : '#ff4444'
  return (
    <div style={{
      position: 'fixed', top: '24px', left: '50%', transform: 'translateX(-50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
      zIndex: 100, pointerEvents: 'none',
    }}>
      <div style={{ fontFamily: "'Space Mono',monospace", fontSize: '8px', letterSpacing: '0.25em', color: '#005f75' }}>
        SIGNAL STRENGTH
      </div>
      <div style={{
        width: '160px', height: '10px',
        border: '1px solid rgba(0,95,117,0.5)',
        borderRadius: '3px', overflow: 'hidden',
        background: 'rgba(0,20,30,0.35)',
      }}>
        <div style={{
          height: '100%',
          width: `${pct * 100}%`,
          background: color,
          boxShadow: `0 0 8px ${color}`,
          transition: 'width 0.2s ease, background 0.4s ease',
          borderRadius: '2px',
        }} />
      </div>
      <div style={{ fontFamily: "'Space Mono',monospace", fontSize: '8px', color, letterSpacing: '0.1em' }}>
        {Math.max(0, health)} HP
      </div>
    </div>
  )
}

function DeathScreen({ onRespawn }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Space Mono',monospace",
    }}>
      <div style={{ fontSize: '9px', letterSpacing: '0.5em', color: '#ff4444', marginBottom: '16px' }}>
        ⚠ SIGNAL LOST
      </div>
      <div style={{ fontSize: '42px', fontWeight: 700, color: '#ff4444', letterSpacing: '0.04em', fontFamily: "'Space Grotesk',sans-serif", marginBottom: '8px' }}>
        KNOCKED OUT
      </div>
      <div style={{ width: '160px', height: '10px', border: '1px solid #ff444455', borderRadius: '3px', background: 'rgba(255,68,68,0.1)', marginBottom: '32px' }}>
        <div style={{ height: '100%', width: '0%', background: '#ff4444', borderRadius: '2px' }} />
      </div>
      <button
        onClick={onRespawn}
        style={{ background: 'transparent', border: '2px solid #00d4ff', color: '#00d4ff', fontFamily: "'Space Mono',monospace", fontSize: '11px', letterSpacing: '0.3em', padding: '14px 40px', cursor: 'pointer', transition: 'all 0.2s', borderRadius: '4px' }}
        onMouseEnter={e => { e.currentTarget.style.background = '#00d4ff22' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
      >
        RESPAWN
      </button>
    </div>
  )
}

function GameHUD({ visitedCount, total }) {
  return (
    <>
      <div style={{ position: 'fixed', bottom: '28px', right: '28px', fontFamily: "'Space Mono',monospace", fontSize: '10px', letterSpacing: '0.2em', color: '#005f75', zIndex: 100, pointerEvents: 'none' }}>
        ★ {visitedCount} / {total} FOUND
      </div>
      <div style={{ position: 'fixed', bottom: '28px', left: '28px', fontFamily: "'Space Mono',monospace", fontSize: '9px', color: 'rgba(5,40,60,0.55)', letterSpacing: '0.15em', lineHeight: 1.9, zIndex: 100, pointerEvents: 'none' }}>
        W / S — MOVE &nbsp;·&nbsp; Q / E — ORBIT CAM<br />
        SPACE — JUMP &nbsp;·&nbsp; AVOID ALIENS (-15 HP)
      </div>
    </>
  )
}

export default function WorkPage() {
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

  const handleRespawn = useCallback(() => {
    setHealth(100)
    setIsDead(false)
    // Ball position reset handled by remounting via key
  }, [])

  const closePopup = useCallback(() => setActivePopup(null), [])

  return (
    <div style={{ width: '100%', height: '100vh', background: '#a8edf5', position: 'relative' }}>
      <button onClick={() => navigate('/')} style={{ position: 'fixed', top: '24px', left: '28px', background: 'rgba(255,255,255,0.75)', border: `1px solid ${ACCENT}88`, color: '#0a4a5a', fontFamily: "'Space Mono',monospace", fontSize: '10px', letterSpacing: '0.2em', padding: '8px 16px', cursor: 'pointer', zIndex: 100, borderRadius: '4px', backdropFilter: 'blur(4px)' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.95)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.75)'}>
        ← ORBIT
      </button>
      <div style={{ position: 'fixed', top: '24px', right: '28px', fontFamily: "'Space Mono',monospace", textAlign: 'right', zIndex: 100, pointerEvents: 'none' }}>
        <div style={{ fontSize: '9px', color: '#005f75', letterSpacing: '0.3em', fontWeight: 700 }}>WORK</div>
        <div style={{ fontSize: '9px', color: '#338899', letterSpacing: '0.15em', marginTop: '2px' }}>PLANET KEPLER-W</div>
      </div>

      <Canvas key={isDead ? 'dead' : 'alive'} camera={{ position: [0, 5, 12], fov: 60, near: 0.1, far: 500 }} shadows style={{ background: '#a8edf5' }}>
        <Suspense fallback={null}>
          <AlienScene
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
      {activePopup !== null && <ExperiencePopup exp={EXPERIENCES[activePopup]} onClose={closePopup} />}
      {isDead && <DeathScreen onRespawn={handleRespawn} />}
    </div>
  )
}