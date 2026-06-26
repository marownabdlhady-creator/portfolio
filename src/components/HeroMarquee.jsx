import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

import './HeroMarquee.css'

// Register plugins once at module scope (ScrollTrigger is registered now so the
// optional scroll-velocity coupling — and future passes — can use it).
gsap.registerPlugin(useGSAP, ScrollTrigger)

/* ================================================================
   HERO — PART 1 ONLY
   Background (grid paper) + a seamless giant-type marquee running
   BEHIND a bottom-anchored transparent cut-out figure.

   Navbar, labels, scroll UI, etc. are intentionally NOT here yet —
   the container is left ready for them.
================================================================ */

/* ----------------------------------------------------------------
   EASY-TO-TWEAK CONSTANTS
------------------------------------------------------------------ */
// MARQUEE COPY — a full PHRASE now (not a single word). It is repeated with a
// separator between copies so it reads as a continuous ticker:
//   "A Journey in Design and Creativity • A Journey in Design and Creativity • …"
const MARQUEE_TEXT = 'A Journey in Design and Creativity'
// SEPARATOR — sits between every repeat. Default renders visually as " • " (the
// MARQUEE_GAP below supplies the breathing space on each side of this glyph, so
// the gap scales with the type). Swap to '/', '—', '·', etc. to taste.
const MARQUEE_SEPARATOR = '•'
// MARQUEE FACE — Mezcal: the custom display face (@font-face in HeroMarquee.css,
// file at public/fonts/Mezcal.otf). Full Latin coverage incl. lowercase, so the
// mixed-case phrase renders correctly. Fallbacks (Anton → Arial Narrow) cover the
// brief swap window / rare no-webfont case.
const MARQUEE_FONT = "'Mezcal', 'Anton', 'Arial Narrow', 'Helvetica Neue', sans-serif"
const MARQUEE_WEIGHT = 400 // Mezcal ships a single display weight
const MARQUEE_LINE_HEIGHT = 1.12 // single line; roomy enough that y/g/j descenders never clip
// SPEED — exposed as "seconds for ONE copy (phrase + separator) to travel its
// own width". This is the readable knob: lower = faster. Because a copy's width
// scales with the (fluid) type size, px/sec scales with the viewport too — so it
// reads at the SAME pace everywhere and feels calmer (slower px/sec) on mobile.
// Lower = faster. ~18–26 reads as a slow drift; ~12–15 is a lively, premium
// glide that still reads comfortably. THE speed knob — tune this only.
const MARQUEE_SECONDS_PER_COPY = 14
const MARQUEE_GAP = '0.42em' // em-based space on EACH side of the separator (scales with type)
// MARQUEE TYPE SIZE — one fluid clamp() so the giant line scales smoothly with
// the viewport (no stepped jumps) and is unchanged on desktop (MAX wins there).
// Units are svh (= the hero's own height unit) so the type/figure proportions
// hold on mobile, where svh ≠ vh.
//   NOTE on cap-height: Mezcal's cap-height is ≈ 0.704× the font-size (measured
//   from the .otf), vs Anton's ≈ 0.73×. To keep the SAME visual cap-height (so the
//   head-overlap geometry is preserved with the new face) the sizes below are
//   nudged up ~3.7% (0.73 / 0.704). Tune by VISUAL (cap) height with that factor
//   in mind. If the head-overlap ever needs a tweak, adjust these or MARQUEE_TOP*.
//   MIN  — floor on the narrowest phones: bold, but clearly SMALLER than the
//          68svh figure so the FIGURE stays the hero
//   PREF — width-driven preferred size (tablet smaller, shrinks further on phones)
//   MAX  — desktop cap (the line is exactly this on wide screens — large + bold)
const MARQUEE_SIZE_MIN = '35svh'
const MARQUEE_SIZE_PREF = '45vw'
const MARQUEE_SIZE_MAX = '48svh'
// MARQUEE VERTICAL MIDLINE — fluid, tied to where the figure's head is. The band
// reaches the head from near centre, so DESKTOP and PHONE sit close together (the
// head crown lands at the band's top edge → the type passes BEHIND the head). The
// figure is UNCHANGED, so these values keep the same head-crosses-type overlap.
//   DESKTOP — slightly above centre (unchanged)
//   PHONE   — ~46%: the band crosses the head/upper-chest, head crown emerges above
//   PREF    — width-driven blend term controlling where DESKTOP→PHONE hands off
const MARQUEE_TOP = '47%' // desktop midline (MAX — wide screens use this)
const MARQUEE_TOP_PHONE = '46%' // phone midline (MIN — floor on narrow screens)
const MARQUEE_TOP_PREF = '47vw' // blend term (raise → handoff happens wider)
// PHRASE copies per group. The track holds 2 identical groups and translates
// exactly -50% (one group) per loop, so ANY count tiles seamlessly. 3 keeps a
// comfortable safety margin: one group is always wider than the viewport (even
// ultrawide / smallest type), so the strip never shows empty space.
const REPEAT_PER_GROUP = 3
// Seconds for ONE seamless loop (the strip travels exactly -50% = one whole
// group = REPEAT_PER_GROUP copies). Derived from the per-copy speed so the glide
// pace stays identical no matter how many copies a group holds. Do NOT hand-tune
// this — tune MARQUEE_SECONDS_PER_COPY above instead.
const MARQUEE_CYCLE_SEC = MARQUEE_SECONDS_PER_COPY * REPEAT_PER_GROUP

