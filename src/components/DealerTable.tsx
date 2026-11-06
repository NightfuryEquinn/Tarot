"use client";
import { useEffect, useRef, useState } from "react";
import { animate, createScope, stagger } from "animejs";
import { adjacentCard } from "@/lib/dealer";
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
  const [columns, setColumns] = useState(6),
    [keyboard, setKeyboard] = useState(0);
  const root = useRef<HTMLDivElement>(null),
    buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const keyboardPick = useRef(false),
    finish = useRef(onDealComplete);
  finish.current = onDealComplete;
  const first = deck.findIndex((_, i) => !selected.includes(i));
  const tabStop = selected.includes(keyboard) ? first : keyboard;
  useEffect(() => {
    const sync = () =>
      setColumns(
        innerWidth < 390
          ? 5
          : innerWidth < 640
            ? 6
            : innerWidth < 1024
              ? 8
              : 13,
      );
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
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
      buttons.current[first]?.scrollIntoView({ block: "nearest" });
    }
  }, [first, selected.length]);
  useEffect(() => {
    if (!selected.length || reduced) return;
    const el = root.current?.querySelector(
      `[data-slot="${selected.length - 1}"]`,
    );
    if (!el) return;
    const animation = animate(el, {
      opacity: [0, 1],
      translateY: [-12, 0],
      scale: [0.88, 1],
      duration: 400,
      ease: "out(3)",
    });
    return () => {
      animation.revert();
    };
  }, [selected.length, reduced]);
  return (
    <div ref={root} className="mx-auto w-full max-w-5xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-[10px] tracking-wider text-muted">
        <span>{t("THE COMPLETE DECK · 78 CARDS", "完整牌组 · 78 张牌")}</span>
        <span>
          {t("Scroll to explore · Tap to choose", "滚动探索 · 轻触选择")}
        </span>
      </div>
      <div
        role="group"
        aria-label={t(
          "All 78 face-down cards. Use arrow keys to explore and Enter or Space to choose.",
          "全部78张背面朝上的牌。使用方向键浏览，按回车键或空格键选择。",
        )}
        aria-busy={!active}
        className="grid max-h-[360px] grid-cols-5 gap-2 overflow-y-auto overscroll-contain rounded-lg border border-line bg-ink/45 p-3 [scrollbar-color:#6b604e_#111927] min-[360px]:gap-2.5 min-[390px]:grid-cols-6 sm:max-h-[440px] sm:grid-cols-8 sm:gap-3 sm:p-5 lg:grid-cols-13"
      >
        {deck.map((item, index) => {
          const chosen = selected.includes(index);
          return (
            <button
              key={item.id}
              ref={(el) => {
                buttons.current[index] = el;
              }}
              data-card-index={index}
              className={`group relative aspect-[3/4.5] min-h-11 min-w-11 rounded-sm p-0.5 ${chosen ? "border border-dashed border-gold/20" : "hover:z-10 focus-visible:z-10"}`}
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
                  buttons.current[next]?.scrollIntoView({ block: "nearest" });
                }
              }}
            >
              {chosen ? (
                <span className="absolute inset-0 flex items-center justify-center text-gold/60">
                  <Icon name="check" size={18} />
                </span>
              ) : (
                <span
                  data-deck-art
                  className="block size-full rounded-sm motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-hover:-translate-y-1 motion-safe:group-focus-visible:-translate-y-1 group-hover:brightness-125 group-focus-visible:brightness-125"
                >
                  <CardBack compact />
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div className="mt-7 flex items-center justify-between gap-3">
        <span className={eyebrow}>{t("YOUR SPREAD", "你的牌阵")}</span>
        <p aria-live="polite" className="text-xs text-gold">
          {t(
            `${selected.length} of 5 chosen`,
            `已选择 ${selected.length} / 5 张牌`,
          )}
        </p>
      </div>
      <div
        role="group"
        aria-label={t("Your five chosen cards", "你选择的五张牌")}
        className="mt-4 grid grid-cols-5 gap-2 sm:gap-5"
      >
        {positions.map((position, i) => (
          <div key={i} className="text-center">
            <div
              className={`mx-auto flex aspect-[3/4] w-full max-w-20 items-center justify-center rounded-sm border ${selected[i] !== undefined ? "border-transparent" : "border-dashed border-gold/25 bg-gold/[0.025]"}`}
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
            <span className="mt-2 block text-[9px] leading-4 text-muted sm:text-[11px]">
              {position.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
