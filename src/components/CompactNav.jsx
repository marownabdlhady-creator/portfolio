import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

import './CompactNav.css'
import { smoothScrollTo } from '../lib/smoothScrollTo.js'

gsap.registerPlugin(useGSAP, ScrollTrigger)

/* ================================================================
   COMPACT PILL NAV — DESKTOP + TABLET ONLY.

   A small floating pill (logo + horizontal links) that animates IN once
   the page is scrolled past a threshold (where the main navbar has hidden
   itself) and animates OUT near the top — so one nav hands off to the other.
   Bottom-centre by default; transform/opacity only → 60fps.

   Self-contained: it does NOT touch the main Nav, the menu, or any section.
   On phones it never appears (CSS display:none + the ScrollTrigger is only
   built at ≥ MIN_WIDTH), so the existing MENU / fullscreen-menu flow is the
   sole mobile navigation.
================================================================ */

/* ----------------------------------------------------------------
   EASY-TO-TWEAK CONSTANTS
------------------------------------------------------------------ */
// Links — editable. Real anchors to section ids (some may be future sections).
const LINKS = [
  { label: 'About', href: '#about' },
  { label: 'Projects', href: '#projects' },
  { label: 'Services', href: '#services' },
  { label: 'Contact', href: '#contact' },
]

// Logo — reuse the site's "مروان" custom-font wordmark, compact.
const LOGO_TEXT = 'مروان'

// POSITION — where the pill floats: 'bottom' (bottom-centre) or 'top'.
const POSITION = 'bottom'
const INSET = '1.5rem' // distance from that edge (also a CSS var below)

// SHOW / HIDE
const SHOW_THRESHOLD = 200 // px scrolled before the pill appears (main nav is gone by here)

// MOTION — slow + soft (ignored under reduced motion → simple fade instead).
// Separate in/out tuning so the arrival and departure can each feel right.
const DURATION_IN = 0.58 // appear duration (s) — gentle
const EASE_IN = 'power3.out' // soft deceleration as it settles
const DURATION_OUT = 0.5 // disappear duration (s)
const EASE_OUT = 'power3.inOut' // smooth, unhurried exit
const SLIDE = 16 // px of soft slide on enter/exit (toward its anchored edge)
const SCALE_FROM = 0.97 // barely-there scale-up on enter
const REDUCE_FADE = 0.18 // reduced-motion: plain fade duration (s), no slide/scale

// BREAKPOINT — show ONLY at/above this width (keep in sync with the CSS @media).
const MIN_WIDTH = 768 // px (desktop + tablet)

export default function CompactNav() {
  const pill = useRef(null)

  // In-page smooth scroll (logo → top, links → their section). preventDefault
  // keeps it from a hard hash jump; uses the shared Lenis-aware helper.
  const onNavClick = (href) => (e) => {
    e.preventDefault()
    smoothScrollTo(href)
  }

  useGSAP(
    () => {
      const el = pill.current
      if (!el) return

      // The slide travels toward the anchored edge: from below when bottom-anchored,
      // from above when top-anchored.
      const fromY = POSITION === 'top' ? -SLIDE : SLIDE

      const mm = gsap.matchMedia()

      mm.add(
        {
          isWide: `(min-width: ${MIN_WIDTH}px)`,
          reduce: '(prefers-reduced-motion: reduce)',
        },
        (ctx) => {
          const { isWide, reduce } = ctx.conditions
          // Phones: never build it — the pill stays hidden (CSS also display:none).
          if (!isWide) return

          // Resting (shown) + hidden transforms. xPercent:-50 stays constant so the
          // pill keeps centred while y/scale animate (no CSS transform conflict).
          const HIDDEN = reduce
            ? { autoAlpha: 0, xPercent: -50 }
            : { autoAlpha: 0, xPercent: -50, y: fromY, scale: SCALE_FROM }
          const SHOWN = reduce
            ? { autoAlpha: 1, xPercent: -50 }
            : { autoAlpha: 1, xPercent: -50, y: 0, scale: 1 }

          // Gentle, separately-tuned arrival / departure. overwrite:'auto' keeps
          // rapid toggles smooth (no stacking tweens). autoAlpha drives visibility,
          // so the pill isn't focusable while hidden.
          const show = () =>
            gsap.to(el, {
              ...SHOWN,
              duration: reduce ? REDUCE_FADE : DURATION_IN,
              ease: reduce ? 'none' : EASE_IN,
              overwrite: 'auto',
            })
          const hide = () =>
            gsap.to(el, {
              ...HIDDEN,
              duration: reduce ? REDUCE_FADE : DURATION_OUT,
              ease: reduce ? 'none' : EASE_OUT,
              overwrite: 'auto',
            })

          // Initial state: respect scroll position on load (e.g. refresh mid-page).
          let shown = window.scrollY > SHOW_THRESHOLD
          gsap.set(el, shown ? SHOWN : HIDDEN)

          const st = ScrollTrigger.create({
            start: 0,
            end: 'max',
            onUpdate: (self) => {
              const next = self.scroll() > SHOW_THRESHOLD
              if (next === shown) return
              shown = next
              next ? show() : hide()
            },
          })

          return () => st.kill()
        },
      )

      return () => mm.revert()
    },
    { scope: pill },
  )

  return (
    <nav
      className={`cnav cnav--${POSITION}`}
      ref={pill}
      aria-label="Compact navigation"
      style={{ '--cnav-inset': INSET }}
    >
      <a
        className="cnav__logo"
        href="#top"
        aria-label="Marwan — home, back to top"
        onClick={onNavClick('#top')}
      >
        <span className="cnav__logo-mark" lang="ar" dir="rtl">
          {LOGO_TEXT}
        </span>
      </a>

      <ul className="cnav__links">
        {LINKS.map((l) => (
          <li key={l.href}>
            <a className="cnav__link" href={l.href} onClick={onNavClick(l.href)}>
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
