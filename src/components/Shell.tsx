"use client";
import Link from "next/link";
import { LanguageSwitch, useLanguage } from "./Language";
import { Icon } from "./Icon";
import { OfflineStatus } from "./OfflineStatus";
import { CelestialBackdrop } from "./CelestialBackdrop";
import { sectionWidth, textButton } from "./ui";

export function Brand() {
  const { copy } = useLanguage();
  return (
    <Link
      href="/"
      aria-label={copy("Midnight Arcana home")}
      className="flex shrink-0 items-center gap-3 text-gold"
    >
      <span className="relative flex size-10 items-center justify-center rounded-full border border-gold/30">
        <Icon name="star" size={23} />
        <span className="absolute inset-1 rounded-full border border-gold/10" />
      </span>
      <span className="hidden text-sm font-medium tracking-[.12em] sm:block">
        MIDNIGHT
        <span className="mt-1 block text-sm tracking-[.25em] text-parchment/70">
          ARCANA
        </span>
      </span>
    </Link>
  );
}
export function Header() {
  const { copy } = useLanguage();
  return (
    <>
      <CelestialBackdrop />
      <header
        className={`${sectionWidth} flex min-h-24 flex-wrap items-center justify-between gap-3 border-b border-line py-5`}
      >
        <Brand />
        <nav
          className="order-3 flex w-full justify-center gap-7 sm:order-none sm:w-auto"
          aria-label={copy("Main navigation")}
        >
          <Link className={textButton} href="/">
            {copy("The ritual")}
          </Link>
          <Link className={textButton} href="/cards/">
            {copy("The deck")}
            <span className="text-sm text-gold">78</span>
          </Link>
        </nav>
        <LanguageSwitch />
      </header>
    </>
  );
}
export function Footer() {
  const { copy } = useLanguage();
  return (
    <footer
      className={`${sectionWidth} mt-16 flex flex-wrap items-center justify-between gap-x-8 gap-y-3 border-t border-line py-8 text-sm text-muted`}
    >
      <p>{copy("A little ritual. A little room to reflect.")}</p>
      <Link href="/cards/#credits" className={textButton}>
        {copy("Deck & credits")}
        <Icon name="arrow" size={14} />
      </Link>
      <OfflineStatus />
    </footer>
  );
}
