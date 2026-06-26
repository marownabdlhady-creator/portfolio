import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

import './Services.css'

gsap.registerPlugin(useGSAP, ScrollTrigger)

/* ================================================================
   VIDEO → PROJECTS TRANSITION (scoped, namespaced, safe).

   A full-bleed video that SHRINKS to a centred card as you scroll,
   while two words — "Show" (from the LEFT) and "Projects" (from the
   RIGHT) — converge to the centre to form the link "Show Projects".
   Video shrink + word convergence are ONE scrubbed motion (same
   ScrollTrigger), so it feels crisp and synchronized. The whole phrase
   is a link that scrolls down to the Projects grid.

   SAFETY / ISOLATION (strict):
   • Everything is namespaced under `svc-` and every rule is scoped under
     `.svc`. The media stage is position:sticky and the overlay/scrim are
     position:absolute INSIDE it — NOTHING is position:fixed, so this can
     only ever affect its own section, never the hero/navbar/others.
   • VISIBLE BY DEFAULT: in CSS the video is full, the scrim is shown, and
     "Show Projects" is a centred, readable, clickable link. The pre-scroll
     "hidden/offset" state is applied by JS only (in useGSAP's layout
     effect, before paint → no flash). If JS/ScrollTrigger errors, never
     runs, or under reduced motion, the section still renders with the
     video + a working "Show Projects" link. The effect can never hide
     content or crash the page.
   • transform / opacity only → GPU-friendly, 60fps. Lenis-aware.
================================================================ */

/* ----------------------------------------------------------------
   EXPOSED TUNING — fine-tune the transition here.
------------------------------------------------------------------ */
// SHRINK SCROLL LENGTH — extra vertical scroll (in svh) over which the whole
// motion plays while the video is pinned. LOWER = snappier/crisper (less
// draggy). The words converge over this SAME range. (~50–80 feels lively.)
const SHRINK_SCROLL_VH = 60
// FINAL VIDEO SIZE — scale the video ends at (1 = full bleed). ~0.55–0.65
// leaves a tidy centred card with room for the words over it.
const FINAL_VIDEO_SCALE = 0.6
// WORD TRAVEL — how far (in vw) each word starts off-centre before sliding in.
const WORD_TRAVEL_VW = 42
// SCRIM — soft darkening over the video so the light words stay readable on any
// footage. Strength is the rgba alpha; it fades in across the scroll.
const SCRIM_COLOR = 'rgba(10, 10, 10, 0.62)'
// SCRUB SMOOTHING — seconds of catch-up tying the motion to scroll. 0 / true =
// 1:1 (crispest); a small number (~0.4–0.8) adds a smooth premium glide.
const SCRUB = 0.6
// EASE — shapes the scroll→progress mapping. 'none' = perfectly linear/synced.
const SCRUB_EASE = 'none'
// VIDEO — full-bleed source. If this domain is ever blocked, drop a file in
// /public and point this at e.g. `${import.meta.env.BASE_URL}services.mp4`.
const VIDEO_SRC = 'https://grainient.b-cdn.net/Inspirux/new%20short.mp4'
// Anchor target — the Projects section's id.
const PROJECTS_ID = 'projects'

export default function Services() {
  const root = useRef(null)

  // Smooth-scroll the "Show Projects" link to the Projects grid (enhances the
  // plain #projects anchor; falls back to it if the target isn't found).
  const onCtaClick = (e) => {
    const target = document.getElementById(PROJECTS_ID)
    if (!target) return
    e.preventDefault()
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
  }

  useGSAP(
    () => {
      // Best-effort autoplay (muted + playsInline already make this allowed).
      const video = root.current.querySelector('.svc-video')
      if (video) {
        video.muted = true
        const p = video.play()
        if (p && typeof p.catch === 'function') p.catch(() => {})
      }

      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (reduce) return // CSS defaults already show video + centred link.

      const stage = root.current.querySelector('.svc-stage')
      const frame = root.current.querySelector('.svc-frame')
      const scrim = root.current.querySelector('.svc-scrim')
      const left = root.current.querySelector('.svc-word--left')
      const right = root.current.querySelector('.svc-word--right')
      if (!stage || !frame) return

      // SAFETY NET: a failure must NOT throw out of the layout effect, and must
      // never leave content hidden → on error, clear inline styles (CSS shows all).
      try {
        const tl = gsap.timeline({
          defaults: { ease: SCRUB_EASE },
          scrollTrigger: {
            trigger: stage,
            start: 'top top',
            end: 'bottom bottom', // full stage scroll = full transition
            scrub: SCRUB,
            invalidateOnRefresh: true, // recompute vw-based travel on resize
          },
        })

        // ONE synced motion: video shrinks + scrim fades in + words converge.
        tl.fromTo(frame, { scale: 1 }, { scale: FINAL_VIDEO_SCALE, force3D: true }, 0)
        if (scrim) tl.fromTo(scrim, { autoAlpha: 0 }, { autoAlpha: 1 }, 0)
        if (left) {
          tl.fromTo(
            left,
            { x: () => -(window.innerWidth * WORD_TRAVEL_VW) / 100, autoAlpha: 0 },
            { x: 0, autoAlpha: 1, force3D: true },
            0,
          )
        }
        if (right) {
          tl.fromTo(
            right,
            { x: () => (window.innerWidth * WORD_TRAVEL_VW) / 100, autoAlpha: 0 },
            { x: 0, autoAlpha: 1, force3D: true },
            0,
          )
        }

        // Webfont metrics can shift trigger positions — refresh once settled.
        if (document.fonts && document.fonts.ready) {
          document.fonts.ready.then(() => ScrollTrigger.refresh()).catch(() => {})
        }

        // Keep ScrollTrigger in sync with Lenis (if present) so they don't
        // fight/stutter. No-op when Lenis is absent.
        const lenis = window.lenis || window.__lenis
        let onLenisScroll
        if (lenis && typeof lenis.on === 'function') {
          onLenisScroll = () => ScrollTrigger.update()
          lenis.on('scroll', onLenisScroll)
          return () => {
            if (typeof lenis.off === 'function') lenis.off('scroll', onLenisScroll)
          }
        }
      } catch (err) {
        // Hard fallback: clear inline styles → video + link fully visible.
        gsap.set([frame, scrim, left, right].filter(Boolean), { clearProps: 'all' })
        // eslint-disable-next-line no-console
        console.error('[Services] video transition init failed; static shown.', err)
      }
    },
    { scope: root },
  )

  return (
    <section
      className="svc"
      ref={root}
      aria-label="Projects intro"
      style={{
        '--svc-scrim': SCRIM_COLOR,
        '--svc-reveal': `${SHRINK_SCROLL_VH}svh`,
      }}
    >
      {/* MEDIA STAGE — tall, so the inner media can stay pinned (sticky) while
          the transition plays. The scroll length = the stage's extra height. */}
      <div className="svc-stage">
        <div className="svc-sticky">
          {/* Video card — scales down (full bleed → centred card). */}
          <div className="svc-frame">
            <video
              className="svc-video"
              src={VIDEO_SRC}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
            />
            {/* Readability scrim over the video (fades in with the shrink). */}
            <span className="svc-scrim" aria-hidden="true" />
          </div>

          {/* CONVERGING WORDS — one link "Show Projects" → scrolls to Projects. */}
          <a
            className="svc-cta"
            href={`#${PROJECTS_ID}`}
            aria-label="Show Projects"
            onClick={onCtaClick}
          >
            <span className="svc-word svc-word--left">Show</span>
            <span className="svc-word svc-word--right">Projects</span>
          </a>
        </div>
      </div>
    </section>
  )
}
