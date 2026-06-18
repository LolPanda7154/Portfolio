import React, { useEffect, useState } from 'react'
import useNodeSelection from '../hooks/useNodeSelection'

// EnterButton deliberately does NOT call navigate() itself.
// Instead it calls enterSection(), which hands control to
// useNodeSelection's state machine:
//
//   idle → transitioning → done
//
// The 'done' watcher inside useNodeSelection (or CameraController)
// is responsible for calling navigate(section.route) once the
// shake + zoom animation has finished.  This keeps transitionPhase
// in sync with OrbitControls.enabled and the camera tween.
//
// We no longer import useAppStore here because setIsTransitioning
// was a parallel boolean that duplicated — and conflicted with —
// the transitionPhase machine.  If other parts of the app still
// read isTransitioning, replace those reads with
// `transitionPhase !== 'idle'` from useNodeSelection instead.

export default function EnterButton({ section }) {
  const { enterSection, clearSelectedNode } = useNodeSelection()
  const [visible, setVisible] = useState(false)

  // Small mount delay so the button fades in rather than popping
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 150)
    return () => clearTimeout(timer)
  }, [])

  const handleEnter = () => {
    // enterSection() must exist in useNodeSelection and must:
    //   1. Set transitionPhase to 'transitioning'
    //   2. Trigger the camera shake + zoom animation
    //   3. On animation complete, set transitionPhase to 'done'
    //   4. The 'done' effect then calls navigate(section.route)
    //      and resets state back to idle.
    enterSection()
  }

  const handleDismiss = () => {
    clearSelectedNode()
  }

  if (!section) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '48px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.4s ease',
        zIndex: 100,
      }}
    >
      {/* Section label */}
      <div style={{
        fontFamily: "'Space Mono', monospace",
        fontSize: '11px',
        letterSpacing: '0.3em',
        color: section.color,
        textTransform: 'uppercase',
        opacity: 0.8,
      }}>
        {section.name} — {section.subtitle}
      </div>

      {/* Primary CTA — triggers the transition state machine */}
      <button
        onClick={handleEnter}
        style={{
          background: 'transparent',
          border: `1px solid ${section.color}`,
          color: section.color,
          fontFamily: "'Space Mono', monospace",
          fontSize: '12px',
          letterSpacing: '0.25em',
          padding: '12px 40px',
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.3s ease',
          textTransform: 'uppercase',
          boxShadow: `0 0 20px ${section.color}33, inset 0 0 20px ${section.color}11`,
          animation: 'pulse-glow 2s ease-in-out infinite',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = `${section.color}22`
          e.currentTarget.style.boxShadow = `0 0 40px ${section.color}66, inset 0 0 30px ${section.color}22`
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.boxShadow = `0 0 20px ${section.color}33, inset 0 0 20px ${section.color}11`
        }}
      >
        ENTER
      </button>

      {/* Dismiss — deselects the node without navigating */}
      <button
        onClick={handleDismiss}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'rgba(232, 244, 255, 0.3)',
          fontFamily: "'Space Mono', monospace",
          fontSize: '10px',
          letterSpacing: '0.2em',
          cursor: 'pointer',
          padding: '4px 12px',
          transition: 'color 0.2s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(232, 244, 255, 0.7)' }}
        onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(232, 244, 255, 0.3)' }}
      >
        ← BACK
      </button>
    </div>
  )
}