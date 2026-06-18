import React, { useEffect, useState, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import Earth from '../components/Earth'
import Satellite from '../components/Satellite'
import OrbitNode from '../components/OrbitNode'
import EnterButton from '../components/EnterButton'
import SpaceBackground from '../components/SpaceBackground'
import CameraController from '../components/CameraController'
import Lighting from '../components/Lighting'
import useAppStore from '../store/appStore'
import useNodeSelection from '../hooks/useNodeSelection'
import { SECTIONS } from '../constants/sectionData'

function HUD() {
  const [time, setTime] = useState('')
  useEffect(() => {
    const tick = () => setTime(new Date().toUTCString().slice(17, 25))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <>
      {/* Top-left: identity */}
      <div style={{
        position: 'fixed', top: '24px', left: '28px',
        fontFamily: "'Space Mono', monospace",
        zIndex: 50, pointerEvents: 'none',
      }}>
        <div style={{ fontSize: '18px', fontWeight: 700, color: '#e8f4ff', letterSpacing: '0.05em' }}>
          EARTHVERSE
        </div>
        <div style={{ fontSize: '9px', color: '#00d4ff', opacity: 0.6, letterSpacing: '0.3em', marginTop: '2px' }}>
          PORTFOLIO — v1.0
        </div>
      </div>

      {/* Top-right: system time */}
      <div style={{
        position: 'fixed', top: '24px', right: '28px',
        fontFamily: "'Space Mono', monospace",
        textAlign: 'right', zIndex: 50, pointerEvents: 'none',
      }}>
        <div style={{ fontSize: '9px', color: '#00d4ff', opacity: 0.5, letterSpacing: '0.2em' }}>
          UTC {time}
        </div>
        <div style={{ fontSize: '9px', color: 'rgba(232,244,255,0.3)', letterSpacing: '0.15em', marginTop: '2px' }}>
          ORBIT STABLE
        </div>
      </div>

      {/* Bottom-left: hint */}
      <div style={{
        position: 'fixed', bottom: '28px', left: '28px',
        fontFamily: "'Space Mono', monospace",
        fontSize: '9px', color: 'rgba(232,244,255,0.3)',
        letterSpacing: '0.18em', zIndex: 50, pointerEvents: 'none',
      }}>
        CLICK A NODE TO EXPLORE
      </div>

      {/* Bottom-right: node count */}
      <div style={{
        position: 'fixed', bottom: '28px', right: '28px',
        fontFamily: "'Space Mono', monospace",
        fontSize: '9px', color: 'rgba(232,244,255,0.3)',
        letterSpacing: '0.18em', zIndex: 50, pointerEvents: 'none',
      }}>
        {SECTIONS.length} SECTORS ORBITING
      </div>
    </>
  )
}

function IntroOverlay({ onComplete }) {
  const [opacity, setOpacity] = useState(1)
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 600)
    const t2 = setTimeout(() => setPhase(2), 1800)
    const t3 = setTimeout(() => setOpacity(0), 2800)
    const t4 = setTimeout(() => onComplete(), 3400)
    return () => [t1, t2, t3, t4].forEach(clearTimeout)
  }, [onComplete])

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: '#020408',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      zIndex: 200,
      opacity,
      transition: 'opacity 0.6s ease',
      pointerEvents: opacity < 0.1 ? 'none' : 'all',
    }}>
      <div style={{
        fontFamily: "'Space Mono', monospace",
        textAlign: 'center',
        transform: `translateY(${phase >= 1 ? 0 : 20}px)`,
        opacity: phase >= 1 ? 1 : 0,
        transition: 'all 0.8s ease',
      }}>
        <div style={{
          fontSize: '11px', letterSpacing: '0.4em',
          color: '#00d4ff', opacity: 0.7, marginBottom: '16px',
        }}>
          INITIALIZING EARTHVERSE
        </div>
        <div style={{
          fontSize: '42px', fontWeight: 700,
          color: '#e8f4ff', letterSpacing: '0.05em',
          fontFamily: "'Space Grotesk', sans-serif",
        }}>
          Welcome.
        </div>
        <div style={{
          fontSize: '14px', color: 'rgba(232,244,255,0.5)',
          marginTop: '12px', letterSpacing: '0.08em',
          opacity: phase >= 2 ? 1 : 0,
          transform: `translateY(${phase >= 2 ? 0 : 10}px)`,
          transition: 'all 0.6s ease 0.2s',
        }}>
          Navigate my universe
        </div>
      </div>
    </div>
  )
}

export default function HomePage() {
  const { introComplete, setIntroComplete } = useAppStore()
  // selectedSection is the resolved section object (name/color/etc),
  // not just the raw id string stored in Zustand — EnterButton needs
  // the full object, not an id.
  const { selectedSection, transitionPhase } = useNodeSelection()

  return (
    <div style={{ width: '100%', height: '100vh', background: '#020408' }}>
      {!introComplete && <IntroOverlay onComplete={setIntroComplete} />}

      <HUD />

      <Canvas
        camera={{ position: [0, 2, 10], fov: 60, near: 0.1, far: 500 }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: '#020408' }}
      >
        <Suspense fallback={null}>
          <Lighting />
          <SpaceBackground />
          <Earth />
          <Satellite />
          {SECTIONS.map((section) => (
            <OrbitNode key={section.id} section={section} />
          ))}
          <CameraController />
          <OrbitControls
            enablePan={false}
            enableZoom={true}
            minDistance={5}
            maxDistance={18}
            autoRotate={!selectedSection && transitionPhase === 'idle'}
            autoRotateSpeed={0.3}
            maxPolarAngle={Math.PI * 0.75}
            minPolarAngle={Math.PI * 0.25}
            enabled={transitionPhase === 'idle'}
          />
        </Suspense>
      </Canvas>

      {selectedSection && transitionPhase === 'idle' && (
        <EnterButton section={selectedSection} />
      )}
    </div>
  )
}