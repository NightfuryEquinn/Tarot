"use client";
import { useEffect, useRef } from "react";
import { animate, createScope, stagger } from "animejs";
import { CardBack } from "./CardBack";

export function OracleArtwork({ reduced }: { reduced: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (reduced || !root.current) return;
    const scope = createScope({ root }).add(() => {
      animate("[data-oracle-card]", {
        opacity: [0, 1],
        translateY: [28, 0],
        duration: 1300,
        delay: stagger(160),
        ease: "out(4)",
      });
      animate("[data-orbit]", {
        rotate: [0, 360],
        duration: 180000,
        loop: true,
        ease: "linear",
      });
      animate("[data-oracle-float]", {
        translateY: [-5, 5],
        duration: 3800,
        alternate: true,
        loop: true,
        ease: "inOutSine",
      });
    });
    return () => scope.revert();
  }, [reduced]);
  return (
    <div
      ref={root}
      aria-hidden="true"
      className="relative mx-auto aspect-square w-full max-w-[600px] select-none"
    >
      <div className="absolute inset-[1%] rounded-full border border-gold/10" />
      <div className="absolute inset-[7%] rounded-full border border-gold/20" />
      <div className="absolute inset-[9%] rounded-full border border-dashed border-gold/10" />
      <div className="absolute inset-[20%] rounded-full bg-gold/[0.035] blur-3xl" />
      <div data-orbit className="absolute inset-[7%] rounded-full">
        <span className="absolute left-1/2 top-0 size-1.5 -translate-y-1/2 rounded-full bg-gold shadow-[0_0_18px_#e8c995]" />
        <span className="absolute bottom-[15%] right-[15%] text-gold/70">
          ✧
        </span>
      </div>
      <div className="absolute left-1/2 top-[3%] -translate-x-1/2 bg-ink px-3 font-display text-xl text-gold/70">
        ☽
      </div>
      <span className="absolute left-[2%] top-1/2 -translate-y-1/2 bg-ink py-3 text-gold/70">
        ✦
      </span>
      <span className="absolute right-[2%] top-1/2 -translate-y-1/2 bg-ink py-3 text-gold/70">
        ✦
      </span>
      <div data-oracle-float className="absolute inset-0">
        <div className="absolute left-[14%] top-[28%] aspect-[3/5] w-[29%] -rotate-[19deg]">
          <div data-oracle-card className="size-full rounded-lg shadow-2xl">
            <CardBack />
          </div>
        </div>
        <div className="absolute right-[14%] top-[28%] aspect-[3/5] w-[29%] rotate-[19deg]">
          <div data-oracle-card className="size-full rounded-lg shadow-2xl">
            <CardBack />
          </div>
        </div>
        <div className="absolute left-1/2 top-[20%] aspect-[3/5] w-[33%] -translate-x-1/2">
          <div
            data-oracle-card
            className="size-full rounded-lg shadow-[0_20px_65px_#000a,0_0_50px_#d8b88612]"
          >
            <CardBack />
          </div>
        </div>
      </div>
      <span className="absolute bottom-[9%] left-1/2 -translate-x-1/2 font-display text-xl text-gold/60">
        ✧
      </span>
    </div>
  );
}
