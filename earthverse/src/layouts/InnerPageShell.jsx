import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function InnerPageShell({ section, children }) {
  const navigate = useNavigate()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80)
    return () => clearTimeout(t)
  }, [])

  return (
    <div style={{
      width: '100%', height: '100vh',
      background: '#020408',
      overflowY: 'auto',
      opacity: visible ? 1 : 0,
      transition: 'opacity 0.6s ease',
    }}
      className="inner-page"
    >
      {/* Animated top border */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: '2px',
        background: `linear-gradient(90deg, transparent, ${section.color}, transparent)`,
        zIndex: 100,
        animation: 'pulse-glow 3s ease-in-out infinite',
      }} />

      {/* Back button */}
      <button
        onClick={() => navigate('/')}
        style={{
          position: 'fixed', top: '24px', left: '28px',
          background: 'transparent',
          border: `1px solid rgba(${section.color === '#00d4ff' ? '0,212,255' : section.color === '#00ff88' ? '0,255,136' : section.color === '#ff6b6b' ? '255,107,107' : '255,170,0'},0.3)`,
          color: section.color,
          fontFamily: "'Space Mono', monospace",
          fontSize: '10px', letterSpacing: '0.2em',
          padding: '8px 16px', cursor: 'pointer',
          zIndex: 100,
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = `${section.color}22` }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
      >
        ← ORBIT
      </button>

      {/* Section label top right */}
      <div style={{
        position: 'fixed', top: '24px', right: '28px',
        fontFamily: "'Space Mono', monospace",
        textAlign: 'right', zIndex: 100, pointerEvents: 'none',
      }}>
        <div style={{ fontSize: '9px', color: section.color, opacity: 0.7, letterSpacing: '0.3em' }}>
          {section.name.toUpperCase()}
        </div>
        <div style={{ fontSize: '9px', color: 'rgba(232,244,255,0.3)', letterSpacing: '0.15em', marginTop: '2px' }}>
          {section.subtitle}
        </div>
      </div>

      {/* Page content */}
      <div style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: '120px 40px 80px',
      }}>
        {children}
      </div>
    </div>
  )
}