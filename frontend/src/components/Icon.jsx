/**
 * Thin wrapper around a Material Symbols Outlined glyph.
 * `filled` toggles the FILL axis, used for active nav items / status glyphs.
 */
export default function Icon({ name, className = "", filled = false, size }) {
  const style = {
    ...(filled ? { fontVariationSettings: "'FILL' 1" } : {}),
    ...(size ? { fontSize: size } : {}),
  };

  return (
    <span className={`material-symbols-outlined ${className}`} style={style} aria-hidden="true">
      {name}
    </span>
  );
}
