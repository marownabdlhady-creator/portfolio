import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

import './Nav.css'
import { smoothScrollTo } from '../lib/smoothScrollTo.js'

gsap.registerPlugin(useGSAP, ScrollTrigger)

/* ================================================================
   NAVBAR — floating white "pill" bar, minimal Swiss.

   A rounded bar that floats INSET from the screen edges (it never
   touches them). Left: the "مروان" LOGO wordmark + a small bold
   uppercase tagline (DESKTOP ONLY — hidden on small screens, where it
   also lives in About). Right: a real MENU button (label + minimal
   two-line mark) that opens the existing fullscreen menu.

   The pill is the white floating bar from the very first paint — white
   background, soft shadow, inset from the edges — at every scroll
   position. The ONLY scroll behaviour is the optional hide-on-scroll:
   • hides on scroll-down, returns on scroll-up (when enabled).

   State (open) is owned by App; this only renders + toggles + drives
   the optional hide-on-scroll class from scroll.

   ----------------------------------------------------------------
   EXPOSED CONSTANTS (behaviour) — visual constants (inset, max-width,
   radius, shadow, transparent vs filled colours) live at the top of
   Nav.css as CSS custom properties.
   ---------------------------------------------------------------- */
// TAGLINE — shown beside the logo on desktop; hidden on small screens (CSS).
const TAGLINE =
  'FULL-STACK DEVELOPER, DESIGNING & BUILDING DIGITAL EXPERIENCES.'

// LOGO — Arabic wordmark rendered in the custom "LogoFont" face.
const LOGO_TEXT = 'مروان'
// Tunables (Arabic display faces often need size/baseline tweaks). These feed
// CSS custom properties; fine-tune freely. LOGO_SIZE is a fluid clamp so the
// wordmark scales across breakpoints; LOGO_OFFSET nudges the vertical baseline.
const LOGO_SIZE = 'clamp(1.25rem, 2.85vw, 1.75rem)' // ~17% smaller — comfortable balance
const LOGO_OFFSET = '0.01em' // +down / -up — optical centring vs tagline + MENU

const HIDE_ON_SCROLL = true // hide on scroll-down, reveal on scroll-up
const HIDE_AFTER = 140 // px past which hiding is allowed (avoids top flicker)

export default function Nav({ open, onToggle, triggerRef }) {
  const root = useRef(null)

  /* --------------------------------------------------------------
     SCROLL AWARENESS — the pill is always white/floating (CSS). The
     only scroll behaviour is the optional hide-on-scroll: a single
     ScrollTrigger toggles the .is-hidden class (a cheap CSS transform
     transition, 60fps). Disabled entirely under reduced motion, or
     when HIDE_ON_SCROLL is false.
  ---------------------------------------------------------------- */
  useGSAP(
    () => {
      const nav = root.current
      if (!nav) return
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (reduce || !HIDE_ON_SCROLL) return

      const st = ScrollTrigger.create({
        start: 0,
        end: 'max',
        onUpdate: (self) => {
          const hide = self.direction === 1 && self.scroll() > HIDE_AFTER
          nav.classList.toggle('is-hidden', hide)
        },
      })

      return () => st.kill()
    },
    { scope: root },
  )

  return (
    <header
      ref={root}
      className={`nav ${open ? 'is-open' : ''}`}
      style={{ '--logo-size': LOGO_SIZE, '--logo-offset': LOGO_OFFSET }}
    >
      <div className="nav__pill">
        {/* LEFT — Arabic wordmark logo + tagline (tagline desktop-only) */}
        <div className="nav__left">
          <a
            className="nav__logo"
            href="#top"
            aria-label="Marwan — home, back to top"
            onClick={(e) => {
              e.preventDefault()
              smoothScrollTo('#top')
            }}
          >
            <span className="nav__logo-mark" lang="ar" dir="rtl">
              {LOGO_TEXT}
            </span>
          </a>
          <span className="nav__tagline">{TAGLINE}</span>
        </div>

        {/* RIGHT — real button; opens the existing fullscreen menu */}
        <button
          ref={triggerRef}
          type="button"
          className="nav__trigger"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          aria-controls="site-menu"
          onClick={onToggle}
        >
          <span className="nav__trigger-label">{open ? 'Close' : 'Menu'}</span>
          {/* two clean lines → merge into one on open */}
          <span className="nav__mark" aria-hidden="true">
            <span className="nav__bar nav__bar--t" />
            <span className="nav__bar nav__bar--b" />
          </span>
        </button>
      </div>
    </header>
  )
}
