"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useId,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { interfaceChinese, type CopyKey } from "@/data/interface.zh-CN";
import type { Locale } from "@/lib/locale";
import { animate } from "animejs";
const LanguageContext = createContext<{
  locale: Locale;
  setLocale: (locale: Locale) => void;
}>({ locale: "en", setLocale: () => {} });
const KEY = "midnight-arcana.locale.v1";
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>("en");
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(KEY);
    } catch {}
    setLocale(
      saved === "en" || saved === "zh-CN"
        ? saved
        : navigator.language.toLowerCase().startsWith("zh")
          ? "zh-CN"
          : "en",
    );
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    document.documentElement.lang = locale;
    try {
      localStorage.setItem(KEY, locale);
    } catch {}
  }, [locale, ready]);
  useEffect(() => {
    if (!ready) return;
    document.title =
      locale === "en"
        ? pathname.startsWith("/cards")
          ? "The deck · Midnight Arcana"
          : "Midnight Arcana — A moment with the cards"
        : pathname.startsWith("/cards")
          ? "塔罗牌库 · 午夜塔罗"
          : "午夜塔罗 — 与牌相伴的片刻";
    document
      .querySelector("meta[name=description]")
      ?.setAttribute(
        "content",
        locale === "en"
          ? "Explore three-card, five-card, Celtic Cross and annual tarot spreads with all 78 cards. Available offline."
          : "从三张牌、五张牌、凯尔特十字或年度牌阵中获得启发。探索全部78张牌的正逆位含义与相互联系，支持离线使用。",
      );
  }, [locale, pathname, ready]);
  return (
    <LanguageContext.Provider value={{ locale, setLocale }}>
      <a
        className="fixed left-4 top-4 z-50 -translate-y-24 rounded bg-gold px-5 py-3 text-sm text-ink focus:translate-y-0"
        href="#main"
      >
        {locale === "en" ? "Skip to content" : "跳转到正文"}
      </a>
      {children}
    </LanguageContext.Provider>
  );
}
export function useLanguage() {
  const value = useContext(LanguageContext);
  return {
    ...value,
    copy: (key: CopyKey) =>
      value.locale === "en" ? key : interfaceChinese[key],
    t: (en: string, zh: string) => (value.locale === "en" ? en : zh),
  };
}
export function LanguageSwitch({ reduced = true }: { reduced?: boolean }) {
  const { locale, setLocale } = useLanguage();
  const options = [{ value: "en", label: "English" }, { value: "zh-CN", label: "简体中文" }] as const;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const id = useId();
  const selected = options.findIndex(option => option.value === locale);
  const close = (restoreFocus = false) => {
    setOpen(false);
    if (restoreFocus) trigger.current?.focus();
  };
  const choose = (index: number) => {
    setLocale(options[index].value);
    close(true);
  };
  useEffect(() => {
    if (open) list.current?.querySelectorAll<HTMLElement>('[role="option"]')[active]?.focus();
  }, [open, active]);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    const animation = !reduced && list.current ? animate(list.current, {
      opacity: [0, 1], translateY: [-5, 0], duration: 180, ease: "out(3)",
    }) : null;
    return () => { document.removeEventListener("pointerdown", outside); animation?.revert(); };
  }, [open, reduced]);
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape" && open) { event.preventDefault(); close(true); }
    else if (event.key === "Tab" && open) close(true);
    else if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      event.preventDefault();
      setActive(event.key === "Home" ? 0 : event.key === "End" ? options.length - 1
        : !open ? selected : (active + (event.key === "ArrowDown" ? 1 : -1) + options.length) % options.length);
      setOpen(true);
    } else if (open && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault(); choose(active);
    } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      const index = options.findIndex(option => option.label.toLowerCase().startsWith(event.key.toLowerCase()));
      if (index >= 0) { event.preventDefault(); setActive(index); setOpen(true); }
    }
  };
  return (
    <div ref={root} className="relative z-30 shrink-0" onKeyDown={onKeyDown}
      onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
      <button ref={trigger} type="button" role="combobox" aria-label="Language / 语言"
        aria-expanded={open} aria-controls={id} aria-haspopup="listbox"
        className="flex min-h-11 min-w-28 items-center justify-between gap-2 rounded-sm border border-line bg-ink px-3 text-sm text-parchment hover:border-gold/50"
        onClick={() => { setActive(selected); setOpen(!open); }}
      >
        {options[selected].label}
        <svg aria-hidden="true" width="12" height="12" viewBox="0 0 12 12" fill="none" className={open ? "rotate-180" : ""}>
          <path d="m2 4 4 4 4-4" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </button>
      {open && <ul ref={list} id={id} role="listbox" aria-label="Language / 语言"
        className="absolute right-0 top-full mt-2 w-40 rounded-sm border border-gold/30 bg-panel p-1 shadow-xl">
        {options.map((option, index) => <li key={option.value} role="option" aria-selected={locale === option.value}
          tabIndex={-1} onClick={() => choose(index)} onFocus={() => setActive(index)}
          className={`flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-sm px-3 text-sm hover:bg-gold/10 focus:bg-gold/10 focus:outline-none ${locale === option.value ? "text-gold" : "text-parchment"}`}>
          {option.label}<span aria-hidden="true">{locale === option.value ? "✓" : ""}</span>
        </li>)}
      </ul>}
    </div>
  );
}
