import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'

import './Projects.css'
import './ProjectsGrid.css'

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText)

/* ================================================================
   PROJECTS — section wrapper + the "PROJECTS" title with its word-cycle
   (SplitText) effect, followed by THE WORK GRID: a visual 3-column grid
   of project cards (2 on tablet, 1 on phones). Each card is a full-bleed
   project image in a masked, softly-rounded frame with one compact
   caption beneath it — index / title / year. The work sells itself; the
   type is a caption, not the subject.

   MOTION (all transform + opacity only):
     1. ENTRANCE  — once, on enter. Each card's image rises out of its
        overflow mask (y 60 -> 0 + fade) on a GRID-AWARE stagger, so the
        cards arrive as a diagonal wave rather than row-by-row. Each
        caption follows its own image by 0.1s.
     2. COLUMN PARALLAX — scrubbed. Outer columns drift at one rate, the
        second column slightly slower, so the grid breathes with depth
        instead of moving as a rigid block. Rates are keyed to the LIVE
        column count via gsap.matchMedia().
     3. IMAGE PARALLAX — scrubbed, per card. The image is rendered 1.15x
        inside its overflow-hidden frame and drifts vertically within
        that overhang as the card crosses the viewport.
     4. HOVER (fine pointer only) — the hovered card's image zooms gently,
        every other card dims, and the title's underline draws in from
        the left. All tweens use overwrite: "auto", so flicking the mouse
        across the grid can never leave a card stuck dimmed or zoomed.

   SAFETY — unchanged contract:
   • The title + word-cycle stay UNTOUCHED (namespaced `pjx-`, scoped under
     `.pjx`). The grid is a separate namespace `pgrid-`, every rule scoped
     under `.pgrid-root` — no global selectors, no leakage.
   • Cards are VISIBLE BY DEFAULT in CSS; every reveal/parallax start-state
     is applied by JS only and fails safe (any throw clears inline styles ->
     a clean static gallery with working links).
   • Nothing here is `position: fixed`. Each card is a real link carrying
     the existing `mcur-` cursor's "View" state.
   • useGSAP owns a gsap.context() scoped to this component, so every tween,
     ScrollTrigger and matchMedia listener is reverted on unmount — none can
     leak or duplicate across navigation / StrictMode double-mounts.
   • Navbar, title effect, cursor internals, Lenis, other sections:
     untouched. We only LISTEN to Lenis, never re-init it.
================================================================ */

/* ----------------------------------------------------------------
   HEADING CHAR-CYCLE — the "PROJECTS" heading cycles through these
   words (letters slide out / next slides in), then SETTLES on the
   first word ("PROJECTS"). All tunable. Keep "PROJECTS" first (it is
   both the resting word AND the accessible heading text).
------------------------------------------------------------------ */
const CYCLE_WORDS = ['PROJECTS', 'DESIGNED', 'ENGINEERED', 'SHIPPED']

const HEAD_LOOP_FOREVER = false // false → cycle then settle on the 1st word; true → loop
const HEAD_CYCLES = 1 // full passes before settling (when not looping). 1 = once, 2 = twice
const HEAD_HOLD = 1 // seconds each word rests before sliding out
const HEAD_OVERLAP = 0.5 // seconds the outgoing/incoming words overlap (the demo's "-=0.5")
const HEAD_STAGGER = 0.5 // SplitText per-letter slide stagger (stagger.amount)
const HEAD_EASE = 'none' // slide easing (linear, like the demo — smooth & even)
const HEAD_START = 'top 85%' // ScrollTrigger: start cycling as the heading enters view

