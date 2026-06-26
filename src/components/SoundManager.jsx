import { useCallback, useEffect, useRef, useState } from 'react'

import './SoundManager.css'

/* ================================================================
   SOUND MANAGER — subtle UI micro-tones, 100% Web Audio (NO files).

   A SINGLE app-level instance: one shared AudioContext + master gain,
   created/resumed only AFTER the user explicitly enables sound. Cues are
   short synthesized blips (OscillatorNode + GainNode envelopes). OFF by
   default; choice persisted in localStorage. Everything is wrapped in
   try/catch so the site stays silent (never errors) if Web Audio is
   unavailable. All classes/IDs use the `snd-` namespace.

   It only SUBSCRIBES to the fullscreen menu's open/close (via the
   `menuOpen` prop owned by App) — it never touches the menu internals,
   the navbar, the cursor, Lenis, or any section.
================================================================ */

/* ----------------------------------------------------------------
   CONFIG — editable. Keep tones SHORT, SOFT, and cohesive.
------------------------------------------------------------------ */
const SND = {
  masterVolume: 0.06, // master gain — keep low/subtle
  hoverThrottleMs: 100, // ignore repeat hover ticks within this window
  enabledByDefault: false, // MUST stay false (no autoplay)
  storageKey: 'soundEnabled',
  // Per-cue tuning. A cue is one note {…} or an array of notes (chord/sequence).
  // peak is 0..1, scaled by masterVolume; `when` offsets a note within the cue.
  cues: {
    hover: { type: 'sine', freq: 1850, dur: 0.045, peak: 0.45 }, // tiny quiet tick
    click: { type: 'triangle', freq: 520, dur: 0.07, peak: 0.9 }, // a touch more present
    menuOpen: [
      { type: 'sine', freq: 440, dur: 0.08, peak: 0.7 },
      { type: 'sine', freq: 660, dur: 0.1, peak: 0.7, when: 0.06 }, // rising
    ],
    menuClose: [
      { type: 'sine', freq: 660, dur: 0.08, peak: 0.7 },
      { type: 'sine', freq: 440, dur: 0.1, peak: 0.7, when: 0.06 }, // falling
    ],
    toggleOn: [
      { type: 'sine', freq: 523.25, dur: 0.09, peak: 0.8 }, // C5
      { type: 'sine', freq: 783.99, dur: 0.12, peak: 0.8, when: 0.07 }, // G5
    ],
  },
}

// Interactive elements that get hover/click cues (links, buttons, tiles, nav).
const INTERACTIVE = 'a[href], button, [role="button"]'

// Web Audio support (computed once). If absent, the toggle hides + no-ops.
const AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)

// Read the persisted preference; default OFF. Never throws.
function readEnabled() {
  try {
    return window.localStorage.getItem(SND.storageKey) === 'true'
  } catch {
    return SND.enabledByDefault
  }
}

// One short synthesized note: gain envelope (≈5ms attack → fast decay), then
// the nodes stop + disconnect so no oscillators leak.
function playNote(ctx, master, note) {
  const t0 = ctx.currentTime + (note.when || 0)
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.type = note.type || 'sine'
  osc.frequency.setValueAtTime(note.freq, t0)
  const peak = Math.max(0.0001, note.peak ?? 0.6)
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.linearRampToValueAtTime(peak, t0 + 0.005) // ~5ms attack
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + note.dur) // fast decay
  osc.connect(g).connect(master)
  osc.start(t0)
  osc.stop(t0 + note.dur + 0.02)
  osc.onended = () => {
    try {
      osc.disconnect()
      g.disconnect()
    } catch {
      /* already gone */
    }
  }
}

