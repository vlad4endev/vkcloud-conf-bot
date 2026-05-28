export function CrossDecor({
  className = "",
}: {
  className?: string;
}) {
  return (
    <span
      className={`pointer-events-none select-none font-mono text-sm text-white/15 ${className}`}
      aria-hidden
    >
      +
    </span>
  );
}
