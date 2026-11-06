'use client';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useReducer, useRef, useState } from 'react';
import { animate, createScope } from 'animejs';
import { cardById, emptyReading, meaningFor, positions, readingReducer, restoreReading, shuffleDeck } from '@/lib/reading';
import { canTurn, nextReveal, resumeRitual, type RitualStage } from '@/lib/cinematic';
import { Ambience } from '@/lib/ambience';
import { Icon } from './Icon';
import { Header, Footer } from './Shell';
import { OfflineStatus } from './OfflineStatus';
import { ReadingReport } from './ReadingReport';

const CardScene=dynamic(()=>import('./CardScene'),{ssr:false});
const STORAGE_KEY='midnight-arcana.reading.v1';
export function CardBack(){return <span className="card-back" aria-hidden="true"><svg viewBox="0 0 100 130" fill="none" stroke="currentColor" strokeWidth=".8"><circle cx="50" cy="65" r="30" opacity=".4"/><path d="M50 16v16m0 66v16M1 65h16m66 0h16M15 30l12 12m46 46 12 12M15 100l12-12m46-46 12-12"/><path d="M17 65Q50 33 83 65 50 97 17 65Z"/><circle cx="50" cy="65" r="13"/><circle cx="50" cy="65" r="4" fill="currentColor"/></svg></span>;}

