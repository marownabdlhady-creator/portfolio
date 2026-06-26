import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

import './About.css'

gsap.registerPlugin(useGSAP, ScrollTrigger)

/* ================================================================
   ABOUT — the panel that COVERS the hero on scroll.

   Two-column: a huge bold "About" on the LEFT, a content column on the
   RIGHT (bio → tagline → experience rows). Solid, fully-opaque near-black
   background so it covers the pinned hero cleanly (cover mechanics live
   in App.css). Content reveals with a soft, scroll-tied stagger as the
   section enters view.
================================================================ */

/* ----------------------------------------------------------------
   EASY-TO-TWEAK CONSTANTS
------------------------------------------------------------------ */
// Background of the covering panel — must be fully OPAQUE.
const ABOUT_BG = '#0a0a0a'

// SECTION VERTICAL PADDING — the section's height = content + this top/bottom
// padding (no forced 100vh). Tune the breathing room here: smaller → tighter,
// larger → airier. Comfortable default (a bit taller than strict fit-content).
const SECTION_PAD_Y = 'clamp(3.25rem, 8vh, 5.5rem)'

// The big left-hand heading.
const ABOUT_HEADING = 'About'

// BIO — the name is emphasized as the first word and tagged with a pronoun.
const NAME = 'Marwan'
const PRONOUN = '(he/him)'
const BIO =
  'is a full-stack developer and designer with a passion for art and ' +
  'technology. He designs in Figma and Framer and builds with code — ' +
  'crafting clean, premium, one-of-a-kind digital experiences end to end. ' +
  'Available worldwide and ready to take on any challenge.'

// Small uppercase muted tagline.
const TAGLINE = 'Building at the crosspaths of frontend — backend — ai.'

// AVATAR — the person's photo shown in the square next to the experience row.
// Drop in a path later with ONE line (e.g. '/avatar.jpg' from public/). Empty
// string → a clean Swiss monogram fallback ("م") renders instead, never blank.
const ABOUT_AVATAR = ''
const ABOUT_MONOGRAM = 'م'

// EXPERIENCE — repeatable rows. Add more objects to grow the list.
// `logo` is an optional image src; leave it out for a plain placeholder box.
const EXPERIENCE = [
  { role: 'Full-Stack Developer & Designer', org: 'Freelance', logo: null },
]

// Entrance timing (subtle).
const REVEAL_STAGGER = 0.12 // delay between revealed blocks
const REVEAL_DURATION = 0.9 // each block's reveal duration

export default function About() {
  const root = useRef(null)

  useGSAP(
    () => {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (reduce) return // content is already in its final, readable state

      gsap.from('[data-reveal]', {
        yPercent: 18,
        autoAlpha: 0,
        duration: REVEAL_DURATION,
        ease: 'power3.out',
        stagger: REVEAL_STAGGER,
        scrollTrigger: {
          trigger: root.current,
          // begin as the panel rises into view, finish as it settles —
          // tied to the cover so it reads as one calm moment
          start: 'top 80%',
          end: 'top 30%',
          scrub: false,
          toggleActions: 'play none none reverse',
        },
      })
    },
    { scope: root },
  )

  return (
    <section
      className="about"
      id="about"
      aria-labelledby="about-heading"
      ref={root}
      style={{ '--about-bg': ABOUT_BG, '--about-pad-y': SECTION_PAD_Y }}
    >
      <div className="about__inner">
        {/* LEFT — the dominant heading */}
        <h2 className="about__heading" id="about-heading" data-reveal>
          {ABOUT_HEADING}
        </h2>

        {/* RIGHT — content column */}
        <div className="about__content">
          <p className="about__bio" data-reveal>
            <span className="about__name">{NAME}</span>{' '}
            <span className="about__pronoun">{PRONOUN}</span> {BIO}
          </p>

          <p className="about__tagline" data-reveal>
            {TAGLINE}
          </p>

          <ul className="about__experience" data-reveal>
            {EXPERIENCE.map((item, i) => (
              <li className="exp" key={`${item.role}-${i}`}>
                {item.logo ? (
                  <img className="exp__logo" src={item.logo} alt={`${item.org} logo`} />
                ) : ABOUT_AVATAR ? (
                  <img
                    className="exp__logo exp__logo--avatar"
                    src={ABOUT_AVATAR}
                    alt="Marwan"
                  />
                ) : (
                  <span
                    className="exp__logo exp__logo--placeholder exp__logo--monogram"
                    role="img"
                    aria-label="Marwan"
                  >
                    <span aria-hidden="true">{ABOUT_MONOGRAM}</span>
                  </span>
                )}
                <span className="exp__text">
                  <span className="exp__role">{item.role}</span>
                  <span className="exp__org">{item.org}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