export default function SoundManager({ menuOpen = false }) {
  const [enabled, setEnabled] = useState(readEnabled)

  const ctxRef = useRef(null)
  const masterRef = useRef(null)
  const enabledRef = useRef(enabled) // for event handlers (no stale closures)
  const lastHoverEl = useRef(null)
  const lastHoverTime = useRef(0)
  const menuMounted = useRef(false)

  useEffect(() => {
    enabledRef.current = enabled
  }, [enabled])

  // Lazily build the single AudioContext + master gain. Returns null on failure.
  const ensureCtx = useCallback(() => {
    if (ctxRef.current) return ctxRef.current
    if (!AC) return null
    try {
      const ctx = new AC()
      const master = ctx.createGain()
      master.gain.value = SND.masterVolume
      master.connect(ctx.destination)
      ctxRef.current = ctx
      masterRef.current = master
      return ctx
    } catch {
      return null
    }
  }, [])

  // Play a cue by name — no-op unless enabled. Fully guarded.
  const play = useCallback(
    (name) => {
      if (!enabledRef.current) return
      try {
        const ctx = ensureCtx()
        if (!ctx) return
        if (ctx.state === 'suspended') ctx.resume()
        const cue = SND.cues[name]
        if (!cue) return
        const notes = Array.isArray(cue) ? cue : [cue]
        notes.forEach((n) => playNote(ctx, masterRef.current, n))
      } catch {
        /* stay silent */
      }
    },
    [ensureCtx],
  )

  /* HOVER + CLICK — light event delegation on the document (passive). One
     hover tick per element ENTER (mousemove within the same element is
     ignored), throttled so rapid hovers never spray. */
  useEffect(() => {
    if (!AC) return

    const onOver = (e) => {
      let el = null
      try {
        el = e.target.closest?.(INTERACTIVE) || null
      } catch {
        el = null
      }
      if (el === lastHoverEl.current) return // still within the same element
      lastHoverEl.current = el
      if (!el || el.closest('.snd-toggle')) return // ignore the toggle itself
      const now = performance.now()
      if (now - lastHoverTime.current < SND.hoverThrottleMs) return
      lastHoverTime.current = now
      play('hover')
    }

    const onClick = (e) => {
      let el = null
      try {
        el = e.target.closest?.(INTERACTIVE) || null
      } catch {
        el = null
      }
      if (!el) return
      if (el.closest('.snd-toggle')) return // toggle has its own cue
      if (el.closest('.nav__trigger')) return // menu open/close cue covers it
      play('click')
    }

    document.addEventListener('pointerover', onOver, { passive: true })
    document.addEventListener('click', onClick, { passive: true })
    return () => {
      document.removeEventListener('pointerover', onOver)
      document.removeEventListener('click', onClick)
    }
  }, [play])

  /* MENU OPEN/CLOSE — subscribe to the existing menu state (prop). Skip the
     first run so nothing plays on mount. play() is itself gated on enabled. */
  useEffect(() => {
    if (!menuMounted.current) {
      menuMounted.current = true
      return
    }
    play(menuOpen ? 'menuOpen' : 'menuClose')
  }, [menuOpen, play])

  // Close the AudioContext on unmount (single app-level instance, but tidy).
  useEffect(
    () => () => {
      try {
        ctxRef.current?.close()
      } catch {
        /* ignore */
      }
      ctxRef.current = null
      masterRef.current = null
    },
    [],
  )

  // Toggle handler — resumes the context within the user gesture when turning
  // ON, persists the choice, and gives an audible level cue on enable.
  const onToggle = () => {
    const next = !enabled
    setEnabled(next)
    enabledRef.current = next // update immediately for the cue below
    try {
      window.localStorage.setItem(SND.storageKey, String(next))
    } catch {
      /* in-memory fallback — state still updates */
    }
    if (next) {
      try {
        const ctx = ensureCtx()
        if (ctx && ctx.state === 'suspended') ctx.resume()
      } catch {
        /* ignore */
      }
      play('toggleOn')
    }
  }

  // No Web Audio → render nothing (toggle hidden), site stays silent.
  if (!AC) return null

  return (
    <button
      type="button"
      className={`snd-toggle ${enabled ? 'snd-toggle--on' : 'snd-toggle--off'}`}
      onClick={onToggle}
      aria-label={enabled ? 'Mute sound' : 'Enable sound'}
      aria-pressed={enabled}
      title={enabled ? 'Mute sound' : 'Enable sound'}
    >
      <span className="snd-toggle__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
          {/* speaker body */}
          <path
            d="M4 9v6h3.5L13 19V5L7.5 9H4Z"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
          {enabled ? (
            // ON — two sound waves
            <>
              <path
                d="M16 9.5a3.5 3.5 0 0 1 0 5"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
              <path
                d="M18.5 7a7 7 0 0 1 0 10"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </>
          ) : (
            // OFF — a small slash
            <path
              d="M16.5 9.5l4 5m0-5l-4 5"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          )}
        </svg>
      </span>
    </button>
  )
}
