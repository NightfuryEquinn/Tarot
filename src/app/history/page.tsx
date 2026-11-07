import type { Metadata } from 'next';
import { Header, Footer } from '@/components/Shell';
import { HistoryHub } from '@/components/HistoryHub';
import { histories, validateHistories } from '@/data/history';
import { cards } from '@/data/cards';

export const metadata: Metadata = { title: 'History & Stories', description: 'Discover the history, art, and symbolism behind all 78 tarot cards.' };
export default function HistoryPage() {
  validateHistories();
  const summaries = cards.map(card => ({ id: card.id, en: histories[card.id].en.teaser, 'zh-CN': histories[card.id]['zh-CN'].teaser }));
  return <><Header /><HistoryHub summaries={summaries} /><Footer /></>;
}
