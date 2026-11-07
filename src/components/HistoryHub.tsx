"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from './Language';
import { localizedCards, getCard } from '@/lib/locale';
import type { HistorySummary } from '@/data/history-types';
import { eyebrow, secondary, sectionWidth } from './ui';

const categories = [['all','All cards','全部'],['major','Major Arcana','大阿尔卡那'],['wands','Wands','权杖'],['cups','Cups','圣杯'],['swords','Swords','宝剑'],['pentacles','Pentacles','星币']] as const;
const eras = [
  ['15th century','15世纪','A game at court','宫廷里的纸牌游戏','In Renaissance Italy, hand-painted trumps joined familiar suit cards. These were playing cards before they became tools of divination.','文艺复兴时期的意大利，手绘王牌加入了已有的花色牌。塔罗最初用于纸牌游戏，后来才与占卜联系起来。','major-03'],
  ['17th–18th centuries','17至18世纪','Pictures travel','图像走向远方','Printed decks spread familiar figures and suit emblems. The tradition now called Tarot de Marseille became an important point of reference.','印刷牌组传播了熟悉的人物与花色符号。如今称为马赛塔罗的传统，成为后来牌组的重要参照。','major-01'],
  ['Late 18th century','18世纪末','New layers of meaning','新的意义层次','French occult writers proposed new histories and divinatory systems. Their claims of ancient Egyptian origins belong to that later tradition, not established evidence.','法国神秘学作家提出新的起源说与占卜体系。他们关于古埃及起源的说法属于后来的传统，并非已有确证的历史。','major-02'],
  ['1909','1909年','A scene in every card','每张牌都有一个场景','Pamela Colman Smith illustrated the Rider–Waite–Smith deck with Arthur Edward Waite. Its richly pictured numbered cards helped make it an enduring visual language.','帕梅拉·科尔曼·史密斯与亚瑟·爱德华·韦特合作绘制韦特—史密斯塔罗。数字牌中的生动场景，使它成为流传至今的视觉语言。','cups-06'],
];

