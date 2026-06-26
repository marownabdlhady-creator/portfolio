import { useEffect, useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'

import './Menu.css'
import { smoothScrollTo } from '../lib/smoothScrollTo.js'

gsap.registerPlugin(useGSAP)

/* ================================================================
   FULLSCREEN MENU — minimal Swiss, purely typographic.

   Calm, restful, easy on the eyes: a near-black panel gently wipes in,
   then the links clip-reveal up from masks with a soft, gentle stagger
   (numbers reveal with their links). Close reverses, unhurried. The
   right side is left as quiet negative space — links only.
   Only transform / opacity / clip-path animate (GPU, 60fps).
   State (open) is owned by the parent.
================================================================ */

/* ----------------------------------------------------------------
   EASY-TO-TWEAK CONSTANTS
------------------------------------------------------------------ */
// Nav links — edit / reorder freely; the index numbers re-derive.
const LINKS = [
  { label: 'About', href: '#about' },
  { label: 'Projects', href: '#projects' },
  { label: 'Services', href: '#services' },
  { label: 'Contact', href: '#contact' },
]
// Footer meta row (email + socials). Set false to drop it entirely.
const SHOW_META = true

// OVERLAY — the panel colour (near-black, per spec).
const OVERLAY_COLOR = '#0a0a0a'

// WIPE — direction the panel travels in to cover the screen.
//   'top' (top→bottom) · 'bottom' · 'left' · 'right'
const WIPE_FROM = 'top'
const OPEN_DURATION = 0.65 // panel wipe-in (s) — soft, slow, unhurried
const CLOSE_DURATION = 0.55 // overall close (s) — calm, a touch quicker
const WIPE_EASE = 'power3.inOut' // gentle cinematic ease (no snap)

// LINK STAGGER — the calm, gentle rhythm.
const LINK_STAGGER = 0.08 // delay between each link (≈70–90ms)
const LINK_DURATION = 0.7 // each link's clip-reveal duration
const LINK_EASE = 'power3.out' // soft deceleration
// When links start, as a fraction of the wipe (≈ as the panel settles). Kept
// late enough that the panel already covers the centred links before they rise.
const LINK_START = 0.6

// HOVER DIM — opacity of the NON-hovered links while another is hovered
// (lower = more muted; the hovered link stays full white). Soft ~0.3s fade.
const HOVER_DIM = 0.4

// The panel's hidden (pre-wipe) clip per direction; it animates to fully shown.
const HIDDEN_CLIP = {
  top: 'inset(0% 0% 100% 0%)',
  bottom: 'inset(100% 0% 0% 0%)',
  left: 'inset(0% 100% 0% 0%)',
  right: 'inset(0% 0% 0% 100%)',
}
const FULL_CLIP = 'inset(0% 0% 0% 0%)'

export default function Menu({ open, onClose, triggerRef }) {
  const root = useRef(null)
  const tlRef = useRef(null)
  const mounted = useRef(false)

  /* --------------------------------------------------------------
     Build the open timeline ONCE (paused). play() to open, reverse()
     to close — a guaranteed-symmetric rewind that stays seamless on
     rapid toggles. useGSAP scope reverts everything on unmount.
  ---------------------------------------------------------------- */
  useGSAP(
    () => {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      // Reduced motion: no timeline. CSS shows/hides with a fast fade and every
      // layer renders at its final state (no wipe, no stagger).
      if (reduce) {
        tlRef.current = null
        return
      }

      const tl = gsap
        .timeline({ paused: true })
        // 1) PANEL gently wipes across to cover the screen
        .fromTo(
          '.menu__panel',
          { clipPath: HIDDEN_CLIP[WIPE_FROM] },
          { clipPath: FULL_CLIP, duration: OPEN_DURATION, ease: WIPE_EASE },
          0,
        )
        // 2) LINKS clip-reveal up from their masks, gentle stagger (the signature)
        .fromTo(
          '.menu__link-inner',
          { yPercent: 115 },
          {
            yPercent: 0,
            duration: LINK_DURATION,
            stagger: LINK_STAGGER,
            ease: LINK_EASE,
          },
          OPEN_DURATION * LINK_START,
        )
        // 2b) INDEX numbers fade with their link, so they belong ONLY to the
        //     overlay and vanish completely when it closes (never over the hero).
        .fromTo(
          '.menu__index',
          { autoAlpha: 0 },
          {
            autoAlpha: 1,
            duration: LINK_DURATION,
            stagger: LINK_STAGGER,
            ease: LINK_EASE,
          },
          OPEN_DURATION * LINK_START,
        )

      // 3) META fades up last (only if present)
      if (SHOW_META) {
        tl.fromTo(
          '.menu__meta',
          { autoAlpha: 0, y: 16 },
          { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power2.out' },
          '-=0.25',
        )
      }

      tlRef.current = tl
    },
    { scope: root },
  )

  // Drive the timeline from React state.
  useEffect(() => {
    const tl = tlRef.current
    if (!tl) return
    if (open) {
      tl.timeScale(1).play()
    } else {
      // Close a touch quicker than open; reverse keeps it perfectly symmetric.
      tl.timeScale(OPEN_DURATION / CLOSE_DURATION).reverse()
    }
  }, [open])

  // Focus: move INTO the menu on open, RETURN to the trigger on close.
  // (Skip the first mount so we never steal focus on page load.)
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true
      return
    }
    if (open) {
      const first = root.current?.querySelector('a[href], button')
      const id = requestAnimationFrame(() => first?.focus())
      return () => cancelAnimationFrame(id)
    }
    triggerRef?.current?.focus()
  }, [open, triggerRef])

  // Link click → close the menu first, then smooth-scroll to the section.
  // preventDefault keeps it from a hard hash jump; the scroll runs on the
  // next frame so React has flipped `open` and the close wipe has begun.
  const onLinkClick = (href) => (e) => {
    e.preventDefault()
    onClose()
    requestAnimationFrame(() => smoothScrollTo(href))
  }

  // Esc closes; Tab is trapped within the menu while open.
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }
      if (e.key !== 'Tab') return
      const f = root.current?.querySelectorAll('a[href], button:not([disabled])')
      if (!f || !f.length) return
      const first = f[0]
      const last = f[f.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <div
      id="site-menu"
      className={`menu ${open ? 'is-open' : ''}`}
      ref={root}
      aria-hidden={!open}
      style={{ '--overlay': OVERLAY_COLOR, '--dim': HOVER_DIM }}
    >
      {/* PANEL — the wiping near-black surface (decorative) */}
      <div className="menu__panel" aria-hidden="true" />

      {/* CONTENT — links (left) + optional meta row. Right side = negative space. */}
      <nav className="menu__inner" aria-label="Primary">
        <ul className="menu__list">
          {LINKS.map((l, i) => (
            <li className="menu__item" key={l.label}>
              <a className="menu__link" href={l.href} onClick={onLinkClick(l.href)}>
                <span className="menu__index">{`0${i + 1}`}</span>
                <span className="menu__link-mask">
                  <span className="menu__link-inner">
                    <span className="menu__link-fx">{l.label}</span>
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ul>

        {SHOW_META && (
          <div className="menu__meta">
            <a className="menu__email" href="mailto:hello@studio.com">
              hello@studio.com
            </a>
            <div className="menu__socials">
              <a href="#i">Instagram</a>
              <a href="#b">Behance</a>
              <a href="#l">LinkedIn</a>
            </div>
          </div>
        )}
      </nav>
    </div>
  )
}
