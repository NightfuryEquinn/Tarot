"use client";
import { type SpreadContext } from '@/lib/spreads';
import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";
import { animate, createScope, stagger } from "animejs";
import { useLanguage } from "./Language";
import { getCard } from "@/lib/locale";
import { Icon } from "./Icon";
import {
  eyebrow,
  keywords,
  practicalNote,
  sectionWidth,
  textButton,
} from "./ui";
import {
  buildReading,
  meaningFor,
  getPositions,
  type DrawnCard,
} from "@/lib/reading";
export function ReadingReport({
  spread={},
  draws,
  question = "",
  reduced = true,
  onRestart,
}: {
  spread?: SpreadContext;
  draws: DrawnCard[];
  question?: string;
  reduced?: boolean;
  onRestart: () => void;
}) {
  const { locale, t, copy } = useLanguage(),
    positions = getPositions(locale,spread);
  const reading = useMemo(() => buildReading(draws, question, locale, spread), [draws, question, locale, spread]);
  const { connections } = reading;
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    if (reduced) return;
    const scope = createScope({ root }).add(() => {
      animate("[data-report-enter]", {
        opacity: [0, 1], translateY: [12, 0], duration: 500,
        delay: stagger(80), ease: "out(3)",
      });
    });
    return () => scope.revert();
  }, [reduced]);
  useEffect(() => {
    document.getElementById("reading")?.focus({ preventScroll: true });
    if (location.hash === "#about")
      document.getElementById("about")?.scrollIntoView();
  }, []);
  return (
    <main ref={root} id="main" className={"py-12 sm:py-20"}>
      <section
        className={`${sectionWidth} outline-none [&>h2]:mb-10 [&>h2]:mt-4 [&>h2]:font-display [&>h2]:text-4xl [&>h2]:leading-tight sm:[&>h2]:text-6xl [&_em]:text-gold`}
        id="reading"
        tabIndex={-1}
      >
        <span className={eyebrow}>{copy("02 / YOUR READING")}</span>
        <h1 className="mb-10 mt-4 font-display text-4xl leading-tight sm:text-6xl">
          {copy("The threads")} <em>{copy("between the cards.")}</em>
        </h1>
        <div data-report-enter className="mb-8 max-w-3xl space-y-3">
          {question.trim() && <blockquote className="break-words font-display text-2xl italic text-parchment">“{question}”</blockquote>}
          <p className="text-sm text-gold">{t("Reading focus", "解读视角")}: {reading.context.name}</p>
          <p className="text-sm leading-7 text-muted">
            {t("Your question gives a focus for this reading. Read each card through its position and whether it is upright or reversed, then see how the cards connect.", "你的问题为这次解读提供了重心。先结合牌位与正逆位理解每张牌，再看看牌与牌之间如何呼应。")}
          </p>
        </div>
        <div
          data-report-enter
          className={
            "flex flex-col items-start gap-4 rounded-sm border-y border-line bg-gold/[0.03] p-6 sm:flex-row sm:gap-6 sm:p-8 [&>svg]:shrink-0 [&>svg]:text-gold [&_p]:mt-4 [&_p]:font-display [&_p]:text-2xl [&_p]:leading-relaxed"
          }
        >
          <Icon name="sun" size={35} />
          <div>
            <span className={eyebrow}>{copy("THE STORY OF YOUR SPREAD")}</span>
            <p>{reading.summary}</p>
          </div>
        </div>
        {reading.quarters.length > 0 && <section className="my-8 grid gap-5 md:grid-cols-2" aria-label={t('The year in four chapters','一年的四个阶段')}>
          {reading.quarters.map(q=><article key={q.title} className="rounded border border-line bg-panel/50 p-5">
            <h3 className="font-display text-2xl text-gold">{q.title}</h3>
            <p className="mt-3 text-sm leading-7 text-muted">{q.text}</p>
            {q.themes.length>0&&<p className="mt-3 text-sm text-gold">{t('Recurring themes','反复出现的主题')}: {q.themes.join(' · ')}</p>}
          </article>)}
        </section>}
        <div className={"mt-8 grid gap-6 lg:grid-cols-3"}>
          {connections.map((connection, i) => (
            <article
              data-report-enter
              className={
                "relative rounded-sm border border-line bg-panel/50 p-6 sm:p-8 [&>h3]:mb-4 [&>h3]:mt-5 [&>h3]:font-display [&>h3]:text-3xl [&>p]:text-sm [&>p]:leading-7 [&>p]:text-muted"
              }
              key={connection.ids.join("-")}
            >
              <span
                className={"mb-5 flex justify-between text-sm text-gold/65"}
              >
                {String(i + 1).padStart(2,'0')} <Icon name="star" size={14} />
              </span>
              {connection.kind !== "tension" && connection.relations.includes("tension") && (
                <span className="mt-2 block text-sm text-gold">{copy("A USEFUL TENSION")}</span>
              )}
              <span className={eyebrow}>
                {connection.kind === "bridge"
                  ? copy("MAJOR MEETS MINOR")
                  : connection.kind === "tension"
                    ? copy("A USEFUL TENSION")
                    : connection.kind === "resonance"
                      ? copy("A SHARED THREAD")
                      : copy("ACROSS THE SPREAD")}
              </span>
              <h3>{connection.title}</h3>
              <p>{connection.text}</p>
            </article>
          ))}
        </div>
        <div className={"mt-14"}>
          {draws.map((draw, i) => {
            const card = getCard(draw.id, locale),
              meaning = meaningFor(draw, locale);
            const interpretation = reading.cards[i];
            return (
              <article
                className={
                  "grid items-start gap-7 border-b border-line py-10 sm:grid-cols-[150px_1fr] sm:gap-10 lg:grid-cols-[200px_1fr] lg:gap-16 lg:py-14"
                }
                key={draw.id}
              >
                <div
                  className={
                    "mx-auto w-32 sm:sticky sm:top-8 sm:w-full [&>img]:aspect-[3/5] [&>img]:w-full [&>img]:rounded-sm [&>img]:border [&>img]:border-gold/30 [&>img]:object-cover [&>img]:shadow-xl"
                  }
                >
                  <img
                    src={card.image}
                    alt={`${card.name}, ${draw.reversed ? copy("reversed") : copy("upright")}`}
                    width="480"
                    height="800"
                    className={draw.reversed ? "rotate-180" : ""}
                  />
                </div>
                <div
                  className={
                    "min-w-0 [&>h3]:mt-4 [&>h3]:font-display [&>h3]:text-4xl sm:[&>h3]:text-5xl [&>p]:mt-4 [&>p]:text-sm [&>p]:leading-7 [&>p]:text-muted"
                  }
                >
                  <span className={eyebrow}>
                    {String(i + 1).padStart(2,'0')} / {positions[i].label.toUpperCase()}{" "}
                    <span className={"ml-3 inline-block text-sm text-muted"}>
                      {draw.reversed ? copy("REVERSED") : copy("UPRIGHT")}
                    </span>
                  </span>
                  <h3>{card.name}</h3>
                  <div className={keywords}>
                    {meaning.keywords.map((keyword) => (
                      <span key={keyword}>{keyword}</span>
                    ))}
                  </div>
                  <p
                    className={
                      "font-display text-xl! italic text-parchment/85!"
                    }
                  >
                    {interpretation.explanation}
                  </p>
                  <p>{meaning.text}</p>
                  <p>{interpretation.application}</p>
                  <p>{interpretation.orientation}</p>
                  <div className={practicalNote}>
                    <Icon name="star" size={16} />
                    <p>
                      <strong>{copy("A thought to take with you")}</strong>
                      {meaning.advice}
                    </p>
                  </div>
                  <details
                    className={
                      "mt-5 text-sm leading-7 text-muted [&>summary]:min-h-11 [&>summary]:py-2 [&>summary]:text-gold [&>p]:pt-3 [&>p]:text-sm"
                    }
                  >
                    <summary>
                      {draw.reversed
                        ? t("Explore the upright meaning", "探索正位含义")
                        : t("Explore the reversed meaning", "探索逆位含义")}
                    </summary>
                    <p>{(draw.reversed ? card.upright : card.reversed).text}</p>
                  </details>
                </div>
              </article>
            );
          })}
        </div>
        <div className="mt-10 grid gap-6 border-y border-line bg-gold/[0.025] py-8 sm:grid-cols-2 sm:gap-10">
          <div>
            <h2 className={eyebrow}>{t("ONE NEXT STEP", "下一小步")}</h2>
            <p className="mt-4 text-base leading-7 text-parchment">{reading.nextStep}</p>
            <p className="mt-3 text-sm leading-7 text-muted">{reading.context.lens}</p>
          </div>
          <div>
            <h2 className={eyebrow}>{t("A QUESTION TO KEEP", "留给自己的问题")}</h2>
            <p className="mt-4 text-base leading-7 text-parchment">{reading.reflection}</p>
          </div>
        </div>
        <div
          className={
            "py-16 text-center sm:py-24 [&>span]:text-4xl [&>span]:text-gold [&>h3]:my-7 [&>h3]:font-display [&>h3]:text-3xl [&>h3]:leading-tight sm:[&>h3]:text-5xl"
          }
        >
          <span>✧</span>
          <h3>
            {copy("The cards offer a perspective.")}
            <br />
            <em>{copy("The next step is yours.")}</em>
          </h3>
          <button className={textButton} onClick={onRestart}>
            {copy("Begin another reading")}
            <Icon name="arrow" size={17} />
          </button>
        </div>
      </section>
      <section
        className={`${sectionWidth} border-t border-line pt-12`}
        id="about"
      >
        <div
          className={
            "mb-8 flex flex-wrap items-end justify-between gap-6 [&_h2]:mt-4 [&_h2]:font-display [&_h2]:text-4xl [&_em]:text-gold"
          }
        >
          <div>
            <span className={eyebrow}>{copy("03 / LEARN THE LANGUAGE")}</span>
            <h2>
              {copy("Every card holds")} <em>{copy("a story.")}</em>
            </h2>
          </div>
          <Link href="/cards/" className={textButton}>
            {copy("Explore all 78 cards")}
            <Icon name="arrow" size={17} />
          </Link>
        </div>
        <div className={"grid gap-5 md:grid-cols-3"}>
          <Link
            href="/cards/?arcana=major"
            className={
              "group flex flex-col rounded-sm border border-line bg-gradient-to-br from-gold/5 to-transparent p-7 transition-colors hover:border-gold/50 [&>h3]:mb-3 [&>h3]:mt-5 [&>h3]:font-display [&>h3]:text-3xl [&>p]:text-sm [&>p]:leading-7 [&>p]:text-muted"
            }
          >
            <div className={"mb-8 text-gold/70"}>
              <Icon name="sun" size={51} />
            </div>
            <span className={eyebrow}>
              {copy("22 CARDS · THE LARGER PICTURE")}
            </span>
            <h3>{copy("The Major Arcana")}</h3>
            <p>
              {copy(
                "The turning points. The lessons. The experiences that shape who you’re becoming.",
              )}
            </p>
            <span
              className={
                "mt-auto flex min-h-11 items-center gap-3 pt-6 text-sm text-gold"
              }
            >
              {copy("Meet the archetypes")}
              <Icon name="arrow" size={18} />
            </span>
          </Link>
          <Link
            href="/cards/?arcana=minor"
            className={
              "group flex flex-col rounded-sm border border-line bg-panel/50 p-7 transition-colors hover:border-gold/50 [&>h3]:mb-3 [&>h3]:mt-5 [&>h3]:font-display [&>h3]:text-3xl [&>p]:text-sm [&>p]:leading-7 [&>p]:text-muted"
            }
          >
            <div
              className={
                "mb-8 flex h-[51px] items-center gap-5 text-3xl text-gold/70"
              }
            >
              <span>♧</span>
              <span>♜</span>
              <span>⚔</span>
              <span>◇</span>
            </div>
            <span className={eyebrow}>
              {copy("56 CARDS · THE EVERYDAY DETAILS")}
            </span>
            <h3>{copy("The Minor Arcana")}</h3>
            <p>
              {copy(
                "Our feelings, ideas, ambitions, and earthly lives. Four suits, a world of small revelations.",
              )}
            </p>
            <span
              className={
                "mt-auto flex min-h-11 items-center gap-3 pt-6 text-sm text-gold"
              }
            >
              {copy("Discover the four suits")}
              <Icon name="arrow" size={18} />
            </span>
          </Link>
          <article
            className={
              "rounded-sm border border-line p-7 [&>svg]:mb-8 [&>svg]:text-gold [&>h3]:my-5 [&>h3]:font-display [&>h3]:text-3xl [&>p]:text-sm [&>p]:leading-7 [&>p]:text-muted [&_em]:text-gold"
            }
          >
            <Icon name="moon" size={35} />
            <span className={eyebrow}>{copy("A NOTE ON READING")}</span>
            <h3>
              {copy("A mirror,")}
              <br />
              <em>{copy("with many angles.")}</em>
            </h3>
            <p>
              {copy(
                "Tarot makes space for a different question. You bring the meaning, the context, and the freedom to choose what comes next.",
              )}
            </p>
            <span
              className={"mt-7 block font-display text-lg italic text-gold"}
            >
              {copy("Stay curious. Stay your own.")}
            </span>
          </article>
        </div>
      </section>
      <section
        className={`${sectionWidth} mt-10 [&_summary]:min-h-11 [&_summary]:py-3 [&_summary]:text-sm [&_summary]:text-gold [&_p]:max-w-3xl [&_p]:pt-3 [&_p]:text-sm [&_p]:leading-7 [&_p]:text-muted`}
      >
        <details>
          <summary>{copy("How to read your spread")}</summary>
          <p>
            {copy(
              "Major Arcana cards point to bigger life themes; Minor Arcana cards show how those themes play out in everyday life. Each position gives the card a specific question to answer. Reversed cards suggest energy that is turned inward, delayed, pushed too far, or ready to let go. Read the cards together and keep what helps you.",
            )}
          </p>
        </details>
      </section>
    </main>
  );
}
