"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { animate, createScope, stagger } from "animejs";
import {
  emptyReading,
  meaningFor,
  getPositions,
  readingReducer,
  restoreReading,
  shuffleDeck,
} from "@/lib/reading";
import { getCard } from "@/lib/locale";
import {
  canTurn,
  nextReveal,
  resumeRitual,
  type RitualStage,
} from "@/lib/cinematic";
import { Ambience } from "@/lib/ambience";
import { Icon } from "./Icon";
import { Brand, Header, Footer } from "./Shell";
import { OfflineStatus } from "./OfflineStatus";
import { ReadingReport } from "./ReadingReport";
import { DealerTable } from "./DealerTable";
import { LanguageSwitch, useLanguage } from "./Language";
import { OracleArtwork } from "./OracleArtwork";
import { RevealCard } from "./RevealCard";
import { ShuffleDeck } from "./ShuffleDeck";
import { spreadCount, spreadIds, spreadName, type SpreadId } from "@/lib/spreads";
import { SpreadDiagram } from "./SpreadDiagram";
import { PositionGuide } from "./PositionGuide";
import { Dropdown } from "./Dropdown";
import type { ReadingTopic } from '@/lib/topics';
import { CelestialBackdrop } from "./CelestialBackdrop";
import {
  dialogStyle,
  eyebrow,
  iconButton,
  primary,
  sectionWidth,
  textButton,
} from "./ui";
export { CardBack } from "./CardBack";
const CelestialScene = dynamic(() => import("./CelestialScene"), {
  ssr: false,
});
const STORAGE_KEY = "midnight-arcana.reading.v2";

