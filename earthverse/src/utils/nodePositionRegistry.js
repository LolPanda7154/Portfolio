import * as THREE from 'three'

/**
 * nodePositionRegistry
 *
 * OrbitNode instances orbit continuously, so their world position at any
 * given moment can't be read from sectionData's static `position` field.
 * CameraController needs the LIVE position when a zoom-in starts, but
 * polling that through Zustand would mean a state update every frame
 * (60/sec) just to keep one consumer in sync.
 *
 * Instead this is a plain mutable map living outside React/Zustand.
 * OrbitNode writes its current world position into it every frame inside
 * its own useFrame (cheap, no re-renders triggered). CameraController
 * reads from it imperatively, also inside useFrame, only when it actually
 * needs to know where a node is (at the moment a zoom sequence starts).
 *
 * Not reactive by design — nothing should subscribe to this for render.
 */
const positions = new Map()

export function setNodeWorldPosition(id, x, y, z) {
  let v = positions.get(id)
  if (!v) {
    v = new THREE.Vector3()
    positions.set(id, v)
  }
  v.set(x, y, z)
}

export function getNodeWorldPosition(id) {
  return positions.get(id) ?? null
}

export default { setNodeWorldPosition, getNodeWorldPosition }