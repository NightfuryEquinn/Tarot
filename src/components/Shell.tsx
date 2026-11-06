'use client';
import { LanguageSwitch,useLanguage } from './Language';
import Link from 'next/link';
import { Icon } from './Icon';
import { OfflineStatus } from './OfflineStatus';
export function Header() {
  const {copy}=useLanguage();
  return <header className="site-header"><Link className="brand" href="/" aria-label={copy("Midnight Arcana home")}><span className="brand-mark"><Icon name="sun" size={30} /></span><span>MIDNIGHT<span className="brand-sub">A R C A N A</span></span></Link><nav aria-label={copy("Main navigation")}><Link href="/#ritual">{copy("The ritual")}</Link><Link href="/cards/">{copy("The deck")}<span>78</span></Link><Link href="/#about">{copy("Our philosophy")}</Link></nav><LanguageSwitch/><OfflineStatus /></header>;
}
export function Footer() {
  const {copy}=useLanguage();
  return <footer className="site-footer"><Link href="/" className="footer-brand"><Icon name="sun" size={23} /> MIDNIGHT ARCANA</Link><p>{copy("A little ritual. A little room to reflect.")}</p><Link href="/cards/#credits">{copy("Deck & credits")}<Icon name="arrow" size={14} /></Link><span className="footer-note">{copy("Made for the moment you’re in.")}</span></footer>;
}
