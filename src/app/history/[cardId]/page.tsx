import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cards } from '@/data/cards';
import { histories, validateHistories } from '@/data/history';
import { HistoryArticle } from '@/components/HistoryArticle';
import { Header, Footer } from '@/components/Shell';

export const dynamicParams = false;
export function generateStaticParams() {
  validateHistories();
  return cards.map(card => ({ cardId: card.id }));
}
export async function generateMetadata({ params }: { params: Promise<{ cardId: string }> }): Promise<Metadata> {
  const { cardId } = await params;
  const card = cards.find(c => c.id === cardId);
  return card ? { title: `${card.name} · History & Stories`, description: histories[cardId].en.teaser } : {};
}
export default async function CardHistoryPage({ params }: { params: Promise<{ cardId: string }> }) {
  const { cardId } = await params;
  if (!cards.some(c => c.id === cardId)) notFound();
  return <><Header /><HistoryArticle cardId={cardId} story={histories[cardId]} /><Footer /></>;
}
