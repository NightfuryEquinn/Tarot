"use client";

import { useEffect, useRef } from "react";
import { animate, createScope, stagger } from "animejs";
import { CardBack } from "./CardBack";

/** Decorative backs only; the real, immutable deck is committed on Stop. */
export function ShuffleDeck({ reduced, reversals }: { reduced: boolean; reversals: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (reduced) return;
    let stopListening = () => {};
    const scope = createScope({ root }).add(() => {
      const cards = root.current!.querySelectorAll<HTMLElement>("[data-shuffle-card]");
      const motions = [...cards].map((card, i) => animate(card, {
        translateX: [{ to: (i % 2 ? 1 : -1) * 72 }, { to: 0 }],
        translateY: [{ to: -32 - i * 7 }, { to: i * -2 }],
        rotate: [{ to: (i % 2 ? 1 : -1) * 16 }, { to: 0 }],
        duration: 1700,
        delay: i * 70,
        loop: true,
        ease: "inOut(3)",
      }));
      const turn = reversals ? animate("[data-shuffle-turn]", {
        rotate: [{ to: 180 }, { to: 360 }],
        duration: 3400,
        delay: stagger(140),
        loop: true,
        ease: "inOut(3)",
      }) : null;
      const visibility = () => {
        if (document.hidden) { motions.forEach(motion => motion.pause()); turn?.pause(); }
        else { motions.forEach(motion => motion.resume()); turn?.resume(); }
      };
      visibility();
      document.addEventListener("visibilitychange", visibility);
      stopListening = () => document.removeEventListener("visibilitychange", visibility);
    });
    return () => { stopListening(); scope.revert(); };
  }, [reduced, reversals]);
  return (
    <div ref={root} aria-hidden="true" className="relative mx-auto my-8 h-64 w-full max-w-sm [perspective:1000px]">
      {Array.from({ length: 7 }, (_, i) => (
        <div key={i} className="absolute left-1/2 top-8 -translate-x-1/2">
          <div data-shuffle-card style={{ transform: `translateY(${-i * 2}px)` }} className="h-48 w-[7.2rem] rounded-md shadow-xl">
            <div data-shuffle-turn className="size-full rounded-md"><CardBack /></div>
          </div>
        </div>
      ))}
    </div>
  );
}
