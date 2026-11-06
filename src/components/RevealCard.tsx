"use client";
import { useLayoutEffect, useRef } from "react";
import { animate } from "animejs";
import { CardBack } from "./CardBack";

export function RevealCard({
  image,
  reversed,
  revealed,
  reduced,
  skipVersion,
}: {
  image: string;
  reversed: boolean;
  revealed: boolean;
  reduced: boolean;
  skipVersion: number;
}) {
  const inner = useRef<HTMLSpanElement>(null);
  const prior = useRef({ revealed, skipVersion });
  useLayoutEffect(() => {
    const previous = prior.current;
    prior.current = { revealed, skipVersion };
    if (!inner.current) return;
    if (
      reduced ||
      previous.skipVersion !== skipVersion ||
      previous.revealed === revealed
    ) {
      inner.current.style.transform = `rotateY(${revealed ? 180 : 0}deg)`;
      return;
    }
    const animation = animate(inner.current, {
      rotateY: revealed ? [0, 180] : [180, 0],
      duration: 850,
      ease: "inOut(3)",
    });
    return () => {
      animation.cancel();
    };
  }, [revealed, reduced, skipVersion]);
  return (
    <span className="relative block aspect-[3/5] w-full [perspective:1200px]">
      <span
        ref={inner}
        className="relative block size-full [transform-style:preserve-3d]"
        style={{ transform: `rotateY(${revealed ? 180 : 0}deg)` }}
      >
        <span className="absolute inset-0 rounded-md shadow-[0_15px_55px_#0008] [backface-visibility:hidden]">
          <CardBack />
        </span>
        <span className="absolute inset-0 overflow-hidden rounded-md border border-gold/50 bg-panel shadow-[0_15px_55px_#0008] [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <img
            src={image}
            alt=""
            width="480"
            height="800"
            className={`size-full object-cover ${reversed ? "rotate-180" : ""}`}
          />
        </span>
      </span>
    </span>
  );
}