// Optional stretch: nudge marquee speed with scroll velocity, then ease back.
const SCROLL_VELOCITY_COUPLING = true

// Transparent cut-out subject. BASE_URL keeps it correct under sub-path deploys.
// hero2.png is a genuine transparent cut-out (verified: all corners alpha=0), so
// the marquee type passes BEHIND the head exactly as before.
const IMG_SRC = `${import.meta.env.BASE_URL}assets/hero2.png`

// HERO BACKGROUND IMAGE — backmost layer, fills the hero (cover, centred,
// no-repeat) behind the marquee + figure. Replaces the old light grid paper.
// BASE_URL keeps the path correct under sub-path deploys.
const BG_SRC = `${import.meta.env.BASE_URL}assets/BACK_HIRO.png`
// READABILITY SCRIM — a very light, soft band of the paper tone sitting BETWEEN
// the background image and the marquee, just behind the type, so the near-black
// (#0A0A0A) marquee text always reads cleanly over the photo. BACK_HIRO.png is
// already bright (avg luminance ≈230/255, darkest ≈200), so contrast is strong
// even at 0 — this is kept deliberately low so it lifts legibility WITHOUT
// washing out the image. Raise toward ~0.25 if you ever swap in a busier/darker
// background; drop to 0 to remove it entirely. THE readability knob.
const SCRIM_OPACITY = 0.12
// FLUID FIGURE SIZE — the figure height is a single continuous clamp(), so it
// shrinks smoothly and MONOTONICALLY as the viewport narrows (no breakpoint
// jumps) while staying pixel-identical to today's desktop on wide screens
// (the MAX term wins there). Aspect ratio is preserved → never distorts.
//   MIN  — floor (svh): on phones the figure rests here. Kept TALL (≈68svh) so
//          the figure dominates the lower ~⅔ of the frame and its head reaches
//          UP into the marquee — while its base stays pinned to the bottom edge
//          so the waist cut is still off-screen (raise the head by RAISING this,
//          not by lifting IMG_BOTTOM, which would expose the cut).
//   PREF — width-driven preferred height; as the viewport gets narrower this
//          value drops, so resizing smaller always makes the figure SMALLER
//   MAX  — desktop height (svh): the figure is exactly this on wide screens
//   NOTE on the hero2.png swap: the new cut-out carries ~16.5% transparent
//   padding ABOVE the head (vs ~4.7% in the old hero.png) and a more landscape
//   canvas. To keep the figure's ON-SCREEN body size and head-crown position
//   IDENTICAL to before (so the head still punches up through the marquee by the
//   same amount), all three terms are scaled up ~1.14× (105/92). The actual
//   person renders at the same height as the old figure; the extra is just the
//   image's transparent top padding, which sits off the top edge. Tune freely.
const FIGURE_H_MIN = '78svh'
const FIGURE_H_PREF = '84vw'
const FIGURE_H_MAX = '105svh'
// Vertical anchor: gap between the figure's base and the bottom edge.
// '0vh' = flush to the bottom (waist cut sits at the frame edge, off-screen,
// same crop logic as desktop); raise it to lift the whole figure up.
const IMG_BOTTOM = '0vh'