export function TarotExperience(){
  const [state,dispatch]=useReducer(readingReducer,emptyReading);
  const [stage,setStage]=useState<RitualStage>('question');
  const [focus,setFocus]=useState(0);
  const [ready,setReady]=useState(false);
  const [report,setReport]=useState(false);
  const [busy,setBusy]=useState(false);
  const [skipVersion,setSkipVersion]=useState(0);
  const [reduced,setReduced]=useState(true);
  const [simple,setSimple]=useState(false);
  const [failed,setFailed]=useState(false);
  const [notice,setNotice]=useState('');
  const [resetOpen,setResetOpen]=useState(false);
  const [sound,setSound]=useState(false);
  const [sceneReady,setSceneReady]=useState(false);
  const [browse,setBrowse]=useState(0);
  const [pageSize,setPageSize]=useState(5);
  const root=useRef<HTMLElement>(null);
  const title=useRef<HTMLHeadingElement>(null);
  const audio=useRef<Ambience|null>(null);
  const turnLock=useRef(false);
  const restartDialog=useRef<HTMLDialogElement>(null);
  const hasScene=ready&&!reduced&&!simple&&!failed;
  const draws=state.selected.map(index=>state.deck[index]);
  const draw=draws[focus];
  const revealed=!!draw&&state.revealed.includes(draw.id);
  const card=draw?cardById.get(draw.id):undefined;
  const viewOnly=report&&state.revealed.length===5;
  useEffect(()=>{setSceneReady(false);},[viewOnly]);
  const takeNext=()=>{
    const index=nextReveal(state,focus);
    if(index<0)setStage('complete');else{setFocus(index);setBusy(false);turnLock.current=false;}
  };
  useEffect(()=>{
    const media=window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync=()=>setReduced(media.matches);sync();media.addEventListener('change',sync);
    const size=()=>{setPageSize(innerWidth<600?5:innerWidth<1000?9:13);setBrowse(0);};size();window.addEventListener('resize',size);
    try{
      const saved=restoreReading(localStorage.getItem(STORAGE_KEY));
      if(saved){dispatch({type:'restore',state:saved});const resumed=resumeRitual(saved);setStage(resumed.stage);setFocus(resumed.focus);if(saved.revealed.length===5&&['#reading','#about'].includes(location.hash))setReport(true);}
    }catch{setNotice('Progress cannot be saved in this browser. You can still complete your reading.');}
    setReady(true);
    return()=>{media.removeEventListener('change',sync);window.removeEventListener('resize',size);audio.current?.dispose();audio.current=null;};
  },[]);
  useEffect(()=>{
    if(!ready)return;
    try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}catch{setNotice('Progress cannot be saved in this browser. You can still complete your reading.');}
  },[state,ready]);
  useEffect(()=>{
    if(stage!=='gather')return;
    const timer=setTimeout(()=>setStage('choose'),hasScene?1900:180);return()=>clearTimeout(timer);
  },[stage,hasScene]);
  useEffect(()=>{
    if(stage==='choose'&&state.selected.length===5){const next=resumeRitual(state);setFocus(next.focus);setStage(next.stage);}
  },[state,stage]);
  useEffect(()=>{
    if(!busy)return;
    const timer=setTimeout(()=>{setBusy(false);turnLock.current=false;},hasScene?1000:180);return()=>clearTimeout(timer);
  },[busy,hasScene]);
  useEffect(()=>{
    if(!ready)return;
    title.current?.focus({preventScroll:true});
    if(reduced||!root.current)return;
    const scope=createScope({root}).add(()=>{animate('.cinema-enter',{opacity:[0,1],translateY:[10,0],duration:650,ease:'out(3)'});});
    return()=>scope.revert();
  },[stage,focus,viewOnly,ready,reduced]);
  useEffect(()=>{
    const change=()=>{if(state.revealed.length===5)setReport(['#reading','#about'].includes(location.hash));};
    window.addEventListener('hashchange',change);return()=>window.removeEventListener('hashchange',change);
  },[state.revealed.length]);
  useEffect(()=>{
    const change=()=>{if(document.hidden||!sound||viewOnly)void audio.current?.suspend();else void audio.current?.resume().catch(()=>setSound(false));};
    change();document.addEventListener('visibilitychange',change);return()=>document.removeEventListener('visibilitychange',change);
  },[sound,viewOnly]);
  useEffect(()=>{if(resetOpen)restartDialog.current?.showModal();else restartDialog.current?.close();},[resetOpen]);
  const begin=()=>{
    try{dispatch({type:'start',deck:shuffleDeck(state.reversals)});setBrowse(0);setStage('gather');}
    catch{setNotice('The deck couldn’t be shuffled. Please try again in a current browser.');}
  };
  const turn=()=>{
    if(turnLock.current||!canTurn(state,stage,focus,busy)||!draw)return;
    turnLock.current=true;setBusy(true);dispatch({type:'reveal',id:draw.id});audio.current?.chime(focus);
  };
  const skip=()=>{setSkipVersion(n=>n+1);setBusy(false);turnLock.current=false;if(stage==='gather')setStage('choose');};
  const reset=()=>{
    dispatch({type:'reset'});setStage('question');setFocus(0);setReport(false);setBusy(false);setResetOpen(false);turnLock.current=false;
    history.replaceState(null,'',location.pathname);window.scrollTo(0,0);
  };
  const toggleSound=async()=>{
    if(sound){setSound(false);return;}
    try{audio.current??=new Ambience();await audio.current.resume();setSound(true);}
    catch{setNotice('Sound is unavailable in this browser. The reading can continue silently.');}
  };
  const openReport=()=>{setReport(true);location.hash='reading';window.scrollTo(0,0);};
  const labels={question:'BEFORE THE CARDS, A MOMENT FOR YOU',gather:'LET THE EVERYDAY FALL AWAY',choose:'FIVE CARDS. ONE THREAD.',reveal:`${String(focus+1).padStart(2,'0')} / ${positions[focus].label.toUpperCase()}`,complete:'YOUR CONSTELLATION IS COMPLETE'};
  const headlines={question:<>What is calling for<br/><em>your attention?</em></>,gather:<>A little stillness.<br/><em>A space for possibility.</em></>,choose:<>Follow what<br/><em>draws you in.</em></>,reveal:positions[focus].name,complete:<>Five stories.<br/><em>One new perspective.</em></>};
  return <>
    {viewOnly?<><Header/><ReadingReport draws={draws} onRestart={()=>setResetOpen(true)}/><Footer/></>:<main id="main" className={`cinematic-world phase-${stage} ${hasScene&&sceneReady?'scene-present':'scene-fallback'}`} ref={root}>
      <div className="celestial-backdrop" aria-hidden="true"><div className="nebula nebula-a"/><div className="nebula nebula-b"/><div className="starfield"/><div className="celestial-orbit orbit-outer"/><div className="celestial-orbit orbit-inner"/><div className="world-grain"/></div>
      {hasScene&&<CardScene stage={stage} focus={focus} deck={state.deck} selected={state.selected} revealed={state.revealed} browse={browse} skipVersion={skipVersion} onFailure={()=>{setFailed(true);setSceneReady(false);}} onReady={()=>setSceneReady(true)}/>}
      <header className="cinema-header"><Link href="/" className="cinema-wordmark" aria-label="Midnight Arcana"><Icon name="sun" size={26}/><span>MIDNIGHT <b>ARCANA</b></span></Link><div className="cinema-controls"><button onClick={toggleSound} aria-pressed={sound} aria-label={sound?'Mute ambience':'Enable ambience'} className="cinema-control"><span aria-hidden="true">{sound?'♫':'♪'}</span><span>Sound {sound?'on':'off'}</span></button><button onClick={()=>{setSimple(!simple);setSceneReady(false);}} aria-pressed={simple||reduced} disabled={reduced||failed} className="cinema-control"><Icon name="star" size={15}/><span>{reduced||failed?'Gentle mode':simple?'Full effects':'Reduce effects'}</span></button></div></header>
      <section className="cinema-stage" aria-label="Tarot reading">
        <div className="cinema-heading cinema-enter"><span className="eyebrow">{labels[stage]}</span><h1 ref={title} tabIndex={-1}>{headlines[stage]}</h1>{stage==='choose'&&<p>Choose five cards. There is no wrong place to begin.</p>}{stage==='reveal'&&<p>{positions[focus].prompt}</p>}</div>
        {stage==='question'&&<form className="intention-form cinema-enter" onSubmit={e=>{e.preventDefault();begin();}}><label htmlFor="intention" className="sr-only">Your question, optional</label><textarea id="intention" rows={2} maxLength={300} value={state.question} onChange={e=>dispatch({type:'question',value:e.target.value})} placeholder="A question. A feeling. Something on your mind."/><span className="question-whisper">You can leave this blank. Your words stay with you.</span><button className="ritual-action" type="submit" disabled={!ready}>Let the cards speak <Icon name="arrow" size={18}/></button><label className="cinema-reversals"><input type="checkbox" checked={state.reversals} onChange={e=>dispatch({type:'reversals',value:e.target.checked})}/><span>Welcome reversed cards</span></label></form>}
        {stage==='gather'&&<div className="gather-copy cinema-enter"><span className="gather-sigil" aria-hidden="true">✧</span><p>Hold your question lightly.</p><button className="cinema-subtle" onClick={skip}>Skip animation <Icon name="arrow" size={15}/></button></div>}
        {stage==='choose'&&<div className="choose-interface"><div className="fan-window" style={{'--fan-count':pageSize} as React.CSSProperties} role="group" aria-label="Face-down deck">{state.deck.slice(browse,browse+pageSize).map((item,i)=>{const index=browse+i,chosen=state.selected.includes(index);return <button key={item.id} data-card-index={index} className={`fan-card ${chosen?'chosen':''}`} style={{'--fan-index':i,'--fan-curve':Math.pow(i-(pageSize-1)/2,2)*.8} as React.CSSProperties} onClick={()=>dispatch({type:'select',index})} aria-label={`Choose face-down card ${index+1}`} aria-pressed={chosen} disabled={chosen}><CardBack/>{chosen&&<Icon name="check" size={18}/>}<span className="fan-number">{String(index+1).padStart(2,'0')}</span></button>;})}</div><div className="deck-paging"><button onClick={()=>setBrowse(Math.max(0,browse-pageSize))} disabled={browse===0} aria-label="Previous cards">←</button><span>{browse+1}—{Math.min(browse+pageSize,78)} <i>/ 78</i></span><button onClick={()=>setBrowse(Math.min(78-pageSize,browse+pageSize))} disabled={browse>=78-pageSize} aria-label="Next cards">→</button></div><div className="constellation-progress" aria-label={`${state.selected.length} of 5 cards chosen`}>{positions.map((position,i)=><span className={i<state.selected.length?'lit':''} key={position.name}><b>✦</b><small>{i+1}</small></span>)}</div><p className="stage-announcement" aria-live="polite">{state.selected.length} of 5 cards chosen</p></div>}
        {stage==='reveal'&&draw&&card&&<div className="reveal-interface"><button className={`focal-card ${revealed?'turned':''}`} onClick={turn} disabled={revealed||busy} aria-label={revealed?`${card.name}, ${draw.reversed?'reversed':'upright'}`:`Reveal ${positions[focus].label}`}><span className="focal-frame">{revealed?<img src={card.image} alt="" width="480" height="800" className={draw.reversed?'reversed':''}/>:<CardBack/>}</span></button><div className="reveal-caption" aria-live="polite">{revealed?<><span className="eyebrow">{draw.reversed?'↧ REVERSED':'↟ UPRIGHT'}</span><h2>{card.name}</h2><p>{meaningFor(draw).keywords.join(' · ')}</p></>:<p className="reveal-invitation">There is a story waiting on the other side.</p>}</div><div className="reveal-actions">{!revealed?<button className="ritual-action" onClick={turn}>Reveal this card <Icon name="star" size={16}/></button>:busy?<button className="cinema-subtle" onClick={skip}>Skip animation <Icon name="arrow" size={16}/></button>:<button className="ritual-action" onClick={takeNext}>{nextReveal(state,focus)<0?'Bring the story together':'Continue to the next card'} <Icon name="arrow" size={17}/></button>}</div><div className="reveal-steps" aria-label={`Card ${focus+1} of 5`}>{positions.map((p,i)=><span key={p.name} className={i===focus?'current':i<focus?'done':''}>✦</span>)}</div></div>}
        {stage==='complete'&&<div className="completion-interface"><div className="final-tableau">{draws.map((item,i)=><div key={item.id} className="tableau-card"><span className="tableau-frame"><img src={cardById.get(item.id)!.image} alt={`${positions[i].label}: ${cardById.get(item.id)!.name}, ${item.reversed?'reversed':'upright'}`} width="480" height="800" className={item.reversed?'reversed':''}/></span><span>{positions[i].name}</span></div>)}</div>{state.question&&<blockquote className="completed-question">“{state.question}”</blockquote>}<div className="completion-actions"><button className="ritual-action" onClick={openReport}>Understand your reading <Icon name="arrow" size={17}/></button><Link className="cinema-subtle" href="/cards/">Discover the deck <Icon name="book" size={16}/></Link></div></div>}
      </section>
      <footer className="cinema-footer"><span className="journey-coordinate">{stage==='question'?'A MOMENT BETWEEN YOU & THE UNIVERSE':stage==='complete'?'THE NEXT STEP IS YOURS':`MIDNIGHT ARCANA · ${stage.toUpperCase()}`}</span><div className="cinema-footer-tools">{stage!=='question'&&<button className="cinema-subtle" onClick={()=>setResetOpen(true)}>Begin again</button>}<OfflineStatus/></div></footer>
      {notice&&<div className="cinema-notice" role="status">{notice}<button aria-label="Dismiss notice" onClick={()=>setNotice('')}>×</button></div>}
    </main>}
    <dialog ref={restartDialog} className="info-dialog" aria-labelledby="restart-title" onClose={()=>setResetOpen(false)}><button className="icon-button dialog-close" aria-label="Keep this reading" onClick={()=>setResetOpen(false)}><Icon name="close"/></button><Icon name="moon" size={30}/><h2 id="restart-title">Make space for a new story?</h2><p>This clears your current cards and question.</p><button className="button primary" onClick={reset}>Begin again <Icon name="arrow" size={17}/></button><button className="text-button keep-reading" onClick={()=>setResetOpen(false)}>Keep this reading</button></dialog>
  </>;
}
