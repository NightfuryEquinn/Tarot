import Link from 'next/link';
import { Icon } from './Icon';
import { OfflineStatus } from './OfflineStatus';
export function Header() {
  return <header className="site-header"><Link className="brand" href="/" aria-label="Midnight Arcana home"><span className="brand-mark"><Icon name="sun" size={30} /></span><span>MIDNIGHT<span className="brand-sub">A R C A N A</span></span></Link><nav aria-label="Main navigation"><Link href="/#ritual">The ritual</Link><Link href="/cards/">The deck <span>78</span></Link><Link href="/#about">Our philosophy</Link></nav><OfflineStatus /></header>;
}
export function Footer() {
  return <footer className="site-footer"><Link href="/" className="footer-brand"><Icon name="sun" size={23} /> MIDNIGHT ARCANA</Link><p>A little ritual. A little room to reflect.</p><Link href="/cards/#credits">Deck & credits <Icon name="arrow" size={14} /></Link><span className="footer-note">Made for the moment you’re in.</span></footer>;
}
