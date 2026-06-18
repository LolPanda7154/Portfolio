import { useMemo, useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import useAppStore from '../store/appStore'
import { SECTIONS } from '../constants/sectionData'

/**
 * useNodeSelection
 *
 * Single source of truth for node select / hover / enter on the Home scene.
 *
 * Phase machine (owned by CameraController, watched here):
 *   idle → shaking → zooming → done → [navigate] → idle
 *
 * enterSection() sets phase to 'shaking' and hands off to CameraController.
 * This hook watches for 'done' and calls navigate() exactly once, then resets.
 */
export default function useNodeSelection() {
  const navigate = useNavigate()
  const hasNavigatedRef = useRef(false)

  // ── Store reads ─────────────────────────────────────────────────────────────
  const selectedNodeId   = useAppStore((s) => s.selectedNode)
  const hoveredNodeId    = useAppStore((s) => s.hoveredNode)
  const isTransitioning  = useAppStore((s) => s.isTransitioning)
  const transitionPhase  = useAppStore((s) => s.transitionPhase ?? 'idle')

  // ── Store writes ────────────────────────────────────────────────────────────
  const setSelectedNode    = useAppStore((s) => s.setSelectedNode)
  const clearSelectedNode  = useAppStore((s) => s.clearSelectedNode)
  const setHoveredNode     = useAppStore((s) => s.setHoveredNode)
  const setIsTransitioning = useAppStore((s) => s.setIsTransitioning)
  const setCameraTarget    = useAppStore((s) => s.setCameraTarget)
  const setTransitionPhase = useAppStore((s) => s.setTransitionPhase)
  const resetTransitionPhase = useAppStore((s) => s.resetTransitionPhase)

  // ── Derived section objects ─────────────────────────────────────────────────
  const selectedSection = useMemo(
    () => SECTIONS.find((s) => s.id === selectedNodeId) ?? null,
    [selectedNodeId]
  )
  const hoveredSection = useMemo(
    () => SECTIONS.find((s) => s.id === hoveredNodeId) ?? null,
    [hoveredNodeId]
  )

  // ── Actions ─────────────────────────────────────────────────────────────────
  const selectHover = useCallback(
    (id) => { if (!isTransitioning) setHoveredNode(id) },
    [isTransitioning, setHoveredNode]
  )

  const clearHover = useCallback(
    () => setHoveredNode(null),
    [setHoveredNode]
  )

  const selectNode = useCallback(
    (id) => {
      if (isTransitioning) return
      setSelectedNode(id)
      setCameraTarget(id)
    },
    [isTransitioning, setSelectedNode, setCameraTarget]
  )

  // Deselect without navigating (Back button / dismiss)
  const deselectNode = useCallback(() => {
    clearSelectedNode()
    setCameraTarget('home')
    resetTransitionPhase()
  }, [clearSelectedNode, setCameraTarget, resetTransitionPhase])

  // Called by EnterButton. Kicks off the phase machine; does NOT navigate.
  // CameraController advances: shaking → zooming → done.
  const enterSection = useCallback(() => {
    if (!selectedSection || isTransitioning) return
    hasNavigatedRef.current = false
    setIsTransitioning(true)
    setCameraTarget('entering')
    setTransitionPhase('shaking')
  }, [selectedSection, isTransitioning, setIsTransitioning, setCameraTarget, setTransitionPhase])

  // ── Navigate when camera sequence finishes ──────────────────────────────────
  useEffect(() => {
    if (transitionPhase === 'done' && selectedSection && !hasNavigatedRef.current) {
      hasNavigatedRef.current = true
      navigate(selectedSection.route)
      // Reset after a tick so CameraController's final useFrame isn't
      // competing with the state flush.
      setTimeout(() => {
        setIsTransitioning(false)
        resetTransitionPhase()
      }, 0)
    }
  }, [transitionPhase, selectedSection, navigate, setIsTransitioning, resetTransitionPhase])

  // ── Public API ──────────────────────────────────────────────────────────────
  return {
    sections: SECTIONS,
    selectedNodeId,
    selectedSection,
    hoveredNodeId,
    hoveredSection,
    isTransitioning,
    transitionPhase,
    // actions
    selectNode,
    deselectNode,
    clearSelectedNode,   // re-exported so EnterButton can call it directly
    selectHover,
    clearHover,
    enterSection,
  }
}