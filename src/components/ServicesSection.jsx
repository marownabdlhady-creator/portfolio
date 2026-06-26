import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'

import './ServicesSection.css'

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText)

/* ================================================================
   SERVICES — refined Swiss editorial index (Taylor-style).

   A SOLID DARK section, white type, generous negative space, thin 1px
   ruled dividers. Three stacked blocks:
     A) HEADER ROW   — index no. · ( Services ) · © year, with a rule below.
     B) STATEMENT    — one large grotesk statement, ~3 lines, left 2/3.
     C) SERVICE INDEX — a ruled <ul> of 5 rows; each row is a 12-col grid
        aligning number · thumbnail · name · descriptor on identical axes.

   MOTION — ONE calm, uniform reveal, played ONCE on enter (no scrub, no
   pin, no Flip, no loops, no bg flip):
     • Header + statement: mask-up (overflow:hidden + translateY 100%→0);
       the headline reveals line-by-line via SplitText with a soft stagger.
     • EVERY row: the SAME gesture — opacity 0→1, y(yFrom)→0, with a subtle
       internal stagger (number → image → name → description).
     • Optional per-row top divider draw (scaleX 0→1 from left) + image
       settle (scale 1.08→1), synced with that row's reveal.

   ISOLATION (this is exactly what broke the site before):
   • Every class/ID is prefixed `svcs-`; every CSS rule is scoped under
     `.svcs-root`. No generic names, no bare element selectors, no `*`.
   • NO global/body/html styles. NO position:fixed. NO ScrollTrigger pin.
   • Navbar, Lenis and the global ScrollTrigger/smooth-scroll setup are NOT
     touched — we only create our own scoped, scrubless ScrollTriggers.
   • Content is VISIBLE BY DEFAULT in CSS. Reveal start-states are applied
     by JS only (gsap.from inside the scoped context). If JS never runs or
     throws, the full section shows — dark bg, white text, all rows.
   • All GSAP lives inside useGSAP(..., { scope: root }); SplitText is
     reverted on cleanup; everything is reverted on unmount via the scope.
================================================================ */

/* ----------------------------------------------------------------
   CONFIG — every key value is editable here.
------------------------------------------------------------------ */
const SVCS = {
  bg: '#0a0a0a',
  text: '#f4f4f4',
  muted: '#8a8a8a',
  sectionIndex: '04',
  label: '( Services )',
  copyright: '© 2026',
  headline:
    'Thoughtful design and solid engineering — interfaces, systems, and motion, built end to end and shipped with craft.',
  revealDuration: 0.9,
  revealEase: 'power3.out',
  rowStagger: 0.06,
  yFrom: 40,
  drawDividers: true,
  nameStaggerEach: 0.022, // per-letter stagger of the big service names
  nameParallax: 6, // xPercent drift of each name on scroll (alternates L/R)
}

/* Service rows — editable copy. `name` is the visible, accessible text. */
const SVCS_ITEMS = [
  {
    n: '01',
    name: 'Design',
    desc: 'Brand systems, UI, and interfaces designed in Figma and Framer.',
  },
  {
    n: '02',
    name: 'Framer Development',
    desc: 'Production Framer sites — pixel-faithful, fast, and easy to maintain.',
  },
  {
    n: '03',
    name: 'Full-Stack Engineering',
    desc: 'React front-ends through to backend APIs, databases, and deployment.',
  },
  {
    n: '04',
    name: 'Motion & GSAP',
    desc: 'Scroll-driven motion and micro-interactions, tuned to a smooth 60fps.',
  },
  {
    n: '05',
    name: 'AI Automation',
    desc: 'AI workflows and automations that remove repetitive busywork.',
  },
]

