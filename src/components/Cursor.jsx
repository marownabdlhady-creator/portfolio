import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'

import './Cursor.css'

/* ================================================================
   CUSTOM CURSOR — a small, precise, Swiss-style cursor that
   auto-inverts against the site's alternating light/dark sections via
   mix-blend-mode: difference. GLOBAL, app-level: mounted ONCE at the app
   root, outside every section. Never duplicated.

   This is the ONE legitimate exception to our "no position:fixed / no
   global styles" ban — a cursor REQUIRES a fixed, viewport-level mount.
   The safety model is different from the section rules and is followed
   exactly here:
   • Activates only on (pointer: fine) AND NOT (prefers-reduced-motion).
     Otherwise it renders NOTHING, attaches NO listeners, and leaves the
     native cursor untouched (pure no-op).
   • The native cursor is hidden ONLY via the gated `html.mcur-on` class,
     added AFTER the elements mount + first position is set, inside a
     try/catch. On any error `mcur-on` is removed so the native cursor
     returns — it is impossible to end up with the native cursor hidden
     and no working custom cursor.
   • pointer-events: none on the fixed root → the cursor never intercepts
     clicks, hovers, or scroll. Movement is driven by refs + GSAP
     quickSetter/quickTo (NO React state on mousemove) → 60fps, transform
     only. Lenis / navbar / menu / global config are not touched.
================================================================ */

/* ----------------------------------------------------------------
   CONFIG — editable.
------------------------------------------------------------------ */
const MCUR = {
  color: '#ffffff', // white + difference blend = auto-invert on every section
  blendMode: 'difference',
  dotSize: 7,
  ringSize: 38,
  ringBorder: 1.5,
  ringLag: 0.4,
  ringEase: 'power3',
  hoverScale: 2.2,
  hoverBorder: 2.5,
  viewScale: 3.4, // data-cursor="view" rings grow larger to host the label
  enableViewLabel: true, // data-cursor="view" cards show a centred label
  pressScale: 0.85,
}

const INTERACTIVE = 'a, button, [data-cursor], input, textarea, [role="button"]'

function computeGuards() {
  try {
    return (
      window.matchMedia('(pointer: fine)').matches &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    )
  } catch {
    return false
  }
}

