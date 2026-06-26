import { useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

import './Footer.css'

gsap.registerPlugin(useGSAP, ScrollTrigger)

/* ================================================================
   FOOTER / CONTACT — the site's BLACK "floor" + closing signature.

   The FINAL in-flow block, appended AFTER the untouched white
   "video + Visit Website" finale (Contact / .ctc-). Modeled on a
   premium Swiss portfolio footer:
     PART A — a working contact form (right) beside identity + connect
              info (left), under a small mono label row.
     PART B — a Swiss multi-column footer grid (logo+tagline / nav /
              socials / descriptor) with thin 1px dividers + ＋ markers.
     PART C — a GIANT name wordmark as the closing signature, with the
              dynamic year + a real back-to-top button.

   The site alternates light/dark; the finale above is WHITE, so this
   footer is BLACK — closing the rhythm and reading as the floor.

   MOTION — calm, restrained (no scrub, no pin, no Flip, no loops):
     • Contact headline + giant wordmark: mask-up reveal.
     • Form fields, grid columns, info rows: subtle fade/rise + stagger.
     • Optional divider draw (scaleX 0→1), gated by FTR.drawDividers.

   ISOLATION (this is exactly what broke the site before):
   • Every class/ID prefixed `ftr-`; every CSS rule scoped under
     `.ftr-root`. No generic names, no bare element selectors, no `*`.
   • NO global/body/html styles. NO position:fixed. NO ScrollTrigger pin.
   • Navbar, the white finale, WhatsApp button, custom cursor, Lenis and
     the global smooth-scroll config are NOT touched — for back-to-top we
     only CALL the existing Lenis instance's scrollTo (or fall back to a
     smooth window scroll); we never reconfigure it.
   • Content is VISIBLE BY DEFAULT in CSS. Reveal start-states are applied
     by JS only. If JS never runs / throws, the entire footer shows and
     the form + links + back-to-top all still work.
   • All GSAP lives inside useGSAP(..., { scope: root }); scoped refs;
     reverted on unmount via the scope.
================================================================ */

/* ----------------------------------------------------------------
   CONFIG — editable.
------------------------------------------------------------------ */
const FTR = {
  bg: '#0a0a0a',
  text: '#f4f4f4',
  muted: '#8a8a8a',
  brand: 'Marwan', // giant closing wordmark text (Latin, grotesk)
  logoMark: 'مروان', // small grid logo — the site's real Arabic wordmark
  name: 'Marwan Ahmed',
  role: 'Full-Stack & Framer Developer',
  avatar: '', // small avatar image URL (empty → monogram fallback)
  headline: 'Have a project in mind?',
  subline: "I'm always open to collaborations and creative challenges.",
  email: 'marownabdlhady@gmail.com', // EDIT
  phone: '+201018653801',
  tagline:
    'Designing, developing, and launching digital experiences built for real-world impact.',
  availability: 'Available for work',
  descriptor:
    'Creating digital experiences that balance design, performance, and usability.',
  nav: [
    { label: 'Home', href: '#top' },
    { label: 'About', href: '#about' },
    { label: 'Works', href: '#projects' },
    { label: 'Contact', href: '#contact' },
  ],
  socials: [
    { label: 'TikTok', href: 'https://www.tiktok.com/@1studio_1' },
  ],
  budgets: ['Under $1,000', '$1,000 – $3,000', '$3,000 – $7,000', '$7,000+'],
  submitLabel: 'Send message',
  successMsg: "Thanks — I'll reply within 24 hours.",
  errorMsg: 'Something went wrong — please try again.',
  rights: 'All rights reserved.',
  formEndpoint: '', // EDIT LATER: POST endpoint; empty → mailto fallback to `email`
  backToTopDuration: 1.2,
  drawDividers: true,
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const isExternal = (href) => /^(https?:|mailto:|tel:|wa\.me)/i.test(href)

export default function Footer() {
  const root = useRef(null)
  const year = new Date().getFullYear()

  /* ----- FORM STATE — values never lost across validation / error ----- */
  const [values, setValues] = useState({
    name: '',
    email: '',
    phone: '',
    budget: '',
    message: '',
    company: '', // honeypot (must stay empty for humans)
  })
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle') // idle | submitting | success | error
  const [statusMsg, setStatusMsg] = useState('')

  const submitting = status === 'submitting'

  const onChange = (key) => (e) => {
    const v = e.target.value
    setValues((prev) => ({ ...prev, [key]: v }))
    // clear a field's error as the user fixes it
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev))
  }

  const validate = () => {
    const e = {}
    if (!values.name.trim()) e.name = 'Please enter your name.'
    if (!values.email.trim()) e.email = 'Please enter your email.'
    else if (!EMAIL_RE.test(values.email.trim()))
      e.email = 'Please enter a valid email address.'
    if (!values.message.trim()) e.message = 'Please enter a message.'
    return e
  }

  const buildMailto = () => {
    const subject = `New project inquiry — ${values.name || 'Website'}`
    const lines = [
      `Name: ${values.name}`,
      `Email: ${values.email}`,
      values.phone ? `Phone: ${values.phone}` : null,
      values.budget ? `Budget: ${values.budget}` : null,
      '',
      'Message:',
      values.message,
    ].filter((l) => l !== null)
    const body = lines.join('\n')
    return `mailto:${FTR.email}?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Honeypot — if a bot filled the hidden field, silently drop (no error,
    // no submit, no tell). Humans never see or tab to this field.
    if (values.company) return

    const eMap = validate()
    setErrors(eMap)
    if (Object.keys(eMap).length) {
      setStatus('idle')
      // move focus to the first errored field for keyboard users — the inputs
      // already exist in the DOM, so query within our OWN root (scoped, never a
      // global document query) rather than relying on a not-yet-attached ref.
      const firstKey = ['name', 'email', 'message'].find((k) => eMap[k])
      const el = firstKey && root.current && root.current.querySelector(`#ftr-${firstKey}`)
      if (el) el.focus()
      return
    }

    setStatus('submitting')
    setStatusMsg('Sending your message…')

    try {
      // Endpoint not wired yet → graceful mailto fallback so the form is
      // usable immediately (opens the user's mail client, prefilled).
      if (!FTR.formEndpoint) {
        window.location.href = buildMailto()
        setStatus('success')
        setStatusMsg(FTR.successMsg)
        return
      }

      const res = await fetch(FTR.formEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          phone: values.phone,
          budget: values.budget,
          message: values.message,
        }),
      })
      if (!res.ok) throw new Error(`Request failed (${res.status})`)

      setStatus('success')
      setStatusMsg(FTR.successMsg)
    } catch (err) {
      // Keep the user's typed input; offer a retry.
      setStatus('error')
      setStatusMsg(FTR.errorMsg)
      // eslint-disable-next-line no-console
      console.error('[Footer] form submit failed.', err)
    }
  }

  /* ----- BACK TO TOP — prefer the existing Lenis instance (stays smooth like
     the rest of the site); never reconfigure it, only call scrollTo. If Lenis
     isn't reachable, fall back to a smooth native scroll. Never a dead button. */
  const scrollToTop = () => {
    try {
      const lenis = window.lenis || window.__lenis
      if (lenis && typeof lenis.scrollTo === 'function') {
        lenis.scrollTo(0, { duration: FTR.backToTopDuration })
        return
      }
    } catch {
      /* fall through to the native fallback */
    }
    try {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
    } catch {
      window.scrollTo(0, 0)
    }
  }

  // Home (#top) has no element target → drive back-to-top instead of a dead jump.
  const onNavClick = (href) => (e) => {
    if (href === '#top') {
      e.preventDefault()
      scrollToTop()
    }
  }

  /* ----------------------------------------------------------------
     REVEAL — calm, played ONCE on enter. Start-states applied by JS
     ONLY (CSS keeps everything visible if JS never runs / throws).
  ------------------------------------------------------------------ */
  useGSAP(
    () => {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (reduce) return // CSS renders the footer fully visible & static.

      const ctx = root.current
      if (!ctx) return
      const q = gsap.utils.selector(ctx)

      const once = (start = 'top 80%') => ({
        trigger: ctx,
        start,
        toggleActions: 'play none none none',
      })

      // Hard fallback: clear every start-state so the full footer shows.
      const showAll = () => {
        gsap.set(
          q(
            '.ftr-mask-inner, .ftr-divider, .ftr-field, .ftr-form-aside, .ftr-grid-col, .ftr-sign-meta > *, .ftr-identity, .ftr-subline, .ftr-connect',
          ),
          { clearProps: 'all' },
        )
      }

      try {
        // Headline + giant wordmark — mask-up reveal (the two focal gestures).
        gsap.from(q('.ftr-mask-inner'), {
          yPercent: 100,
          duration: 1.0,
          ease: 'power3.out',
          stagger: 0.08,
          scrollTrigger: once(),
        })

        // Optional divider draw, in sync.
        if (FTR.drawDividers) {
          gsap.from(q('.ftr-divider'), {
            scaleX: 0,
            transformOrigin: 'left center',
            duration: 1.1,
            ease: 'power3.out',
            scrollTrigger: once(),
          })
        }

        // Left identity / connect info — understated fade + small rise.
        gsap.from(q('.ftr-identity, .ftr-subline, .ftr-connect'), {
          opacity: 0,
          y: 16,
          duration: 0.7,
          ease: 'power2.out',
          stagger: 0.07,
          scrollTrigger: once('top 78%'),
        })

        // Form fields — subtle staggered rise.
        gsap.from(q('.ftr-field, .ftr-form-aside'), {
          opacity: 0,
          y: 18,
          duration: 0.7,
          ease: 'power2.out',
          stagger: 0.06,
          scrollTrigger: once('top 75%'),
        })

        // Footer grid columns + closing meta row.
        gsap.from(q('.ftr-grid-col, .ftr-sign-meta > *'), {
          opacity: 0,
          y: 16,
          duration: 0.7,
          ease: 'power2.out',
          stagger: 0.06,
          scrollTrigger: once('top 82%'),
        })

        // Recompute trigger positions once webfonts settle (metrics shift).
        if (document.fonts && document.fonts.ready) {
          document.fonts.ready.then(() => ScrollTrigger.refresh()).catch(() => {})
        }
      } catch (err) {
        showAll()
        // eslint-disable-next-line no-console
        console.error('[Footer] reveal init failed; static shown.', err)
      }
    },
    { scope: root },
  )

  const initials = FTR.name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const Avatar = ({ className }) =>
    FTR.avatar ? (
      <img className={className} src={FTR.avatar} alt="" width="40" height="40" />
    ) : (
      <span className={`${className} ftr-avatar--mono`} aria-hidden="true">
        {initials}
      </span>
    )

  return (
    <footer
      className="ftr-root"
      ref={root}
      aria-labelledby="ftr-wordmark"
      style={{
        '--ftr-bg': FTR.bg,
        '--ftr-text': FTR.text,
        '--ftr-muted': FTR.muted,
      }}
    >
      {/* =====================================================
          PART A — CONTACT AREA
      ===================================================== */}
      <div className="ftr-divider ftr-divider--top" aria-hidden="true" />

      <div className="ftr-label-row">
        <span className="ftr-label">
          <span className="ftr-dot" aria-hidden="true">
            ●
          </span>{' '}
          Contact
        </span>
        <span className="ftr-label ftr-label--muted">(Get in touch)</span>
      </div>

      <div className="ftr-contact">
        {/* LEFT — headline + identity + connect, framed by ＋ corner markers */}
        <div className="ftr-contact-left">
          <span className="ftr-plus ftr-plus--tl" aria-hidden="true">
            ＋
          </span>
          <span className="ftr-plus ftr-plus--tr" aria-hidden="true">
            ＋
          </span>
          <span className="ftr-plus ftr-plus--bl" aria-hidden="true">
            ＋
          </span>
          <span className="ftr-plus ftr-plus--br" aria-hidden="true">
            ＋
          </span>

          <h2 className="ftr-headline">
            <span className="ftr-mask">
              <span className="ftr-mask-inner">{FTR.headline}</span>
            </span>
          </h2>

          <div className="ftr-identity">
            <Avatar className="ftr-avatar" />
            <span className="ftr-identity-text">
              <span className="ftr-identity-name">{FTR.name}</span>
              <span className="ftr-identity-role">{FTR.role}</span>
            </span>
          </div>

          <p className="ftr-subline">{FTR.subline}</p>

          <div className="ftr-connect">
            <span className="ftr-label">Let&apos;s connect</span>
            <a className="ftr-connect-link" href={`mailto:${FTR.email}`}>
              {FTR.email}
            </a>
            <a
              className="ftr-connect-link"
              href={`tel:${FTR.phone.replace(/\s+/g, '')}`}
            >
              {FTR.phone}
            </a>
          </div>
        </div>

        {/* RIGHT — working contact form */}
        <div className="ftr-contact-right">
          {status === 'success' ? (
            <div className="ftr-form-aside ftr-form-success" role="status">
              <span className="ftr-success-mark" aria-hidden="true">
                ✓
              </span>
              <p className="ftr-success-msg">{FTR.successMsg}</p>
            </div>
          ) : (
            <form className="ftr-form" onSubmit={handleSubmit} noValidate>
              {/* Honeypot — off-screen, hidden from AT + keyboard. */}
              <div className="ftr-hp" aria-hidden="true">
                <label htmlFor="ftr-company">Company (leave blank)</label>
                <input
                  id="ftr-company"
                  name="company"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={values.company}
                  onChange={onChange('company')}
                />
              </div>

              <div className="ftr-field">
                <label className="ftr-flabel" htmlFor="ftr-name">
                  Name <span className="ftr-req" aria-hidden="true">*</span>
                </label>
                <input
                  id="ftr-name"
                  name="name"
                  type="text"
                  className="ftr-input"
                  required
                  disabled={submitting}
                  value={values.name}
                  onChange={onChange('name')}
                  aria-invalid={errors.name ? 'true' : undefined}
                  aria-describedby={errors.name ? 'ftr-name-err' : undefined}
                  autoComplete="name"
                />
                {errors.name && (
                  <span className="ftr-error" id="ftr-name-err">
                    {errors.name}
                  </span>
                )}
              </div>

              <div className="ftr-field">
                <label className="ftr-flabel" htmlFor="ftr-email">
                  Email <span className="ftr-req" aria-hidden="true">*</span>
                </label>
                <input
                  id="ftr-email"
                  name="email"
                  type="email"
                  className="ftr-input"
                  required
                  disabled={submitting}
                  value={values.email}
                  onChange={onChange('email')}
                  aria-invalid={errors.email ? 'true' : undefined}
                  aria-describedby={errors.email ? 'ftr-email-err' : undefined}
                  autoComplete="email"
                />
                {errors.email && (
                  <span className="ftr-error" id="ftr-email-err">
                    {errors.email}
                  </span>
                )}
              </div>

              <div className="ftr-field-row">
                <div className="ftr-field">
                  <label className="ftr-flabel" htmlFor="ftr-phone">
                    Phone <span className="ftr-opt">(optional)</span>
                  </label>
                  <input
                    id="ftr-phone"
                    name="phone"
                    type="tel"
                    className="ftr-input"
                    disabled={submitting}
                    value={values.phone}
                    onChange={onChange('phone')}
                    autoComplete="tel"
                  />
                </div>

                <div className="ftr-field">
                  <label className="ftr-flabel" htmlFor="ftr-budget">
                    Budget <span className="ftr-opt">(optional)</span>
                  </label>
                  <select
                    id="ftr-budget"
                    name="budget"
                    className="ftr-input ftr-select"
                    disabled={submitting}
                    value={values.budget}
                    onChange={onChange('budget')}
                  >
                    <option value="">Select a range…</option>
                    {FTR.budgets.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="ftr-field">
                <label className="ftr-flabel" htmlFor="ftr-message">
                  Message <span className="ftr-req" aria-hidden="true">*</span>
                </label>
                <textarea
                  id="ftr-message"
                  name="message"
                  className="ftr-input ftr-textarea"
                  rows={4}
                  required
                  disabled={submitting}
                  value={values.message}
                  onChange={onChange('message')}
                  aria-invalid={errors.message ? 'true' : undefined}
                  aria-describedby={errors.message ? 'ftr-message-err' : undefined}
                />
                {errors.message && (
                  <span className="ftr-error" id="ftr-message-err">
                    {errors.message}
                  </span>
                )}
              </div>

              <div className="ftr-form-actions">
                <button
                  type="submit"
                  className="ftr-submit"
                  disabled={submitting}
                >
                  {submitting ? 'Sending…' : FTR.submitLabel}
                  <span className="ftr-submit-arrow" aria-hidden="true">
                    →
                  </span>
                </button>

                {status === 'error' && (
                  <p className="ftr-form-error">{FTR.errorMsg}</p>
                )}
              </div>

              {/* Polite live region — announces state changes to AT. */}
              <p className="ftr-sr-only" role="status" aria-live="polite">
                {statusMsg}
              </p>
            </form>
          )}
        </div>
      </div>

      {/* =====================================================
          PART B — FOOTER GRID
      ===================================================== */}
      <div className="ftr-divider" aria-hidden="true" />

      <div className="ftr-grid">
        {/* Col 1 — logo + tagline + availability */}
        <div className="ftr-grid-col">
          <span className="ftr-grid-logo" lang="ar" dir="rtl">
            {FTR.logoMark}
          </span>
          <p className="ftr-grid-tagline">{FTR.tagline}</p>
          <p className="ftr-grid-avail">
            <span className="ftr-dot ftr-dot--live" aria-hidden="true">
              ●
            </span>{' '}
            {FTR.availability}
          </p>
        </div>

        {/* Col 2 — nav */}
        <nav className="ftr-grid-col" aria-label="Footer">
          <span className="ftr-label ftr-grid-label">Menu</span>
          <ul className="ftr-navlist">
            {FTR.nav.map((n) => (
              <li key={n.label}>
                <a
                  className="ftr-navlink"
                  href={n.href}
                  onClick={onNavClick(n.href)}
                >
                  <span>{n.label}</span>
                  <span className="ftr-navarrow" aria-hidden="true">
                    ↗
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Col 3 — socials */}
        <div className="ftr-grid-col">
          <span className="ftr-label ftr-grid-label">Follow on</span>
          <ul className="ftr-navlist">
            {FTR.socials.map((s) => (
              <li key={s.label}>
                <a
                  className="ftr-navlink"
                  href={s.href}
                  {...(isExternal(s.href)
                    ? { target: '_blank', rel: 'noopener noreferrer' }
                    : {})}
                >
                  <span>{s.label}</span>
                  <span className="ftr-navarrow" aria-hidden="true">
                    ↗
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Col 4 — descriptor + created by */}
        <div className="ftr-grid-col">
          <p className="ftr-grid-descriptor">{FTR.descriptor}</p>
          <div className="ftr-createdby">
            <span className="ftr-label ftr-grid-label">Created by</span>
            <span className="ftr-createdby-row">
              <Avatar className="ftr-avatar ftr-avatar--sm" />
              <span className="ftr-createdby-name">{FTR.name}</span>
            </span>
          </div>
        </div>
      </div>

      {/* =====================================================
          PART C — GIANT WORDMARK (closing signature)
      ===================================================== */}
      <div className="ftr-divider" aria-hidden="true" />

      <h2 id="ftr-wordmark" className="ftr-wordmark">
        <span className="ftr-mask">
          <span className="ftr-mask-inner ftr-wordmark-inner">{FTR.brand}</span>
        </span>
      </h2>

      <div className="ftr-sign-meta">
        <p className="ftr-copy">
          © {year} — {FTR.rights}
        </p>
        <button
          type="button"
          className="ftr-toptop"
          onClick={scrollToTop}
          aria-label="Back to top"
        >
          Back to top
          <span className="ftr-toptop-arrow" aria-hidden="true">
            ↑
          </span>
        </button>
      </div>
    </footer>
  )
}
