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
   (SplitText) effect, followed by "THE INDEX": a giant editorial project
   list (the signature studio-index pattern). Each project is huge display
   type; on a fine pointer, hovering a row reveals a cursor-following media
   preview of that project, dims the other rows, and washes the name in the
   site's cobalt accent. On scroll the names rise letter-by-letter out of
   masked clip-boxes (SplitText), the divider rules draw across, and the
   meta fades in (ScrollTrigger). Touch/mobile gets inline thumbnails;
   reduced-motion gets a clean static list.

   SAFETY — unchanged contract:
   • The title + word-cycle stay UNTOUCHED (namespaced `pjx-`, scoped under
     `.pjx`). The index list is a separate namespace `pidx-`, every rule
     scoped under `.pidx-root` — no global selectors, no leakage.
   • Rows are VISIBLE BY DEFAULT in CSS; reveal start-states are applied by
     JS only and fail safe (any throw clears inline styles → static list).
   • The floating preview is the one `position: fixed` element here — it is
     aria-hidden, pointer-events:none, hidden unless a row is hovered, and
     sits BELOW the nav/compact-nav/cursor. It mirrors the cursor's safety
     model and can't affect any other section.
   • Each row is a real link carrying the existing `mcur-` cursor's "View"
     state. Navbar, title effect, cursor internals, Lenis, other sections:
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
   INDEX CONFIG — editable. Neutral B/W frame; the cobalt accent and the
   project screenshots bring the colour.
------------------------------------------------------------------ */
const PIDX = {
  accent: '#2b2bff', // electric cobalt (site --accent) — the hover wash
  muted: '#6b6862', // warm grey for numbers/meta (site --muted)
  line: 'rgba(10, 10, 10, 0.16)', // divider rules
  eyebrow: 'Selected Work', // small label above the list
  cursorLabel: 'View', // text shown inside the custom cursor on hover
  // reveal
  revealStart: 'top 80%',
  charStagger: 0.014, // per-letter rise within a name
  rowStagger: 0.08, // offset between rows
  // floating preview
  previewLag: 0.55, // seconds of catch-up as the preview trails the cursor
  previewEase: 'power3',
}

const WORK1_SRC = `${import.meta.env.BASE_URL}work1.png`
const WORK2_SRC = `${import.meta.env.BASE_URL}work2.png`
const WORK3_SRC = `${import.meta.env.BASE_URL}work3.png`
const WORK4_SRC = `${import.meta.env.BASE_URL}work4.png`
const WORK5_SRC = `${import.meta.env.BASE_URL}work10.png`
const WORK6_SRC = `${import.meta.env.BASE_URL}work11.png`

/* ----------------------------------------------------------------
   EDIT ME — your real projects. `image` powers both the hover preview
   (desktop) and the inline thumbnail (mobile). External https hrefs open
   in a new tab automatically (see isExternalHref). Add/remove freely.
------------------------------------------------------------------ */
const PIDX_PROJECTS = [
  { name: 'Wateen', category: 'Web', year: '2025', image: WORK1_SRC, href: 'https://superb-tiramisu-0f7eb5.netlify.app/' },
  { name: 'L’Oiseau Dé', category: 'Web', year: '2025', image: WORK2_SRC, href: 'https://pleasant-tenure-401568.framer.app/' },
  { name: 'Firsthouse', category: 'Web', year: '2025', image: WORK3_SRC, href: 'https://firsthouse.framer.website/' },
  { name: 'Mister M', category: 'Store', year: '2025', image: WORK4_SRC, href: 'https://www.mistermstore.net/' },
  { name: 'My Portfolio', category: 'Portfolio', year: '2025', image: WORK5_SRC, href: 'https://marwanportfolio1.framer.website/' },
  { name: 'Project 06', category: 'Web', year: '2025', image: WORK6_SRC, href: '#' },
]

const isExternalHref = (href) => /^https?:/i.test(href || '')
const pad2 = (n) => String(n).padStart(2, '0')

