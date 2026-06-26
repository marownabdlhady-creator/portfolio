import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

import './MarqueeStrip.css'

gsap.registerPlugin(useGSAP, ScrollTrigger)

/* ================================================================
   PROJECTS HEADER (marquee strip) — the Projects section's header.

   A near-white section (contrasting the black About) whose HEADER is an
   OUTLINED rounded band with a seamless horizontal marquee, pinned to the
   TOP of the section, with a small "↳ Projects" lead-in label just below
   it. Below that sits open space reserved for the Projects grid (added
   later). The section rises up and COVERS About on scroll, reusing the
   site's sticky cover mechanic (wired in App.jsx / App.css) and the hero's
   seamless-loop technique: a single translateX(-50%) on a duplicated track
   — no seam, no reflow.

   Only transform / opacity / clip-path animate (GPU, 60fps).
================================================================ */

/* ----------------------------------------------------------------
   EASY-TO-TWEAK CONSTANTS
------------------------------------------------------------------ */
// MARQUEE COPY — repeated with SEPARATOR between copies → a continuous
// ticker: "SELECTED WORK ✦ SELECTED WORK ✦ …". Swap the emoji/text freely.
const MARQUEE_TEXT = 'SELECTED WORK'
const SEPARATOR = '✦'

// SPEED — seconds for ONE copy (text + separator) to travel its own width.
// Lower = faster. The full seamless cycle derives from this × copies/group.
const MARQUEE_SECONDS_PER_COPY = 8
// Copies per group. The track holds 2 identical groups and moves exactly
// -50% (one whole group) per loop, so any count tiles seamlessly. 4 keeps a
// group wider than the viewport at every width (no empty gaps).
const REPEAT_PER_GROUP = 4

// Optional polish: nudge marquee speed with scroll velocity, then ease back.
// Set false to keep a perfectly constant glide.
const SCROLL_VELOCITY_COUPLING = true

// COLOURS
const SECTION_BG = '#f4f2ee' // near-white section (contrasts the black About)
const TEXT_COLOR = '#0a0a0a' // near-black marquee text

// BAND — the outlined rounded bar that frames the moving text.
const BAND_BORDER_WIDTH = '1.5px'
const BAND_BORDER_COLOR = 'rgba(10, 10, 10, 0.85)'
const BAND_RADIUS = 'clamp(1.4rem, 4vw, 3rem)' // rounded corners (scale with size)
const BAND_MARGIN = 'clamp(1rem, 4vw, 3.5rem)' // side margins (band floats inset)
const BAND_PAD_Y = 'clamp(0.45rem, 1.5vw, 1.05rem)' // vertical breathing inside

// MARQUEE TYPE SIZE — one fluid clamp (no breakpoint jumps): MAX on desktop,
// shrinking via the vw PREF term, with MIN as the phone floor.
const TEXT_SIZE_MIN = '2.1rem'
const TEXT_SIZE_PREF = '10.5vw'
const TEXT_SIZE_MAX = '7rem'
const SEP_GAP = '0.4em' // space on each side of the separator (scales with type)

// LEAD-IN LABEL — small "↳ Projects" anchor pointing at the next section.
const LEAD_IN_PREFIX = '↳'
const LEAD_IN_LABEL = 'Projects'
const LEAD_IN_HREF = '#projects'

// ENTRANCE — subtle reveal as the section covers About.
const REVEAL_DURATION = 0.85
const REVEAL_STAGGER = 0.12

// Derived: seconds for one full seamless loop (track travels -50% = one group).
const CYCLE_SEC = MARQUEE_SECONDS_PER_COPY * REPEAT_PER_GROUP

export default function MarqueeStrip() {
  const root = useRef(null)
  const trackRef = useRef(null)

  useGSAP(
    () => {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const track = trackRef.current

      /* ----------------------------------------------------------
         REDUCED MOTION — no infinite scroll, no velocity coupling,
         no reveal. The text rests centred inside the band, readable.
      ---------------------------------------------------------- */
      if (reduce) {
        root.current.querySelector('.strip__marquee').classList.add('is-static')
        return
      }

      /* ----------------------------------------------------------
         SEAMLESS LOOP — duplicated track moved exactly -50% (one
         group). Transform only → never reflows, wraps with no seam.
      ---------------------------------------------------------- */
      const loop = gsap.to(track, {
        xPercent: -50,
        duration: CYCLE_SEC,
        ease: 'none',
        repeat: -1,
      })

      /* ----------------------------------------------------------
         ENTRANCE — band + label reveal softly as the section rises
         into view and covers About. Calm, restful, tied to scroll.
      ---------------------------------------------------------- */
      gsap.from('[data-strip-reveal]', {
        autoAlpha: 0,
        yPercent: 22,
        duration: REVEAL_DURATION,
        ease: 'power3.out',
        stagger: REVEAL_STAGGER,
        scrollTrigger: {
          trigger: root.current,
          start: 'top 80%',
          end: 'top 35%',
          toggleActions: 'play none none reverse',
        },
      })

      /* ----------------------------------------------------------
         OPTIONAL — gently couple loop speed to scroll velocity, then
         ease back to base. timeScale only (no reflow); clamped so it
         can never jank.
      ---------------------------------------------------------- */
      if (!SCROLL_VELOCITY_COUPLING) return

      let targetTS = 1
      ScrollTrigger.create({
        trigger: root.current,
        start: 'top bottom',
        end: 'bottom top',
        onUpdate: (self) => {
          const v = Math.abs(self.getVelocity()) // px/sec
          targetTS = 1 + Math.min(v / 2200, 3) // up to 4× base speed
        },
      })

      const ease = () => {
        const cur = loop.timeScale()
        loop.timeScale(cur + (targetTS - cur) * 0.1)
        if (targetTS > 1) targetTS += (1 - targetTS) * 0.06
      }
      gsap.ticker.add(ease)
      return () => gsap.ticker.remove(ease)
    },
    { scope: root },
  )

  return (
    <section
      className="strip"
      ref={root}
      style={{
        '--strip-bg': SECTION_BG,
        '--strip-text': TEXT_COLOR,
        '--band-bw': BAND_BORDER_WIDTH,
        '--band-bc': BAND_BORDER_COLOR,
        '--band-radius': BAND_RADIUS,
        '--band-margin': BAND_MARGIN,
        '--band-pad-y': BAND_PAD_Y,
        '--text-min': TEXT_SIZE_MIN,
        '--text-pref': TEXT_SIZE_PREF,
        '--text-max': TEXT_SIZE_MAX,
        '--sep-gap': SEP_GAP,
      }}
    >
      <div className="strip__inner">
        {/* OUTLINED BAND — clips the seamless marquee inside its rounded frame */}
        <div className="strip__band" data-strip-reveal>
          <div className="strip__marquee">
            <div className="strip__track" ref={trackRef}>
              {[0, 1].map((g) => (
                // Second group is a pure visual duplicate → hidden from a11y.
                <div
                  className="strip__group"
                  key={g}
                  aria-hidden={g === 1 ? 'true' : undefined}
                >
                  {Array.from({ length: REPEAT_PER_GROUP }).map((_, i) => (
                    // Only the very first copy's text is exposed to screen
                    // readers (announced once); every repeat + separator hidden.
                    <span
                      className="strip__copy"
                      key={i}
                      aria-hidden={g === 0 && i === 0 ? undefined : 'true'}
                    >
                      <span className="strip__word">{MARQUEE_TEXT}</span>
                      <span className="strip__sep" aria-hidden="true">
                        {SEPARATOR}
                      </span>
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
