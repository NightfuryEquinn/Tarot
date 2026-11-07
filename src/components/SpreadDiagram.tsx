"use client";
import { spreadPositions, type SpreadContext } from '@/lib/spreads';
import { getCard } from '@/lib/locale';
import type { DrawnCard } from '@/lib/reading';
import { useLanguage } from './Language';
import type { CSSProperties } from 'react';
const cross = [[2,2],[2,2],[2,3],[1,2],[2,1],[3,2],[5,4],[5,3],[5,2],[5,1]];
const wheel = [[3,1],[4,1],[5,2],[5,3],[5,4],[4,5],[3,5],[2,5],[1,4],[1,3],[1,2],[2,1],[3,3]];
export function SpreadDiagram({spread,draws}: {spread:SpreadContext;draws?:DrawnCard[]}) {
 const {locale,t}=useLanguage(); const positions=spreadPositions(locale,spread);
 const special=spread.spreadId==='celtic'||spread.spreadId==='annual';
 return <div className={`spread-diagram ${special?'spread-traditional':''} my-8 grid grid-cols-2 items-start gap-5 ${special?'': 'sm:flex sm:justify-center'}`} aria-label={t('Numbered spread layout','牌阵位置图')}>
 {positions.map((p,i)=>{
 const d=draws?.[i],card=d?getCard(d.id,locale):null;
 const [x,y]=(spread.spreadId==='celtic'?cross:wheel)[i]??[i+1,1];
 return <figure key={p.id} data-spread-card className={`spread-position m-0 min-w-0 ${special?'':'sm:w-36'} ${spread.spreadId==='celtic'&&i===1?'spread-crossing':''}`} style={{'--spread-x':x,'--spread-y':y} as CSSProperties}>
 <div className="relative mx-auto aspect-[3/5] w-full max-w-36 rounded-sm border border-gold/30 bg-panel">
 {card&&d?<img src={card.image} alt={`${card.name}, ${d.reversed?t('reversed','逆位'):t('upright','正位')}`} width={480} height={800} className={`size-full object-cover ${d.reversed?'rotate-180':''}`}/>:<span className="flex size-full items-center justify-center font-display text-3xl text-gold">{i+1}</span>}
 </div><figcaption className="relative mt-2 rounded bg-ink/90 px-1 text-center text-sm text-parchment">{i+1}. {p.label}{d&&<span className="block text-gold">{d.reversed?t('Reversed','逆位'):t('Upright','正位')}</span>}</figcaption>
 </figure>;
 })}</div>;
}
