import { useEffect, useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

import HeroMarquee from './components/HeroMarquee.jsx'
import Nav from './components/Nav.jsx'
import Menu from './components/Menu.jsx'
import About from './components/About.jsx'
import MarqueeStrip from './components/MarqueeStrip.jsx'
import Projects from './components/Projects.jsx'
import Services from './components/Services.jsx'
import ServicesSection from './components/ServicesSection.jsx'
import Contact from './components/Contact.jsx'
import Footer from './components/Footer.jsx'
import CompactNav from './components/CompactNav.jsx'
import WhatsAppButton from './components/WhatsAppButton.jsx'
import SoundManager from './components/SoundManager.jsx'
import Cursor from './components/Cursor.jsx'
import Intro from './components/Intro.jsx'
import './App.css'

gsap.registerPlugin(useGSAP, ScrollTrigger)

/* ----------------------------------------------------------------
   COVER TRANSITION — tuning constants

   The cover itself is native CSS sticky (see App.css) — always smooth.
   These only drive the OPTIONAL subtle parallax: as About rises, the
   hero recedes a touch and dims, for depth. Set HERO_PARALLAX = false
   to disable entirely (the cover still works).
------------------------------------------------------------------ */
const HERO_PARALLAX = true
const PARALLAX_SCALE = 0.94 // hero scales to this as it's covered (1 = none)
const PARALLAX_DIM = 0.22 // max opacity of the dim overlay over the hero
const SCRUB = 0.6 // scroll-coupling smoothing (seconds of catch-up — buttery)

// PART 1 — hero (grid + marquee + layered figure) UNCHANGED.
// PART 2 — navbar + fullscreen menu. PART 3 — About covers the hero on scroll.
// App owns the menu open/closed state and the cover/parallax wiring.
export default function App() {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef(null)
  const root = useRef(null)

  // Lock background scroll while the menu is open.
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  /* --------------------------------------------------------------
     OPTIONAL PARALLAX — scrub the hero's scale + dim across the cover
     scroll range (start → when About has fully covered). Transform /
     opacity only, scrubbed directly to scroll, so it stays 60fps with
     no layout work. Skipped entirely under reduced motion.
  ---------------------------------------------------------------- */
  useGSAP(
    () => {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (reduce || !HERO_PARALLAX) return

      gsap
        .timeline({
          scrollTrigger: {
            trigger: '.hero-cover',
            start: 'top top',
            end: 'bottom top', // hero fully covered after one viewport of scroll
            scrub: SCRUB,
          },
        })
        .to('.hero-cover__inner', { scale: PARALLAX_SCALE, ease: 'none' }, 0)
        .to('.hero-cover__dim', { opacity: PARALLAX_DIM, ease: 'none' }, 0)
    },
    { scope: root },
  )

  return (
    <main ref={root}>
      {/* INTRO PRELOADER — GLOBAL, app-level, mounted ONCE above everything.
          Fixed full-screen black overlay (z-index 100000) shown on the first
          load of a session: "مروان" wordmark + 0→100 counter + tagline, then a
          curtain-up reveals the Hero already animating beneath. RESUMES Lenis
          and REMOVES itself from the DOM on finish (no leftover overlay). Runs
          once per session (sessionStorage), skips under reduced-motion / no
          GSAP, and has try/catch + a hard safety timeout so it can never trap
          the user on black. Touches nothing global except Lenis stop/start. */}
      <Intro />

      {/* HERO — pinned (sticky); About rises over it. Internals untouched. */}
      <div className="hero-cover">
        <div className="hero-cover__inner">
          <HeroMarquee />
        </div>
        <div className="hero-cover__dim" aria-hidden="true" />
      </div>

      {/* ABOUT — solid panel that rises and covers the pinned hero on scroll
          (its own z-index sits above the sticky hero). NOT pinned itself, so it
          scrolls away normally as the next section follows. */}
      <About />

      {/* PROJECTS (marquee-strip header) — follows About in NORMAL document
          flow: no pin, no cover, just standard scroll past About. */}
      <MarqueeStrip />

      {/* VIDEO → PROJECTS TRANSITION — full-bleed video that shrinks while
          "Show Projects" converges. Self-contained + namespaced (.svc); sits
          right BEFORE Projects in normal flow and leads into it. */}
      <Services />

      {/* PROJECTS — clean 2-column work grid. Self-contained + namespaced
          (.pjx). Opaque + z-index 3 so the sticky hero can't bleed through;
          follows the transition in normal flow and scrolls normally. */}
      <Projects />

      {/* SERVICES — refined Swiss editorial index (Taylor-style): a SOLID
          DARK section with a header row, a large grotesk statement, and a
          ruled 5-row service index on a strict 12-col grid. ONE calm reveal
          per row (opacity + rise) plus header/headline mask-up and optional
          divider-draw / image-settle — no scrub, no pin, no Flip. The
          light→dark change happens naturally at the boundary with the light
          Projects section above. Self-contained + namespaced (.svcs-); does
          NOT touch the navbar, Lenis, or any global config. */}
      <ServicesSection />

      {/* CONTACT — cinematic closing finale (LAST section). A small framed B/W
          image grows to a full-screen background as you scroll, contact overlay
          rising in on top. PINLESS: native position:sticky stage + clip-path
          scrub (NO GSAP Flip, NO ScrollTrigger pin). Self-contained + namespaced
          (.ctc-); id="contact" wires the existing nav anchors. Sits BELOW the
          navbar in z-index — never overlays the nav. Does NOT touch the navbar,
          Lenis, smooth-scroll, or any global config. */}
      <Contact />

      {/* FOOTER / CONTACT — the site's BLACK "floor"; LAST in-flow block after
          the untouched white Contact finale, continuing the light→dark rhythm.
          A working contact form + identity/connect info, a Swiss multi-column
          link/social grid, and a GIANT name wordmark as the closing signature
          (+ dynamic year + back-to-top, smooth via the existing Lenis instance
          with a native-smooth fallback). Calm mask-up + fade/stagger reveals.
          Self-contained + namespaced (.ftr-); content visible by default; does
          NOT touch the navbar, white finale, WhatsApp button, cursor, Lenis,
          or any global config. */}
      <Footer />

      <Nav
        open={open}
        onToggle={() => setOpen((v) => !v)}
        triggerRef={triggerRef}
      />
      {/* COMPACT PILL NAV — desktop/tablet only; appears on scroll, hides at top */}
      <CompactNav />
      <Menu open={open} onClose={() => setOpen(false)} triggerRef={triggerRef} />

      {/* WHATSAPP — additive global floating button (fixed bottom-right).
          Isolated + namespaced; z-index below the menu so it never covers it. */}
      <WhatsAppButton />

      {/* SOUND — single app-level Web Audio manager + its `snd-` toggle.
          OFF by default; subscribes ONLY to the menu's open/close state. */}
      <SoundManager menuOpen={open} />

      {/* CUSTOM CURSOR — single global instance, mounted once at the app root,
          outside all sections. Fixed + pointer-events:none + mix-blend-mode so
          it auto-inverts over every section. No-op on touch / reduced-motion.
          Namespaced (.mcur-); does NOT touch the navbar, menu, Lenis, or config. */}
      <Cursor />
    </main>
  )
}
