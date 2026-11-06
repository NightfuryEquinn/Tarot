/** The entire card back is DOM + Tailwind. No texture, image download, or WebGL. */
export function CardBack({ compact = false }: { compact?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className="relative block size-full overflow-hidden rounded-[inherit] border border-gold/60 bg-[radial-gradient(ellipse_at_50%_35%,#263249_0%,#101a2b_65%,#0b1320_100%)] text-gold shadow-[inset_0_0_24px_#05091080]"
    >
      <span className="absolute inset-[5%] rounded-[2px] border border-gold/40" />
      <span className="absolute inset-[8%] border border-gold/15" />
      <span className="absolute left-1/2 top-[14%] -translate-x-1/2 text-[clamp(6px,1.1vw,15px)]">
        ✦
      </span>
      <span className="absolute bottom-[14%] left-1/2 -translate-x-1/2 text-[clamp(6px,1.1vw,15px)]">
        ✦
      </span>
      <span className="absolute left-1/2 top-1/2 aspect-square w-[62%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-gold/35" />
      <span className="absolute left-1/2 top-1/2 aspect-square w-[46%] -translate-x-1/2 -translate-y-1/2 rotate-45 border border-gold/35" />
      <span className="absolute left-1/2 top-1/2 aspect-square w-[30%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-gold/60 bg-gold/[0.07] shadow-[0_0_18px_#d8b88615]" />
      <span className="absolute left-1/2 top-1/2 aspect-square w-[12%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold shadow-[0_0_16px_#d8b88645]" />
      {!compact && (
        <>
          <span className="absolute left-[14%] top-[12%] h-[76%] w-px bg-gradient-to-b from-transparent via-gold/30 to-transparent" />
          <span className="absolute right-[14%] top-[12%] h-[76%] w-px bg-gradient-to-b from-transparent via-gold/30 to-transparent" />
          <span className="absolute left-[22%] top-[27%] text-[9px] opacity-50">
            ·
          </span>
          <span className="absolute right-[22%] bottom-[27%] text-[9px] opacity-50">
            ·
          </span>
          <span className="absolute left-1/2 top-[9%] h-[10%] w-px bg-gold/30" />
          <span className="absolute bottom-[9%] left-1/2 h-[10%] w-px bg-gold/30" />
        </>
      )}
    </span>
  );
}
