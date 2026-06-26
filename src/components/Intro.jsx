import { useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'

import './Intro.css'

gsap.registerPlugin(useGSAP)

/* ================================================================
   INTRO PRELOADER — a short, premium opening overlay.

   GLOBAL, app-level: mounted ONCE at the app root (App.jsx), ABOVE all
   content. It covers the screen black on first load, counts 0→100 while
   the "مروان" wordmark + tagline mask-up, then a curtain-up reveals the
   Hero already living + animating beneath it (one continuous shot). On
   finish it RESUMES Lenis and REMOVES itself from the DOM entirely — no
   leftover overlay can block clicks.

   ISOLATION: every class/ID is namespaced `intro-`. The fixed full-screen
   overlay + z-index 100000 are intentional and REQUIRED here (the one place
   besides the cursor where that's correct). It touches nothing global except
   pausing/resuming Lenis (stop/start only — never re-init) and a temporary
   scroll-lock class on <html> that is removed on finish.

   SAFE BY CONSTRUCTION: try/catch + a hard safety timeout + useGSAP cleanup
   all funnel through ONE idempotent teardown, so it is impossible to get
   stuck on black. Reduced-motion / no-GSAP / already-played → it renders
   NOTHING and the site shows immediately.
================================================================ */

/* ---- CONFIG (editable) ---------------------------------------- */
// "Hello" across a few languages — each shows FULLY (no clip), large & centred,
// for a short beat, then swaps to the next. Closes on Arabic. Edit/reorder freely.
const INTRO_HELLOS = ['Hello', 'Bonjour', 'こんにちは', 'Привет', 'مرحبا']

const INTRO = {
  bg: '#0a0a0a',
  text: '#f4f4f4',
  name: 'مروان',
  line: 'A Journey in Design and Creativity',
  hellos: INTRO_HELLOS,
  wordHold: 0.26, // seconds each greeting rests FULLY visible before it leaves
  wordFade: 0.2, // fade-in / fade-out duration — longer = smoother (NOT overlapped)
  wordGap: 0.05, // gentle breath between one word leaving and the next arriving
  wordTravel: 9, // yPercent the greeting glides in/out (subtler = smoother)
  curtainDur: 0.62, // split-curtain reveal to the Hero (eased, buttery)
  curtainEase: 'expo.inOut',
  runOncePerSession: false, // DEV: replay on every reload. Set true for production.
  safetyTimeout: 5500, // > full runtime (~3.9s: 5 sequential greetings + curtain)
}

// Detect Arabic/RTL text so a greeting like "مرحبا" reads right-to-left.
const isRTLText = (s) => /[؀-ۿ]/.test(s)

/* Module-level guard. Survives a React StrictMode unmount→remount within the
   SAME page load (so the dev double-mount still plays through), while
   sessionStorage still prevents a replay across SEPARATE loads in the
   session. */
let introRunStarted = false

const getLenis = () =>
  (typeof window !== 'undefined' && (window.lenis || window.__lenis)) || null

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

const gsapReady = () => !!gsap && typeof gsap.timeline === 'function'

export default function Intro() {
  const rootRef = useRef(null)

  /* Decide ONCE, synchronously (before first paint), whether to render the
     preloader at all. If not, this component renders null and the Hero shows
     immediately with scroll never locked. */
  const [visible, setVisible] = useState(() => {
    if (typeof window === 'undefined') return false
    if (!gsapReady()) return false // GSAP unavailable → just show the site
    if (prefersReducedMotion()) return false // reduced motion → skip animation
    if (INTRO.runOncePerSession) {
      try {
        // Played in an EARLIER load this session (not merely a StrictMode
        // remount of the current load) → skip so it never repeats on refresh.
        if (sessionStorage.getItem('introPlayed') && !introRunStarted) return false
      } catch {
        /* storage blocked (private mode) → just play once */
      }
    }
    return true
  })

  useGSAP(
    () => {
      if (!visible) return
      const rootEl = rootRef.current
      if (!rootEl) return

      let finished = false
      let safetyId = 0

      /* ONE idempotent teardown — every path (onComplete, catch, safety
         timeout, unmount) funnels here: restore scroll + Lenis, then unmount
         the overlay. Impossible to leave the user trapped on black. */
      const finish = () => {
        if (finished) return
        finished = true
        if (safetyId) clearTimeout(safetyId)
        try {
          document.documentElement.classList.remove('intro-active')
          const lenis = getLenis()
          if (lenis && typeof lenis.start === 'function') lenis.start()
        } catch {
          /* nothing else we can do */
        }
        setVisible(false) // React removes `.intro-root` from the DOM entirely
      }

      try {
        introRunStarted = true
        // Mark played up-front so a refresh mid-play won't replay it.
        if (INTRO.runOncePerSession) {
          try {
            sessionStorage.setItem('introPlayed', '1')
          } catch {
            /* ignore */
          }
        }

        // LOCK SCROLL — pause Lenis if present (stop/start only, no re-init)
        // + a temporary <html> class for the native scroll container.
        document.documentElement.classList.add('intro-active')
        const lenis = getLenis()
        if (lenis && typeof lenis.stop === 'function') lenis.stop()

        // HARD SAFETY — if the timeline never completes, force-reveal the site.
        safetyId = window.setTimeout(finish, INTRO.safetyTimeout)

        // TIMING — every greeting is its own stacked element in an UNCLIPPED
        // slot. They swap STRICTLY ONE AT A TIME: word i fully fades out, a tiny
        // dead beat passes, THEN word i+1 fades in. At no instant are two words
        // both visible, and each word is shown FULLY (no clip).
        const greetEls = gsap.utils.toArray(rootEl.querySelectorAll('.intro-greet-word'))
        const wordHold = INTRO.wordHold // beat each word rests fully visible
        const wordFade = INTRO.wordFade // fade-in / fade-out duration
        const wordGap = INTRO.wordGap ?? 0.04 // dead beat between out → next in
        const travel = INTRO.wordTravel ?? 10 // yPercent glide distance
        // One full word slot = fade-in + hold + fade-out + gap. The next word's
        // fade-in begins only after this whole slot ends → never overlapping.
        const wordSlot = wordFade + wordHold + wordFade + wordGap
        const curtain = INTRO.curtainDur ?? 0.45 // split-curtain reveal duration
        const lastIdx = greetEls.length - 1

        // Start states applied by JS only (before paint → no flash). The words
        // are VISIBLE BY DEFAULT in CSS; we hide them here, never via a clip.
        // autoAlpha also toggles visibility:hidden at opacity 0, so a fully
        // faded word is removed from view entirely (cannot overlap the next).
        // The wordmark/tagline are kept hidden — the short flow ends on مرحبا.
        gsap.set(['.intro-name .intro-reveal', '.intro-line .intro-reveal'], { yPercent: 110 })
        gsap.set(greetEls, { autoAlpha: 0, yPercent: travel })

        const tl = gsap.timeline({
          defaults: { ease: 'power3.out' },
          onComplete: finish,
        })

        // 1) GREETING CYCLE — strictly sequential. Word i fades+slides in, holds
        //    fully visible, then fades+slides out BEFORE the next begins. Only
        //    one word is ever on screen. The LAST greeting (مرحبا) is the closing
        //    beat: it stays, then leaves together WITH the curtain (never paired
        //    with another word), so the swap is never overlapped.
        const startAt = 0.05
        greetEls.forEach((el, i) => {
          const inAt = startAt + i * wordSlot
          tl.fromTo(
            el,
            { autoAlpha: 0, yPercent: travel },
            { autoAlpha: 1, yPercent: 0, duration: wordFade, ease: 'sine.inOut' },
            inAt,
          )
          if (i !== lastIdx) {
            tl.to(
              el,
              { autoAlpha: 0, yPercent: -travel, duration: wordFade, ease: 'sine.inOut' },
              inAt + wordFade + wordHold, // out starts only after the full hold
            )
          }
        })

        // 2) SPLIT-SCREEN REVEAL — the last greeting holds a touch longer, then
        //    the foreground (with مرحبا) fades, a hairline seam flashes, and the
        //    two halves fly apart to uncover the Hero beneath. One continuous shot.
        const splitAt = startAt + lastIdx * wordSlot + wordFade + wordHold * 1.4
        tl.to('.intro-content', { autoAlpha: 0, duration: 0.4, ease: 'sine.inOut' }, splitAt)
        tl.fromTo(
          '.intro-seam',
          { scaleX: 0, autoAlpha: 0 },
          { scaleX: 1, autoAlpha: 1, duration: 0.3, ease: 'sine.out' },
          splitAt,
        )
        tl.to('.intro-seam', { autoAlpha: 0, duration: 0.42, ease: 'sine.in' }, splitAt + 0.24)
        tl.to(
          '.intro-panel--top',
          { yPercent: -100, duration: curtain, ease: INTRO.curtainEase },
          splitAt + 0.1,
        )
        tl.to(
          '.intro-panel--bottom',
          { yPercent: 100, duration: curtain, ease: INTRO.curtainEase },
          splitAt + 0.1,
        )
      } catch (err) {
        // ANY failure → resume + reveal immediately; never trap on black.
        // eslint-disable-next-line no-console
        console.error('[Intro] preloader failed; revealing site.', err)
        finish()
      }

      /* If we unmount before finishing (e.g. StrictMode), still restore
         scroll/Lenis so nothing stays locked. The GSAP context auto-reverts
         the timeline + inline styles. */
      return () => {
        if (safetyId) clearTimeout(safetyId)
        if (!finished) {
          try {
            document.documentElement.classList.remove('intro-active')
            const lenis = getLenis()
            if (lenis && typeof lenis.start === 'function') lenis.start()
          } catch {
            /* ignore */
          }
        }
      }
    },
    { scope: rootRef, dependencies: [visible] },
  )

  if (!visible) return null

  return (
    <div
      className="intro-root"
      ref={rootRef}
      aria-hidden="true"
      style={{ '--intro-bg': INTRO.bg, '--intro-text': INTRO.text }}
    >
      {/* The two black halves that fly apart to reveal the Hero. */}
      <span className="intro-panel intro-panel--top" aria-hidden="true" />
      <span className="intro-panel intro-panel--bottom" aria-hidden="true" />
      {/* Hairline that flashes along the split seam at the moment of reveal. */}
      <span className="intro-seam" aria-hidden="true" />

      <div className="intro-content">
        <div className="intro-center">
          {/* Multilingual greeting — each word is its own stacked element in an
              unclipped slot; JS crossfades them so each shows fully, never sliced. */}
          <div className="intro-greet">
            {(INTRO.hellos ?? []).map((w, i) => (
              <span
                className="intro-greet-word"
                key={`${w}-${i}`}
                dir={isRTLText(w) ? 'rtl' : 'ltr'}
              >
                {w}
              </span>
            ))}
          </div>

          {/* The wordmark that the greeting settles into. */}
          <div className="intro-name">
            <span className="intro-mask">
              <span className="intro-reveal">{INTRO.name}</span>
            </span>
          </div>

          <div className="intro-line">
            <span className="intro-mask">
              <span className="intro-reveal">{INTRO.line}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