export function TarotExperience() {
  const { locale, t } = useLanguage();
  const [state, dispatch] = useReducer(readingReducer, emptyReading);
  const positions = getPositions(locale,state);
  const count=spreadCount(state.spreadId);
  const [stage, setStage] = useState<RitualStage>("question");
  const [focus, setFocus] = useState(0),
    [ready, setReady] = useState(false),
    [report, setReport] = useState(false);
  const [busy, setBusy] = useState(false),
    [skipVersion, setSkipVersion] = useState(0);
  const [reduced, setReduced] = useState(true),
    [simple, setSimple] = useState(false),
    [failed, setFailed] = useState(false);
  const [notice, setNotice] = useState<"storage" | "shuffle" | "sound" | "">(
    "",
  );
  const [resetOpen, setResetOpen] = useState(false),
    [sound, setSound] = useState(false);
  const root = useRef<HTMLElement>(null),
    frame = useRef<HTMLDivElement>(null),
    title = useRef<HTMLHeadingElement>(null),
    restartDialog = useRef<HTMLDialogElement>(null);
  const audio = useRef<Ambience | null>(null),
    turnLock = useRef(false),
    shuffleLock = useRef(false);
  const hasMotion = ready && !reduced && !simple;
  const draws = state.selected.map((index) => state.deck[index]),
    draw = draws[focus];
  const revealed = !!draw && state.revealed.includes(draw.id),
    card = draw ? getCard(draw.id, locale) : undefined;
  const viewOnly = report && state.revealed.length === count;
  const focused = false;
  const finishIntro = useCallback(
    () => setStage((current) => (current === "gather" ? "choose" : current)),
    [],
  );
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(media.matches);
    sync();
    media.addEventListener("change", sync);
    try {
      setSimple(localStorage.getItem("midnight-arcana.gentle") === "true");
      const saved = restoreReading(localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem("midnight-arcana.reading.v1"));
      if (saved) {
        dispatch({ type: "restore", state: saved });
        const resumed = resumeRitual(saved);
        setStage(resumed.stage);
        setFocus(resumed.focus);
        if (
          saved.revealed.length === spreadCount(saved.spreadId) &&
          ["#reading", "#about"].includes(location.hash)
        )
          setReport(true);
      }
    } catch {
      setNotice("storage");
    }
    setReady(true);
    return () => {
      media.removeEventListener("change", sync);
      audio.current?.dispose();
      audio.current = null;
    };
  }, []);
  useEffect(() => {
    if (ready)
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch {
        setNotice("storage");
      }
  }, [state, ready]);
  useEffect(() => {
    if (stage !== "choose" || state.selected.length !== count) return;
    const timer = setTimeout(
      () => {
        const next = resumeRitual(state);
        setFocus(next.focus);
        setStage(next.stage);
      },
      hasMotion ? 450 : 0,
    );
    return () => clearTimeout(timer);
  }, [stage, state, hasMotion]);
  useEffect(() => {
    if (!busy) return;
    const timer = setTimeout(
      () => {
        setBusy(false);
        turnLock.current = false;
      },
      hasMotion ? 900 : 0,
    );
    return () => clearTimeout(timer);
  }, [busy, hasMotion]);
  useEffect(() => {
    if (!ready) return;
    if (stage !== "question") {
      title.current?.focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: "instant" });
    }
    if (!hasMotion || !root.current) return;
    const scope = createScope({ root }).add(() => {
      animate("[data-enter]", {
        opacity: [0, 1],
        translateY: [10, 0],
        duration: 600,
        ease: "out(4)",
      });
      animate("[data-spread-card]", {
        opacity: [0, 1], translateY: [20, 0], scale: [0.96, 1],
        duration: 650, delay: stagger(90), ease: "out(4)",
      });
    });
    return () => scope.revert();
  }, [stage, focus, viewOnly, ready, hasMotion]);
  useEffect(() => {
    const change = () => {
      if (state.revealed.length === count)
        setReport(["#reading", "#about"].includes(location.hash));
    };
    window.addEventListener("hashchange", change);
    return () => window.removeEventListener("hashchange", change);
  }, [state.revealed.length]);
  useEffect(() => {
    const change = () => {
      if (document.hidden || !sound || viewOnly) void audio.current?.suspend();
      else void audio.current?.resume().catch(() => setSound(false));
    };
    change();
    document.addEventListener("visibilitychange", change);
    return () => document.removeEventListener("visibilitychange", change);
  }, [sound, viewOnly]);
  useEffect(() => {
    if (resetOpen) restartDialog.current?.showModal();
    else restartDialog.current?.close();
  }, [resetOpen]);
  const begin = () => {
    if (!ready || state.selected.length || !["question", "choose"].includes(stage)) return;
    shuffleLock.current = false;
    setNotice("");
    setStage("shuffle");
  };
  const stopShuffle = () => {
    if (stage !== "shuffle" || shuffleLock.current) return;
    shuffleLock.current = true;
    try {
      dispatch({ type: "start", deck: shuffleDeck(state.reversals) });
      setStage("gather");
    } catch {
      shuffleLock.current = false;
      setNotice("shuffle");
    }
  };
  const pick = (index: number) => {
    if (stage === "choose") dispatch({ type: "select", index });
  };
  const turn = () => {
    if (turnLock.current || !canTurn(state, stage, focus, busy) || !draw)
      return;
    turnLock.current = true;
    setBusy(true);
    dispatch({ type: "reveal", id: draw.id });
    audio.current?.chime(focus);
  };
  const takeNext = () => {
    const index = nextReveal(state, focus);
    if (index < 0) setStage("complete");
    else {
      setFocus(index);
      setBusy(false);
      turnLock.current = false;
    }
  };
  const skip = () => {
    setSkipVersion((n) => n + 1);
    setBusy(false);
    turnLock.current = false;
    finishIntro();
  };
  const reset = () => {
    dispatch({ type: "reset" });
    setStage("question");
    setFocus(0);
    setReport(false);
    setBusy(false);
    setResetOpen(false);
    turnLock.current = false;
    shuffleLock.current = false;
    history.replaceState(null, "", location.pathname);
    window.scrollTo(0, 0);
  };
  const toggleSound = async () => {
    if (sound) {
      setSound(false);
      return;
    }
    try {
      audio.current ??= new Ambience();
      await audio.current.resume();
      setSound(true);
    } catch {
      setNotice("sound");
    }
  };
  const toggleEffects = () => {
    setSimple(!simple);
    try {
      localStorage.setItem("midnight-arcana.gentle", String(!simple));
    } catch {}
  };
  const openReport = () => {
    setReport(true);
    location.hash = "reading";
    window.scrollTo(0, 0);
  };
  const step =
    stage === "question"
      ? 0
      : stage === "shuffle" || stage === "gather" || stage === "choose"
        ? 1
        : stage === "reveal"
          ? 2
          : 3;
  const notices = {
    storage: t(
      "Progress cannot be saved in this browser. You can still complete your reading.",
      "此浏览器无法保存进度，你仍可以完成本次解读。",
    ),
    shuffle: t(
      "The deck couldn’t be shuffled. Please try again in a current browser.",
      "暂时无法洗牌，请使用较新版本的浏览器重试。",
    ),
    sound: t(
      "Sound is unavailable in this browser. The reading can continue silently.",
      "此浏览器暂时无法播放声音，你可以安静地继续解读。",
    ),
  };
  const choosing = !viewOnly && (stage === "gather" || stage === "choose");
  return (
    <div ref={frame} data-ritual-focused={focused} className={`relative isolate min-h-dvh ${choosing ? "flex flex-col" : ""}`}>
      <CelestialBackdrop />
      {hasMotion && !failed && !viewOnly && (
        <CelestialScene onFailure={() => setFailed(true)} />
      )}
      {viewOnly ? (
        <>
          <Header />
          <ReadingReport spread={state} draws={draws} question={state.question} reduced={!hasMotion} onRestart={() => setResetOpen(true)} />
          <Footer />
        </>
      ) : (
        <>
          <header
            className={`${sectionWidth} relative z-20 flex min-h-24 shrink-0 flex-wrap items-center justify-between gap-2 border-b border-line py-4 sm:gap-4`}
          >
            <Brand />
            <nav
              data-ritual-secondary
              aria-label={t("Main navigation", "主导航")}
              className="hidden items-center gap-8 md:flex"
            >
              <a
                href="#ritual"
                className="relative flex min-h-11 items-center text-sm text-gold after:absolute after:bottom-0 after:left-1/2 after:size-1 after:-translate-x-1/2 after:rounded-full after:bg-gold"
              >
                {t("The ritual", "开始解读")}
              </a>
              <Link href="/cards/" className={textButton}>
                {t("The deck", "牌库")}
                <span className="text-sm text-gold/65">78</span>
              </Link>
            </nav>
            <div className="flex items-center gap-1 sm:gap-3">
              <LanguageSwitch reduced={!hasMotion} />
              <button
                onClick={toggleSound}
                aria-pressed={sound}
                aria-label={
                  sound
                    ? t("Mute ambience", "关闭环境音")
                    : t("Enable ambience", "开启环境音")
                }
                title={
                  sound ? t("Sound on", "声音开启") : t("Sound off", "声音关闭")
                }
                className={`${iconButton} border-transparent text-lg`}
              >
                <span aria-hidden="true">{sound ? "♫" : "♪"}</span>
              </button>
              <button
                onClick={toggleEffects}
                aria-pressed={simple || reduced}
                disabled={reduced}
                aria-label={
                  reduced
                    ? t(
                        "Gentle mode follows your device setting",
                        "轻柔模式遵循设备设置",
                      )
                    : simple
                      ? t("Enable full effects", "开启完整效果")
                      : t("Reduce effects", "减少特效")
                }
                title={
                  simple || reduced
                    ? t("Gentle mode", "轻柔模式")
                    : t("Reduce effects", "减少特效")
                }
                className={`${iconButton} border-transparent ${simple || reduced ? "text-muted" : ""}`}
              >
                <Icon name={simple || reduced ? "moon" : "star"} size={18} />
              </button>
            </div>
          </header>
          <main
            id="main"
            ref={root}
            className={`${sectionWidth} relative ${choosing ? "flex min-h-0 flex-1 flex-col py-2" : "pb-10 pt-7 sm:pt-10"}`}
          >
            <div
              id="ritual"
              className={`${choosing ? "mb-1 shrink-0" : "mb-8"} flex items-center justify-between gap-3`}
            >
              <ol
                aria-label={t("Reading progress", "解读进度")}
                className="grid grid-cols-2 items-center gap-x-4 gap-y-2 sm:flex sm:flex-wrap sm:gap-5"
              >
                {[
                  t("Intention", "意图"),
                  t("Choose", "选牌"),
                  t("Reveal", "翻牌"),
                  t("Reflect", "思考"),
                ].map((label, i) => (
                  <li
                    key={i}
                    aria-current={i === step ? "step" : undefined}
                    className={`flex items-center gap-2 text-sm ${i === step ? "text-gold" : i < step ? "text-parchment/70" : "text-muted/60"}`}
                  >
                    <span className="font-display text-base">
                      {i < step ? "✓" : `0${i + 1}`}
                    </span>
                    <span>{label}</span>
                    {i < 3 && (
                      <span
                        aria-hidden="true"
                        className="ml-1 hidden h-px w-5 bg-line sm:block"
                      />
                    )}
                  </li>
                ))}
              </ol>
              <Link
                data-ritual-secondary
                href="/cards/"
                className={`${textButton} md:hidden`}
                aria-label={t("Explore the deck", "探索塔罗牌库")}
              >
                <Icon name="book" size={18} />
              </Link>
            </div>
            {stage === "question" && (
              <>
                <section
                  className="grid items-center gap-x-5 lg:grid-cols-[1fr_1.05fr]"
                  aria-label={t("Begin your reading", "开始你的解读")}
                >
                  <div
                    data-ritual-secondary
                    className="relative z-10 pt-4 text-center lg:pt-10 lg:text-left"
                  >
                    <p
                      className={`${eyebrow} mb-5 flex items-center justify-center gap-3 lg:justify-start`}
                    >
                      <span className="h-px w-7 bg-gold/50" />
                      {t(
                        "BEFORE THE CARDS, A MOMENT FOR YOU",
                        "翻牌之前，给自己片刻",
                      )}
                    </p>
                    <h1
                      ref={title}
                      tabIndex={-1}
                      className="font-display text-[clamp(2.8rem,5.6vw,5.3rem)] leading-[.98] tracking-[-.035em] outline-none"
                    >
                      {t("What is calling for", "什么正在呼唤")}
                      <br />
                      <em className="font-normal text-gold">
                        {t("your attention?", "你的关注？")}
                      </em>
                    </h1>
                    <p className="mx-auto mt-6 max-w-sm text-sm leading-7 text-muted lg:mx-0">
                      {t(
                        "A little ritual. A little room to reflect.",
                        "一个小小的仪式，一点思考的空间。",
                      )}
                      <br />
                      {t(
                        "Your cards. A new perspective.",
                        "你的牌阵，一个全新的视角。",
                      )}
                    </p>
                  </div>
                  <div data-ritual-secondary className="row-span-2 mx-auto my-4 w-[min(100%,280px)] sm:w-[min(100%,360px)] lg:my-0 lg:w-full">
                    <OracleArtwork reduced={!hasMotion || focused} />
                    <p className="-mt-1 hidden text-center text-sm tracking-[.12em] text-gold/65 lg:block">
                      {t("AS ABOVE, SO WITHIN", "仰望星空，照见内心")}
                    </p>
                  </div>
                  <form
                    data-enter
                    className="relative z-10 mx-auto mt-4 w-full max-w-[460px] lg:mx-0 lg:mt-9"
                    onSubmit={(event) => {
                      event.preventDefault();
                      begin();
                    }}
                  >
                    <label
                      htmlFor="intention"
                      className="mb-3 flex justify-between text-sm text-parchment/90"
                    >
                      <span>
                        {t("What’s on your mind?", "此刻，有什么心事？")}
                      </span>
                      <span className="text-sm text-muted">
                        {t("OPTIONAL", "可留空")}
                      </span>
                    </label>
                    <div className="relative">
                      <textarea
                        id="intention"
                        rows={2}
                        maxLength={300}
                        value={state.question}
                        onChange={(event) =>
                          dispatch({
                            type: "question",
                            value: event.target.value,
                          })
                        }
                        placeholder={t(
                          "A question. A feeling. Something on your mind.",
                          "一个问题，一种感受，一件心事。",
                        )}
                        className="block h-24 w-full resize-none overflow-y-auto rounded-sm border border-gold/25 bg-ink/45 p-4 text-base leading-6 text-parchment placeholder:text-muted/65 hover:border-gold/45 focus-visible:outline focus-visible:outline-gold"
                      />
                    </div>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm leading-6 text-muted">
                      {t(
                        "You can leave this blank. Your words stay with you.",
                        "可以留空，你写下的话只保存在此设备上。",
                      )}
                    </p>
                    {state.question && <button type="button" className={textButton} onClick={() => {
                      dispatch({ type: "question", value: "" });
                      document.getElementById("intention")?.focus();
                    }}>{t("Clear question", "清空问题")}</button>}
                    </div>
                    <Dropdown<ReadingTopic | 'auto'> label={t("Reading topic", "\u89e3\u8bfb\u4e3b\u9898")}
                      value={state.topic??'auto'} onChange={value=>dispatch({type:'topic',value})}
                      options={([['auto','Automatic','自动识别'],['general','General','综合'],['relationships','Relationships','情感与关系'],['work','Work & study','工作与学业'],['finances','Money & resources','金钱与资源'],['growth','Personal growth','个人成长']] as const).map(([value,en,zh])=>({value,label:t(en,zh)}))} />
                    <Dropdown<SpreadId> label={t("Choose a spread", "\u9009\u62e9\u724c\u9635")}
                      value={state.spreadId} onChange={value=>dispatch({type:'spread',value})}
                      options={spreadIds.map(value=>({value,label:`${spreadName(value,locale)} \u00b7 ${spreadCount(value)}`}))} />
                    <PositionGuide spread={state} />
                    <div className="my-5 flex flex-wrap items-center justify-between gap-3">
                      <label className="flex min-h-11 cursor-pointer items-center gap-2.5 text-sm text-muted">
                        <input
                          className="size-4 accent-gold"
                          type="checkbox"
                          checked={state.reversals}
                          onChange={(event) =>
                            dispatch({
                              type: "reversals",
                              value: event.target.checked,
                            })
                          }
                        />
                        <span>{t("Welcome reversed cards", "包含逆位牌")}</span>
                      </label>
                      <span className="text-sm text-muted/70">
                        {t(`${count} cards · Your own pace`, `${count} 张牌 · 跟随你的节奏`)}
                      </span>
                    </div>
                    <button
                      className={`${primary} w-full sm:w-auto sm:min-w-64`}
                      type="submit"
                      disabled={!ready}
                    >
                      {t("Start shuffle", "开始洗牌")}
                      <Icon
                        name="arrow"
                        size={18}
                        className="transition-transform group-hover:translate-x-1"
                      />
                    </button>
                  </form>
                </section>
                <div data-ritual-secondary className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 border-t border-line pt-6 text-sm tracking-wider text-muted lg:mt-16">
                  <span className="flex items-center gap-2">
                    <Icon name="cards" size={14} />
                    {t("78 original illustrations", "78 张经典插画")}
                  </span>
                  <span className="flex items-center gap-2">
                    <Icon name="moon" size={14} />
                    {t("A space for reflection", "留给思考的空间")}
                  </span>
                  <span className="flex items-center gap-2">
                    <Icon name="download" size={14} />
                    {t("Yours to take offline", "随时离线使用")}
                  </span>
                </div>
              </>
            )}
            {stage === "shuffle" && (
              <section aria-label={t("Shuffle your cards", "洗牌")} className="mx-auto max-w-xl py-6 text-center">
                <div data-enter>
                  <p className={eyebrow}>{t("A MOMENT FOR YOUR QUESTION", "给你的问题片刻时间")}</p>
                  <h1 ref={title} tabIndex={-1} className="mt-4 font-display text-4xl outline-none sm:text-6xl">
                    {t("Find your rhythm.", "跟随你的节奏。")}
                  </h1>
                </div>
                <ShuffleDeck reduced={!hasMotion} reversals={state.reversals} />
                {state.question.trim() && <blockquote className="mb-6 break-words font-display text-2xl italic text-parchment">“{state.question}”</blockquote>}
                <p id="shuffle-instruction" className="mx-auto mb-6 max-w-md text-base leading-7 text-muted">
                  {t("Repeat your question a few times before stopping the shuffle.", "停止洗牌前，请在心中重复你的问题几次。")}
                </p>
                <button className={primary} onClick={stopShuffle} aria-describedby="shuffle-instruction">
                  {t("Stop shuffle", "停止洗牌")}<Icon name="cards" size={18} />
                </button>
                <p role="status" className="mt-4 text-sm text-muted">{t("Shuffling · Stop whenever you feel ready", "正在洗牌 · 准备好后随时停止")}</p>
              </section>
            )}
            {(stage === "gather" || stage === "choose") && (
              <section className="relative flex min-h-0 flex-1 flex-col" aria-label={t("Choose your cards", "选择你的牌")}>
                <div data-enter className="mb-3 shrink-0 text-center">
                  <p className={eyebrow}>
                    {stage === "gather"
                      ? t("THE DECK FINDS ITS RHYTHM", "牌在流转，心渐安定")
                      : t(
                          `${count} CARDS. ONE THREAD.`,
                          `${count} 张牌，串起你的思绪。`,
                        )}
                  </p>
                  <h1
                    ref={title}
                    tabIndex={-1}
                    className="mt-1 font-display text-[clamp(1.5rem,4dvh,2.75rem)] leading-tight outline-none"
                  >
                    {stage === "gather" ? (
                      t("A moment in motion.", "一场轻盈的流转。")
                    ) : (
                      <>
                        {t("Follow what", "跟随此刻")}{" "}
                        <em className="text-gold">
                          {t("draws you in.", "心之所向。")}
                        </em>
                      </>
                    )}
                  </h1>
                  <p className="mt-1 hidden text-sm leading-5 text-muted min-[800px]:block [@media(max-height:600px)]:hidden">
                    {t(
                      "Let a card catch your eye. Make it part of your story.",
                      "让一张牌吸引你的目光，成为你故事的一部分。",
                    )}
                  </p>
                </div>
                <DealerTable spread={state}
                  deck={state.deck}
                  selected={state.selected}
                  active={stage === "choose"}
                  reduced={!hasMotion}
                  onDealComplete={finishIntro}
                  onPick={pick}
                />
                {stage === "choose" && state.selected.length === 0 && (
                  <div className="mt-3 text-center"><button className={textButton} onClick={begin}>
                    {t("Shuffle again", "再次洗牌")}
                  </button></div>
                )}
                {stage === "gather" && (
                  <div className="absolute inset-x-0 top-1/2 z-20 text-center">
                    <button className={`${textButton} rounded border border-line bg-ink/90 px-5`} onClick={skip}>
                      {t("Skip animation", "跳过动画")}
                      <Icon name="arrow" size={15} />
                    </button>
                  </div>
                )}
              </section>
            )}
            {stage === "reveal" && draw && card && (
              <section aria-label={t("Reveal your cards", "翻开你的牌")}>
                <div data-enter className="mt-6 text-center">
                  <p className={eyebrow}>
                    {String(focus + 1).padStart(2, "0")} /{" "}
                    {positions[focus].label.toUpperCase()}
                  </p>
                  <h1
                    ref={title}
                    tabIndex={-1}
                    className="mt-3 font-display text-5xl outline-none sm:text-6xl"
                  >
                    {positions[focus].name}
                  </h1>
                  <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted">
                    {positions[focus].prompt}
                  </p>
                </div>
                <div className="mx-auto mt-8 grid max-w-3xl items-center gap-6 sm:grid-cols-2 sm:gap-16">
                  <div className="relative mx-auto w-40 sm:w-56">
                    <div
                      aria-hidden="true"
                      className="absolute -inset-12 rounded-full border border-gold/10"
                    />
                    <div
                      aria-hidden="true"
                      className="absolute -inset-6 rounded-full border border-gold/15"
                    />
                    <button
                      onClick={turn}
                      disabled={revealed || busy}
                      aria-label={
                        revealed
                          ? `${card.name} · ${draw.reversed ? t("Reversed", "逆位") : t("Upright", "正位")}`
                          : t(
                              `Reveal ${positions[focus].label}`,
                              `翻开${positions[focus].label}`,
                            )
                      }
                      className="relative block w-full rounded-md"
                    >
                      <RevealCard
                        key={draw.id}
                        image={card.image}
                        reversed={draw.reversed}
                        revealed={revealed}
                        reduced={!hasMotion}
                        skipVersion={skipVersion}
                      />
                    </button>
                  </div>
                  <div className="relative z-10 text-center sm:text-left">
                    <div
                      aria-live="polite"
                      className="flex min-h-32 flex-col justify-center"
                    >
                      {revealed ? (
                        <>
                          <p className={eyebrow}>
                            {draw.reversed
                              ? t("↧ REVERSED", "↧ 逆位")
                              : t("↟ UPRIGHT", "↟ 正位")}
                          </p>
                          <h2 className="my-3 font-display text-4xl">
                            {card.name}
                          </h2>
                          <p className="text-sm leading-7 text-muted">
                            {meaningFor(draw, locale).keywords.join(" · ")}
                          </p>
                        </>
                      ) : (
                        <>
                          <Icon
                            name="star"
                            size={24}
                            className="mx-auto mb-4 text-gold sm:mx-0"
                          />
                          <p className="font-display text-2xl text-parchment/90">
                            {t(
                              "There is a story waiting on the other side.",
                              "牌的另一面，有一个故事在等你。",
                            )}
                          </p>
                        </>
                      )}
                    </div>
                    <div className="mt-5">
                      {!revealed ? (
                        <button className={primary} onClick={turn}>
                          {t("Reveal this card", "翻开这张牌")}
                          <Icon name="star" size={16} />
                        </button>
                      ) : busy ? (
                        <button className={textButton} onClick={skip}>
                          {t("Skip animation", "跳过动画")}
                          <Icon name="arrow" size={16} />
                        </button>
                      ) : (
                        <button className={primary} onClick={takeNext}>
                          {nextReveal(state, focus) < 0
                            ? t("Bring the story together", "让故事连成一线")
                            : t("Continue to the next card", "继续翻开下一张")}
                          <Icon name="arrow" size={17} />
                        </button>
                      )}
                    </div>
                    <div
                      className="mt-7 flex justify-center gap-4 sm:justify-start"
                      aria-label={t(
                        `Card ${focus + 1} of ${count}`,
                        `第 ${focus + 1} / ${count} 张牌`,
                      )}
                    >
                      {positions.map((_, i) => (
                        <span
                          key={i}
                          className={
                            i === focus
                              ? "text-gold"
                              : i < focus
                                ? "text-gold/50"
                                : "text-muted/25"
                          }
                        >
                          ✦
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            )}
            {stage === "complete" && (
              <section className="mt-6 text-center">
                <div data-enter>
                  <p className={eyebrow}>
                    {t("YOUR CONSTELLATION IS COMPLETE", "你的星图，已然成形")}
                  </p>
                  <h1
                    ref={title}
                    tabIndex={-1}
                    className="mt-4 font-display text-4xl leading-[1.05] outline-none sm:text-6xl"
                  >
                    {t(`${count} stories.`, `${count} 个故事。`)}
                    <br />
                    <em className="text-gold">
                      {t("One new perspective.", "一个全新的视角。")}
                    </em>
                  </h1>
                </div>
                <SpreadDiagram spread={state} draws={draws} />
                {state.question && (
                  <blockquote className="mx-auto mb-7 max-w-xl break-words font-display text-2xl italic text-muted">
                    “{state.question}”
                  </blockquote>
                )}
                <div className="flex flex-col items-center gap-3">
                  <button className={primary} onClick={openReport}>
                    {t("Understand your reading", "理解你的牌阵")}
                    <Icon name="arrow" size={17} />
                  </button>
                  <Link className={textButton} href="/cards/">
                    {t("Discover the deck", "探索全部塔罗牌")}
                    <Icon name="book" size={16} />
                  </Link>
                </div>
              </section>
            )}
          </main>
          <footer
            className={`${sectionWidth} flex shrink-0 items-center justify-between gap-x-5 gap-y-1 border-t border-line ${choosing ? "py-0 pb-[env(safe-area-inset-bottom)]" : "flex-wrap py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]"}`}
          >
            <span data-ritual-secondary className={`${choosing ? "hidden sm:block" : ""} text-sm tracking-[.12em] text-muted/70`}>
              {t("A MOMENT TO PAUSE & REFLECT", "片刻停留，与自己对话")}
            </span>
            <div className="flex flex-wrap items-center gap-5">
              {stage !== "question" && (
                <button
                  className={textButton}
                  onClick={() => setResetOpen(true)}
                >
                  {t("Begin again", "重新开始")}
                </button>
              )}
              <div data-ritual-secondary><OfflineStatus /></div>
            </div>
          </footer>
        </>
      )}
      {notice && (
        <div
          className="fixed bottom-5 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 items-center gap-3 rounded border border-gold/30 bg-panel p-4 text-sm leading-6 shadow-2xl"
          role="status"
        >
          {notices[notice]}
          <button
            className={iconButton}
            aria-label={t("Dismiss notice", "关闭提示")}
            onClick={() => setNotice("")}
          >
            <Icon name="close" size={16} />
          </button>
        </div>
      )}
      <dialog
        ref={restartDialog}
        className={dialogStyle}
        aria-labelledby="restart-title"
        onClose={() => setResetOpen(false)}
      >
        <button
          className={`${iconButton} absolute right-3 top-3`}
          aria-label={t("Keep this reading", "保留本次解读")}
          onClick={() => setResetOpen(false)}
        >
          <Icon name="close" />
        </button>
        <Icon name="moon" size={30} className="text-gold" />
        <h2 id="restart-title">
          {t("Make space for a new story?", "为新故事腾出空间？")}
        </h2>
        <p>
          {t(
            "This clears your current cards and question.",
            "这会清除当前的牌阵与问题。",
          )}
        </p>
        <button className={primary} onClick={reset}>
          {t("Begin again", "重新开始")}
          <Icon name="arrow" size={17} />
        </button>
        <button
          className={`${textButton} mt-3 w-full`}
          onClick={() => setResetOpen(false)}
        >
          {t("Keep this reading", "保留本次解读")}
        </button>
      </dialog>
    </div>
  );
}