export default function Cursor() {
  // Lazy initial guard (client-only; no SSR in this app).
  const [enabled, setEnabled] = useState(computeGuards)

  const rootRef = useRef(null)
  const dotRef = useRef(null)
  const ringRef = useRef(null)
  const labelRef = useRef(null)

  // Re-evaluate when the pointer type / motion preference changes
  // (e.g. plugging or unplugging a mouse). Leaving fine-pointer disables the
  // feature, which unmounts the elements and restores the native cursor.
  useEffect(() => {
    let fine, motion
    try {
      fine = window.matchMedia('(pointer: fine)')
      motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    } catch {
      return undefined
    }
    const update = () => setEnabled(fine.matches && !motion.matches)
    fine.addEventListener?.('change', update)
    motion.addEventListener?.('change', update)
    return () => {
      fine.removeEventListener?.('change', update)
      motion.removeEventListener?.('change', update)
    }
  }, [])

  // Setup runs in a layout effect so the first position is set before paint
  // (no flash at 0,0). Only runs while enabled; elements exist in that case.
  useLayoutEffect(() => {
    if (!enabled) return undefined

    const root = rootRef.current
    const dot = dotRef.current
    const ring = ringRef.current
    const label = labelRef.current
    if (!root || !dot || !ring || !label) return undefined

    const html = document.documentElement
    const offs = []
    const add = (target, ev, fn, opts) => {
      target.addEventListener(ev, fn, opts)
      offs.push(() => target.removeEventListener(ev, fn, opts))
    }

    // FAILSAFE: never leave the native cursor hidden without a working custom
    // one. We only add `mcur-on` after positions are set; any throw removes it.
    try {
      // Centre both visual elements on the pointer; start at screen centre.
      gsap.set([dot, ring, label], { xPercent: -50, yPercent: -50 })
      const ix = window.innerWidth / 2
      const iy = window.innerHeight / 2
      gsap.set(dot, { x: ix, y: iy })
      gsap.set(ring, { x: ix, y: iy, borderWidth: MCUR.ringBorder })
      gsap.set(label, { x: ix, y: iy, autoAlpha: 0 })
      gsap.set(root, { autoAlpha: 0 })

      // Position drivers — refs + GSAP only, never React state.
      const setDotX = gsap.quickSetter(dot, 'x', 'px')
      const setDotY = gsap.quickSetter(dot, 'y', 'px')
      const setLabX = gsap.quickSetter(label, 'x', 'px')
      const setLabY = gsap.quickSetter(label, 'y', 'px')
      const ringX = gsap.quickTo(ring, 'x', { duration: MCUR.ringLag, ease: MCUR.ringEase })
      const ringY = gsap.quickTo(ring, 'y', { duration: MCUR.ringLag, ease: MCUR.ringEase })

      const onMove = (e) => {
        const x = e.clientX
        const y = e.clientY
        setDotX(x)
        setDotY(y)
        setLabX(x)
        setLabY(y)
        ringX(x)
        ringY(y)
      }
      add(window, 'mousemove', onMove, { passive: true })

      /* ---- Interactive states via event delegation (no per-element tags) -- */
      let mode = 'default' // 'default' | 'hover' | 'view'
      let pressed = false
      let hovered = null

      const ringScaleFor = () =>
        mode === 'view' ? MCUR.viewScale : mode === 'hover' ? MCUR.hoverScale : 1
      const ringBorderFor = () => (mode === 'default' ? MCUR.ringBorder : MCUR.hoverBorder)
      const dotScaleFor = () => (mode === 'view' ? 0 : 1)

      const apply = (fast) => {
        const d = fast ? 0.12 : 0.3
        const p = pressed ? MCUR.pressScale : 1
        gsap.to(ring, {
          scale: ringScaleFor() * p,
          borderWidth: ringBorderFor(),
          duration: d,
          ease: 'power3',
          overwrite: 'auto',
        })
        gsap.to(dot, {
          scale: dotScaleFor() * p,
          duration: d,
          ease: 'power3',
          overwrite: 'auto',
        })
        gsap.to(label, {
          autoAlpha: mode === 'view' ? 1 : 0,
          duration: 0.25,
          overwrite: 'auto',
        })
      }

      const onOver = (e) => {
        const el = e.target.closest && e.target.closest(INTERACTIVE)
        if (!el || el === hovered) return
        hovered = el
        if (MCUR.enableViewLabel && el.getAttribute('data-cursor') === 'view') {
          label.textContent = el.getAttribute('data-cursor-label') || 'View'
          mode = 'view'
        } else {
          mode = 'hover'
        }
        apply(false)
      }
      const onOut = (e) => {
        const el = e.target.closest && e.target.closest(INTERACTIVE)
        if (!el || el !== hovered) return
        // Ignore moves to a descendant of the same interactive element.
        const to = e.relatedTarget
        if (to && el.contains(to)) return
        hovered = null
        mode = 'default'
        apply(false)
      }
      add(document, 'mouseover', onOver)
      add(document, 'mouseout', onOut)

      const onDown = () => {
        pressed = true
        apply(true)
      }
      const onUp = () => {
        pressed = false
        apply(false)
      }
      add(window, 'mousedown', onDown)
      add(window, 'mouseup', onUp)

      // Fade out when the pointer leaves the window; fade back on return.
      const onLeave = () => gsap.to(root, { autoAlpha: 0, duration: 0.25, overwrite: 'auto' })
      const onEnter = () => gsap.to(root, { autoAlpha: 1, duration: 0.25, overwrite: 'auto' })
      add(document, 'mouseleave', onLeave)
      add(document, 'mouseenter', onEnter)

      // Elements mounted + first position set → NOW hide the native cursor.
      html.classList.add('mcur-on')
      gsap.to(root, { autoAlpha: 1, duration: 0.25 })

      return () => {
        offs.forEach((off) => off())
        gsap.killTweensOf([root, dot, ring, label])
        html.classList.remove('mcur-on')
      }
    } catch (err) {
      // Restore the native cursor and bail — no half-broken state.
      offs.forEach((off) => off())
      html.classList.remove('mcur-on')
      gsap.killTweensOf([root, dot, ring, label])
      // eslint-disable-next-line no-console
      console.error('[Cursor] init failed; native cursor restored.', err)
      return undefined
    }
  }, [enabled])

  if (!enabled) return null

  return (
    <div
      className="mcur-root"
      ref={rootRef}
      aria-hidden="true"
      style={{
        '--mcur-color': MCUR.color,
        '--mcur-blend': MCUR.blendMode,
        '--mcur-dot': `${MCUR.dotSize}px`,
        '--mcur-ring': `${MCUR.ringSize}px`,
        '--mcur-ring-border': `${MCUR.ringBorder}px`,
      }}
    >
      <div className="mcur-ring" ref={ringRef} />
      <div className="mcur-dot" ref={dotRef} />
      <div className="mcur-label" ref={labelRef} />
    </div>
  )
}