/* ----------------------------------------------------------------
   GRID CONFIG — editable. Neutral B/W frame; the cobalt accent and the
   project screenshots bring the colour.
------------------------------------------------------------------ */
const PGRID = {
  accent: '#2b2bff', // electric cobalt (site --accent) — focus ring
  muted: '#6b6862', // warm grey for the index/year captions (site --muted)
  eyebrow: 'Selected Work', // small label above the grid
  cursorLabel: 'View', // text shown inside the custom cursor on hover

  /* 1 — ENTRANCE (once, not scrubbed) */
  revealStart: 'top 80%', // ScrollTrigger start
  revealY: 60, // px the image rises out of its mask
  revealDur: 1.2, // seconds
  revealEase: 'power4.out',
  revealAmount: 0.9, // TOTAL seconds the grid-aware stagger is spread over
  captionOffset: 0.1, // seconds each caption trails its own image
  captionY: 20, // px the caption rises
  captionDur: 1, // seconds

  /* 2 — COLUMN PARALLAX (scrubbed). yPercent travel from +v to -v across
     the section, so the total relative shift between a fast and a slow
     column is ~2 * (main - slow) percent of a card's height — a few dozen
     px on a typical card. Subtle: the grid must read as alive, never
     broken or misaligned. */
  colParallaxMain: 8, // outer columns (1 and 3)
  colParallaxSlow: 3, // the second column — slightly slower

  /* 3 — IMAGE PARALLAX INSIDE EACH CARD (scrubbed). The image is drawn at
     `imgScale`, which leaves (imgScale - 1) / 2 = 7.5% of overhang above
     and below the frame; `imgDrift` must stay inside that or the mask
     would show a gap. */
  imgScale: 1.15,
  imgDrift: 4.5, // yPercent, -v -> +v

  /* 4 — HOVER (fine pointer only) */
  hoverZoom: 1.04, // multiplies imgScale (1.15 -> 1.196)
  hoverDim: 0.45, // opacity of every OTHER card
  hoverDur: 0.6, // seconds
  hoverEase: 'power2.out',
}

const WORK1_SRC = `${import.meta.env.BASE_URL}work1.png`
const WORK2_SRC = `${import.meta.env.BASE_URL}work2.png`
const WORK3_SRC = `${import.meta.env.BASE_URL}work3.png`
const WORK4_SRC = `${import.meta.env.BASE_URL}work4.png`
const WORK5_SRC = `${import.meta.env.BASE_URL}work10.png`
const WORK6_SRC = `${import.meta.env.BASE_URL}work11.png`
/* NOTE the double "k" — the file in /public really is `workk12.png`. */
const WORK7_SRC = `${import.meta.env.BASE_URL}workk12.png`
const PIATTO_SRC = `${import.meta.env.BASE_URL}piatto-17.png`

/* ----------------------------------------------------------------
   EDIT ME — your real projects. `image` is the card's hero. External
   https hrefs open in a new tab automatically (see isExternalHref).
   Add/remove freely; the grid, the count and the index numbers all
   follow the length of this array.
------------------------------------------------------------------ */
const PGRID_PROJECTS = [
  { name: 'Wateen', category: 'Web', year: '2025', image: WORK1_SRC, href: 'https://wateen-ten.vercel.app/' },
  { name: 'Mister M', category: 'Store', year: '2025', image: WORK4_SRC, href: 'https://www.mistermstore.net/' },
  { name: 'My Portfolio', category: 'Web', year: '2025', image: WORK6_SRC, href: '#' },
  { name: 'SHRI', category: 'Web', year: '2025', image: WORK7_SRC, href: 'https://shri-lgrz.vercel.app/' },
  { name: 'Piatto', category: 'Web', year: '2025', image: PIATTO_SRC, href: 'https://www.piattops.online' },
]

/* Cards above the fold are worth fetching eagerly; everything after is
   lazy. One desktop row = 3 cards. */
const EAGER_COUNT = 3

/* The card widths the browser should plan for, matching the CSS grid
   (3 cols > 1024px, 2 cols 641-1024px, 1 col below). Vite serves the
   PNGs as-is (no responsive variants), so this only guides the fetch
   priority of the lazy images — but it costs nothing and is correct if
   srcset variants are ever added. */
const IMG_SIZES = '(max-width: 640px) 100vw, (max-width: 1024px) 46vw, 30vw'

const isExternalHref = (href) => /^https?:/i.test(href || '')
const pad2 = (n) => String(n).padStart(2, '0')

