import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

import './Contact.css'

gsap.registerPlugin(useGSAP, ScrollTrigger)

/* ================================================================
   CONTACT — cinematic closing finale (PINLESS, LIGHT/WHITE).

   A small framed VIDEO grows to a full-screen background as you scroll,
   with a single line + a "Visit Website" button beside it. This keeps the
   Flip.fit()+scrub CodePen feel WITHOUT GSAP Flip and WITHOUT a
   ScrollTrigger pin — the highest-risk patterns on a Lenis stack.

   HOW (pinless sticky stage — UNCHANGED mechanic):
   • `.ctc-root` is a tall section (config.runway) giving scroll room.
   • `.ctc-stage` is position:sticky / top:0 / 100vh — native sticky keeps
     it "held" in view while the tall root scrolls past. No pin, no fixed.
   • `.ctc-media` (now a <video>) is ALWAYS full-viewport-sized; only its
     clip-path inset changes — from a small rounded window (progress 0) to
     inset(0) full bleed (progress 1). Animating clip-path (not width/
     height/top/left) is GPU-friendly and triggers no layout.

   ONE scrubbed ScrollTrigger (trigger:.ctc-root, top top → bottom bottom)
   drives a timeline: clip grow + light scrim fade-in + content rise-in.
   transform / opacity / clip-path only → 60fps.

   LIGHT SECTION: white bg, near-black text. The video sits behind; copy is
   kept legible by living in a SOLID WHITE CHIP (.ctc-content), never bare
   over the footage — so contrast stays ≥4.5:1 at every scroll position.

   CURSOR: the button AND the stage carry data-cursor="view" +
   data-cursor-label, which drives the EXISTING global `mcur-` cursor's
   view state (ring grows + shows the label). No new cursor here.

   ISOLATION (non-negotiable — this is what broke the site before):
   • Every class/ID prefixed `ctc-`; every CSS rule scoped under `.ctc-root`.
   • NO global/body/html styles. NO position:fixed (sticky only). NO Flip.
   • Navbar, Lenis, smooth-scroll, cursor internals, global config: untouched.
     The video lives inside this stage, z-index BELOW the navbar — never
     overlays the nav.
   • VISIBLE BY DEFAULT in CSS: full-bleed video (or poster) + readable line +
     clickable button. Start-states (small clip window, scrim 0, content
     hidden) are applied by JS ONLY. If JS never runs / throws / reduced-motion
     / autoplay blocked → static END state.
   • All GSAP inside useGSAP({ scope: root }); scoped refs (no document
     queries); clip recomputed on resize (revert + rebuild); cleaned up.
================================================================ */

/* ----------------------------------------------------------------
   CONFIG — editable.
   abot.mp4 lives in /public/assets (same convention as hero.png), served
   at `${import.meta.env.BASE_URL}assets/abot.mp4`. Poster is a frame
   extracted from it (assets/abot-poster.jpg) so something shows before the
   video loads / if autoplay is blocked.
------------------------------------------------------------------ */
const CTC = {
  bg: '#ffffff',
  text: '#0a0a0a',
  muted: '#6b6b6b',
  video: `${import.meta.env.BASE_URL}assets/abot.mp4`, // EDIT: video URL (mp4/webm)
  poster: `${import.meta.env.BASE_URL}assets/abot-poster.jpg`, // EDIT: fallback still
  grayscale: false,
  line: "If you're interested in getting to know me more",
  ctaLabel: 'Visit Website',
  websiteUrl: 'https://dedicated-method-548323.framer.app/',
  cursorLabel: 'Visit Website',
  runway: '250vh',
  scrub: 1,
  windowWidthPx: 280,
  windowRatio: '16/9',
  windowRadiusPx: 10,
  scrimOpacity: 0.15,
}

const lerp = (a, b, t) => a + (b - a) * t

