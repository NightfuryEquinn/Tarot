"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useLanguage } from "./Language";
import { localizedCards, getCard, themeName, suitNames } from "@/lib/locale";
import { type TarotCard } from "@/data/cards";
import { Icon } from "./Icon";
import {
  eyebrow,
  iconButton,
  keywords,
  practicalNote,
  sectionWidth,
  secondary,
} from "./ui";

const categories = [
  ["all", "All cards"],
  ["major", "Major Arcana"],
  ["wands", "Wands"],
  ["cups", "Cups"],
  ["swords", "Swords"],
  ["pentacles", "Pentacles"],
] as const;
export function CardLibrary() {
  const { locale, t, copy } = useLanguage();
  const deck = localizedCards[locale];
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [cardId, setCardId] = useState<string | null>(null);
  const card = cardId ? getCard(cardId, locale) : null;
  const [reversed, setReversed] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const arcana = new URLSearchParams(location.search).get("arcana");
    if (arcana === "major" || arcana === "minor") setCategory(arcana);
  }, []);
  const filtered = useMemo(
    () =>
      deck.filter(
        (c) =>
          (category === "all" ||
            c.arcana === category ||
            c.suit === category) &&
          `${c.name} ${c.upright.keywords.join(" ")} ${c.reversed.keywords.join(" ")} ${getCard(c.id, "en").name} ${getCard(c.id, "zh-CN").name} ${getCard(c.id, "en").upright.keywords.join(" ")} ${getCard(c.id, "zh-CN").upright.keywords.join(" ")} ${getCard(c.id, "en").reversed.keywords.join(" ")} ${getCard(c.id, "zh-CN").reversed.keywords.join(" ")}`
            .toLowerCase()
            .includes(query.trim().toLowerCase()),
      ),
    [category, query, deck],
  );
  const open = (item: TarotCard) => {
    setCardId(item.id);
    setReversed(false);
    dialog.current?.showModal();
  };
  const meaning = card ? (reversed ? card.reversed : card.upright) : null;
  return (
    <main id="main" className={`${sectionWidth} py-12 sm:py-20`}>
      <div
        className={
          "relative mb-10 text-center [&>h1]:mt-5 [&>h1]:font-display [&>h1]:text-4xl [&>h1]:leading-[1.05] sm:[&>h1]:text-6xl [&_em]:text-gold [&>p]:mt-6 [&>p]:text-sm [&>p]:leading-7 [&>p]:text-muted"
        }
      >
        <span className={eyebrow}>
          {copy("THE RIDER–WAITE–SMITH COLLECTION")}
        </span>
        <h1>
          {copy("Seventy-eight ways")}
          <br />
          {copy("to see")} <em>{copy("a little differently.")}</em>
        </h1>
        <p>
          {copy("A language of symbols, stories, and everyday life.")}
          <br />
          {copy("Find a card. Follow a feeling. See what opens up.")}
        </p>
        <span className={"mt-7 block text-3xl text-gold/70"}>✧</span>
      </div>
      <div
        className={
          "flex flex-col gap-5 border-y border-line py-5 xl:flex-row xl:items-center xl:justify-between"
        }
      >
        <div
          className={
            "flex flex-wrap gap-1.5 [&_button]:flex [&_button]:min-h-11 [&_button]:items-center [&_button]:gap-2 [&_button]:rounded-sm [&_button]:px-3 [&_button]:text-sm [&_button]:transition-colors [&_span]:text-sm [&_span]:text-gold/60"
          }
          role="group"
          aria-label={copy("Filter cards by arcana or suit")}
        >
          {categories.map(([value, label]) => (
            <button
              key={value}
              className={
                category === value
                  ? "bg-gold/15 text-gold"
                  : "text-muted hover:bg-white/5 hover:text-parchment"
              }
              aria-pressed={category === value}
              onClick={() => setCategory(value)}
            >
              {copy(label)}
              {value === "all" && <span>78</span>}
            </button>
          ))}
          {category === "minor" && (
            <button
              className="bg-gold/15 text-gold"
              aria-pressed="true"
              onClick={() => setCategory("all")}
            >
              {copy("Minor Arcana ×")}
            </button>
          )}
        </div>
        <label
          className={
            "flex min-h-12 items-center gap-3 rounded-sm border border-line bg-ink/70 px-4 text-muted [&>input]:min-w-0 [&>input]:flex-1 [&>input]:bg-transparent [&>input]:py-3 [&>input]:text-base sm:[&>input]:text-sm [&>input]:outline-none xl:w-72"
          }
        >
          <Icon name="search" size={18} />
          <span className="sr-only">
            {copy("Search card names and keywords")}
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={copy("Find a card or a feeling…")}
          />
        </label>
      </div>
      <div
        className={
          "my-7 flex flex-wrap justify-between gap-3 text-sm tracking-[.16em] text-muted"
        }
      >
        <span aria-live="polite">
          {t(
            `${filtered.length} ${filtered.length === 1 ? "CARD" : "CARDS"} TO EXPLORE`,
            `共 ${filtered.length} 张牌，等待探索`,
          )}
        </span>
        <span>{copy("TAP A CARD TO TURN A PAGE")}</span>
      </div>
      <div
        className={
          "grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 sm:gap-x-7 lg:grid-cols-4 xl:grid-cols-6"
        }
      >
        {filtered.map((c) => (
          <button
            className={
              "group flex min-w-0 flex-col items-stretch justify-start text-left [&>h2]:mt-2 [&>h2]:font-display [&>h2]:text-2xl [&>h2]:leading-tight [&>p]:mt-2 [&>p]:text-sm [&>p]:leading-5 [&>p]:text-muted"
            }
            key={c.id}
            onClick={() => open(c)}
          >
            <div
              className={
                "relative overflow-hidden rounded-sm border border-gold/25 bg-panel p-1.5 shadow-xl transition-colors group-hover:border-gold/70 [&>img]:aspect-[3/5] [&>img]:w-full [&>img]:rounded-[1px] [&>img]:object-cover"
              }
            >
              <img
                src={c.image}
                alt=""
                width="480"
                height="800"
                loading="lazy"
              />
              <span
                className={
                  "absolute inset-x-1.5 bottom-1.5 flex min-h-11 items-center justify-center gap-2 bg-ink/95 py-2 text-sm text-gold opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 [@media(hover:none)]:opacity-100"
                }
              >
                <Icon name="book" size={20} /> {copy("Explore meaning")}
              </span>
            </div>
            <span
              className={"mt-4 block text-sm tracking-[.16em] text-gold/80"}
            >
              {c.arcana === "major"
                ? copy("MAJOR ARCANA")
                : locale === "en"
                  ? c.suit?.toUpperCase()
                  : suitNames[c.suit!]}
            </span>
            <h2>{c.name}</h2>
            <p>{c.upright.keywords.slice(0, 2).join(" · ")}</p>
          </button>
        ))}
      </div>
      {!filtered.length && (
        <div
          className={
            "py-20 text-center [&>svg]:mx-auto [&>svg]:text-gold [&>h2]:my-5 [&>h2]:font-display [&>h2]:text-4xl [&>p]:mb-6 [&>p]:text-sm [&>p]:text-muted"
          }
        >
          <Icon name="search" size={32} />
          <h2>{copy("No cards found.")}</h2>
          <p>
            {copy("Try a different name or feeling, or explore the full deck.")}
          </p>
          <button
            className={secondary}
            onClick={() => {
              setQuery("");
              setCategory("all");
            }}
          >
            {copy("Show all cards")}
          </button>
        </div>
      )}
      <section
        className={
          "mt-20 flex flex-col gap-5 border-t border-line pt-10 sm:flex-row sm:gap-8 [&>svg]:shrink-0 [&>svg]:text-gold [&_h2]:mb-4 [&_h2]:font-display [&_h2]:text-3xl [&_p]:max-w-3xl [&_p]:text-sm [&_p]:leading-7 [&_p]:text-muted"
        }
        id="credits"
      >
        <Icon name="sun" size={33} />
        <div>
          <h2>{copy("A century of stories.")}</h2>
          <p>
            {copy(
              "Illustrated by Pamela Colman Smith under the direction of Arthur Edward Waite, the Rider–Waite–Smith deck first appeared in 1909. These original public-domain illustrations are preserved from the Roses & Lilies edition through Wikimedia Commons. Our interpretations are written for reflection, in the language of everyday life.",
            )}
          </p>
          <div
            className={
              "mt-5 flex flex-wrap gap-x-7 gap-y-2 [&>a]:inline-flex [&>a]:min-h-11 [&>a]:items-center [&>a]:gap-2 [&>a]:text-sm [&>a]:text-gold [&>a:hover]:underline"
            }
          >
            <a
              href="https://commons.wikimedia.org/wiki/Category:Rider-Waite_tarot_deck_(Roses_%26_Lilies)"
              target="_blank"
              rel="noreferrer"
            >
              {copy("Artwork & provenance ↗")}
            </a>
            <a href="/cards/sources.json">{copy("Per-card source records")}</a>
            <Link href="/#ritual">
              {copy("Begin a reading")}
              <Icon name="arrow" size={15} />
            </Link>
          </div>
        </div>
      </section>
      <dialog
        ref={dialog}
        className={
          "fixed max-h-[90dvh] w-[calc(100%-2rem)] max-w-4xl overflow-y-auto rounded-lg border border-gold/30 bg-panel p-6 text-parchment shadow-2xl backdrop:bg-ink/85 backdrop:backdrop-blur-sm sm:p-10"
        }
        aria-labelledby="card-details-title"
        onClick={(event) => {
          if (event.target === dialog.current) dialog.current.close();
        }}
      >
        <button
          className={`${iconButton} sticky left-full top-0 z-10 mb-3 bg-panel`}
          aria-label={copy("Close card details")}
          onClick={() => dialog.current?.close()}
        >
          <Icon name="close" />
        </button>
        {card && meaning && (
          <div
            className={
              "grid items-start gap-8 sm:grid-cols-[1fr_1.7fr] sm:gap-10"
            }
          >
            <div
              className={
                "mx-auto w-36 sm:sticky sm:top-0 sm:w-full [&>img]:aspect-[3/5] [&>img]:w-full [&>img]:rounded-sm [&>img]:border [&>img]:border-gold/30 [&>img]:object-cover"
              }
            >
              <img
                src={card.image}
                alt={`${card.name}, ${reversed ? copy("reversed") : copy("upright")}`}
                width="480"
                height="800"
                className={reversed ? "rotate-180" : ""}
              />
            </div>
            <div
              className={
                "min-w-0 [&>h2]:my-4 [&>h2]:font-display [&>h2]:text-4xl [&>p]:text-sm [&>p]:leading-7 [&>p]:text-muted"
              }
            >
              <span className={eyebrow}>
                {card.arcana === "major"
                  ? `${t("MAJOR ARCANA", "大阿尔卡那")} · ${card.number}`
                  : `${t("MINOR ARCANA", "小阿尔卡那")} · ${locale === "en" ? card.suit?.toUpperCase() : suitNames[card.suit!]}`}
              </span>
              <h2 id="card-details-title">{card.name}</h2>
              <div
                className={
                  "my-5 flex gap-2 [&>button]:min-h-11 [&>button]:rounded-sm [&>button]:border [&>button]:px-5 [&>button]:text-sm"
                }
                role="group"
                aria-label={copy("Card orientation")}
              >
                <button
                  aria-pressed={!reversed}
                  className={
                    !reversed
                      ? "border-gold/50 bg-gold/10 text-gold"
                      : "border-line text-muted"
                  }
                  onClick={() => setReversed(false)}
                >
                  {copy("↟ Upright")}
                </button>
                <button
                  aria-pressed={reversed}
                  className={
                    reversed
                      ? "border-gold/50 bg-gold/10 text-gold"
                      : "border-line text-muted"
                  }
                  onClick={() => setReversed(true)}
                >
                  {copy("↧ Reversed")}
                </button>
              </div>
              <div className={keywords}>
                {meaning.keywords.map((k) => (
                  <span key={k}>{k}</span>
                ))}
              </div>
              <p>{meaning.text}</p>
              <div className={practicalNote}>
                <Icon name="star" size={17} />
                <p>
                  <strong>{copy("A thought to take with you")}</strong>
                  {meaning.advice}
                </p>
              </div>
              <div
                className={
                  "border-t border-line pt-5 [&>p]:my-3 [&>p]:text-sm [&>p]:text-muted [&>small]:text-sm [&>small]:leading-6 [&>small]:text-muted"
                }
              >
                <span className={eyebrow}>{copy("THREADS TO LOOK FOR")}</span>
                <p>
                  {meaning.themes
                    .map((theme) => themeName(theme, locale))
                    .join(" · ")}
                </p>
                <small>
                  {copy(
                    "These themes help connect this card with others in a spread.",
                  )}
                </small>
              </div>
            </div>
          </div>
        )}
      </dialog>
    </main>
  );
}
