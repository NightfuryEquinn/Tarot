"use client";
import Link from "next/link";
import { useEffect } from "react";
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
  connectReading,
  meaningFor,
  getPositions,
  summarizeReading,
  type DrawnCard,
} from "@/lib/reading";
export function ReadingReport({
  draws,
  onRestart,
}: {
  draws: DrawnCard[];
  onRestart: () => void;
}) {
  const { locale, t, copy } = useLanguage(),
    positions = getPositions(locale);
  const connections = connectReading(draws, locale);
  useEffect(() => {
    document.getElementById("reading")?.focus({ preventScroll: true });
    if (location.hash === "#about")
      document.getElementById("about")?.scrollIntoView();
  }, []);
  return (
    <main id="main" className={"py-12 sm:py-20"}>
      <section
        className={`${sectionWidth} outline-none [&>h2]:mb-10 [&>h2]:mt-4 [&>h2]:font-display [&>h2]:text-4xl [&>h2]:leading-tight sm:[&>h2]:text-6xl [&_em]:text-gold`}
        id="reading"
        tabIndex={-1}
      >
        <span className={eyebrow}>{copy("02 / YOUR READING")}</span>
        <h1 className="mb-10 mt-4 font-display text-4xl leading-tight sm:text-6xl">
          {copy("The threads")} <em>{copy("between the cards.")}</em>
        </h1>
        <div
          className={
            "flex items-start gap-5 rounded-sm border-y border-line bg-gold/[0.03] px-1 py-7 sm:gap-7 sm:px-7 [&>svg]:shrink-0 [&>svg]:text-gold [&_p]:mt-3 [&_p]:font-display [&_p]:text-2xl [&_p]:leading-relaxed sm:[&_p]:text-3xl"
          }
        >
          <Icon name="sun" size={35} />
          <div>
            <span className={eyebrow}>{copy("THE STORY OF YOUR SPREAD")}</span>
            <p>{summarizeReading(draws, locale)}</p>
          </div>
        </div>
        <div className={"mt-8 grid gap-4 md:grid-cols-2"}>
          {connections.map((connection, i) => (
            <article
              className={
                "relative rounded-sm border border-line bg-panel/50 p-6 sm:p-8 [&>h3]:mb-4 [&>h3]:mt-5 [&>h3]:font-display [&>h3]:text-3xl [&>p]:text-sm [&>p]:leading-7 [&>p]:text-muted"
              }
              key={connection.ids.join("-")}
            >
              <span
                className={"mb-5 flex justify-between text-xs text-gold/65"}
              >
                0{i + 1} <Icon name="star" size={14} />
              </span>
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
                    0{i + 1} / {positions[i].label.toUpperCase()}{" "}
                    <span className={"ml-3 inline-block text-[9px] text-muted"}>
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
                    {t(
                      `${positions[i].context}, this card asks you to consider ${meaning.keywords[0].toLowerCase()}.`,
                      `${positions[i].context}，这张牌邀请你思考「${meaning.keywords[0]}」。`,
                    )}
                  </p>
                  <p>{meaning.text}</p>
                  <div className={practicalNote}>
                    <Icon name="star" size={16} />
                    <p>
                      <strong>{copy("A thought to take with you")}</strong>
                      {meaning.advice}
                    </p>
                  </div>
                  <details
                    className={
                      "mt-5 text-xs leading-7 text-muted [&>summary]:min-h-11 [&>summary]:py-2 [&>summary]:text-gold [&>p]:pt-3 [&>p]:text-sm"
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
                "mt-auto flex min-h-11 items-center gap-3 pt-6 text-xs text-gold"
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
                "mt-auto flex min-h-11 items-center gap-3 pt-6 text-xs text-gold"
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
        className={`${sectionWidth} mt-10 [&_summary]:min-h-11 [&_summary]:py-3 [&_summary]:text-xs [&_summary]:text-gold [&_p]:max-w-3xl [&_p]:pt-3 [&_p]:text-sm [&_p]:leading-7 [&_p]:text-muted`}
      >
        <details>
          <summary>{copy("How to read your spread")}</summary>
          <p>
            {copy(
              "Major Arcana describe larger themes; Minor Arcana bring them into everyday life. The position of each card adds context. Reversals can suggest an inward, blocked, excessive, or releasing expression. Read the connections together, and keep the perspective that helps you.",
            )}
          </p>
        </details>
      </section>
    </main>
  );
}
