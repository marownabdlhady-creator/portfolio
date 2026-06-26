import './WhatsAppButton.css'

/* ================================================================
   WHATSAPP FLOATING BUTTON — additive, global, isolated.

   A fixed bottom-right link that opens a WhatsApp chat. Fully self-
   contained + namespaced (`wa-`); it touches no other section. Its
   z-index sits BELOW the fullscreen menu (9990) and the nav trigger,
   so the opaque menu overlay covers it when open — it can never block
   the menu. It sits bottom-RIGHT while the compact pill nav is bottom-
   CENTRE, so they never overlap.
================================================================ */

// International format: Egypt (+20), leading 0 dropped → 201018653801.
const WHATSAPP_HREF = 'https://wa.me/201018653801'

export default function WhatsAppButton() {
  return (
    <a
      className="wa-fab"
      href={WHATSAPP_HREF}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
    >
      <svg
        className="wa-fab__icon"
        viewBox="0 0 32 32"
        width="30"
        height="30"
        fill="currentColor"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M16.01 3.2c-7.08 0-12.83 5.74-12.83 12.82 0 2.26.59 4.47 1.72 6.42L3.07 28.8l6.53-1.71a12.8 12.8 0 0 0 6.4 1.63h.01c7.07 0 12.82-5.74 12.82-12.82 0-3.42-1.33-6.64-3.75-9.06A12.74 12.74 0 0 0 16.01 3.2zm0 23.42h-.01a10.65 10.65 0 0 1-5.42-1.48l-.39-.23-4.03 1.06 1.08-3.93-.25-.4a10.6 10.6 0 0 1-1.63-5.66c0-5.88 4.79-10.66 10.67-10.66 2.85 0 5.52 1.11 7.53 3.13a10.6 10.6 0 0 1 3.12 7.54c0 5.88-4.78 10.63-10.67 10.63z" />
        <path d="M21.86 18.78c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51-.17-.01-.37-.01-.57-.01-.2 0-.52.07-.8.37-.27.3-1.05 1.02-1.05 2.49 0 1.47 1.07 2.89 1.22 3.09.15.2 2.11 3.22 5.11 4.51.71.31 1.27.49 1.7.63.72.23 1.37.2 1.88.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35z" />
      </svg>
    </a>
  )
}
