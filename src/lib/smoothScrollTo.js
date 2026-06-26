/* ================================================================
   smoothScrollTo — shared in-page scroll helper for the nav surfaces
   (main navbar logo, compact pill nav, fullscreen menu).

   Mirrors the pattern already used across the site (see Footer's
   back-to-top): PREFER the existing global Lenis instance so motion
   matches the rest of the site, and NEVER reconfigure it — only call
   scrollTo. If Lenis isn't reachable (it isn't initialised today, but
   the hooks are kept everywhere), fall back to a smooth native scroll.
   Reduced-motion → instant jump. Never throws, never a dead link.

   `href` is a hash like '#about'. '#top' / '#home' resolve to the very
   top of the page (the logo's home behaviour). `offset` is added to the
   target position; pass a negative value to leave room for the fixed
   navbar.
================================================================ */

const NAV_OFFSET = -90 // px — clears the floating top navbar pill

export function smoothScrollTo(href, opts = {}) {
  if (!href || href[0] !== '#') return
  const { duration = 1.0, offset = NAV_OFFSET } = opts

  const id = href.slice(1)
  const toTop = id === 'top' || id === 'home' || id === ''
  const target = toTop ? null : document.getElementById(id)
  // Unknown anchor (no matching section) → do nothing rather than a bad jump.
  if (!toTop && !target) return

  // 1) Preferred: the existing Lenis instance (keeps motion site-consistent).
  try {
    const lenis = window.lenis || window.__lenis
    if (lenis && typeof lenis.scrollTo === 'function') {
      lenis.scrollTo(toTop ? 0 : target, { duration, offset: toTop ? 0 : offset })
      return
    }
  } catch {
    /* fall through to the native fallback */
  }

  // 2) Fallback: smooth native scroll (instant under reduced motion).
  try {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const behavior = reduce ? 'auto' : 'smooth'
    if (toTop) {
      window.scrollTo({ top: 0, behavior })
    } else {
      const y = target.getBoundingClientRect().top + window.scrollY + offset
      window.scrollTo({ top: y, behavior })
    }
  } catch {
    // 3) Last resort: hard, but never dead.
    if (toTop) window.scrollTo(0, 0)
    else if (target) target.scrollIntoView()
  }
}
