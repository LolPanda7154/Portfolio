import React, { Suspense } from 'react'
import AppRoutes from './routes/AppRoutes'

function LoadingScreen() {
  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: '#020408', color: '#00d4ff',
      fontFamily: "'Space Mono', monospace",
      fontSize: '12px', letterSpacing: '0.2em',
      gap: '16px'
    }}>
      <div style={{
        width: '48px', height: '48px',
        border: '2px solid rgba(0,212,255,0.2)',
        borderTop: '2px solid #00d4ff',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      INITIALIZING EARTHVERSE
    </div>
  )
}

export default function App() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <AppRoutes />
    </Suspense>
  )
}