export default function ServicesSection() {
  const root = useRef(null)
  const headlineRef = useRef(null)

  useGSAP(
    () => {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (reduce) return // CSS renders the section fully visible & static.

      const ctx = root.current
      if (!ctx) return
      const q = gsap.utils.selector(ctx)

      // Shared trigger options — every reveal plays ONCE on enter.
      const once = (trigger, start = 'top 85%') => ({
        trigger,
        start,
        toggleActions: 'play none none none',
      })

      // Hard fallback: clear every start-state so the full section shows.
      const showAll = () => {
        gsap.set(
          q('.svcs-line, .svcs-headline, .svcs-num, .svcs-name, .svcs-desc, .svcs-divider, .svcs-rule'),
          { clearProps: 'all' },
        )
      }

      const splits = [] // every SplitText we create — reverted on cleanup

      try {
        /* A) HEADER ROW — mask-up the three items together. */
        gsap.from(q('.svcs-header .svcs-line'), {
          yPercent: 100,
          duration: SVCS.revealDuration + 0.1,
          ease: SVCS.revealEase,
          stagger: 0.08,
          scrollTrigger: once(ctx),
        })

        if (SVCS.drawDividers) {
          gsap.from(q('.svcs-divider'), {
            scaleX: 0,
            transformOrigin: 'left center',
            duration: SVCS.revealDuration + 0.2,
            ease: SVCS.revealEase,
            scrollTrigger: once(ctx),
          })
        }

        /* B) STATEMENT — line-by-line mask-up via SplitText (soft stagger). */
        const headEl = headlineRef.current
        const canSplit = SplitText && typeof SplitText.create === 'function'
        if (headEl && canSplit) {
          const headSplit = SplitText.create(headEl, {
            type: 'lines',
            mask: 'lines',
            linesClass: 'svcs-split-line',
          })
          splits.push(headSplit)
          gsap.from(headSplit.lines, {
            yPercent: 100,
            duration: 1.0,
            ease: SVCS.revealEase,
            stagger: 0.12,
            scrollTrigger: once(q('.svcs-statement')),
          })
        } else if (headEl) {
          // No SplitText → still reveal the whole statement as one calm unit.
          gsap.from(headEl, {
            yPercent: 100,
            duration: 1.0,
            ease: SVCS.revealEase,
            scrollTrigger: once(q('.svcs-statement')),
          })
        }

        /* C) SERVICE INDEX — the showpiece. Each row reveals as the divider
           DRAWS in, the number ticks up, the big service NAME bursts in
           letter-by-letter from behind a mask (staggered, with a settling
           skew), and the description rises. Rows alternate the letter
           direction so the index feels choreographed, not repetitive. */
        q('.svcs-row').forEach((row, i) => {
          const dir = i % 2 === 0 ? 1 : -1
          const numEl = row.querySelector('.svcs-num')
          const nameEl = row.querySelector('.svcs-name')
          const descEl = row.querySelector('.svcs-desc')
          const rule = row.querySelector('.svcs-rule')

          // Split the big name into masked characters (each clipped to its box,
          // so letters slide up from nothing). Falls back to a whole-word rise.
          let nameChars = null
          if (nameEl && canSplit) {
            const s = SplitText.create(nameEl, { type: 'chars', mask: 'chars' })
            splits.push(s)
            nameChars = s.chars
          }

          const tl = gsap.timeline({ scrollTrigger: once(row) })

          if (SVCS.drawDividers && rule) {
            tl.from(
              rule,
              {
                scaleX: 0,
                transformOrigin: dir > 0 ? 'left center' : 'right center',
                duration: SVCS.revealDuration,
                ease: SVCS.revealEase,
              },
              0,
            )
          }

          if (numEl) {
            tl.from(numEl, { opacity: 0, y: 24, duration: 0.7, ease: SVCS.revealEase }, 0.05)
          }

          if (nameChars && nameChars.length) {
            tl.from(
              nameChars,
              {
                yPercent: 120,
                opacity: 0,
                duration: 0.9,
                ease: 'power4.out',
                stagger: { each: SVCS.nameStaggerEach, from: dir > 0 ? 'start' : 'end' },
              },
              0.08,
            )
            // A whole-name skew that settles to 0 — gives the burst a bit of
            // attitude without clipping individual letters.
            tl.from(nameEl, { skewX: 6 * dir, duration: 0.9, ease: 'power3.out' }, 0.08)
          } else if (nameEl) {
            tl.from(
              nameEl,
              { yPercent: 60, opacity: 0, duration: SVCS.revealDuration, ease: SVCS.revealEase },
              0.08,
            )
          }

          if (descEl) {
            tl.from(descEl, { opacity: 0, y: 22, duration: 0.8, ease: SVCS.revealEase }, 0.22)
          }
        })

        /* SCRUBBED PARALLAX — desktop/tablet only. Each big name drifts
           horizontally (alternating L/R) as its row crosses the viewport, so
           the whole index breathes with the scroll. Transform-only, no pin;
           matchMedia auto-reverts below the breakpoint. */
        const mm = gsap.matchMedia(ctx)
        mm.add('(min-width: 768px)', () => {
          q('.svcs-name').forEach((nameEl, i) => {
            const dir = i % 2 === 0 ? 1 : -1
            const row = nameEl.closest('.svcs-row')
            gsap.fromTo(
              nameEl,
              { xPercent: SVCS.nameParallax * dir },
              {
                xPercent: -SVCS.nameParallax * dir,
                ease: 'none',
                scrollTrigger: {
                  trigger: row,
                  start: 'top bottom',
                  end: 'bottom top',
                  scrub: 1,
                  invalidateOnRefresh: true,
                },
              },
            )
          })
        })

        // Closing divider below the last row.
        if (SVCS.drawDividers) {
          gsap.from(q('.svcs-rule--bottom'), {
            scaleX: 0,
            transformOrigin: 'left center',
            duration: SVCS.revealDuration,
            ease: SVCS.revealEase,
            scrollTrigger: once(q('.svcs-rule--bottom')),
          })
        }

        // Recompute trigger positions once webfonts settle (line metrics shift).
        if (document.fonts && document.fonts.ready) {
          document.fonts.ready.then(() => ScrollTrigger.refresh()).catch(() => {})
        }
      } catch (err) {
        // Hard guarantee: full section visible & readable on the dark bg.
        showAll()
        // eslint-disable-next-line no-console
        console.error('[ServicesSection] reveal init failed; static shown.', err)
      }

      // Revert every SplitText's DOM changes on cleanup (the useGSAP scope
      // already reverts the tweens, triggers and matchMedia).
      return () => {
        splits.forEach((s) => {
          if (s && typeof s.revert === 'function') s.revert()
        })
      }
    },
    { scope: root },
  )

  return (
    <section
      className="svcs-root"
      id="services"
      ref={root}
      aria-labelledby="svcs-heading"
      style={{
        '--svcs-bg': SVCS.bg,
        '--svcs-text': SVCS.text,
        '--svcs-muted': SVCS.muted,
        '--svcs-y-from': `${SVCS.yFrom}px`,
      }}
    >
      <h2 id="svcs-heading" className="svcs-sr-only">
        Services
      </h2>

      {/* A) HEADER ROW */}
      <div className="svcs-header">
        <span className="svcs-mask">
          <span className="svcs-line" aria-hidden="true">
            {SVCS.sectionIndex}
          </span>
        </span>
        <span className="svcs-mask svcs-mask--center">
          <span className="svcs-line">{SVCS.label}</span>
        </span>
        <span className="svcs-mask svcs-mask--right">
          <span className="svcs-line">{SVCS.copyright}</span>
        </span>
      </div>
      <div className="svcs-divider" aria-hidden="true" />

      {/* B) STATEMENT HEADLINE */}
      <div className="svcs-statement">
        <p className="svcs-headline" ref={headlineRef}>
          {SVCS.headline}
        </p>
      </div>
      <div className="svcs-divider" aria-hidden="true" />

      {/* C) SERVICE INDEX */}
      <ul className="svcs-list">
        {SVCS_ITEMS.map((s) => (
          <li className="svcs-row" key={s.n}>
            <span className="svcs-rule" aria-hidden="true" />
            <span className="svcs-num" aria-hidden="true">
              {s.n}
            </span>
            <span className="svcs-name">{s.name}</span>
            <p className="svcs-desc">{s.desc}</p>
          </li>
        ))}
        <span className="svcs-rule svcs-rule--bottom" aria-hidden="true" />
      </ul>
    </section>
  )
}
