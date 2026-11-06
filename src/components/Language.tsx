"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { interfaceChinese, type CopyKey } from "@/data/interface.zh-CN";
import type { Locale } from "@/lib/locale";
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
          ? "A five-card tarot reading with all 78 cards, upright and reversed meanings, and connections. Available offline."
          : "通过五张塔罗牌，发现新的视角。探索全部78张牌的正逆位含义及牌与牌之间的联结，支持离线使用。",
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
export function LanguageSwitch() {
  const { locale, setLocale } = useLanguage();
  return (
    <label className="relative flex min-h-11 items-center">
      <span className="sr-only">Language / 语言</span>
      <select
        className="min-h-11 max-w-28 rounded-sm border border-line bg-ink px-3 text-base text-muted sm:text-[11px] hover:border-gold/50"
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
      >
        <option value="en">English</option>
        <option value="zh-CN">简体中文</option>
      </select>
    </label>
  );
}