export function HistoryHub({ summaries }: { summaries: HistorySummary[] }) {
  const { locale, t } = useLanguage();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  useEffect(() => {
    const restore = () => {
      const params = new URLSearchParams(window.location.search);
      setQuery(params.get('q') ?? '');
      const next = params.get('category');
      setCategory(categories.some(c => c[0] === next) ? next! : 'all');
    };
    restore(); window.addEventListener('popstate', restore);
    return () => window.removeEventListener('popstate', restore);
  }, []);
  function update(q: string, c: string) {
    setQuery(q); setCategory(c);
    const params = new URLSearchParams();
    if (q) params.set('q',q);
    if (c !== 'all') params.set('category',c);
    window.history.replaceState(null,'',`/history/${params.size ? `?${params}` : ''}#stories`);
  }
  const directoryParams = new URLSearchParams();
  if(query) directoryParams.set('q',query);
  if(category !== 'all') directoryParams.set('category',category);
  const suffix = directoryParams.size ? `?${directoryParams}` : '';
  const filtered = localizedCards[locale].filter(card => {
    const summary = summaries.find(s => s.id === card.id)!;
    return (category === 'all' || card.arcana === category || card.suit === category) &&
      `${getCard(card.id,'en').name} ${getCard(card.id,'zh-CN').name} ${summary.en} ${summary['zh-CN']}`.toLowerCase().includes(query.trim().toLowerCase());
  });
  return <main id="main" className={`${sectionWidth} py-12 sm:py-20`}>
    <section className="mx-auto max-w-3xl text-center">
      <p className={eyebrow}>{t('THE STORIES BEHIND THE SYMBOLS','符号背后的故事')}</p>
      <h1 className="my-6 font-display text-5xl leading-tight sm:text-7xl">{t('Every card has','每一张牌，')}<br/><em className="text-gold">{t('a past.','都有来处。')}</em></h1>
      <p className="mx-auto max-w-2xl text-lg leading-8 text-muted">{t('Before the readings, there were games, artists, and pictures passed from hand to hand. Follow the journey—and discover the small details that make each card unforgettable.','在占卜之前，有游戏、有画家，还有在人们手中流转的图画。沿着历史前行，发现让每张牌令人难忘的小细节。')}</p>
      <a href="#stories" className={`${secondary} mt-8`}>{t('Explore the 78 stories ↓','探索78个故事 ↓')}</a>
    </section>
    <section className="mt-20" aria-labelledby="timeline-heading">
      <h2 id="timeline-heading" className="font-display text-4xl">{t('Six centuries, many ways of seeing','六个世纪，不同的观看方式')}</h2>
      <p className="mt-4 max-w-2xl text-base leading-8 text-muted">{t('Tarot did not arrive with a single, fixed meaning. Games, printing, occult traditions, and individual artists each left their mark.','塔罗并非从一开始就有固定的意义。游戏、印刷、神秘学传统与艺术家，都在其中留下了痕迹。')}</p>
      <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{eras.map(([date,zhDate,title,zhTitle,text,zhText,id]) => <li key={id} className="border-t border-gold/40 pt-5">
        <div className="flex items-center gap-4"><img src={getCard(id).image} alt="" width="60" height="100" loading="lazy" className="w-12 rounded-sm"/><span className={eyebrow}>{t(date,zhDate)}</span></div>
        <h3 className="my-4 font-display text-2xl">{t(title,zhTitle)}</h3><p className="text-base leading-7 text-muted">{t(text,zhText)}</p>
      </li>)}</ol>
      <p className="mt-6 text-sm leading-7 text-muted">{t('The illustrations above are from our 1909 deck, used as visual guides to the timeline. Historical background: ','以上插图取自本站1909年牌组，作为时间线的视觉引导。历史背景：')}<a className="text-gold underline" href="https://www.themorgan.org/collection/tarot-cards">The Morgan Library & Museum</a>{' · '}<a className="text-gold underline" href="https://www.vam.ac.uk/articles/tarot-cards/">V&A</a>{' · '}<a className="text-gold underline" href="https://www.bnf.fr/fr/un-tarot-qui-rebat-les-cartes-collections">Bibliothèque nationale de France</a></p>
    </section>
    <section className="my-16 grid gap-8 border-y border-line py-8 md:grid-cols-2">
      <div><h2 className="font-display text-3xl">{t('22 larger-than-life figures','22张大阿尔卡那')}</h2><p className="mt-3 text-base leading-8 text-muted">{t('The Major Arcana grew from the trump sequence: rulers, virtues, celestial bodies, and scenes of human life. Familiar names and their order changed across decks.','大阿尔卡那来自王牌序列：统治者、美德、天体与人生场景。熟悉的名称和顺序，在不同牌组中也曾发生变化。')}</p></div>
      <div><h2 className="font-display text-3xl">{t('56 glimpses of everyday life','56张小阿尔卡那')}</h2><p className="mt-3 text-base leading-8 text-muted">{t('Wands, Cups, Swords, and Pentacles each contain an ace through ten and four court cards. Earlier numbered cards often repeated suit emblems; Smith gave them memorable human scenes.','权杖、圣杯、宝剑和星币，每种花色都有王牌至十号牌，以及四张宫廷牌。早期数字牌常以花色符号排列；史密斯为它们描绘了令人难忘的人生场景。')}</p></div>
    </section>
    <section id="stories" className="scroll-mt-8" aria-labelledby="stories-heading">
      <p className={eyebrow}>{t('THE COMPLETE COLLECTION','完整故事集')}</p><h2 id="stories-heading" className="mt-3 font-display text-4xl">{t('Find a card. Follow its story.','找到一张牌，走进它的故事。')}</h2>
      <div className="my-8 flex flex-col gap-5">
        <label className="flex flex-col gap-2 text-sm text-muted">{t('Search names and stories in either language','搜索中英文牌名与故事')}<input type="search" value={query} onChange={e=>update(e.target.value,category)} placeholder={t('Try The Fool, a lion, or 圣杯…','试试愚者、狮子，或 The Fool…')} className="min-h-12 w-full rounded-sm border border-line bg-panel px-4 text-base text-parchment sm:max-w-lg"/></label>
        <div role="group" aria-label={t('Filter stories','筛选故事')} className="flex flex-wrap gap-2">{categories.map(([id,en,zh])=><button key={id} aria-pressed={category===id} onClick={()=>update(query,id)} className={`${secondary} ${category===id?'border-gold bg-gold/10 text-gold':''}`}>{t(en,zh)}</button>)}</div>
      </div>
      <p aria-live="polite" className="mb-6 text-sm text-muted">{t(`${filtered.length} stories to discover`,`${filtered.length} 个故事等待发现`)}</p>
      <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">{filtered.map(card=><Link key={card.id} href={`/history/${card.id}/${suffix}`} className="group flex items-start gap-5 rounded-sm border border-line bg-panel/30 p-5 transition-colors hover:border-gold/60">
        <img src={card.image} alt="" width="90" height="150" loading="lazy" className="w-20 shrink-0 rounded-sm self-start"/>
        <div className="min-w-0"><h3 className="font-display text-2xl text-parchment group-hover:text-gold">{card.name}</h3><p className="mt-3 text-base leading-7 text-muted">{summaries.find(s=>s.id===card.id)![locale]}</p><span className="mt-4 block text-sm text-gold">{t('Read the story →','阅读故事 →')}</span></div>
      </Link>)}</div>
      {!filtered.length&&<div className="py-12"><h3 className="font-display text-3xl">{t('No stories found','没有找到故事')}</h3><p className="my-4 text-muted">{t('Try another name or explore the whole collection.','试试其他名称，或浏览完整故事集。')}</p><button onClick={()=>update('','all')} className={secondary}>{t('Show all stories','显示所有故事')}</button></div>}
    </section>
  </main>;
}