/* Fresh stagger config per tween — GSAP caches the measured grid on the
   object it is handed, so the images and the captions must not share one. */
const gridStagger = () => ({ grid: 'auto', from: 'start', amount: PGRID.revealAmount, axis: null })

export default function Projects() {
  const root = useRef(null)
  const titleRef = useRef(null)
  const gridRef = useRef(null)

  /* --------------------------------------------------------------
     HEADING CHAR-CYCLE — scoped to the heading ONLY. The real text
     "PROJECTS" is always in the DOM (the .pjx-title-sr span) for screen
     readers AND as the visible fallback. The animated word-stack is
     aria-hidden and display:none by default; JS only reveals + animates
     it after SplitText succeeds. If SplitText/JS errors or reduced-motion
     is set, the static "PROJECTS" heading shows — never blank.
  ---------------------------------------------------------------- */
  useGSAP(
    () => {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (reduce) return // static heading — leave .pjx-title-sr visible.

      const el = titleRef.current
      if (!el) return
      if (!SplitText || typeof SplitText.create !== 'function') return

      const words = gsap.utils.toArray(el.querySelectorAll('.pjx-word'))
      if (words.length < 2) return // nothing to cycle through

      let splits = []
      try {
        splits = words.map((w) => SplitText.create(w, { type: 'chars', mask: 'chars' }))

        gsap.set(words, { opacity: 1 })
        el.classList.add('pjx-title--animated')

        const overlap = `-=${HEAD_OVERLAP}`
        const tl = gsap.timeline({
          defaults: { ease: HEAD_EASE, stagger: { amount: HEAD_STAGGER } },
          repeat: HEAD_LOOP_FOREVER ? -1 : Math.max(0, HEAD_CYCLES - 1),
          scrollTrigger: { trigger: el, start: HEAD_START, once: true },
        })

        splits.forEach((s, i) => {
          const next = splits[i + 1]
          tl.to(s.chars, { xPercent: -100 }, `+=${HEAD_HOLD}`)
          if (next) tl.from(next.chars, { xPercent: 100 }, overlap)
        })
        tl.fromTo(
          splits[0].chars,
          { xPercent: 100 },
          { xPercent: 0, immediateRender: false },
          overlap,
        )

        return () => {
          tl.kill()
          splits.forEach((s) => s.revert())
          el.classList.remove('pjx-title--animated')
        }
      } catch (err) {
        el.classList.remove('pjx-title--animated')
        splits.forEach((s) => {
          try {
            s.revert()
          } catch {
            /* ignore */
          }
        })
        // eslint-disable-next-line no-console
        console.error('[Projects] heading cycle failed; static heading shown.', err)
      }
    },
    { scope: root },
  )

  /* --------------------------------------------------------------
     GRID MOTION — four independent, fail-safe pieces (see the header
     comment). Cards are visible by default in CSS; every start-state is
     applied here and cleared on complete, so any throw drops us straight
     back to a static, fully-visible gallery.
  ---------------------------------------------------------------- */
  useGSAP(
    () => {
      const gridEl = gridRef.current
      if (!gridEl) return

      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const cards = gsap.utils.toArray(gridEl.querySelectorAll('.pgrid-card'))
      if (!cards.length) return

      const figures = cards.map((c) => c.querySelector('.pgrid-figure')).filter(Boolean)
      const captions = cards.map((c) => c.querySelector('.pgrid-caption')).filter(Boolean)
      const drifts = cards.map((c) => c.querySelector('.pgrid-drift')).filter(Boolean)
      const zooms = cards.map((c) => c.querySelector('.pgrid-zoom')).filter(Boolean)

      // REDUCED MOTION — render the final state and stop. No entrance, no
      // parallax, no hover: nothing below this line runs.
      if (reduce) return

      const mm = gsap.matchMedia()
      const cleanupFns = []
      const offs = []
      const add = (target, ev, fn, opts) => {
        target.addEventListener(ev, fn, opts)
        offs.push(() => target.removeEventListener(ev, fn, opts))
      }

      try {
        /* ---------- (1) ENTRANCE — masked reveal, diagonal wave ----------
           Both tweens use an IDENTICAL grid-aware stagger, so a caption
           always lands exactly `captionOffset` after its own image (the
           captions sit in the same grid cells, so GSAP measures the same
           wave for both). Plays once and never replays on scroll-up. */
        gsap.set(figures, { y: PGRID.revealY, autoAlpha: 0 })
        gsap.set(captions, { y: PGRID.captionY, autoAlpha: 0 })

        const intro = gsap.timeline({
          scrollTrigger: {
            trigger: gridEl,
            start: PGRID.revealStart,
            toggleActions: 'play none none none',
            once: true,
          },
          onComplete: () => {
            // Rest = natural CSS state; drop the inline transform/opacity so
            // nothing stale can fight the hover or parallax layers.
            gsap.set([figures, captions], { clearProps: 'transform,opacity,visibility' })
          },
        })

        intro
          .to(
            figures,
            {
              y: 0,
              autoAlpha: 1,
              duration: PGRID.revealDur,
              ease: PGRID.revealEase,
              stagger: gridStagger(),
            },
            0,
          )
          .to(
            captions,
            {
              y: 0,
              autoAlpha: 1,
              duration: PGRID.captionDur,
              ease: PGRID.revealEase,
              stagger: gridStagger(),
            },
            PGRID.captionOffset,
          )

        cleanupFns.push(() => {
          if (intro.scrollTrigger) intro.scrollTrigger.kill()
          intro.kill()
        })

        /* ---------- (3) IMAGE PARALLAX INSIDE EACH CARD (scrubbed) ----------
           The image is drawn `imgScale` larger than its overflow-hidden
           frame; the drift layer then slides within that overhang as the
           card crosses the viewport. Real depth, per card, and the mask
           never shows a gap because imgDrift < (imgScale - 1) / 2 * 100. */
        gsap.set(zooms, { scale: PGRID.imgScale })

        cards.forEach((card, i) => {
          const drift = drifts[i]
          if (!drift) return
          const tween = gsap.fromTo(
            drift,
            { yPercent: -PGRID.imgDrift },
            {
              yPercent: PGRID.imgDrift,
              ease: 'none',
              scrollTrigger: {
                trigger: card,
                start: 'top bottom',
                end: 'bottom top',
                scrub: true,
              },
            },
          )
          cleanupFns.push(() => {
            if (tween.scrollTrigger) tween.scrollTrigger.kill()
            tween.kill()
          })
        })

        /* ---------- (2) COLUMN PARALLAX (scrubbed) ----------
           Keyed to the LIVE column count: with a plain CSS grid, card `i`
           sits in column `i % cols`, so no measuring is needed — and
           matchMedia rebuilds these (and only these) when the breakpoint
           changes, so a resize can never leave the columns mis-keyed.
           The queries MUST stay in step with ProjectsGrid.css. */
        const BREAKPOINTS = [
          ['(min-width: 1025px)', 3],
          ['(min-width: 641px) and (max-width: 1024px)', 2],
          ['(max-width: 640px)', 1],
        ]

        BREAKPOINTS.forEach(([query, cols]) => {
          mm.add(`${query} and (prefers-reduced-motion: no-preference)`, () => {
            // Column 2 (index 1) drifts slower; the outer columns share the
            // main rate. A single column just gets one calm, uniform drift.
            const slow = []
            const main = []
            cards.forEach((card, i) => {
              ;(cols >= 2 && i % cols === 1 ? slow : main).push(card)
            })

            const drift = (targets, amount) => {
              if (!targets.length) return
              gsap.fromTo(
                targets,
                { yPercent: amount },
                {
                  yPercent: -amount,
                  ease: 'none',
                  scrollTrigger: {
                    trigger: gridEl,
                    start: 'top bottom',
                    end: 'bottom top',
                    scrub: true,
                  },
                },
              )
            }

            drift(main, PGRID.colParallaxMain)
            drift(slow, PGRID.colParallaxSlow)

            // matchMedia reverts everything created in here on breakpoint
            // exit; clear the residual transform so the grid sits flat.
            return () => gsap.set(cards, { clearProps: 'transform' })
          })
        })

        /* ---------- (4) HOVER — desktop / fine pointer ONLY ----------
           matchMedia gates this on `(hover: hover) and (pointer: fine)`, so
           touch devices never bind a single listener. Every tween carries
           overwrite: "auto" (it only clears the SAME property on the same
           target, so it can never kill the scrubbed yPercent parallax),
           which is what keeps rapid mouse movement from stuttering or
           leaving a card stuck dimmed.

           The un-dim lives on the GRID's mouseleave rather than each card's,
           so flicking between two adjacent cards hands off directly instead
           of flashing the whole grid back to full opacity in between. */
        mm.add(
          '(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)',
          () => {
            const hoverOffs = []
            const hoverAdd = (target, ev, fn) => {
              target.addEventListener(ev, fn)
              hoverOffs.push(() => target.removeEventListener(ev, fn))
            }

            cards.forEach((card, i) => {
              const zoom = zooms[i]
              const rule = card.querySelector('.pgrid-rule')
              const others = cards.filter((c) => c !== card)

              const onEnter = () => {
                if (zoom)
                  gsap.to(zoom, {
                    scale: PGRID.imgScale * PGRID.hoverZoom,
                    duration: PGRID.hoverDur,
                    ease: PGRID.hoverEase,
                    overwrite: 'auto',
                  })
                if (rule)
                  gsap.to(rule, {
                    scaleX: 1,
                    duration: PGRID.hoverDur,
                    ease: PGRID.hoverEase,
                    overwrite: 'auto',
                  })
                gsap.to(others, {
                  opacity: PGRID.hoverDim,
                  duration: PGRID.hoverDur,
                  ease: PGRID.hoverEase,
                  overwrite: 'auto',
                })
                gsap.to(card, {
                  opacity: 1,
                  duration: PGRID.hoverDur,
                  ease: PGRID.hoverEase,
                  overwrite: 'auto',
                })
              }

              const onLeave = () => {
                if (zoom)
                  gsap.to(zoom, {
                    scale: PGRID.imgScale,
                    duration: PGRID.hoverDur,
                    ease: PGRID.hoverEase,
                    overwrite: 'auto',
                  })
                if (rule)
                  gsap.to(rule, {
                    scaleX: 0,
                    duration: PGRID.hoverDur,
                    ease: PGRID.hoverEase,
                    overwrite: 'auto',
                  })
              }

              hoverAdd(card, 'mouseenter', onEnter)
              hoverAdd(card, 'mouseleave', onLeave)
            })

            const onGridLeave = () =>
              gsap.to(cards, {
                opacity: 1,
                duration: PGRID.hoverDur,
                ease: PGRID.hoverEase,
                overwrite: 'auto',
              })
            hoverAdd(gridEl, 'mouseleave', onGridLeave)

            return () => {
              hoverOffs.forEach((off) => off())
              gsap.killTweensOf([...cards, ...zooms])
              gsap.set(cards, { clearProps: 'opacity' })
            }
          },
        )

        /* ---------- CORRECTNESS: refresh once the layout is final ----------
           The card frames carry a fixed aspect-ratio, so a decoding image
           shifts nothing — but webfont metrics move the captions, and a
           lazy image that only decodes near the fold can still land after
           ScrollTrigger measured. Refresh on both, cheaply. */
        if (document.fonts && document.fonts.ready) {
          document.fonts.ready.then(() => ScrollTrigger.refresh()).catch(() => {})
        }

        const imgs = gsap.utils.toArray(gridEl.querySelectorAll('img'))
        let pending = imgs.filter((img) => !img.complete).length
        if (pending) {
          const settle = () => {
            pending -= 1
            if (pending <= 0) ScrollTrigger.refresh()
          }
          imgs.forEach((img) => {
            if (img.complete) return
            add(img, 'load', settle, { once: true })
            add(img, 'error', settle, { once: true })
          })
        }

        /* Keep ScrollTrigger in sync with Lenis if present (no-op when absent).
           We only LISTEN — never re-init Lenis/ScrollTrigger. */
        const lenis = window.lenis || window.__lenis
        if (lenis && typeof lenis.on === 'function') {
          const onScroll = () => ScrollTrigger.update()
          lenis.on('scroll', onScroll)
          cleanupFns.push(() => {
            if (typeof lenis.off === 'function') lenis.off('scroll', onScroll)
          })
        }
      } catch (err) {
        // Hard guarantee: clear every inline style so the grid is fully
        // visible and the links still work.
        try {
          mm.revert()
          gsap.set([...figures, ...captions, ...drifts, ...zooms, ...cards], {
            clearProps: 'all',
          })
        } catch {
          /* CSS default keeps the grid visible */
        }
        // eslint-disable-next-line no-console
        console.error('[Projects] grid motion init failed; static grid shown.', err)
      }

      return () => {
        offs.forEach((off) => off())
        cleanupFns.forEach((fn) => {
          try {
            fn()
          } catch {
            /* ignore */
          }
        })
        try {
          mm.revert()
        } catch {
          /* ignore */
        }
      }
    },
    { scope: root },
  )

  return (
    <section className="pjx" id="projects" ref={root} aria-label="Projects">
      <header className="pjx-head">
        <h2 className="pjx-title" ref={titleRef}>
          {/* Real, accessible heading text + visible fallback (always in DOM). */}
          <span className="pjx-title-sr">Projects</span>
          {/* Visual char-cycling stack — aria-hidden, hidden until JS activates. */}
          <span className="pjx-title-anim" aria-hidden="true">
            {CYCLE_WORDS.map((w) => (
              <span className="pjx-word" key={w}>
                {w}
              </span>
            ))}
          </span>
        </h2>
      </header>

      {/* THE WORK GRID — 3 columns on desktop, 2 on tablet, 1 on phones.
          Scoped root `.pgrid-root`; all styles namespaced `pgrid-`. */}
      <div
        className="pgrid-root"
        style={{
          '--pgrid-accent': PGRID.accent,
          '--pgrid-muted': PGRID.muted,
        }}
      >
        <div className="pgrid-eyebrow">
          <span className="pgrid-eyebrow-label">{PGRID.eyebrow}</span>
          <span className="pgrid-eyebrow-count">{`(${pad2(PGRID_PROJECTS.length)})`}</span>
        </div>

        <div className="pgrid" ref={gridRef}>
          {PGRID_PROJECTS.map((p, i) => (
            <a
              className="pgrid-card"
              key={p.name}
              href={p.href || '#'}
              aria-label={`${p.name} — ${p.category} ${p.year}`}
              data-cursor="view"
              data-cursor-label={PGRID.cursorLabel}
              {...(isExternalHref(p.href)
                ? { target: '_blank', rel: 'noopener noreferrer' }
                : {})}
            >
              {/* MEDIA — the mask. `.pgrid-figure` rises out of it on entry,
                  `.pgrid-drift` parallaxes within it on scroll, and
                  `.pgrid-zoom` holds the 1.15x oversize + the hover zoom. */}
              <span className="pgrid-media">
                <span className="pgrid-figure">
                  <span className="pgrid-drift">
                    <span className="pgrid-zoom">
                      <img
                        src={p.image}
                        alt={`${p.name} — ${p.category} project`}
                        sizes={IMG_SIZES}
                        loading={i < EAGER_COUNT ? 'eager' : 'lazy'}
                        decoding="async"
                        draggable="false"
                      />
                    </span>
                  </span>
                </span>
              </span>

              {/* CAPTION — one compact row: index / title / year. */}
              <span className="pgrid-caption">
                <span className="pgrid-idx">{pad2(i + 1)}</span>
                <span className="pgrid-name">
                  <span className="pgrid-name-in">
                    {p.name}
                    <span className="pgrid-rule" aria-hidden="true" />
                  </span>
                </span>
                <span className="pgrid-year">{p.year}</span>
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