// ENTRANCE — the figure rises from fully below its resting spot into place.
const FIGURE_RISE_SEC = 1.2 // filmic, calm (≈1–1.3s), not snappy
const FIGURE_RISE_FROM = 115 // start yPercent: fully below the bottom edge (out of view)

/* ----------------------------------------------------------------
   RESPONSIVE NOTE  (no per-breakpoint figure constants any more)

   The cut-out is LANDSCAPE (head + torso, hard cut at the waist). Sizing
   is now FULLY FLUID — no media queries, no stepped multipliers. The
   figure height (FIGURE_H_* above) and the marquee type size
   (MARQUEE_SIZE_* above) are single clamp()s that scale continuously from
   desktop down to ~360px. At every width the figure stays bottom-anchored
   + horizontally centred, its base pinned to the bottom edge so the waist
   cut sits at/just below the frame (never floating), the sides crop into
   the frame, and the marquee keeps passing behind the head.

   Tune the figure with FIGURE_H_*, its anchor with IMG_BOTTOM, and the
   type with MARQUEE_SIZE_* / MARQUEE_TOP.
------------------------------------------------------------------ */

/* ----------------------------------------------------------------
   DEPTH + FINISHING — all subtle. If any one effect is noticeable on
   its own it's too strong; these only make the scene feel "real".
   Every value below is a knob you can fine-tune.
------------------------------------------------------------------ */
// GROUND CONTACT SHADOW — soft elliptical floor shadow under the figure
// (ambient floor shadow, NOT a hard outline / halo around the cut-out).
const SHADOW_OPACITY = 0.16 // darkest centre alpha (~10–18% black)
const SHADOW_BLUR = '38px' // heavy blur → reads as soft floor contact, not an edge
const SHADOW_WIDTH = '44vh' // ellipse width (scales with viewport like the figure)
const SHADOW_HEIGHT = '7vh' // ellipse height (flat → sits on the ground)
const SHADOW_LIFT = '3.5vh' // raise the shadow's centre off the very bottom edge

// DEPTH SEPARATION — a barely-there soft darkening of the type plane right
// behind the body, just enough to lift the figure forward.
const DEPTH_OPACITY = 0.07 // keep < ~0.1, or it becomes a visible shape
const DEPTH_BLUR = '50px'

// FILM GRAIN — kills digital flatness for a printed feel. Should never be
// individually visible; nudge up only until the flatness is gone.
const GRAIN_OPACITY = 0.05

// ANDALUSIAN ARCH — ONE restrained geometric touch: a soft pointed-arch
// (mihrab-like) pool of light behind the figure. No pattern, no gold — just a
// faint architectural silhouette that reads as texture. Whisper-light by design;
// set ANDALUSIAN_ARCH = false to remove it entirely.
const ANDALUSIAN_ARCH = true
const ARCH_OPACITY = 0.5 // layer opacity (the gradient inside is already faint)
const ARCH_WIDTH = '58vh' // arch span (scales with the figure)
const ARCH_HEIGHT = '86vh' // arch height (tall, frames the upper body)
const ARCH_BOTTOM = '-2vh' // sits just off the floor, behind the figure

