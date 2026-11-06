'use client';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useCallback,useEffect,useReducer,useRef,useState } from 'react';
import { animate,createScope } from 'animejs';
import { emptyReading,meaningFor,getPositions,readingReducer,restoreReading,shuffleDeck } from '@/lib/reading';
import { getCard } from '@/lib/locale';
import { canTurn,nextReveal,resumeRitual,type RitualStage } from '@/lib/cinematic';
import { Ambience } from '@/lib/ambience';
import { Icon } from './Icon';
import { Header,Footer } from './Shell';
import { OfflineStatus } from './OfflineStatus';
import { ReadingReport } from './ReadingReport';
import { DealerTable } from './DealerTable';
import { LanguageSwitch,useLanguage } from './Language';
import { CardBack } from './CardBack';
export { CardBack } from './CardBack';
const CardScene=dynamic(()=>import('./CardScene'),{ssr:false});
const STORAGE_KEY='midnight-arcana.reading.v1';
export function TarotExperience(){
  const {locale,t}=useLanguage(),positions=getPositions(locale);
  const [state,dispatch]=useReducer(readingReducer,emptyReading);
  const [stage,setStage]=useState<RitualStage>('question');
  const [focus,setFocus]=useState(0),[ready,setReady]=useState(false),[report,setReport]=useState(false);
  const [busy,setBusy]=useState(false),[skipVersion,setSkipVersion]=useState(0);
  const [reduced,setReduced]=useState(true),[simple,setSimple]=useState(false),[failed,setFailed]=useState(false);
  const [notice,setNotice]=useState<'storage'|'shuffle'|'sound'|''>('');
  const [resetOpen,setResetOpen]=useState(false),[sound,setSound]=useState(false),[sceneReady,setSceneReady]=useState(false);
  const [preview,setPreview]=useState<number|null>(null),[pending,setPending]=useState(false),[generation,setGeneration]=useState(0);
  const root=useRef<HTMLElement>(null),title=useRef<HTMLHeadingElement>(null),restartDialog=useRef<HTMLDialogElement>(null);
  const audio=useRef<Ambience|null>(null),turnLock=useRef(false),pickLock=useRef(false),version=useRef(0);
  const hasScene=ready&&!reduced&&!simple&&!failed;
  const draws=state.selected.map(index=>state.deck[index]),draw=draws[focus];
  const revealed=!!draw&&state.revealed.includes(draw.id),card=draw?getCard(draw.id,locale):undefined;
  const viewOnly=report&&state.revealed.length===5;
  const finishIntro=useCallback((token:number)=>{if(token===version.current)setStage(current=>current==='gather'?'choose':current);},[]);
  const finishPick=useCallback((token:number)=>{if(token!==version.current)return;pickLock.current=false;setPending(false);setPreview(null);},[]);
  useEffect(()=>{setSceneReady(false);},[viewOnly]);
  useEffect(()=>{
    const media=matchMedia('(prefers-reduced-motion: reduce)');const sync=()=>setReduced(media.matches);sync();media.addEventListener('change',sync);
    try{const saved=restoreReading(localStorage.getItem(STORAGE_KEY));if(saved){dispatch({type:'restore',state:saved});const resumed=resumeRitual(saved);setStage(resumed.stage);setFocus(resumed.focus);if(saved.revealed.length===5&&['#reading','#about'].includes(location.hash))setReport(true);}}
    catch{setNotice('storage');}setReady(true);
    return()=>{media.removeEventListener('change',sync);audio.current?.dispose();audio.current=null;};
  },[]);
  useEffect(()=>{if(!ready)return;try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}catch{setNotice('storage');}},[state,ready]);
  // The fallback never waits for a WebGL timeline. Scene startup has a bounded escape route.
  useEffect(()=>{if(!hasScene){if(stage==='gather')finishIntro(generation);if(pending)finishPick(generation);}},[hasScene,stage,pending,generation,finishIntro,finishPick]);
  useEffect(()=>{if(!hasScene||sceneReady)return;let timer:ReturnType<typeof setTimeout>;const arm=()=>{clearTimeout(timer);if(!document.hidden)timer=setTimeout(()=>{setFailed(true);setSceneReady(false);},8000);};arm();document.addEventListener('visibilitychange',arm);return()=>{clearTimeout(timer);document.removeEventListener('visibilitychange',arm);};},[hasScene,sceneReady]);
  useEffect(()=>{if(stage==='choose'&&state.selected.length===5&&!pending){const next=resumeRitual(state);setFocus(next.focus);setStage(next.stage);}},[stage,state,pending]);
  useEffect(()=>{if(!busy)return;const timer=setTimeout(()=>{setBusy(false);turnLock.current=false;},hasScene?1000:0);return()=>clearTimeout(timer);},[busy,hasScene]);
  useEffect(()=>{
    if(!ready)return;title.current?.focus({preventScroll:true});if(reduced||!root.current)return;
    const scope=createScope({root}).add(()=>{animate('.cinema-enter',{opacity:[0,1],translateY:[8,0],duration:700,ease:'out(4)'});});return()=>scope.revert();
  },[stage,focus,viewOnly,ready,reduced]);
  useEffect(()=>{const change=()=>{if(state.revealed.length===5)setReport(['#reading','#about'].includes(location.hash));};window.addEventListener('hashchange',change);return()=>window.removeEventListener('hashchange',change);},[state.revealed.length]);
  useEffect(()=>{const change=()=>{if(document.hidden||!sound||viewOnly)void audio.current?.suspend();else void audio.current?.resume().catch(()=>setSound(false));};change();document.addEventListener('visibilitychange',change);return()=>document.removeEventListener('visibilitychange',change);},[sound,viewOnly]);
  useEffect(()=>{if(resetOpen)restartDialog.current?.showModal();else restartDialog.current?.close();},[resetOpen]);
  const begin=()=>{try{const token=++version.current;setGeneration(token);setPreview(null);dispatch({type:'start',deck:shuffleDeck(state.reversals)});setStage('gather');}catch{setNotice('shuffle');}};
  const pick=()=>{if(stage!=='choose'||preview===null||pickLock.current||state.selected.length>=5||state.selected.includes(preview))return;pickLock.current=true;setPending(true);dispatch({type:'select',index:preview});};
  const turn=()=>{if(turnLock.current||!canTurn(state,stage,focus,busy)||!draw)return;turnLock.current=true;setBusy(true);dispatch({type:'reveal',id:draw.id});audio.current?.chime(focus);};
  const takeNext=()=>{const index=nextReveal(state,focus);if(index<0)setStage('complete');else{setFocus(index);setBusy(false);turnLock.current=false;}};
  const skip=()=>{setSkipVersion(n=>n+1);setBusy(false);turnLock.current=false;if(stage==='gather')finishIntro(generation);if(pending)finishPick(generation);};
  const reset=()=>{setGeneration(++version.current);dispatch({type:'reset'});setStage('question');setFocus(0);setReport(false);setBusy(false);setResetOpen(false);setPending(false);setPreview(null);turnLock.current=false;pickLock.current=false;history.replaceState(null,'',location.pathname);window.scrollTo(0,0);};
  const toggleSound=async()=>{if(sound){setSound(false);return;}try{audio.current??=new Ambience();await audio.current.resume();setSound(true);}catch{setNotice('sound');}};
  const openReport=()=>{setReport(true);location.hash='reading';window.scrollTo(0,0);};
  const labels={question:t('BEFORE THE CARDS, A MOMENT FOR YOU','翻牌之前，给自己片刻'),gather:t('THE DECK FINDS ITS RHYTHM','牌在流转，心渐安定'),choose:t('FIVE CARDS. ONE THREAD.','五张牌，一条相连的线索。'),reveal:`${String(focus+1).padStart(2,'0')} / ${positions[focus].label.toUpperCase()}`,complete:t('YOUR CONSTELLATION IS COMPLETE','你的星图，已然成形')};
  const headlines={question:<>{t('What is calling for','什么正在呼唤')}<br/><em>{t('your attention?','你的关注？')}</em></>,gather:<>{t('A moment','一场轻盈的')} <em>{t('in motion.','流转。')}</em></>,choose:<>{t('Follow what','跟随此刻')} <em>{t('draws you in.','心之所向。')}</em></>,reveal:positions[focus].name,complete:<>{t('Five stories.','五个故事。')}<br/><em>{t('One new perspective.','一个全新的视角。')}</em></>};
  const notices={storage:t('Progress cannot be saved in this browser. You can still complete your reading.','此浏览器无法保存进度，你仍可以完成本次解读。'),shuffle:t('The deck couldn’t be shuffled. Please try again in a current browser.','暂时无法洗牌，请使用较新版本的浏览器重试。'),sound:t('Sound is unavailable in this browser. The reading can continue silently.','此浏览器暂时无法播放声音，你可以安静地继续解读。')};
  return <>
    {viewOnly?<><Header/><ReadingReport draws={draws} onRestart={()=>setResetOpen(true)}/><Footer/></>:<main id="main" className={`cinematic-world phase-${stage} ${hasScene&&sceneReady?'scene-present':'scene-fallback'}`} ref={root}>
      <div className="celestial-backdrop" aria-hidden="true"><div className="nebula nebula-a"/><div className="nebula nebula-b"/><div className="starfield"/><div className="celestial-orbit orbit-outer"/><div className="celestial-orbit orbit-inner"/><div className="world-grain"/></div>
      {hasScene&&<CardScene stage={stage} focus={focus} deck={state.deck} selected={state.selected} revealed={state.revealed} preview={preview} pending={pending} generation={generation} locale={locale} skipVersion={skipVersion} onIntroComplete={finishIntro} onPickComplete={finishPick} onFailure={()=>{setFailed(true);setSceneReady(false);}} onReady={()=>setSceneReady(true)}/>}
      <header className="cinema-header"><Link href="/" className="cinema-wordmark" aria-label="Midnight Arcana"><Icon name="sun" size={26}/><span>MIDNIGHT <b>ARCANA</b></span></Link><div className="cinema-controls"><LanguageSwitch/><button onClick={toggleSound} aria-pressed={sound} aria-label={sound?t('Mute ambience','关闭环境音'):t('Enable ambience','开启环境音')} className="cinema-control"><span aria-hidden="true">{sound?'♫':'♪'}</span><span>{sound?t('Sound on','声音开启'):t('Sound off','声音关闭')}</span></button><button onClick={()=>{setSimple(!simple);setSceneReady(false);}} aria-pressed={simple||reduced} disabled={reduced||failed} className="cinema-control"><Icon name="star" size={15}/><span>{reduced||failed?t('Gentle mode','轻柔模式'):simple?t('Full effects','完整效果'):t('Reduce effects','减少特效')}</span></button></div></header>
      <section className="cinema-stage" aria-label={t('Tarot reading','塔罗解读')}>
        <div className="cinema-heading cinema-enter"><span className="eyebrow">{labels[stage]}</span><h1 ref={title} tabIndex={-1}>{headlines[stage]}</h1>{stage==='choose'&&<p>{t('Let a card catch your eye. Make it part of your story.','让一张牌吸引你的目光，成为你故事的一部分。')}</p>}{stage==='reveal'&&<p>{positions[focus].prompt}</p>}</div>
        {stage==='question'&&<form className="intention-form cinema-enter" onSubmit={e=>{e.preventDefault();begin();}}><label htmlFor="intention" className="sr-only">{t('Your question, optional','你的问题（可留空）')}</label><textarea id="intention" rows={2} maxLength={300} value={state.question} onChange={e=>dispatch({type:'question',value:e.target.value})} placeholder={t('A question. A feeling. Something on your mind.','一个问题，一种感受，一件心事。')}/><span className="question-whisper">{t('You can leave this blank. Your words stay with you.','可以留空，你写下的话只保存在此设备上。')}</span><button className="ritual-action" type="submit" disabled={!ready}>{t('Let the cards speak','让牌开始诉说')}<Icon name="arrow" size={18}/></button><label className="cinema-reversals"><input type="checkbox" checked={state.reversals} onChange={e=>dispatch({type:'reversals',value:e.target.checked})}/><span>{t('Welcome reversed cards','包含逆位牌')}</span></label></form>}
        {(stage==='gather'||stage==='choose')&&<><DealerTable deck={state.deck} selected={state.selected} preview={preview} active={stage==='choose'} pending={pending} onPreview={index=>{if(!pickLock.current)setPreview(index);}} onPick={pick}/>{stage==='gather'&&<div className="gather-overlay"><p>{t('Hold your question lightly.','轻轻地，把问题放在心上。')}</p><button className="cinema-subtle" onClick={skip}>{t('Skip animation','跳过动画')}<Icon name="arrow" size={15}/></button></div>}</>}
        {stage==='reveal'&&draw&&card&&<div className="reveal-interface"><button className={`focal-card ${revealed?'turned':''}`} onClick={turn} disabled={revealed||busy} aria-label={revealed?`${card.name} · ${draw.reversed?t('Reversed','逆位'):t('Upright','正位')}`:t(`Reveal ${positions[focus].label}`,`翻开${positions[focus].label}`)}><span className="focal-frame">{revealed?<img src={card.image} alt="" width="480" height="800" className={draw.reversed?'reversed':''}/>:<CardBack/>}</span></button><div className="reveal-caption" aria-live="polite">{revealed?<><span className="eyebrow">{draw.reversed?t('↧ REVERSED','↧ 逆位'):t('↟ UPRIGHT','↟ 正位')}</span><h2>{card.name}</h2><p>{meaningFor(draw,locale).keywords.join(' · ')}</p></>:<p className="reveal-invitation">{t('There is a story waiting on the other side.','牌的另一面，有一个故事在等你。')}</p>}</div><div className="reveal-actions">{!revealed?<button className="ritual-action" onClick={turn}>{t('Reveal this card','翻开这张牌')}<Icon name="star" size={16}/></button>:busy?<button className="cinema-subtle" onClick={skip}>{t('Skip animation','跳过动画')}<Icon name="arrow" size={16}/></button>:<button className="ritual-action" onClick={takeNext}>{nextReveal(state,focus)<0?t('Bring the story together','让故事连成一线'):t('Continue to the next card','继续翻开下一张')}<Icon name="arrow" size={17}/></button>}</div><div className="reveal-steps" aria-label={t(`Card ${focus+1} of 5`,`第 ${focus+1} / 5 张牌`)}>{positions.map((p,i)=><span key={i} className={i===focus?'current':i<focus?'done':''}>✦</span>)}</div></div>}
        {stage==='complete'&&<div className="completion-interface"><div className="final-tableau">{draws.map((item,i)=><div key={item.id} className="tableau-card"><span className="tableau-frame"><img src={getCard(item.id,locale).image} alt={`${positions[i].label}: ${getCard(item.id,locale).name}, ${item.reversed?t('reversed','逆位'):t('upright','正位')}`} width="480" height="800" className={item.reversed?'reversed':''}/></span><span>{positions[i].name}</span></div>)}</div>{state.question&&<blockquote className="completed-question">“{state.question}”</blockquote>}<div className="completion-actions"><button className="ritual-action" onClick={openReport}>{t('Understand your reading','理解你的牌阵')}<Icon name="arrow" size={17}/></button><Link className="cinema-subtle" href="/cards/">{t('Discover the deck','探索全部塔罗牌')}<Icon name="book" size={16}/></Link></div></div>}
      </section>
      <footer className="cinema-footer"><span className="journey-coordinate">{stage==='question'?t('A MOMENT TO PAUSE & REFLECT','片刻停留，与自己对话'):stage==='complete'?t('THE NEXT STEP IS YOURS','下一步，由你决定'):t('MIDNIGHT ARCANA · YOUR READING','午夜塔罗 · 你的解读')}</span><div className="cinema-footer-tools">{stage!=='question'&&<button className="cinema-subtle" onClick={()=>setResetOpen(true)}>{t('Begin again','重新开始')}</button>}<OfflineStatus/></div></footer>
      {notice&&<div className="cinema-notice" role="status">{notices[notice]}<button aria-label={t('Dismiss notice','关闭提示')} onClick={()=>setNotice('')}>×</button></div>}
    </main>}
    <dialog ref={restartDialog} className="info-dialog" aria-labelledby="restart-title" onClose={()=>setResetOpen(false)}><button className="icon-button dialog-close" aria-label={t('Keep this reading','保留本次解读')} onClick={()=>setResetOpen(false)}><Icon name="close"/></button><Icon name="moon" size={30}/><h2 id="restart-title">{t('Make space for a new story?','为新故事腾出空间？')}</h2><p>{t('This clears your current cards and question.','这会清除当前的牌阵与问题。')}</p><button className="button primary" onClick={reset}>{t('Begin again','重新开始')}<Icon name="arrow" size={17}/></button><button className="text-button keep-reading" onClick={()=>setResetOpen(false)}>{t('Keep this reading','保留本次解读')}</button></dialog>
  </>;
}
