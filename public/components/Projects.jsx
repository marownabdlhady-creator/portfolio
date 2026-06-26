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
   (SplitText) effect, followed by a dense, large, staggered TWO-COLUMN
   gallery of full-bleed tiles (premium Awwwards work grid).

   The title + word-cycle stay UNTOUCHED (namespaced `pjx-`, scoped under
   `.pjx`). The grid is a separate namespace `pwrk-`, every rule scoped
   under `.pwrk-root` — no global selectors, no leakage. 6 projects →
   3 per column; column 2 offset DOWN so columns interlock (masonry).
   On scroll the two columns drift at slightly different speeds (scrubbed,
   transform-only, NO pin). Tiles are VISIBLE BY DEFAULT in CSS; reveal +
   parallax start-states are applied by JS only and fail safe. Each tile
   is a real link carrying the existing `mcur-` cursor's "View" state.
   Navbar, title effect, cursor internals, Lenis, other sections: untouched.
================================================================ */

/* ----------------------------------------------------------------
   HEADING CHAR-CYCLE — the "PROJECTS" heading cycles through these
   words (letters slide out / next slides in), then SETTLES on the
   first word ("PROJECTS"). All tunable.

   The first word is both the resting word AND the accessible heading
   text, so keep "PROJECTS" first.
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
   GALLERY CONFIG — editable. Frame/labels stay neutral B/W; project
   IMAGES (added later by filling `image` or `video`) bring the colour.
------------------------------------------------------------------ */
const PWRK = {
  bg: '#ececec',
  text: '#0a0a0a',
  muted: '#6b6b6b',
  perRow: 2, // two big cards side by side per row
  aspect: '3/2', // LANDSCAPE tile media ratio (wide & short) — desktop + tablet
  aspectMobile: '4/3', // a lone full-width tile on phones may be slightly taller
  radius: '4px',
  colGap: '16px', // slim gutter between the two cards in a row
  rowGap: '16px', // slim gap between rows
  sidePadding: '2vw', // near full-bleed: small side margins only
  placeholderBg: '#141414', // intentional DARK placeholder (not washed grey)
  placeholderText: '#8a8a8a', // muted-white large name inside the dark tile
  parallax: 8, // yPercent drift of the media INSIDE its frame (subtle depth)
  scrub: 1,
  revealStagger: 0.08,
  hoverScale: 1.04,
  cursorLabel: 'View',
}

const WORK1_SRC = `${import.meta.env.BASE_URL}work1.png`

/* ----------------------------------------------------------------
   EDIT ME — your real projects. Fill `image` (URL) and/or `video`
   (URL, muted/looped) per project to replace the dark placeholder with
   edge-to-edge media — no other change needed. Add/remove freely.
------------------------------------------------------------------ */
const PWRK_PROJECTS = [
  { name: 'Project 01', category: 'Brand', year: '2024', image: WORK1_SRC, video: '', href: '#' },
  { name: 'Project 02', category: 'Web', year: '2024', image: '', video: '', href: '#' },
  { name: 'Project 03', category: 'Product', year: '2025', image: '', video: '', href: '#' },
  { name: 'Project 04', category: 'Motion', year: '2025', image: '', video: '', href: '#' },
  { name: 'Project 05', category: 'Full-Stack', year: '2025', image: '', video: '', href: '#' },
  { name: 'Project 06', category: 'AI', year: '2026', image: '', video: '', href: '#' },
]

/* Chunk projects into rows of `perRow` (pairs) — each row is a full-screen
   stage holding two big side-by-side cards. */
const PWRK_ROWS = (() => {
  const rows = []
  for (let i = 0; i < PWRK_PROJECTS.length; i += PWRK.perRow) {
    rows.push(PWRK_PROJECTS.slice(i, i + PWRK.perRow))
  }
  return rows
})()

const isExternalHref = (href) => /^https?:/i.test(href || '')

/* A tile's media — video or image both fill the frame edge-to-edge via an
   over-scanned inner wrapper (so a subtle scroll parallax never reveals an
   edge); else an INTENTIONAL dark Swiss placeholder panel with the project
   name large inside. Real media replaces the placeholder entirely. */
