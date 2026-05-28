const TEXT =
  "ПРОЕКТИРУЕМ БУДУЩЕЕ · АРХИТЕКТОРЫ ЦИФРОВОЙ СРЕДЫ · VK CLOUD CONF'26 · 17 ИЮНЯ · МОСКВА · ";

export function Marquee() {
  const repeated = TEXT.repeat(4);

  return (
    <div className="overflow-hidden border-y border-[#1e6dff]/20 py-3">
      <div className="marquee-track flex w-max whitespace-nowrap">
        <span className="font-mono text-xs uppercase tracking-widest text-[#1e6dff]/70">
          {repeated}
        </span>
        <span
          className="font-mono text-xs uppercase tracking-widest text-[#1e6dff]/70"
          aria-hidden
        >
          {repeated}
        </span>
      </div>
    </div>
  );
}
