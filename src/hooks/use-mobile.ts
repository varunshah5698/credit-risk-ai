import * as React from "react"

const MOBILE_BREAKPOINT = 768

/**
 * Subscribes to the viewport breakpoint.
 *
 * Implemented with `useSyncExternalStore` rather than `useState` + `useEffect`:
 * matchMedia is an external store, so React should read the snapshot directly
 * instead of staging a synchronous `setState` inside an effect (which forces an
 * extra render on every mount and is flagged by `react-hooks/set-state-in-effect`).
 */
function subscribe(callback: () => void) {
  const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
  mql.addEventListener("change", callback)
  return () => mql.removeEventListener("change", callback)
}

function getSnapshot() {
  return window.innerWidth < MOBILE_BREAKPOINT
}

/** No viewport during SSR — assume desktop, matching the old `undefined` → false. */
function getServerSnapshot() {
  return false
}

export function useIsMobile() {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