export default function Projects() {
  const root = useRef(null)
  const titleRef = useRef(null)
  const listRef = useRef(null)
  const previewRef = useRef(null)

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
     INDEX MOTION — two independent, fail-safe pieces:

     (A) SCROLL REVEAL (all pointers): each name rises letter-by-letter out
         of a masked clip-box, the divider rules draw across (scaleX), and
         the numbers/meta fade up — one calm pass, once, on enter. Rows are
         visible by default in CSS; start-states are JS-only and cleared on
         complete. Any throw clears every inline style → static list.

     (B) CURSOR-FOLLOW PREVIEW (fine pointer + hover only): a fixed,
         pointer-events:none panel that trails the cursor (quickTo lag) and
         cross-fades to the hovered project's screenshot. Shown only while a
         row is hovered; hidden the instant the pointer leaves the list. The
         row dim/accent/shift themselves are pure CSS :hover (so they work
         even if this JS never runs). Reverts fully on cleanup.
  ---------------------------------------------------------------- */
  useGSAP(
    () => {
      const rootEl = root.current
      const listEl = listRef.current
      if (!rootEl || !listEl) return

      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const rows = gsap.utils.toArray(listEl.querySelectorAll('.pidx-row'))
      if (!rows.length) return

      let splits = []
      let cleanupFns = []
      const offs = []
      const add = (target, ev, fn, opts) => {
        target.addEventListener(ev, fn, opts)
        offs.push(() => target.removeEventListener(ev, fn, opts))
      }

      try {
        /* ---------- (A) SCROLL REVEAL ---------- */
        if (!reduce) {
          const lines = gsap.utils.toArray(rootEl.querySelectorAll('.pidx-line'))
          const metas = gsap.utils.toArray(rootEl.querySelectorAll('.pidx-rowmeta'))

          // Split each name into masked chars (each char clipped to its box).
          const nameEls = rows
            .map((r) => r.querySelector('.pidx-name'))
            .filter(Boolean)
          splits =
            SplitText && typeof SplitText.create === 'function'
              ? nameEls.map((el) => SplitText.create(el, { type: 'chars', mask: 'chars' }))
              : []
          const allChars = splits.flatMap((s) => s.chars)

          // Start-states (JS only) — names hidden in their clip-boxes, rules
          // collapsed, meta lowered. Everything reverts on complete/cleanup.
          if (allChars.length) gsap.set(allChars, { yPercent: 120 })
          gsap.set(lines, { scaleX: 0, transformOrigin: 'left center' })
          gsap.set(metas, { autoAlpha: 0, y: 18 })

          const tl = gsap.timeline({
            scrollTrigger: { trigger: listEl, start: PIDX.revealStart, once: true },
            onComplete: () => {
              // Rest = natural CSS state; drop inline transforms/opacity.
              gsap.set([lines, metas], { clearProps: 'all' })
              splits.forEach((s) => {
                if (s.chars) gsap.set(s.chars, { clearProps: 'transform' })
              })
            },
          })

          rows.forEach((row, i) => {
            const at = i * PIDX.rowStagger
            const line = row.querySelector('.pidx-line')
            const meta = row.querySelector('.pidx-rowmeta')
            const chars = splits[i] ? splits[i].chars : []
            if (line) tl.to(line, { scaleX: 1, duration: 0.9, ease: 'power3.inOut' }, at)
            if (chars.length)
              tl.to(
                chars,
                { yPercent: 0, duration: 0.85, ease: 'power4.out', stagger: PIDX.charStagger },
                at + 0.08,
              )
            if (meta)
              tl.to(meta, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power3.out' }, at + 0.18)
          })

          cleanupFns.push(() => {
            tl.kill()
            if (tl.scrollTrigger) tl.scrollTrigger.kill()
          })

          // Re-measure once webfonts settle (Anton metrics shift the splits).
          if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(() => ScrollTrigger.refresh()).catch(() => {})
          }
        }

        /* ---------- (B) CURSOR-FOLLOW PREVIEW ---------- */
        const canHover =
          !reduce && window.matchMedia('(hover: hover) and (pointer: fine)').matches
        const preview = previewRef.current
        if (canHover && preview) {
          const imgs = gsap.utils.toArray(preview.querySelectorAll('.pidx-preview-card'))

          gsap.set(preview, { xPercent: -50, yPercent: -50, autoAlpha: 0, scale: 0.82 })
          gsap.set(imgs, { autoAlpha: 0 })

          const xTo = gsap.quickTo(preview, 'x', {
            duration: PIDX.previewLag,
            ease: PIDX.previewEase,
          })
          const yTo = gsap.quickTo(preview, 'y', {
            duration: PIDX.previewLag,
            ease: PIDX.previewEase,
          })

          let placed = false
          const onMove = (e) => {
            if (!placed) {
              // Jump to the pointer on the first move so it never flies in.
              gsap.set(preview, { x: e.clientX, y: e.clientY })
              placed = true
              return
            }
            xTo(e.clientX)
            yTo(e.clientY)
          }
          add(window, 'mousemove', onMove, { passive: true })

          rows.forEach((row, i) => {
            const onEnter = () => {
              imgs.forEach((card, j) =>
                gsap.to(card, { autoAlpha: j === i ? 1 : 0, duration: 0.35, ease: 'power2.out' }),
              )
              const active = imgs[i]
              if (active) {
                const media = active.querySelector('.pidx-preview-media')
                if (media) gsap.fromTo(media, { scale: 1.14 }, { scale: 1, duration: 1, ease: 'power3.out' })
              }
              gsap.to(preview, { autoAlpha: 1, scale: 1, duration: 0.5, ease: 'power3.out' })
            }
            add(row, 'mouseenter', onEnter)
          })

          const onListLeave = () =>
            gsap.to(preview, { autoAlpha: 0, scale: 0.82, duration: 0.4, ease: 'power3.out' })
          add(listEl, 'mouseleave', onListLeave)

          cleanupFns.push(() => gsap.killTweensOf([preview, ...imgs]))
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
        // Hard guarantee: clear every inline style so the list is fully visible
        // and the links still work, and revert any SplitText DOM changes.
        try {
          gsap.set(rootEl.querySelectorAll('.pidx-line, .pidx-rowmeta'), { clearProps: 'all' })
          splits.forEach((s) => {
            try {
              s.revert()
            } catch {
              /* ignore */
            }
          })
          splits = []
          if (previewRef.current) gsap.set(previewRef.current, { autoAlpha: 0 })
        } catch {
          /* CSS default keeps the list visible */
        }
        // eslint-disable-next-line no-console
        console.error('[Projects] index motion init failed; static list shown.', err)
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
        splits.forEach((s) => {
          try {
            s.revert()
          } catch {
            /* ignore */
          }
        })
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

      {/* THE INDEX — giant editorial project list. Scoped root `.pidx-root`;
          all styles namespaced `pidx-`. */}
      <div
        className="pidx-root"
        style={{
          '--pidx-accent': PIDX.accent,
          '--pidx-muted': PIDX.muted,
          '--pidx-line': PIDX.line,
        }}
      >
        <div className="pidx-eyebrow">
          <span className="pidx-eyebrow-label">{PIDX.eyebrow}</span>
          <span className="pidx-eyebrow-count">{`(${pad2(PIDX_PROJECTS.length)})`}</span>
        </div>

        <div className="pidx-list" ref={listRef}>
          {PIDX_PROJECTS.map((p, i) => (
            <a
              className="pidx-row"
              key={p.name}
              href={p.href || '#'}
              aria-label={p.name}
              data-cursor="view"
              data-cursor-label={PIDX.cursorLabel}
              {...(isExternalHref(p.href)
                ? { target: '_blank', rel: 'noopener noreferrer' }
                : {})}
            >
              {/* Divider rule (drawn on scroll) — sits at the TOP of the row. */}
              <span className="pidx-line" aria-hidden="true" />

              <span className="pidx-num">{pad2(i + 1)}</span>

              <span className="pidx-name-wrap">
                <span className="pidx-name">{p.name}</span>
              </span>

              {/* Inline thumbnail — MOBILE/touch only (hover preview is desktop). */}
              <span className="pidx-thumb" aria-hidden="true">
                <img src={p.image} alt="" loading="lazy" decoding="async" />
              </span>

              <span className="pidx-rowmeta">
                <span className="pidx-cat">
                  {[p.category, p.year].filter(Boolean).join(' / ') || '—'}
                </span>
                <span className="pidx-arrow" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none">
                    <path
                      d="M7 17L17 7M17 7H8M17 7V16"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </span>
            </a>
          ))}
          {/* Closing rule beneath the last row (also drawn on scroll). */}
          <span className="pidx-line pidx-line--end" aria-hidden="true" />
        </div>
      </div>

      {/* FLOATING PREVIEW — fixed, aria-hidden, pointer-events:none. Visible
          only while a row is hovered (desktop/fine-pointer). Each project is
          pre-rendered as a stacked card; JS cross-fades to the active one. */}
      <div className="pidx-preview" ref={previewRef} aria-hidden="true">
        {PIDX_PROJECTS.map((p) => (
          <span className="pidx-preview-card" key={p.name}>
            <span className="pidx-preview-media">
              <img src={p.image} alt="" decoding="async" />
            </span>
          </span>
        ))}
      </div>
    </section>
  )
}
