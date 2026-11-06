'use client';
import { useEffect,useRef,useState,type CSSProperties } from 'react';
import { adjacentCard,fanColumns,fanLayout } from '@/lib/dealer';
import type { DrawnCard } from '@/lib/reading';
import { useLanguage } from './Language';
import { CardBack } from './CardBack';
import { Icon } from './Icon';

type Props={deck:DrawnCard[];selected:number[];preview:number|null;active:boolean;pending:boolean;onPreview:(index:number|null)=>void;onPick:(index:number)=>void};
export function DealerTable({deck,selected,preview,active,pending,onPreview,onPick}:Props){
  const {t}=useLanguage();const [columns,setColumns]=useState(13);const [keyboard,setKeyboard]=useState(0);
  const buttons=useRef<(HTMLButtonElement|null)[]>([]),returnFocus=useRef(false),previousPending=useRef(false);
  useEffect(()=>{const sync=()=>setColumns(fanColumns(innerWidth));sync();window.addEventListener('resize',sync);return()=>window.removeEventListener('resize',sync);},[]);
  const enabled=active&&!pending&&selected.length<5;
  const first=deck.findIndex((_,i)=>!selected.includes(i));
  const tabIndex=selected.includes(keyboard)?first:keyboard;
  useEffect(()=>{if(previousPending.current&&!pending&&returnFocus.current&&selected.length<5){returnFocus.current=false;setKeyboard(first);buttons.current[first]?.focus();}previousPending.current=pending;},[pending,first,selected.length]);
  return <div className={`dealer-table ${active?'dealer-active':'dealer-dealing'}`} style={{'--fan-columns':columns,'--fan-rows':Math.ceil(78/columns)} as CSSProperties} inert={!active} aria-hidden={!active} onKeyDown={e=>{if(e.key==='Escape'){onPreview(null);e.stopPropagation();}}}>
    <div className="dealer-fans" role="group" aria-label={t('All 78 face-down cards. Use arrow keys to preview and Enter or Space to choose.','全部78张背面朝上的牌。使用方向键预览，按回车键或空格键选择。')}>
      {deck.map((item,index)=>{const chosen=selected.includes(index),pos=fanLayout(index,columns);return <button key={item.id} ref={el=>{buttons.current[index]=el;}} data-card-index={index} data-angle={pos.angle} className={`dealer-card ${chosen?'chosen':''} ${preview===index?'previewing':''}`} style={{'--card-x':`${pos.x*100}%`,'--card-row':pos.row,'--card-curve':pos.curve,'--card-angle':`${pos.angle}deg`} as CSSProperties} aria-label={chosen?t(`Card ${index+1} chosen`,`第${index+1}张牌已选择`):t(`Choose face-down card ${index+1}`,`选择第${index+1}张牌`)} disabled={!enabled||chosen} tabIndex={index===tabIndex?0:-1} onPointerEnter={e=>{if(e.pointerType==='mouse'&&enabled&&!chosen)onPreview(index);}} onFocus={()=>{if(enabled&&!chosen)onPreview(index);}} onClick={e=>{if(!enabled||chosen)return;returnFocus.current=e.detail===0;setKeyboard(index);onPick(index);}} onKeyDown={e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(e.key)){e.preventDefault();const next=adjacentCard(index,e.key,columns,selected);setKeyboard(next);buttons.current[next]?.focus();}}}><span className="dealer-card-position"><span className="deck-card-art"><CardBack/></span></span><span className="dealer-number">{String(index+1).padStart(2,'0')}</span>{chosen&&<Icon name="check" size={12}/>}</button>;})}
    </div>
    <div className="dealer-preview-zone">
      <div className={`dealer-preview ${preview!==null?'has-preview':''}`} aria-hidden="true"><span className="preview-frame">{preview!==null&&<CardBack/>}</span><span className="preview-aura"/></div>
      <div className="dealer-invitation"><span className="eyebrow">{t('LET ONE CARD CALL TO YOU','让一张牌吸引你的目光')}</span><p aria-live="polite">{pending?t('Joining your spread…','正在进入你的牌阵…'):preview===null?t('Click or tap a card to choose it.','点击或轻触一张牌，即可选择。'):t(`Card ${String(preview+1).padStart(2,'0')} is waiting.\nClick, tap, or press Enter to choose.`,`第 ${String(preview+1).padStart(2,'0')} 张牌，静候你的选择。\n点击、轻触或按回车键即可选择。`)}</p></div>
    </div>
    <div className="dealer-tray" role="group" aria-label={t('Your five chosen cards','你选择的五张牌')}>
      {Array.from({length:5},(_,i)=><div className={`dealer-slot ${selected[i]!==undefined?'filled':''}`} key={i}><span className="tray-frame">{selected[i]!==undefined?<CardBack/>:<span>✧</span>}</span><small>{String(i+1).padStart(2,'0')}</small></div>)}
      <p className="stage-announcement" aria-live="polite">{t(`${selected.length} of 5 cards chosen`,`已选择 ${selected.length} / 5 张牌`)}</p>
    </div>
  </div>;
}