export default function Contact() {
  const root = useRef(null)
  const stageRef = useRef(null)
  const mediaRef = useRef(null)
  const scrimRef = useRef(null)
  const contentRef = useRef(null)

  useGSAP(
    () => {
      const media = mediaRef.current // <video>
      const rootEl = root.current
      if (!media || !rootEl) return // CSS already shows the static end state.

      // prefers-reduced-motion → keep the static END state (CSS default).
      // Do NOT autoplay: the untouched <video> renders its poster full-bleed,
      // line + button visible. No grow, no scrub, no motion.
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (reduce) return

      const [rw, rh] = String(CTC.windowRatio).split('/').map(Number)
      const ratio = rw && rh ? rh / rw : 9 / 16

      // Compute the small first-frame window (a rounded box at left-center)
      // from the current viewport. Returns inset px values + radius.
      const computeStart = () => {
        const W = window.innerWidth
        const H = window.innerHeight
        const isMobile = W < 640
        const margin = isMobile ? Math.max(16, W * 0.06) : Math.max(24, W * 0.08)
        const winW = Math.min(CTC.windowWidthPx, Math.max(120, W - margin * 2))
        const winH = winW * ratio
        // Desktop: window pinned left, raised above the lower-left content chip.
        // Mobile: window centred horizontally and raised (content flows below).
        const left = isMobile ? (W - winW) / 2 : margin
        const right = W - left - winW
        const cy = isMobile ? H * 0.34 : H * 0.42
        const top = Math.max(0, cy - winH / 2)
        const bottom = Math.max(0, H - top - winH)
        return { top, right, bottom, left, radius: CTC.windowRadiusPx }
      }

      let start = computeStart()
      const state = { p: 0 } // 0 = small window, 1 = full bleed

      const applyClip = (p) => {
        const t = lerp(start.top, 0, p)
        const r = lerp(start.right, 0, p)
        const b = lerp(start.bottom, 0, p)
        const l = lerp(start.left, 0, p)
        const rad = lerp(start.radius, 0, p)
        media.style.clipPath = `inset(${t}px ${r}px ${b}px ${l}px round ${rad}px)`
      }

      let tl
      let cleanupExtras = () => {}

      // HARD FALLBACK / autoplay-blocked → render the static END state:
      // full-bleed video (showing poster) on white, line + button visible.
      const forceStatic = () => {
        try {
          if (tl) {
            if (tl.scrollTrigger) tl.scrollTrigger.kill()
            tl.kill()
          }
          media.style.clipPath = ''
          gsap.set([scrimRef.current, contentRef.current].filter(Boolean), {
            clearProps: 'all',
          })
        } catch {
          /* no-op: CSS default already shows the readable end state */
        }
      }

      try {
        // Autoplay the muted, inline video so the grow shows moving footage.
        // If the browser blocks autoplay, fall back to the static poster state.
        media.muted = true
        const playAttempt = media.play && media.play()
        if (playAttempt && typeof playAttempt.catch === 'function') {
          playAttempt.catch(() => forceStatic())
        }

        // JS-applied START states (CSS keeps them visible if JS never runs).
        applyClip(0)
        if (scrimRef.current) gsap.set(scrimRef.current, { opacity: 0 })
        if (contentRef.current) gsap.set(contentRef.current, { opacity: 0, y: 24 })

        // ONE scrubbed timeline, NO pin. Total duration normalised to 1 so the
        // sub-tweens can be placed by fraction.
        tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: rootEl,
            start: 'top top',
            end: 'bottom bottom',
            scrub: CTC.scrub,
            invalidateOnRefresh: true,
          },
        })

        // Clip grow across the FULL range (drives small → full-bleed video).
        tl.to(state, { p: 1, onUpdate: () => applyClip(state.p) }, 0)

        // Light scrim fades IN over the middle (softens video edges only — NOT
        // for legibility; the content chip handles that).
        if (scrimRef.current) {
          tl.to(scrimRef.current, { opacity: CTC.scrimOpacity, duration: 0.4 }, 0.3)
        }

        // Content (line + button) rises + fades IN EARLY beside the small video
        // and STAYS visible/readable through to full-bleed (the white chip keeps
        // it legible over the footage at every position).
        if (contentRef.current) {
          tl.to(contentRef.current, { opacity: 1, y: 0, duration: 0.3 }, 0.05)
        }

        // Keep ScrollTrigger in sync with Lenis (if present). No-op when absent.
        // We only LISTEN — never re-init Lenis/ScrollTrigger.
        const lenis = window.lenis || window.__lenis
        let onLenisScroll
        if (lenis && typeof lenis.on === 'function') {
          onLenisScroll = () => ScrollTrigger.update()
          lenis.on('scroll', onLenisScroll)
        }

        // Recompute the start window on resize (revert + rebuild the clip),
        // then refresh trigger positions. Debounced via rAF.
        let raf = 0
        const onResize = () => {
          if (raf) cancelAnimationFrame(raf)
          raf = requestAnimationFrame(() => {
            start = computeStart()
            applyClip(state.p) // re-apply at current progress with new geometry
            ScrollTrigger.refresh()
          })
        }
        window.addEventListener('resize', onResize)

        // Recompute once webfonts settle (layout/line metrics can shift).
        if (document.fonts && document.fonts.ready) {
          document.fonts.ready.then(() => ScrollTrigger.refresh()).catch(() => {})
        }

        cleanupExtras = () => {
          window.removeEventListener('resize', onResize)
          if (raf) cancelAnimationFrame(raf)
          if (lenis && onLenisScroll && typeof lenis.off === 'function') {
            lenis.off('scroll', onLenisScroll)
          }
        }
      } catch (err) {
        forceStatic()
        // eslint-disable-next-line no-console
        console.error('[Contact] finale init failed; static end state shown.', err)
      }

      // Manual cleanup (useGSAP scope reverts the tween/trigger automatically).
      return () => cleanupExtras()
    },
    { scope: root },
  )

  return (
    <section
      id="contact"
      className="ctc-root"
      ref={root}
      aria-labelledby="ctc-heading"
      style={{
        '--ctc-bg': CTC.bg,
        '--ctc-text': CTC.text,
        '--ctc-muted': CTC.muted,
        '--ctc-runway': CTC.runway,
        '--ctc-grayscale': CTC.grayscale ? 'grayscale(1)' : 'none',
        '--ctc-scrim-opacity': CTC.scrimOpacity,
      }}
    >
      <h2 id="ctc-heading" className="ctc-sr-only">
        Contact
      </h2>

      {/* STAGE — native position:sticky, held while the root scrolls. Carries
          the cursor view-state so hovering anywhere on the growing video shows
          the "Visit Website" label in the existing custom cursor. */}
      <div
        className="ctc-stage"
        ref={stageRef}
        data-cursor="view"
        data-cursor-label={CTC.cursorLabel}
      >
        {/* MEDIA — full-viewport muted/looping/inline video, clipped to a small
            window at the start. Poster shows before load / if autoplay blocked. */}
        <video
          className="ctc-media"
          ref={mediaRef}
          src={CTC.video}
          poster={CTC.poster}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
          tabIndex={-1}
        />

        {/* SCRIM — light translucent overlay; softens video edges only. */}
        <div className="ctc-scrim" ref={scrimRef} aria-hidden="true" />

        {/* CONTENT — line + "Visit Website" button in a SOLID white chip so the
            copy stays readable over the footage at any scroll position. */}
        <div className="ctc-content" ref={contentRef}>
          <p className="ctc-line">{CTC.line}</p>
          <a
            className="ctc-cta"
            href={CTC.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-cursor="view"
            data-cursor-label={CTC.cursorLabel}
          >
            {CTC.ctaLabel}
            <span className="ctc-cta-arrow" aria-hidden="true">
              ↗
            </span>
          </a>
        </div>
      </div>
    </section>
  )
}