function PwrkMedia({ project }) {
  if (project.video) {
    return (
      <span className="pwrk-media-inner">
        <video
          className="pwrk-media-el"
          src={project.video}
          poster={project.poster || undefined}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
          tabIndex={-1}
        />
      </span>
    )
  }
  if (project.image) {
    return (
      <span className="pwrk-media-inner">
        <img
          className="pwrk-media-el"
          src={project.image}
          alt={project.name}
          loading="lazy"
          decoding="async"
        />
      </span>
    )
  }
  return (
    <span className="pwrk-placeholder" aria-hidden="true">
      <span className="pwrk-placeholder-name">{project.name}</span>
    </span>
  )
}

export default function Projects() {
  const root = useRef(null)
  const titleRef = useRef(null)

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
      // SplitText must be present/registered, else keep the static heading.
      if (!SplitText || typeof SplitText.create !== 'function') return

      const words = gsap.utils.toArray(el.querySelectorAll('.pjx-word'))
      if (words.length < 2) return // nothing to cycle through

      let splits = []
      try {
        // Split each word into masked chars (each char clipped to its box, so
        // slid-out letters are hidden without overflowing the page).
        splits = words.map((w) => SplitText.create(w, { type: 'chars', mask: 'chars' }))

        // Only NOW reveal the animated stack (and visually hide the SR text).
        gsap.set(words, { opacity: 1 })
        el.classList.add('pjx-title--animated')

        const overlap = `-=${HEAD_OVERLAP}`
        const tl = gsap.timeline({
          defaults: { ease: HEAD_EASE, stagger: { amount: HEAD_STAGGER } },
          repeat: HEAD_LOOP_FOREVER ? -1 : Math.max(0, HEAD_CYCLES - 1),
          scrollTrigger: { trigger: el, start: HEAD_START, once: true },
        })

        // Slide the current word's letters out (left); bring the next word's
        // letters in (from the right), overlapping for a continuous hand-off.
        splits.forEach((s, i) => {
          const next = splits[i + 1]
          tl.to(s.chars, { xPercent: -100 }, `+=${HEAD_HOLD}`)
          if (next) tl.from(next.chars, { xPercent: 100 }, overlap)
        })
        // Bring the FIRST word back in → the cycle lands/settles on "PROJECTS".
        tl.fromTo(
          splits[0].chars,
          { xPercent: 100 },
          { xPercent: 0, immediateRender: false },
          overlap,
        )

        // SplitText alters the DOM — revert it (and the class) on cleanup.
        return () => {
          tl.kill()
          splits.forEach((s) => s.revert())
          el.classList.remove('pjx-title--animated')
        }
      } catch (err) {
        // Hard fallback: undo everything → the static "PROJECTS" heading shows.
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
     GALLERY MOTION — calm reveal (once, on enter) + a subtle PINLESS
     parallax of the media INSIDE each fixed frame. Tiles are VISIBLE BY
     DEFAULT in CSS; the reveal start-state is applied by JS only and
     cleared on complete. The media drift is transform-only (yPercent on
     an over-scanned inner wrapper, so an edge never shows) — NO pin, NO
     layout animation. Parallax is gated ≥641px via gsap.matchMedia
     (auto-reverts per breakpoint). Any throw clears inline styles so the
     static grid stays fully visible and the links still work. With the
     dark placeholders (no media yet) there's simply nothing to drift —
     the parallax engages automatically once `image`/`video` is set.
  ---------------------------------------------------------------- */
  useGSAP(
    () => {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (reduce) return // CSS already shows the static full-screen-pairs grid.

      const rootEl = root.current
      if (!rootEl) return

      const tiles = gsap.utils.toArray(rootEl.querySelectorAll('.pwrk-tile'))
      if (!tiles.length) return

      let mm
      let lenisOff

      try {
        // REVEAL — subtle fade + rise, staggered, once. Start-state via JS only.
        gsap.set(tiles, { autoAlpha: 0, y: 40, willChange: 'transform, opacity' })
        ScrollTrigger.batch(tiles, {
          start: 'top 90%',
          once: true,
          onEnter: (batch) =>
            gsap.to(batch, {
              autoAlpha: 1,
              y: 0,
              duration: 0.8,
              ease: 'power3.out',
              stagger: PWRK.revealStagger,
              // Rest state = natural CSS state (also drops will-change).
              onComplete: () => gsap.set(batch, { clearProps: 'all' }),
            }),
        })

        // PARALLAX — desktop/tablet only (≥641px). Each card's media drifts
        // within its over-scanned frame as the card crosses the viewport.
        // Transform-only, scrubbed, NO pin. matchMedia auto-reverts on
        // breakpoint change. (Only present for tiles with real media.)
        mm = gsap.matchMedia(rootEl)
        mm.add('(min-width: 641px)', () => {
          const inners = gsap.utils.toArray(rootEl.querySelectorAll('.pwrk-media-inner'))
          inners.forEach((inner) => {
            const tile = inner.closest('.pwrk-tile')
            if (!tile) return
            gsap.fromTo(
              inner,
              { yPercent: -PWRK.parallax },
              {
                yPercent: PWRK.parallax,
                ease: 'none',
                scrollTrigger: {
                  trigger: tile,
                  start: 'top bottom',
                  end: 'bottom top',
                  scrub: PWRK.scrub,
                  invalidateOnRefresh: true,
                },
              },
            )
          })
        })

        // Recompute trigger positions once webfonts settle (metrics can shift).
        if (document.fonts && document.fonts.ready) {
          document.fonts.ready.then(() => ScrollTrigger.refresh()).catch(() => {})
        }

        // Keep ScrollTrigger in sync with Lenis if present (no-op when absent).
        // We only LISTEN — never re-init Lenis/ScrollTrigger.
        const lenis = window.lenis || window.__lenis
        if (lenis && typeof lenis.on === 'function') {
          const onScroll = () => ScrollTrigger.update()
          lenis.on('scroll', onScroll)
          lenisOff = () => {
            if (typeof lenis.off === 'function') lenis.off('scroll', onScroll)
          }
        }
      } catch (err) {
        // Hard guarantee: clear every inline style so tiles are fully visible.
        try {
          gsap.set(tiles, { clearProps: 'all' })
          gsap.set(rootEl.querySelectorAll('.pwrk-media-inner'), { clearProps: 'transform' })
        } catch {
          /* nothing more we can do; CSS default keeps the grid visible */
        }
        // eslint-disable-next-line no-console
        console.error('[Projects] gallery motion init failed; static grid shown.', err)
      }

      return () => {
        if (mm) mm.revert()
        if (lenisOff) lenisOff()
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

      {/* GALLERY — rows of two big cards; each row (pair) fills the screen.
          Scoped root `.pwrk-root`; all styles namespaced `pwrk-`. */}
      <div
        className="pwrk-root"
        style={{
          '--pwrk-text': PWRK.text,
          '--pwrk-muted': PWRK.muted,
          '--pwrk-placeholder-bg': PWRK.placeholderBg,
          '--pwrk-placeholder-text': PWRK.placeholderText,
          '--pwrk-aspect': PWRK.aspect,
          '--pwrk-aspect-mobile': PWRK.aspectMobile,
          '--pwrk-radius': PWRK.radius,
          '--pwrk-colgap': PWRK.colGap,
          '--pwrk-rowgap': PWRK.rowGap,
          '--pwrk-side': PWRK.sidePadding,
          '--pwrk-hover-scale': PWRK.hoverScale,
        }}
      >
        <div className="pwrk-grid">
          {PWRK_ROWS.map((row, ri) => (
            <div className="pwrk-row" key={ri}>
              {row.map((p) => (
                <a
                  className="pwrk-tile"
                  key={p.name}
                  href={p.href || '#'}
                  aria-label={p.name}
                  data-cursor="view"
                  data-cursor-label={PWRK.cursorLabel}
                  {...(isExternalHref(p.href)
                    ? { target: '_blank', rel: 'noopener noreferrer' }
                    : {})}
                >
                  <span className="pwrk-media">
                    <PwrkMedia project={p} />
                  </span>
                  <span className="pwrk-label">
                    <span className="pwrk-name">{p.name}</span>
                    {(p.category || p.year) && (
                      <span className="pwrk-meta">
                        {[p.category, p.year].filter(Boolean).join(' — ')}
                      </span>
                    )}
                  </span>
                </a>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
