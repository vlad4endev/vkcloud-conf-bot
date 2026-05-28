export function VkLogo({ size = 32 }: { size?: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-sm bg-[#1E6DFF] font-[family-name:var(--font-unbounded)] text-xs font-bold text-white"
      style={{ width: size, height: size }}
      aria-hidden
    >
      vk
    </span>
  );
}