export default function HeroMarquee() {
  const root = useRef(null)
  const trackRef = useRef(null)

  useGSAP(
    () => {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const track = trackRef.current

      /* ============================================================
         REDUCED MOTION — no infinite motion. Render a calm, centred
         rest state that still frames the figure, fully visible.
      ============================================================ */
      if (reduce) {
        root.current.querySelector('.marquee').classList.add('is-static')
        // Render the figure already in its final centred, bottom-anchored
        // position — no rise, no fade. (yPercent, not y: there is no transform
        // baked into CSS anymore, so this is the resting state.)
        gsap.set(['.marquee', '.hero-m__figure'], { autoAlpha: 1, yPercent: 0 })
        // Depth + ground shadow render fully formed (GSAP owns xPercent so the
        // horizontal centring matches the animated path exactly).
        gsap.set('.hero-m__depth', { autoAlpha: 1, xPercent: -50 })
        gsap.set('.hero-m__shadow', { autoAlpha: 1, xPercent: -50, scale: 1 })
        return
      }

      /* ============================================================
         SEAMLESS LOOP — the track holds 2 identical groups; moving it
         exactly -50% wraps with no seam or jump. Transform only, so it
         never reflows. Built paused; the entrance starts it.
      ============================================================ */
      const loop = gsap.to(track, {
        xPercent: -50,
        duration: MARQUEE_CYCLE_SEC,
        ease: 'none',
        repeat: -1,
        paused: true,
      })

      /* ============================================================
         ENTRANCE — one cohesive, calm reveal: the marquee fades in and
         starts moving while the figure rises a few px with a soft fade.
      ============================================================ */
      gsap.set('.marquee', { autoAlpha: 0 })
      // Start fully below the resting spot (out of view) + transparent.
      gsap.set('.hero-m__figure', { autoAlpha: 0, yPercent: FIGURE_RISE_FROM })
      // Depth darkening fades in with the figure; the ground shadow starts
      // small + invisible and GROWS as he settles (GSAP owns xPercent so the
      // CSS translateX(-50%) never fights the scale tween).
      gsap.set('.hero-m__depth', { autoAlpha: 0, xPercent: -50 })
      gsap.set('.hero-m__shadow', {
        autoAlpha: 0,
        xPercent: -50,
        scale: 0.7,
        transformOrigin: '50% 50%',
      })

      gsap
        .timeline({ defaults: { ease: 'power3.out' } })
        .add(() => loop.play(), 0) // marquee is ALREADY moving as the figure rises
        .to('.marquee', { autoAlpha: 1, duration: 0.9 }, 0) // type fades in just before
        // Cinematic filmic rise: translateY + opacity only (GPU, no reflow).
        .to(
          '.hero-m__figure',
          { autoAlpha: 1, yPercent: 0, duration: FIGURE_RISE_SEC },
          0.15,
        )
        // Depth lifts him off the type plane as he arrives.
        .to('.hero-m__depth', { autoAlpha: 1, duration: FIGURE_RISE_SEC }, 0.15)
        // Ground shadow lands beneath him — grows + fades in slightly behind
        // the rise so the contact reads believably as he settles.
        .to(
          '.hero-m__shadow',
          { autoAlpha: 1, scale: 1, duration: FIGURE_RISE_SEC * 0.95 },
          0.3,
        )

      /* ============================================================
         OPTIONAL — gently couple loop speed to scroll velocity, then
         ease back to base. timeScale only (no reflow); clamped so it
         can never jank. Inert until the page is scrollable.
      ============================================================ */
      if (!SCROLL_VELOCITY_COUPLING) return

      let targetTS = 1
      ScrollTrigger.create({
        trigger: root.current,
        start: 'top bottom',
        end: 'bottom top',
        onUpdate: (self) => {
          const v = Math.abs(self.getVelocity()) // px/sec
          targetTS = 1 + Math.min(v / 1800, 3) // up to 4× base speed
        },
      })

      // Ease the live timeScale toward target, and decay target back to 1.
      const ease = () => {
        const cur = loop.timeScale()
        loop.timeScale(cur + (targetTS - cur) * 0.1)
        if (targetTS > 1) targetTS += (1 - targetTS) * 0.06
      }
      gsap.ticker.add(ease)

      // If a Lenis smooth-scroll instance is exposed globally, drive
      // ScrollTrigger from its scroll event so velocity stays accurate and the
      // two never fight/stutter. No-op when Lenis is absent (it is, today). The
      // marquee loop itself is scroll-independent, so it can't conflict anyway.
      const lenis = window.lenis || window.__lenis
      let onLenisScroll
      if (lenis && typeof lenis.on === 'function') {
        onLenisScroll = () => ScrollTrigger.update()
        lenis.on('scroll', onLenisScroll)
      }

      return () => {
        gsap.ticker.remove(ease)
        if (lenis && onLenisScroll && typeof lenis.off === 'function') {
          lenis.off('scroll', onLenisScroll)
        }
      }
    },
    { scope: root },
  )

  return (
    <section
      className="hero-m"
      ref={root}
      // Tunables surfaced as CSS custom properties. Responsive sizing is fully
      // fluid in the stylesheet: the figure and type each resolve to a single
      // clamp() built from the MIN/PREF/MAX knobs below — these stay the source.
      style={{
        '--m-top': MARQUEE_TOP,
        '--m-top-phone': MARQUEE_TOP_PHONE,
        '--m-top-pref': MARQUEE_TOP_PREF,
        '--m-size-min': MARQUEE_SIZE_MIN,
        '--m-size-pref': MARQUEE_SIZE_PREF,
        '--m-size-max': MARQUEE_SIZE_MAX,
        '--m-gap': MARQUEE_GAP,
        '--m-font': MARQUEE_FONT,
        '--m-weight': MARQUEE_WEIGHT,
        '--m-lh': MARQUEE_LINE_HEIGHT,
        '--fig-min': FIGURE_H_MIN,
        '--fig-pref': FIGURE_H_PREF,
        '--fig-max': FIGURE_H_MAX,
        '--img-bottom': IMG_BOTTOM,
        '--hero-bg': `url(${BG_SRC})`,
        '--scrim-opacity': SCRIM_OPACITY,
        '--shadow-opacity': SHADOW_OPACITY,
        '--shadow-blur': SHADOW_BLUR,
        '--shadow-w': SHADOW_WIDTH,
        '--shadow-h': SHADOW_HEIGHT,
        '--shadow-lift': SHADOW_LIFT,
        '--depth-opacity': DEPTH_OPACITY,
        '--depth-blur': DEPTH_BLUR,
        '--grain-opacity': GRAIN_OPACITY,
        '--arch-opacity': ARCH_OPACITY,
        '--arch-w': ARCH_WIDTH,
        '--arch-h': ARCH_HEIGHT,
        '--arch-bottom': ARCH_BOTTOM,
      }}
    >
      {/* BACKGROUND IMAGE — BACK_HIRO.png, backmost layer, covers the hero
          (cover, centred, no-repeat) behind everything. Replaces the old grid.
          First child so it sits beneath the faint atmosphere/arch light layers. */}
      <div className="hero-m__bg" aria-hidden="true" />

      {/* ATMOSPHERE — faint light pool behind the upper body + a whisper of
          edge vignette, now layered subtly OVER the background image. */}
      <div className="hero-m__atmosphere" aria-hidden="true" />

      {/* ANDALUSIAN ARCH — one restrained pointed-arch light behind the figure
          (mihrab silhouette as texture, not decoration). Whisper-light. */}
      {ANDALUSIAN_ARCH && <div className="hero-m__arch" aria-hidden="true" />}

      {/* READABILITY SCRIM — a soft, light band behind the type so the near-black
          marquee text stays legible over the photo. Above the background image,
          BELOW the marquee + figure. Opacity is --scrim-opacity (SCRIM_OPACITY). */}
      <div className="hero-m__scrim" aria-hidden="true" />

      {/* MARQUEE (behind layer) — decorative ticker, hidden from the a11y tree.
          Two identical groups sit side by side; GSAP translates the track exactly
          -50% (one group) so it wraps with NO seam. Each copy is PHRASE + SEPARATOR,
          and every copy is identical, so the phrase·separator pattern tiles
          perfectly across the group boundary — the loop point is invisible. */}
      <div className="marquee" aria-hidden="true" lang="en">
        <div className="marquee__track" ref={trackRef}>
          {[0, 1].map((g) => (
            <div className="marquee__group" key={g}>
              {Array.from({ length: REPEAT_PER_GROUP }).map((_, i) => (
                <span className="marquee__copy" key={i}>
                  <span className="marquee__word">{MARQUEE_TEXT}</span>
                  <span className="marquee__sep">{MARQUEE_SEPARATOR}</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* DEPTH — soft darkening on the type plane right behind the body, so the
          figure reads as sitting in FRONT of the marquee (above type, below figure). */}
      <div className="hero-m__depth" aria-hidden="true" />

      {/* GROUND CONTACT SHADOW — soft floor ellipse beneath the figure (above
          the type, below the figure → grounds him without a halo). */}
      <div className="hero-m__shadow" aria-hidden="true" />

      {/* FIGURE (front layer) — transparent cut-out; the type passes behind it */}
      <div className="hero-m__figure">
        <img src={IMG_SRC} alt="" draggable="false" />
      </div>

      {/* FILM GRAIN — tiled SVG noise across the whole hero at very low opacity
          (kills the digital flatness; sits on top, never interactive). */}
      <div className="hero-m__grain" aria-hidden="true" />
    </section>
  )
}
