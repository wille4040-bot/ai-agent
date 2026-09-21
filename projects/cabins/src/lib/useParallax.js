import { useEffect, useRef } from 'react'

// Lätt parallax: översätter ett bakgrundslager på scroll via requestAnimationFrame.
// Avstängd vid prefers-reduced-motion och på små skärmar (mobil-prestanda).
export function useParallax(speed = 0.25) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el || typeof matchMedia !== 'function') return

    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    const isSmall = !matchMedia('(min-width: 768px)').matches
    if (reduce || isSmall) return // Ingen parallax på mobil eller vid reducerad rörelse.

    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        el.style.transform = `translate3d(0, ${window.scrollY * speed}px, 0)`
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [speed])

  return ref
}
