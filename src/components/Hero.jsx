import {
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

import Menu from './Menu.jsx'
import './Hero.css'

// Register plugins once at module scope.
// The headline is split into characters manually in JSX, so the masked
// clip-up reveal works without the SplitText plugin.
gsap.registerPlugin(useGSAP, ScrollTrigger)

/* ================================================================
   THE HERO is built as ONE object made of TWO real, live, pixel-
   aligned layers on the same layout grid:

     SURFACE  — the clean designed hero (light, on top).
     SYSTEM   — the engineering layer that "makes" it (dark blueprint
                underneath: component tree, layout guides, a data line
                and the ACTUAL JSX that renders the headline, whose
                text is genuinely streamed in token-by-token at runtime).

   A draggable vertical seam wipes between them via a clip-path on the
   Surface layer. Because both layers share the exact same headline box
   (same font / size / position), the peel reads as a single object:
   "the made" and "the making".
================================================================ */

// Display copy, modelled as lines. The SAME array drives both the live
// Surface headline and the streamed System headline (and is mirrored in
// the System code block) so the System layer is literally true.
const HEADING_LINES = ['FORM', 'FOLLOWS', 'FEELING']

// Pre-computed flat offsets so the streamer can map a global char index
// back onto its line without recounting every frame.
const LINE_STARTS = HEADING_LINES.reduce(
  (acc, line) => {
    acc.push(acc[acc.length - 1] + line.length)
    return acc
  },
  [0],
)
const TOTAL_CHARS = HEADING_LINES.join('').length

// Streaming window: as the System reveal fraction crosses this band the
// headline builds from 0 -> all characters.
const STREAM_START = 0.12
const STREAM_END = 0.9

const clamp = (v, min, max) => Math.min(max, Math.max(min, v))

/* ================================================================
   SYSTEM HEADLINE — the live build.

   Renders the SAME markup as the Surface headline (so it occupies the
   identical box and stays pixel-aligned), but each glyph is hidden until
   it has been "emitted". A gsap.ticker loop eases a displayed-character
   count toward a target derived from the seam position, at a capped
   tokens/sec rate — so it genuinely streams like a model emitting tokens
   rather than scrubbing. State lives here so streaming re-renders never
   touch the Surface layer or the seam.
================================================================ */
const SystemHeadline = forwardRef(function SystemHeadline({ reduced }, ref) {
  const [count, setCount] = useState(0) // characters currently emitted
  const target = useRef(0) // desired count (float), driven by the seam
  const disp = useRef(0) // currently displayed count (float, eased)
  const rendered = useRef(0) // last integer pushed to React state

  // Imperative API the drag handler calls every frame.
  useImperativeHandle(
    ref,
    () => ({
      // fraction = how much of the width currently shows the System layer
      setTarget(fraction) {
        const t = clamp(
          ((fraction - STREAM_START) / (STREAM_END - STREAM_START)) * TOTAL_CHARS,
          0,
          TOTAL_CHARS,
        )
        target.current = t
        // Reduced motion: no streaming — snap to the resolved count.
        if (reduced) {
          const c = Math.round(t)
          disp.current = c
          rendered.current = c
          setCount(c)
        }
      },
    }),
    [reduced],
  )

  // The streaming ticker (skipped entirely under reduced motion).
  useEffect(() => {
    if (reduced) return
    const RATE_IN = 24 // tokens/sec while building (reads as typing)
    const RATE_OUT = 60 // faster while retracting (feels responsive)
    const tick = (_time, dt) => {
      const tg = target.current
      let d = disp.current
      if (d < tg) d = Math.min(tg, d + (RATE_IN / 1000) * dt)
      else if (d > tg) d = Math.max(tg, d - (RATE_OUT / 1000) * dt)
      disp.current = d
      const ci = Math.floor(d + 1e-6)
      if (ci !== rendered.current) {
        rendered.current = ci
        setCount(ci)
      }
    }
    gsap.ticker.add(tick)
    return () => gsap.ticker.remove(tick)
  }, [reduced])

  // Where the caret sits (the streaming frontier).
  let caretLine = 0
  let caretCol = 0
  for (let i = 0; i < HEADING_LINES.length; i++) {
    const start = LINE_STARTS[i]
    const len = HEADING_LINES[i].length
    if (count <= start + len) {
      caretLine = i
      caretCol = count - start
      break
    }
    caretLine = i
    caretCol = len
  }
  const showCaret = !reduced && count < TOTAL_CHARS

  return (
    <h1 className="hero__heading is-system" aria-hidden="true">
      {HEADING_LINES.map((line, li) => {
        const start = LINE_STARTS[li]
        const kids = []
        for (let ci = 0; ci < line.length; ci++) {
          // caret renders at the frontier, before the next glyph to appear
          if (showCaret && li === caretLine && ci === caretCol) {
            kids.push(<span className="sys-caret" key={`caret-${ci}`} />)
          }
          const idx = start + ci
          kids.push(
            <span className={`char ${idx < count ? 'is-on' : ''}`} key={ci}>
              <span className="char-inner">{line[ci]}</span>
            </span>,
          )
        }
        // caret at end-of-line when the frontier landed there
        if (showCaret && li === caretLine && caretCol === line.length) {
          kids.push(<span className="sys-caret" key="caret-end" />)
        }
        return (
          <span className="hero__line" key={li}>
            <span className="hero__word">{kids}</span>
          </span>
        )
      })}
    </h1>
  )
})

/* The real JSX that renders the headline, as colour-tokenised lines.
   This mirrors HEADING_LINES -> mapped <span> exactly, so the System
   layer shows the actual structure of THIS hero, not filler code. */
const TOK = { k: 'sy-kw', s: 'sy-str', f: 'sy-fn', t: 'sy-tag', a: 'sy-attr' }
const CODE_LINES = [
  [['const', 'k'], [' LINES = ['], ["'FORM'", 's'], [', '], ["'FOLLOWS'", 's'], [', '], ["'FEELING'", 's'], [']']],
  [],
  [['function', 'k'], [' '], ['Headline', 'f'], ['() {']],
  [['  return (']],
  [['    <'], ['h1', 't'], [' '], ['className', 'a'], ['='], ['"hero__heading"', 's'], ['>']],
  [['      {LINES.'], ['map', 'f'], ['((w) => (']],
  [['        <'], ['span', 't'], ['>{w}</'], ['span', 't'], ['>']],
  [['      ))}']],
  [['    </'], ['h1', 't'], ['>']],
  [['  )']],
  [['}']],
]

function Hero() {
  // Single root ref — gsap.context (via useGSAP) scopes every selector here
  // and auto-reverts all tweens / ScrollTriggers on unmount.
  const root = useRef(null)
  const surfaceRef = useRef(null) // clipped layer
  const seamRef = useRef(null) // draggable seam (translated in X)
  const systemHeadlineRef = useRef(null) // imperative streamer
  const ctaRef = useRef(null)
  const cursorRef = useRef(null)
  const counterRef = useRef(null)
  const ringRef = useRef(null) // pulsing status ring
  const logoRef = useRef(null)
  const burgerRef = useRef(null)

  // Fullscreen menu open/closed (the only React state that re-renders Hero).
  const [menuOpen, setMenuOpen] = useState(false)
  // Read prefers-reduced-motion once, synchronously, so the streamer mounts
  // in the correct mode.
  const [reduced] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  /* --------------------------------------------------------------
     Lock body scroll + allow Escape-to-close while the menu is open.
  ---------------------------------------------------------------- */
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    const onKey = (e) => e.key === 'Escape' && setMenuOpen(false)
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  useGSAP(
    () => {
      /* ============================================================
         SEAM STATE — a single fraction (0 = full Surface, 1 = full
         System) is the source of truth. applySeam() turns it into a
         clip-path on the Surface, a translate on the seam, the
         streaming target, and the header colour decision. We only ever
         write transform / clip-path (no layout reads in the hot path),
         so dragging never reflows.
      ============================================================ */
      const seam = { f: 0 }
      const widthRef = { current: window.innerWidth }
      const logoRight = { current: 0 }
      const burgerLeft = { current: 0 }
      const scrollDark = { current: false } // header sits over a dark section
      let hintTl = null // the load auto-hint (killed on first interaction)

      const measure = () => {
        widthRef.current = root.current.offsetWidth
        if (logoRef.current)
          logoRight.current = logoRef.current.getBoundingClientRect().right
        if (burgerRef.current)
          burgerLeft.current = burgerRef.current.getBoundingClientRect().left
      }

      const updateHeader = (px) => {
        // A header element flips to the light token when a dark surface is
        // beneath it — whether that's the dark next-section (scroll) OR the
        // dark System layer revealed by the peel under that corner.
        const logoLight = scrollDark.current || px > logoRight.current
        const burgerLight = scrollDark.current || px > burgerLeft.current
        logoRef.current?.classList.toggle('is-light', logoLight)
        burgerRef.current?.classList.toggle('is-light', burgerLight)
      }

      const applySeam = () => {
        const w = widthRef.current || 1
        const px = clamp(seam.f, 0, 1) * w
        // Surface is cut from the left, revealing the full System beneath.
        surfaceRef.current.style.clipPath = `inset(0px 0px 0px ${px}px)`
        seamRef.current.style.transform = `translate3d(${px}px,0,0)`
        systemHeadlineRef.current?.setTarget(seam.f)
        updateHeader(px)
      }

      // Smooth follow with a touch of inertia — snappy, not floaty.
      const setSeam = gsap.quickTo(seam, 'f', {
        duration: 0.3,
        ease: 'power3',
        onUpdate: applySeam,
      })

      measure()
      applySeam() // initial: full Surface

      /* ============================================================
         CUSTOM CURSOR (kept — it's interaction-driven, not ambient).
      ============================================================ */
      const cursor = cursorRef.current
      const cx = gsap.quickTo(cursor, 'x', { duration: 0.5, ease: 'power3' })
      const cy = gsap.quickTo(cursor, 'y', { duration: 0.5, ease: 'power3' })
      const onPointerMoveCursor = (e) => {
        cx(e.clientX)
        cy(e.clientY)
      }
      if (!reduced) window.addEventListener('pointermove', onPointerMoveCursor)

      /* ============================================================
         REDUCED MOTION — show the finished Surface, a static visible
         handle, and no auto-hint / streaming / intro. The seam is still
         draggable + tap-toggleable below (just without easing).
      ============================================================ */
      if (reduced) {
        gsap.set(['.hero__intro', '.hero__cursor'], { display: 'none' })
        gsap.set('.layer--surface .char-inner', { clearProps: 'all', opacity: 1, y: 0 })
        seamRef.current?.classList.add('is-hinting') // static, visible affordance
      } else {
        /* ==========================================================
           MASTER LOAD TIMELINE — intro counter wipes away, Surface
           headline reveals, details rise, then ONE auto-hint peel so
           the seam is discoverable.
        ========================================================== */
        const inners = gsap.utils.toArray('.layer--surface .char-inner')
        const counter = { v: 0 }
        const tl = gsap.timeline({ defaults: { ease: 'power4.out' } })

        tl.to(counter, {
          v: 100,
          duration: 1.3,
          ease: 'power2.inOut',
          onUpdate: () => {
            if (counterRef.current)
              counterRef.current.textContent = String(
                Math.round(counter.v),
              ).padStart(3, '0')
          },
        })
          .to('.hero__intro', { yPercent: -100, duration: 1.05, ease: 'expo.inOut' }, '+=0.12')
          .from(
            inners,
            { yPercent: 120, rotate: 6, filter: 'blur(12px)', opacity: 0, duration: 1.1, stagger: 0.04 },
            '-=0.7',
          )
          .from('.hero__divider', { scaleX: 0, duration: 1.0, ease: 'expo.inOut' }, '-=0.8')
          .from(
            ['.hero__nav .hero__logo', '.hero__nav .hero__burger', '.hero__status', '.hero__footer .hero__sub', '.hero__footer .hero__cta'],
            { yPercent: 110, opacity: 0, duration: 0.85, stagger: 0.06 },
            '-=0.85',
          )
          .from('.seam', { opacity: 0, duration: 0.6 }, '-=0.4')

        // One subtle peel-and-return so users discover the seam is draggable.
        hintTl = gsap
          .timeline({ paused: true })
          .to(seam, { f: 0.22, duration: 0.85, ease: 'power2.inOut', onUpdate: applySeam })
          .to(seam, { f: 0, duration: 0.95, ease: 'power2.inOut', onUpdate: applySeam }, '+=0.18')
        tl.eventCallback('onComplete', () => {
          seamRef.current?.classList.add('is-hinting') // reveal the label
          if (hintTl) hintTl.play()
        })

        /* ==========================================================
           MICRO-MOTION — the "available" status keeps a soft radar
           ping. This is the ONLY ambient motion besides the signature.
        ========================================================== */
        gsap.fromTo(
          ringRef.current,
          { scale: 1, opacity: 0.55, transformOrigin: 'center' },
          { scale: 3.2, opacity: 0, duration: 1.8, ease: 'power2.out', repeat: -1 },
        )

        /* ==========================================================
           SCROLL — pin the hero and dissolve the whole signature into
           the next section (no per-line parallax, so both layers stay
           perfectly aligned).
        ========================================================== */
        gsap.to('.signature', {
          opacity: 0,
          yPercent: -6,
          ease: 'none',
          scrollTrigger: {
            trigger: root.current,
            start: 'top top',
            end: '+=110%',
            scrub: 1,
            pin: true,
            pinSpacing: true,
          },
        })
      }

      /* ============================================================
         HEADER READABILITY — a ScrollTrigger flips the header to the
         light token while it sits over the dark next-section (replaces
         the old mix-blend-mode trick, which couldn't show brand colour
         and went unreadable over mid-greys).
      ============================================================ */
      ScrollTrigger.create({
        trigger: '.next-section',
        start: 'top top',
        onEnter: () => {
          scrollDark.current = true
          updateHeader(seam.f * widthRef.current)
        },
        onLeaveBack: () => {
          scrollDark.current = false
          updateHeader(seam.f * widthRef.current)
        },
      })

      /* ============================================================
         DRAG-TO-PEEL — pointer events cover mouse + touch. Pure
         transform / clip-path writes; no layout thrash.
      ============================================================ */
      const seamEl = seamRef.current
      let dragging = false
      let moved = false
      let startX = 0
      let toggleTween = null // tap-to-toggle tween (killed when grabbed)

      const killHint = () => {
        if (hintTl) {
          hintTl.kill()
          hintTl = null
        }
      }

      const onDown = (e) => {
        killHint()
        if (toggleTween) toggleTween.kill() // don't fight an in-flight toggle
        dragging = true
        moved = false
        startX = e.clientX
        seamEl.classList.add('is-grabbing')
        seamEl.classList.add('is-touched') // hides the one-time hint label
        seamEl.setPointerCapture?.(e.pointerId)
      }
      const onMove = (e) => {
        if (!dragging) return
        const r = root.current.getBoundingClientRect()
        const f = clamp((e.clientX - r.left) / r.width, 0, 1)
        if (Math.abs(e.clientX - startX) > 4) moved = true
        if (reduced) {
          seam.f = f
          applySeam()
        } else {
          setSeam(f)
        }
      }
      const toggleSeam = () => {
        const tgt = seam.f < 0.5 ? 1 : 0
        if (reduced) {
          seam.f = tgt
          applySeam()
        } else {
          toggleTween = gsap.to(seam, { f: tgt, duration: 0.7, ease: 'power3', onUpdate: applySeam })
        }
      }
      const onUp = (e) => {
        if (!dragging) return
        dragging = false
        seamEl.classList.remove('is-grabbing')
        seamEl.releasePointerCapture?.(e.pointerId)
        // A clean tap (no drag) toggles between Surface and System.
        if (!moved) toggleSeam()
      }

      seamEl.addEventListener('pointerdown', onDown)
      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)

      // Hide the custom cursor dot over the seam (native ew-resize takes over).
      const hideCursor = () => gsap.to(cursor, { opacity: 0, duration: 0.2 })
      const showCursor = () => gsap.to(cursor, { opacity: 1, duration: 0.2 })
      if (!reduced) {
        seamEl.addEventListener('pointerenter', hideCursor)
        seamEl.addEventListener('pointerleave', showCursor)
      }

      /* ============================================================
         HOVER CURSOR GROW + MAGNETIC CTA (kept).
      ============================================================ */
      const hot = gsap.utils.toArray('.hero a, .hero__word, .menu__link, .hero__burger')
      const grow = () => gsap.to(cursor, { scale: 3.4, duration: 0.3 })
      const shrink = () => gsap.to(cursor, { scale: 1, duration: 0.3 })
      if (!reduced) {
        hot.forEach((el) => {
          el.addEventListener('pointerenter', grow)
          el.addEventListener('pointerleave', shrink)
        })
      }

      const cta = ctaRef.current
      const label = cta.querySelector('.hero__cta-label')
      const onCtaMove = (e) => {
        const r = cta.getBoundingClientRect()
        const mx = e.clientX - (r.left + r.width / 2)
        const my = e.clientY - (r.top + r.height / 2)
        gsap.to(cta, { x: mx * 0.4, y: my * 0.4, duration: 0.6, ease: 'power3' })
        gsap.to(label, { x: mx * 0.18, y: my * 0.18, duration: 0.6, ease: 'power3' })
      }
      const onCtaLeave = () =>
        gsap.to([cta, label], { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1, 0.4)' })
      if (!reduced) {
        cta.addEventListener('pointermove', onCtaMove)
        cta.addEventListener('pointerleave', onCtaLeave)
      }

      /* ============================================================
         RESIZE — re-measure and re-apply (keeps the fraction stable so
         the clip stays correct at any width).
      ============================================================ */
      const onResize = () => {
        measure()
        applySeam()
        ScrollTrigger.refresh()
      }
      window.addEventListener('resize', onResize)

      // Cleanup manual listeners (context handles tweens / triggers).
      return () => {
        window.removeEventListener('pointermove', onPointerMoveCursor)
        seamEl.removeEventListener('pointerdown', onDown)
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
        seamEl.removeEventListener('pointerenter', hideCursor)
        seamEl.removeEventListener('pointerleave', showCursor)
        hot.forEach((el) => {
          el.removeEventListener('pointerenter', grow)
          el.removeEventListener('pointerleave', shrink)
        })
        cta.removeEventListener('pointermove', onCtaMove)
        cta.removeEventListener('pointerleave', onCtaLeave)
        window.removeEventListener('resize', onResize)
      }
    },
    { scope: root, dependencies: [reduced] },
  )

  return (
    <section className="hero" ref={root}>
      {/* full-screen intro overlay that wipes away on load */}
      <div className="hero__intro" aria-hidden="true">
        <span className="hero__intro-tag">FORM FOLLOWS FEELING</span>
        <span className="hero__intro-counter" ref={counterRef}>000</span>
      </div>

      {/* custom cursor */}
      <div className="hero__cursor" ref={cursorRef} aria-hidden="true" />

      {/* ---- FIXED header: logo (left) + menu button (right) ----
          Colour is driven by a ScrollTrigger + the peel position (see
          updateHeader) — no mix-blend-mode, always readable + on-brand. */}
      <nav className="hero__nav">
        <a className="hero__logo" href="#home" aria-label="Studio home" ref={logoRef}>
          FFF<span className="hero__logo-mark">®</span>
        </a>
        <button
          type="button"
          className={`hero__burger ${menuOpen ? 'is-open' : ''}`}
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          ref={burgerRef}
        >
          <span className="hero__burger-label">{menuOpen ? 'CLOSE' : 'MENU'}</span>
          <span className="hero__burger-icon" aria-hidden="true">
            <span />
            <span />
          </span>
        </button>
      </nav>

      {/* fullscreen overlay menu (unchanged) */}
      <Menu open={menuOpen} onClose={() => setMenuOpen(false)} />

      {/* ============================================================
          THE SIGNATURE — two pixel-aligned layers + the draggable seam.
      ============================================================ */}
      <div className="signature">
        {/* ---- SYSTEM (underneath): the blueprint that "makes" it ---- */}
        <div className="layer layer--system" aria-hidden="true">
          <div className="hero__stage hero__stage--system">
            {/* small labeled component tree (real structure of THIS hero) */}
            <div className="sys__tree">
              <span className="sys__line"><span className="sy-tag">&lt;Hero&gt;</span></span>
              <span className="sys__line"><span className="sy-branch">├─ </span><span className="sy-tag">&lt;Status</span> <span className="sy-str">"available"</span> <span className="sy-tag">/&gt;</span></span>
              <span className="sys__line"><span className="sy-branch">├─ </span><span className="sy-tag">&lt;Headline /&gt;</span> <span className="sy-comment">// streaming</span></span>
              <span className="sys__line"><span className="sy-branch">├─ </span><span className="sy-tag">&lt;Divider /&gt;</span></span>
              <span className="sys__line"><span className="sy-branch">└─ </span><span className="sy-tag">&lt;Footer&gt;</span></span>
              <span className="sys__line"><span className="sy-branch">{'   └─ '}</span><span className="sy-tag">&lt;CTA</span> <span className="sy-str">"start a project"</span> <span className="sy-tag">/&gt;</span></span>
            </div>

            {/* the headline being PRODUCED — same box as the Surface h1 */}
            <div className="hero__main">
              <SystemHeadline ref={systemHeadlineRef} reduced={reduced} />
              <span className="sys__dim">H1 · clamp(4rem, 20vw, 17rem)</span>
            </div>

            {/* a subtle data line: baseline guide with measurement ticks */}
            <div className="sys__data">
              <span className="sys__data-label">baseline grid · 8pt</span>
              <span className="sys__data-line">
                {Array.from({ length: 24 }).map((_, i) => (
                  <i key={i} />
                ))}
              </span>
            </div>

            {/* the ACTUAL JSX that renders the headline (stretch: literally true) */}
            <div className="hero__footer sys__footer">
              <pre className="sys__code sys__code--full">
                {CODE_LINES.map((line, i) => (
                  <span className="sys__code-line" key={i}>
                    {line.length
                      ? line.map((tok, j) => (
                          <span key={j} className={tok[1] ? TOK[tok[1]] : undefined}>
                            {tok[0]}
                          </span>
                        ))
                      : ' '}
                  </span>
                ))}
              </pre>
              {/* collapsed to the headline's line only when space is tight */}
              <pre className="sys__code sys__code--mini">
                <span className="sys__code-line">
                  <span className="sy-kw">const</span>{' LINES = ['}
                  <span className="sy-str">{"'FORM'"}</span>{', '}
                  <span className="sy-str">{"'FOLLOWS'"}</span>{', '}
                  <span className="sy-str">{"'FEELING'"}</span>{']'}
                </span>
                <span className="sys__code-line">
                  {'<'}<span className="sy-tag">h1</span>{'>{LINES.'}
                  <span className="sy-fn">map</span>{'(w => w)}</'}
                  <span className="sy-tag">h1</span>{'>'}
                </span>
              </pre>
            </div>
          </div>
        </div>

        {/* ---- SURFACE (on top, clipped by the seam): the designed hero ---- */}
        <div className="layer layer--surface" ref={surfaceRef}>
          {/* faint editorial column grid */}
          <div className="hero__grid" aria-hidden="true" />

          <div className="hero__stage">
            {/* top status: availability + radar-ping dot (the ONLY live HUD kept) */}
            <div className="hero__status">
              <span className="hero__pulse" aria-hidden="true">
                <span className="hero__pulse-ring" ref={ringRef} />
              </span>
              AVAILABLE FOR WORK
            </div>

            {/* centre: the big type (pixel-matched to the System headline) */}
            <div className="hero__main">
              <h1 className="hero__heading" aria-label={HEADING_LINES.join(' ')}>
                {HEADING_LINES.map((line, li) => (
                  <span className="hero__line" key={li}>
                    <span className="hero__word">
                      {line.split('').map((ch, ci) => (
                        <span className="char" key={ci} aria-hidden="true">
                          <span className="char-inner">{ch}</span>
                        </span>
                      ))}
                    </span>
                  </span>
                ))}
              </h1>
            </div>

            {/* bottom: divider + studio line + magnetic CTA */}
            <div className="hero__footer">
              <div className="hero__divider" aria-hidden="true" />
              <p className="hero__sub">
                An independent design &amp; motion studio building expressive digital
                products for brands who refuse the ordinary. Currently booking{' '}
                <em>select projects</em> for 2026.
              </p>
              <a className="hero__cta" href="#contact" ref={ctaRef}>
                <span className="hero__cta-label">
                  START A PROJECT
                  <span className="hero__cta-arrow" aria-hidden="true">→</span>
                </span>
              </a>
            </div>
          </div>
        </div>

        {/* ---- the draggable seam: thin line + grip handle ---- */}
        <div className="seam" ref={seamRef}>
          <span className="seam__rail" />
          <span className="seam__line" />
          <span className="seam__grip" aria-hidden="true">
            <svg viewBox="0 0 16 16" width="16" height="16" focusable="false">
              <path d="M6 3 L2 8 L6 13 M10 3 L14 8 L10 13" />
            </svg>
          </span>
          <span className="seam__hint">DRAG TO REVEAL THE SYSTEM</span>
        </div>
      </div>
    </section>
  )
}

export default Hero
