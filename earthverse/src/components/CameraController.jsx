import { useEffect, useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import useAppStore from '../store/appStore'
import { getNodeWorldPosition } from '../utils/nodePositionRegistry'
import { lerp, easeInOutCubic } from '../utils/math'

const HOME_POSITION = new THREE.Vector3(0, 2, 10)
const SELECTED_POSITION = new THREE.Vector3(0, 1.5, 7.5)

const SHAKE_DURATION = 0.35 // seconds
const SHAKE_MAGNITUDE = 0.06
const ZOOM_DURATION = 0.9 // seconds, should roughly match any UI-side waits

export default function CameraController() {
  const { camera } = useThree()
  const selectedNode = useAppStore((s) => s.selectedNode)
  const transitionPhase = useAppStore((s) => s.transitionPhase)
  const setTransitionPhase = useAppStore((s) => s.setTransitionPhase)

  // Free-orbit tween state (home <-> selected, before entering)
  const tweenStartRef = useRef(new THREE.Vector3())
  const tweenTargetRef = useRef(HOME_POSITION.clone())
  const tweenElapsedRef = useRef(0)
  const tweenDurationRef = useRef(0.6)

  // Enter-sequence state (shake then zoom-into-planet)
  const phaseElapsedRef = useRef(0)
  const shakeBasePositionRef = useRef(new THREE.Vector3())
  const zoomStartRef = useRef(new THREE.Vector3())
  const zoomTargetRef = useRef(new THREE.Vector3())
  const lookAtTargetRef = useRef(new THREE.Vector3(0, 0, 0))
  const prevPhaseRef = useRef('idle')

  // Free orbit target changes (select / deselect a node, not yet entering)
  useEffect(() => {
    tweenStartRef.current.copy(camera.position)
    tweenTargetRef.current = selectedNode ? SELECTED_POSITION.clone() : HOME_POSITION.clone()
    tweenElapsedRef.current = 0
    tweenDurationRef.current = 0.6
  }, [selectedNode, camera])

  // Phase transitions for the enter sequence
  useEffect(() => {
    if (transitionPhase === 'shaking' && prevPhaseRef.current !== 'shaking') {
      shakeBasePositionRef.current.copy(camera.position)
      phaseElapsedRef.current = 0
    }

    if (transitionPhase === 'zooming' && prevPhaseRef.current !== 'zooming') {
      zoomStartRef.current.copy(camera.position)
      phaseElapsedRef.current = 0
    }

    prevPhaseRef.current = transitionPhase
  }, [transitionPhase, selectedNode, camera])

  useFrame((_, delta) => {
    // --- Enter sequence takes priority over free orbit tween ---
    if (transitionPhase === 'shaking') {
      phaseElapsedRef.current += delta
      const t = Math.min(phaseElapsedRef.current / SHAKE_DURATION, 1)
      const decay = 1 - t // shake settles out toward the end
      const shakeX = (Math.random() - 0.5) * SHAKE_MAGNITUDE * decay
      const shakeY = (Math.random() - 0.5) * SHAKE_MAGNITUDE * decay

      camera.position.set(
        shakeBasePositionRef.current.x + shakeX,
        shakeBasePositionRef.current.y + shakeY,
        shakeBasePositionRef.current.z
      )

      if (t >= 1) {
        setTransitionPhase('zooming')
      }
      return
    }

    if (transitionPhase === 'zooming') {
      phaseElapsedRef.current += delta
      const t = Math.min(phaseElapsedRef.current / ZOOM_DURATION, 1)
      const eased = easeInOutCubic(t)

      // Re-read the planet's live position every frame (it's still
      // orbiting), so the camera locks onto where it actually is right
      // now instead of flying toward a stale snapshot.
      const livePos = getNodeWorldPosition(selectedNode)
      if (livePos) {
        const dir = livePos.clone().sub(zoomStartRef.current).normalize()
        zoomTargetRef.current.copy(livePos).sub(dir.multiplyScalar(1.6))
        lookAtTargetRef.current.copy(livePos)
      }

      camera.position.set(
        lerp(zoomStartRef.current.x, zoomTargetRef.current.x, eased),
        lerp(zoomStartRef.current.y, zoomTargetRef.current.y, eased),
        lerp(zoomStartRef.current.z, zoomTargetRef.current.z, eased)
      )
      camera.lookAt(lookAtTargetRef.current)

      if (t >= 1) {
        setTransitionPhase('done')
      }
      return
    }

    if (transitionPhase === 'done') {
      // Hold position; HomePage/useNodeSelection will swap routes shortly.
      return
    }

    // --- Idle: free orbit tween between home <-> selected framing ---
    tweenElapsedRef.current += delta
    const t = Math.min(tweenElapsedRef.current / tweenDurationRef.current, 1)
    const eased = easeInOutCubic(t)

    camera.position.set(
      lerp(tweenStartRef.current.x, tweenTargetRef.current.x, eased),
      lerp(tweenStartRef.current.y, tweenTargetRef.current.y, eased),
      lerp(tweenStartRef.current.z, tweenTargetRef.current.z, eased)
    )
    camera.lookAt(0, 0, 0)
  })

  return null
}