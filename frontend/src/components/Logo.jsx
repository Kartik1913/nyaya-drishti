/**
 * Vector "Eye of Justice" mark — scales of justice fused with a watchful eye.
 * Transparent background so it drops cleanly onto light or dark surfaces.
 * `variant="mark"` renders just the icon; `variant="full"` adds the wordmark.
 */
export default function Logo({ className = "h-9 w-9", variant = "mark", title = "Nyaya-Drishti" }) {
  const mark = (
    <svg
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label={title}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="nd-navy" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#13243A" />
          <stop offset="100%" stopColor="#0B1628" />
        </linearGradient>
        <linearGradient id="nd-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#D6C08C" />
          <stop offset="100%" stopColor="#8A7240" />
        </linearGradient>
        <radialGradient id="nd-iris" cx="35%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#D6C08C" />
          <stop offset="100%" stopColor="#0B1628" />
        </radialGradient>
      </defs>

      {/* Beam + post */}
      <path
        d="M32 7v6.5M13 19.5h38M32 44.5v9.5M23.5 54h17"
        stroke="url(#nd-navy)"
        strokeWidth="3.2"
        strokeLinecap="round"
        fill="none"
      />
      {/* Left pan */}
      <path
        d="M8.5 19.5l-4.5 11.5a8.5 8.5 0 0 0 17 0l-4.5-11.5"
        stroke="url(#nd-gold)"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Right pan */}
      <path
        d="M46 19.5l-4.5 11.5a8.5 8.5 0 0 0 17 0l-4.5-11.5"
        stroke="url(#nd-gold)"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Fulcrum cap */}
      <circle cx="32" cy="15.5" r="3" fill="url(#nd-gold)" />

      {/* Eye — sits on the beam, all-seeing oversight */}
      <path
        d="M17.5 27c5.8-6.6 23.2-6.6 29 0-5.8 6.6-23.2 6.6-29 0Z"
        fill="url(#nd-navy)"
      />
      <circle cx="32" cy="27" r="6" fill="url(#nd-iris)" stroke="#D6C08C" strokeWidth="1.3" />
      <circle cx="33.8" cy="25" r="1.4" fill="#fff" opacity="0.9" />
    </svg>
  );

  if (variant === "mark") return mark;

  return (
    <div className="flex items-center gap-2.5">
      {mark}
      <span className="font-headline-md font-bold tracking-tight leading-none">
        Nyaya<span className="text-[0.9em] opacity-70">-</span>Drishti
      </span>
    </div>
  );
}
