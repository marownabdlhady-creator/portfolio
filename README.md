# Cinematic Hero — React + Vite + GSAP

An Awwwards-grade hero section: pure-black canvas, ALL-CAPS Anton display type,
character-by-character masked reveal, scroll-pinned parallax, magnetic CTA, and a
blend-mode custom cursor. Built with GSAP + `useGSAP`/`gsap.context` for clean
React integration and automatic cleanup.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
```

Production build / preview:

```bash
npm run build
npm run preview
```

> Requires Node 18+.

## What's inside

| Feature | Where |
|---|---|
| Character mask reveal (clip-up + blur→sharp, `power4.out`) | `src/components/Hero.jsx` load timeline |
| Divider draws L→R (`scaleX`) | same timeline |
| Subhead + mono label staggered fade/slide | same timeline |
| Scroll pin + per-letter depth drift + stage parallax | `ScrollTrigger` blocks |
| Magnetic CTA + custom cursor (`quickTo`) | pointer handlers |
| `prefers-reduced-motion` fallback | early return in `useGSAP` |
| Cleanup on unmount | `gsap.context` (via `useGSAP` scope) + listener teardown |

## Customizing

- **Heading text:** edit `HEADING_LINES` in `src/components/Hero.jsx`.
- **Accent color / fonts:** `--accent` and tokens in `src/index.css`; font `<link>` in `index.html`.
- **Performance:** only `transform`, `opacity`, and a brief `filter: blur` are
  animated, all GPU-composited. `will-change` is set on animated elements.

## Notes

- The heading is split into characters manually in JSX (not via innerHTML), so
  React stays in control of the DOM. SplitText is **not** required — though as of
  GSAP 3.13 it ships free if you prefer to swap it in.
- The custom cursor and magnetic effect are disabled on touch / no-hover devices
  and under reduced-motion.
