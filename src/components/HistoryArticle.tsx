"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { cards } from '@/data/cards';
import type { BilingualStory } from '@/data/history-types';
import { getCard } from '@/lib/locale';
import { useLanguage } from './Language';
import { eyebrow, secondary, sectionWidth } from './ui';

const sections = [['origin','Where it began','从何而来'],['evolution','How the picture changed','图像如何演变'],['symbols','Look closely','细看画面'],['today','Why it matters today','今天如何理解'],['detail','A detail to remember','值得记住的细节'],['sources','Sources & further reading','资料与延伸阅读']] as const;
function sourceLabel(url: string) {
  const host = new URL(url).hostname;
  if(host.includes('wikisource')) return 'A. E. Waite · The Pictorial Key to the Tarot';
  if(host.includes('sacred-texts')) return 'A. E. Waite · The Pictorial Key to the Tarot';
  if(host.includes('themorgan')) return 'The Morgan Library & Museum';
  if(host.includes('metmuseum')) return 'The Metropolitan Museum of Art';
  if(host.includes('vam.ac')) return 'Victoria and Albert Museum';
  return host.replace(/^www\./,'');
}
export function HistoryArticle({ cardId, story }: { cardId: string; story: BilingualStory }) {
  const { locale, t } = useLanguage();
  const card = getCard(cardId,locale);
  const copy = story[locale];
  const index = cards.findIndex(c=>c.id===cardId);
  const [suffix,setSuffix] = useState('');
  useEffect(()=>{
    const current = new URLSearchParams(window.location.search);
    const params = new URLSearchParams();
    for(const key of ['q','category']) { const value=current.get(key); if(value) params.set(key,value); }
    setSuffix(params.size?`?${params}`:'');
  },[cardId]);
  useEffect(()=>{
    document.title = `${card.name} · ${t('History & Stories · Midnight Arcana','历史与故事 · 午夜塔罗')}`;
    document.querySelector('meta[name=description]')?.setAttribute('content',copy.teaser);
  },[card.name,copy.teaser,locale]);
  return <main id="main" className={`${sectionWidth} py-10 sm:py-16`}>
    <Link href={`/history/${suffix}#stories`} className="inline-flex min-h-11 items-center text-sm text-gold hover:underline">{t('← All card stories','← 所有牌的故事')}</Link>
    <div className="mt-8 grid items-start gap-10 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-16">
      <aside className="lg:sticky lg:top-8">
        <img src={card.image} alt={t(`${card.name}, illustrated by Pamela Colman Smith`,`${card.name}，帕梅拉·科尔曼·史密斯绘`)} width="480" height="800" className="mx-auto w-44 rounded-sm border border-gold/30 shadow-xl lg:w-full"/>
        <p className="mx-auto mt-4 max-w-xs text-center text-sm leading-6 text-muted">{t('Pamela Colman Smith · 1909','帕梅拉·科尔曼·史密斯 · 1909年')}<br/>Rider–Waite–Smith</p>
        <nav aria-label={t('Article sections','文章章节')} className="mt-6 flex flex-wrap justify-center gap-x-5 lg:flex-col lg:items-start">{sections.map(([id,en,zh])=><a key={id} href={`#${id}`} className="inline-flex min-h-11 items-center text-sm text-muted hover:text-gold">{t(en,zh)}</a>)}</nav>
      </aside>
      <article className="min-w-0 max-w-[68ch]">
        <p className={eyebrow}>{t('HISTORY & STORIES','历史与故事')} · {t('3–5 MIN READ','约3–5分钟阅读')}</p>
        <h1 className="my-5 font-display text-5xl leading-tight sm:text-6xl">{card.name}</h1>
        <p className="mb-10 border-l-2 border-gold/60 pl-5 text-xl leading-9 text-parchment/90">{copy.teaser}</p>
        {sections.map(([id,en,zh])=><section key={id} id={id} className="mb-12 scroll-mt-8">
          <h2 className="mb-5 font-display text-3xl text-parchment sm:text-4xl">{t(en,zh)}</h2>
          {(id==='origin'||id==='evolution'||id==='today') && copy[id].map((paragraph,i)=><p key={i} className="mb-5 text-base leading-8 text-muted sm:text-lg sm:leading-9">{paragraph}</p>)}
          {id==='symbols'&&<ul className="space-y-6">{copy.symbols.map((symbol,i)=><li key={symbol.name} className="flex gap-4 rounded-sm border border-line bg-gold/[.025] p-5"><span aria-hidden="true" className="font-display text-3xl text-gold/70">0{i+1}</span><div><h3 className="mb-2 text-lg font-medium text-parchment">{symbol.name}</h3><p className="text-base leading-8 text-muted">{symbol.text}</p></div></li>)}</ul>}
          {id==='detail'&&<p className="border-y border-gold/30 py-6 text-lg leading-9 text-parchment/90">{copy.detail}</p>}
          {id==='sources'&&<><p className="mb-4 text-sm leading-7 text-muted">{t('Historical evidence, visible artwork, and later interpretation are different kinds of information. These references let you explore those layers. External source pages require an internet connection.','历史证据、画面本身与后来的诠释，是不同层次的信息。以下资料帮助你继续探索。外部资料页面需要联网访问。')}</p><ul className="space-y-3">{copy.sources.map((url,i)=><li key={url}><a href={url} className="inline-block break-words py-2 text-base text-gold underline underline-offset-4">{i+1}. {sourceLabel(url)} ↗</a></li>)}</ul></>}
        </section>)}
        <Link href={`/cards/?card=${card.id}`} className={secondary}>{t('Explore upright & reversed meanings →','探索正位与逆位含义 →')}</Link>
        <nav aria-label={t('More card stories','更多牌的故事')} className="mt-12 grid grid-cols-2 gap-5 border-t border-line pt-6">
          {index>0?<Link href={`/history/${cards[index-1].id}/${suffix}`} className="py-3 text-gold"><span className="mb-2 block text-sm text-muted">{t('← Previous card','← 上一张牌')}</span>{getCard(cards[index-1].id,locale).name}</Link>:<span/>}
          {index<cards.length-1&&<Link href={`/history/${cards[index+1].id}/${suffix}`} className="py-3 text-right text-gold"><span className="mb-2 block text-sm text-muted">{t('Next card →','下一张牌 →')}</span>{getCard(cards[index+1].id,locale).name}</Link>}
        </nav>
      </article>
    </div>
  </main>;
}
