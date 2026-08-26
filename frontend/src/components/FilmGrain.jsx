/**
 * Animated film-grain overlay. Drop it inside a dark section (absolutely
 * positioned, non-interactive) to give flat navy a faint, living texture —
 * the cheapest high-end trick for making a solid fill read as cinematic
 * rather than dead. The noise is an inline SVG feTurbulence data-URI, so
 * there's no external asset and no payload beyond a few bytes of markup.
 *
 * Respects reduced motion by simply not animating (the static grain is still
 * fine, and very subtle).
 */

const NOISE =
  "data:image/svg+xml," +
  encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>"
  );

export default function FilmGrain({ opacity = 0.06, className = "" }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 animate-grain motion-reduce:animate-none ${className}`}
      style={{
        backgroundImage: `url("${NOISE}")`,
        backgroundSize: "140px 140px",
        opacity,
        mixBlendMode: "overlay",
      }}
    />
  );
}
