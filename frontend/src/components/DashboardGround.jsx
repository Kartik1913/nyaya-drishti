import Logo from "./Logo.jsx";

/**
 * Ambient "spatial ground" for the dashboard: a very faint radial warm glow,
 * a hairline grid at ~3% opacity, and a large watermark logo bottom-right at
 * ~4% opacity. Sits behind everything (z-0, pointer-events-none) so it never
 * fights with the KPIs, charts, or hover targets — it just gives the surface
 * a sense of "premium graph paper" instead of flat ivory.
 *
 * Absolutely no photography, colour gradients, or textures — those look great
 * in isolation and terrible under a data grid.
 */
export default function DashboardGround() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
    >
      {/* Warm radial glow, near-white centre → ivory edges. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 65% 55% at 30% 20%, rgba(255,252,244,0.9) 0%, rgba(246,243,237,0) 60%)",
        }}
      />
      {/* Hairline grid — 32px squares in a very faint navy. */}
      <div
        className="absolute inset-0 opacity-[0.045]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #0B1628 1px, transparent 1px), linear-gradient(to bottom, #0B1628 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          maskImage:
            "radial-gradient(ellipse 80% 80% at 50% 40%, black 60%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 80% at 50% 40%, black 60%, transparent 100%)",
        }}
      />
      {/* Corner watermark — the brand mark, huge, at ~4%. */}
      <div className="absolute -bottom-16 -right-16 opacity-[0.04] rotate-[-8deg]">
        <Logo variant="mark" className="w-[420px] h-[420px]" />
      </div>
      {/* A single soft gold accent along the top edge, so the dashboard
          picks up the same warm signature as the rest of the brand. */}
      <div
        className="absolute top-0 left-0 right-0 h-24"
        style={{
          background:
            "linear-gradient(to bottom, rgba(184,155,94,0.06), transparent)",
        }}
      />
    </div>
  );
}
