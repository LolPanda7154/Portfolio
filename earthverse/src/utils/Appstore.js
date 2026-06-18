import { create } from 'zustand'

const useAppStore = create((set) => ({
  // Selected node state
  selectedNode: null,
  setSelectedNode: (node) => set({ selectedNode: node }),
  clearSelectedNode: () => set({ selectedNode: null }),

  // Camera state
  cameraTarget: 'home',
  setCameraTarget: (target) => set({ cameraTarget: target }),

  // Scene state
  isTransitioning: false,
  setIsTransitioning: (val) => set({ isTransitioning: val }),

  // Transition phase state machine, drives the click -> shake -> zoom ->
  // route-swap sequence. CameraController owns moving this from
  // 'shaking' -> 'zooming' -> 'done'; HomePage watches for 'done' to
  // actually navigate, instead of guessing with a setTimeout.
  //   idle     - nothing happening, free orbit camera
  //   shaking  - brief camera shake right after a node is clicked
  //   zooming  - camera tweening in toward the selected node
  //   done     - zoom finished, safe to swap route / unmount scene
  transitionPhase: 'idle',
  setTransitionPhase: (phase) => set({ transitionPhase: phase }),
  resetTransitionPhase: () => set({ transitionPhase: 'idle' }),

  // Intro sequence
  introComplete: false,
  setIntroComplete: () => set({ introComplete: true }),

  // Hover state
  hoveredNode: null,
  setHoveredNode: (node) => set({ hoveredNode: node }),
}))

export default useAppStore