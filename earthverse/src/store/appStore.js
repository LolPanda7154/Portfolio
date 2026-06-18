import { create } from 'zustand'

// Valid transitionPhase values (owned by CameraController, read everywhere):
//   'idle'      – nothing happening, OrbitControls enabled, EnterButton visible
//   'shaking'   – camera shake running (enterSection() was called)
//   'zooming'   – shake done, zoom-in tween running
//   'done'      – zoom finished; useNodeSelection's effect fires navigate()
const INITIAL_PHASE = 'idle'

const useAppStore = create((set) => ({
  // ── Node selection ──────────────────────────────────────────────────────────
  selectedNode: null,
  setSelectedNode: (node) => set({ selectedNode: node }),
  clearSelectedNode: () => set({ selectedNode: null, hoveredNode: null }),

  // ── Hover ───────────────────────────────────────────────────────────────────
  hoveredNode: null,
  setHoveredNode: (node) => set({ hoveredNode: node }),

  // ── Camera target ───────────────────────────────────────────────────────────
  // 'home' | 'entering' | a section id
  cameraTarget: 'home',
  setCameraTarget: (target) => set({ cameraTarget: target }),

  // ── Transition phase ────────────────────────────────────────────────────────
  // This is the source of truth for the camera state machine.
  // Components must NOT derive phase from isTransitioning (boolean) alone —
  // use transitionPhase directly so every subscriber stays in sync.
  transitionPhase: INITIAL_PHASE,
  setTransitionPhase: (phase) => set({ transitionPhase: phase }),
  // Convenience: jump straight back to idle and clear transitioning flag.
  resetTransitionPhase: () =>
    set({ transitionPhase: INITIAL_PHASE, isTransitioning: false }),

  // ── Legacy transitioning boolean ────────────────────────────────────────────
  // Kept for any component still reading isTransitioning directly.
  // Prefer transitionPhase !== 'idle' for new code.
  isTransitioning: false,
  setIsTransitioning: (val) => set({ isTransitioning: val }),

  // ── Intro ───────────────────────────────────────────────────────────────────
  introComplete: false,
  setIntroComplete: () => set({ introComplete: true }),
}))

export default useAppStore