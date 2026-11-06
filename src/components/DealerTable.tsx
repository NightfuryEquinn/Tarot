"use client";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { animate, createScope, stagger } from "animejs";
import { adjacentCard, fanColumns, fanLayout } from "@/lib/dealer";
import { getPositions, type DrawnCard } from "@/lib/reading";
import { useLanguage } from "./Language";
import { CardBack } from "./CardBack";
import { Icon } from "./Icon";
import { eyebrow } from "./ui";

type Props = {
  deck: DrawnCard[];
  selected: number[];
  active: boolean;
  reduced: boolean;
  onDealComplete: () => void;
  onPick: (index: number) => void;
};
export function DealerTable({
  deck,
  selected,
  active,
  reduced,
  onDealComplete,
  onPick,
}: Props) {
  const { t, locale } = useLanguage();
  const positions = getPositions(locale);
  const [size, setSize] = useState({ width: 320, height: 240 }),
    [keyboard, setKeyboard] = useState(0);
  const columns = fanColumns(size.width);
  const root = useRef<HTMLDivElement>(null),
    fans = useRef<HTMLDivElement>(null),
    buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const keyboardPick = useRef(false),
    finish = useRef(onDealComplete);
  finish.current = onDealComplete;
  const first = deck.findIndex((_, i) => !selected.includes(i));
  const tabStop = selected.includes(keyboard) ? first : keyboard;
  useEffect(() => {
    const element = fans.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize((previous) =>
        previous.width === width && previous.height === height
          ? previous
          : { width, height },
      );
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (active) return;
    if (reduced) {
      finish.current();
      return;
    }
    const scope = createScope({ root }).add(() => {
      animate("[data-deck-art]", {
        opacity: [0, 1],
        translateY: [32, 0],
        rotate: [-12, 0],
        scale: [0.8, 1],
        delay: stagger(12),
        duration: 800,
        ease: "out(4)",
        onComplete: () => finish.current(),
      });
    });
    // Reading can always advance even if the animation is interrupted or throttled.
    const timer = setTimeout(() => finish.current(), 2400);
    return () => {
      clearTimeout(timer);
      scope.revert();
    };
  }, [active, reduced]);
  useEffect(() => {
    if (keyboardPick.current && first >= 0 && selected.length < 5) {
      keyboardPick.current = false;
      setKeyboard(first);
      buttons.current[first]?.focus({ preventScroll: true });
    }
  }, [first, selected.length]);
  useEffect(() => {
    if (!selected.length || reduced) return;
    const el = root.current?.querySelector(
      `[data-slot="${selected.length - 1}"]`,
    );
    if (!el) return;
    const source = root.current?.querySelector<HTMLElement>(`[data-card-index="${selected[selected.length - 1]}"] [data-deck-art]`);
    const from = source?.getBoundingClientRect();
    const to = el.getBoundingClientRect();
    let flight: ReturnType<typeof animate> | undefined;
    let ghost: HTMLElement | undefined;
    if (source && from && from.width > 0 && to.width > 0) {
      ghost = source.cloneNode(true) as HTMLElement;
      ghost.removeAttribute("data-deck-art");
      ghost.setAttribute("aria-hidden", "true");
      Object.assign(ghost.style, {
        position: "fixed", left: `${from.left}px`, top: `${from.top}px`,
        width: `${from.width}px`, height: `${from.height}px`,
        pointerEvents: "none", zIndex: "40", transformOrigin: "top left",
      });
      document.body.appendChild(ghost);
      flight = animate(ghost, {
        translateX: [0, to.left - from.left], translateY: [0, to.top - from.top],
        scaleX: [1, to.width / from.width], scaleY: [1, to.height / from.height],
        opacity: [1, 0.3], duration: 400, ease: "inOut(3)",
        onComplete: () => ghost?.remove(),
      });
    }
    const animation = animate(el, {
      opacity: [0, 1],
      translateY: [-12, 0],
      scale: [0.88, 1],
      duration: 400,
      ease: "out(3)",
    });
    return () => {
      animation.revert();
      flight?.cancel();
      ghost?.remove();
    };
  }, [selected.length, reduced]);
  return (
    <div ref={root} className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col">
      <div className="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 text-sm text-muted">
        <span>{t("THE COMPLETE DECK · 78 CARDS", "完整牌组 · 78 张牌")}</span>
        <span>
          {t("All in view · Tap to choose", "全部呈现 · 轻触选择")}
        </span>
      </div>
      <div
        ref={fans}
        data-card-fans
        role="group"
        aria-label={t(
          "All 78 face-down cards. Use arrow keys to explore and Enter or Space to choose.",
          "全部78张背面朝上的牌。使用方向键浏览，按回车键或空格键选择。",
        )}
        aria-busy={!active}
        className="relative isolate min-h-[clamp(12rem,35dvh,28rem)] flex-1 rounded-lg border border-line bg-ink/45"
      >
        {deck.map((item, index) => {
          const chosen = selected.includes(index);
          const position = fanLayout(index, columns, size.width, size.height);
          return (
            <button
              key={item.id}
              ref={(el) => {
                buttons.current[index] = el;
              }}
              data-card-index={index}
              style={{
                "--card-x": `${position.x}px`,
                "--card-top": `${position.row * position.rowHeight}px`,
                "--card-y": `${position.y}px`,
                "--row-height": `${position.rowHeight}px`,
                "--card-width": `${position.width}px`,
                "--card-height": `${position.height}px`,
                "--hit-width": `${position.hitWidth}px`,
                "--card-angle": `${position.angle}deg`,
              } as CSSProperties}
              className="group absolute left-[var(--card-x)] top-[var(--card-top)] h-[var(--row-height)] w-[var(--hit-width)] -translate-x-1/2 rounded-sm focus-visible:z-10 focus-visible:outline-offset-0"
              aria-label={
                chosen
                  ? t(`Card ${index + 1} chosen`, `第${index + 1}张牌已选择`)
                  : t(
                      `Choose face-down card ${index + 1}`,
                      `选择第${index + 1}张牌`,
                    )
              }
              disabled={!active || chosen || selected.length === 5}
              tabIndex={index === tabStop ? 0 : -1}
              onClick={(event) => {
                keyboardPick.current = event.detail === 0;
                setKeyboard(index);
                onPick(index);
              }}
              onKeyDown={(event) => {
                if (
                  [
                    "ArrowLeft",
                    "ArrowRight",
                    "ArrowUp",
                    "ArrowDown",
                    "Home",
                    "End",
                  ].includes(event.key)
                ) {
                  event.preventDefault();
                  const next = adjacentCard(
                    index,
                    event.key,
                    columns,
                    selected,
                  );
                  setKeyboard(next);
                  buttons.current[next]?.focus({ preventScroll: true });
                }
              }}
            >
              <span className="pointer-events-none absolute left-1/2 top-[var(--card-y)] h-[var(--card-height)] w-[var(--card-width)] -translate-x-1/2 -translate-y-1/2 rotate-[var(--card-angle)] rounded-sm">
                <span className={`block size-full rounded-sm ${chosen ? "opacity-15" : "group-hover:brightness-125 group-focus-visible:brightness-125"}`}>
                  <span data-deck-art className="block size-full rounded-sm shadow-lg">
                    <CardBack compact />
                  </span>
                </span>
                {chosen && <span className="absolute inset-0 flex items-center justify-center text-gold/70"><Icon name="check" size={14} /></span>}
              </span>
            </button>
          );
        })}
      </div>
      <div className="mt-2 flex shrink-0 items-center justify-between gap-3">
        <span className={eyebrow}>{t("YOUR SPREAD", "你的牌阵")}</span>
        <p aria-live="polite" className="text-sm text-gold">
          {t(
            `${selected.length} of 5 chosen`,
            `已选择 ${selected.length} / 5 张牌`,
          )}
        </p>
      </div>
      <div
        role="group"
        aria-label={t("Your five chosen cards", "你选择的五张牌")}
        className="mt-2 grid shrink-0 grid-cols-5 gap-2 sm:gap-5"
      >
        {positions.map((position, i) => (
          <div key={i} className="min-w-0 text-center">
            <div
              className={`mx-auto flex aspect-[3/4] h-[clamp(1.25rem,6dvh,3rem)] items-center justify-center rounded-sm border ${selected[i] !== undefined ? "border-transparent" : "border-dashed border-gold/25 bg-gold/[0.025]"}`}
            >
              {selected[i] !== undefined ? (
                <span data-slot={i} className="block size-full rounded-sm">
                  <CardBack compact />
                </span>
              ) : (
                <span className="font-display text-2xl text-gold/35">
                  {String(i + 1).padStart(2, "0")}
                </span>
              )}
            </div>
            <span title={position.label} className="mt-2 block text-sm leading-5 text-muted [overflow-wrap:anywhere]">
              {position.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
