'use client';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { animate, createScope } from 'animejs';
import { cards } from '@/data/cards';
import { cardById, connectReading, emptyReading, meaningFor, positions, readingReducer, restoreReading, shuffleDeck, summarizeReading } from '@/lib/reading';
import { Icon } from './Icon';

const CardScene = dynamic(() => import('./CardScene'), { ssr: false, loading: () => <div className="scene-loading"><Icon name="star" /><span>Setting the table…</span></div> });
const STORAGE_KEY='midnight-arcana.reading.v1';

export function CardBack({ small=false }: {small?:boolean}) {
  return <span className={`card-back ${small?'small-back':''}`} aria-hidden="true"><span className="back-corner top">✦</span><svg viewBox="0 0 100 130" fill="none" stroke="currentColor" strokeWidth=".8"><circle cx="50" cy="65" r="30" opacity=".4"/><path d="M50 16v16m0 66v16M1 65h16m66 0h16M15 30l12 12m46 46 12 12M15 100l12-12m46-46 12-12"/><path d="M17 65Q50 33 83 65 50 97 17 65Z"/><circle cx="50" cy="65" r="13"/><circle cx="50" cy="65" r="4" fill="currentColor"/><path d="m50 5 3 6-3 6-3-6Zm0 108 3 6-3 6-3-6Z"/></svg><span className="back-corner bottom">✦</span></span>;
}

export function TarotExperience() {
  const [state,dispatch]=useReducer(readingReducer,emptyReading);
  const [hydrated,setHydrated]=useState(false);
  const [storageError,setStorageError]=useState(false);
  const [drawError,setDrawError]=useState('');
  const [reduced,setReduced]=useState(true);
  const [simple,setSimple]=useState(false);
  const [webglFailed,setWebglFailed]=useState(false);
  const [howOpen,setHowOpen]=useState(false);
  const [resetOpen,setResetOpen]=useState(false);
  const root=useRef<HTMLElement>(null);
  const ritual=useRef<HTMLElement>(null);
  const results=useRef<HTMLElement>(null);
  const hasDeck=state.deck.length>0;
  const complete=state.selected.length===5;
  const allRevealed=state.revealed.length===5;
  const draws=useMemo(()=>state.selected.map(index=>state.deck[index]),[state.deck,state.selected]);
  const connections=useMemo(()=>allRevealed?connectReading(draws):[],[allRevealed,draws]);
  const stage=!hasDeck?'prepare':!complete?'choose':!allRevealed?'reveal':'reflect';
  const canAnimate=!reduced&&!simple&&!webglFailed;

  useEffect(()=>{
    const media=window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync=()=>setReduced(media.matches);sync();media.addEventListener('change',sync);
    try{const saved=restoreReading(localStorage.getItem(STORAGE_KEY));if(saved)dispatch({type:'restore',state:saved});}catch{setStorageError(true);}
    setHydrated(true);return()=>media.removeEventListener('change',sync);
  },[]);
  useEffect(()=>{
    if(!hydrated)return;
    try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}catch{setStorageError(true);}
  },[state,hydrated]);
  useEffect(()=>{
    if(reduced||!root.current)return;
    const scope=createScope({root}).add(()=>{
      animate('.stage-enter',{opacity:[0,1],translateY:[12,0],duration:650,ease:'out(3)'});
    });
    return()=>scope.revert();
  },[stage,reduced]);
  const start=()=>{
    try{dispatch({type:'start',deck:shuffleDeck(state.reversals)});setDrawError('');}catch{setDrawError('The deck could not be shuffled. Please try again in a current browser.');}
  };
  const reset=()=>{dispatch({type:'reset'});setResetOpen(false);ritual.current?.scrollIntoView({behavior:reduced?'instant':'smooth',block:'start'});};
  const revealAll=()=>draws.forEach(draw=>dispatch({type:'reveal',id:draw.id}));

  return <main id="main" ref={root}>
    <section className="hero section-width">
      <div className="hero-copy"><span className="eyebrow"><span className="tiny-line"/> THE ANSWERS BEGIN WITH A PAUSE</span>
        <h1>A little stillness.<br/>A different<br/><em>perspective.</em></h1>
        <p>Seventy-eight stories. Five cards. One moment for you.<br className="desktop-break"/> Let the cards open a conversation with yourself.</p>
        <a className="button primary" href="#ritual">{hasDeck?'Return to your reading':'Find your reading'} <Icon name="arrow" size={18}/></a>
        <div className="hero-caption"><span className="tiny-stars">✧ ✦ ✧</span><span>NO SIGN-UP. JUST YOU AND THE CARDS.</span></div>
      </div>
      <div className="hero-art" aria-label="The Moon, The Star, and The Sun tarot cards">
        <div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="orbit orbit-three"/>
        <span className="orbit-star star-a">✦</span><span className="orbit-star star-b">✧</span><span className="orbit-star star-c">✦</span><span className="orbit-star star-d">✧</span>
        <div className="hero-card moon-card"><img src="/cards/major-18.webp" alt="The Moon" width="480" height="800"/><span>XVIII · THE MOON</span></div>
        <div className="hero-card sun-card"><img src="/cards/major-19.webp" alt="The Sun" width="480" height="800"/><span>XIX · THE SUN</span></div>
        <div className="hero-card star-card"><img src="/cards/major-17.webp" alt="The Star" width="480" height="800" fetchPriority="high"/><span>XVII · THE STAR</span></div>
        <span className="art-annotation">AS ABOVE, SO WITHIN</span>
      </div>
    </section>
    <div className="ritual-divider section-width"><span>AN OLD PRACTICE. A FRESH PERSPECTIVE.</span><span className="divider-line"/><Icon name="star" size={17}/><span className="divider-line"/><span>YOUR OWN SMALL RITUAL</span></div>

    <section className="ritual-section section-width" id="ritual" ref={ritual}>
      <div className="section-heading"><div><span className="eyebrow">01 / THE RITUAL</span><h2>Make room for <em>what’s here.</em></h2></div><button className="text-button" aria-expanded={howOpen} onClick={()=>setHowOpen(!howOpen)}>How it works <Icon name={howOpen?'close':'book'} size={16}/></button></div>
      {howOpen&&<div className="how-panel"><p>Think of a situation you’d like to explore. Shuffle, choose five face-down cards, then reveal them. Each position adds context to a card’s meaning. The connections bring the story together.</p><p>Major Arcana point to larger lessons; Minor Arcana explore everyday life. A reversal can suggest a blocked, inward, excessive, or releasing expression of a card. Readings offer possibilities, and you decide what resonates.</p></div>}
      <div className="reading-table">
        <div className="table-topline"><span><Icon name="cards" size={18}/> THE FIVE-CARD GUIDANCE SPREAD</span><span className="table-step">{stage==='prepare'?'SET YOUR INTENTION':stage==='choose'?`${state.selected.length} OF 5 SELECTED`:stage==='reveal'?`${state.revealed.length} OF 5 REVEALED`:'YOUR READING IS COMPLETE'}</span></div>
        <div className="step-tracker" aria-label="Reading progress">{['Prepare','Choose','Reveal','Reflect'].map((label,i)=><span key={label} className={['prepare','choose','reveal','reflect'].indexOf(stage)>=i?'active':''}><b>{i+1}</b>{label}</span>)}</div>
        {!hasDeck?<div className="prepare-panel stage-enter">
          <div className="intention-copy"><Icon name="moon" size={31}/><h3>First, take a breath.</h3><p>You don’t need the perfect question.<br/>Just something you’re ready to look at differently.</p></div>
          <label className="question-label" htmlFor="question">WHAT’S ON YOUR MIND? <span>OPTIONAL · ONLY SAVED ON THIS DEVICE</span></label>
          <textarea id="question" value={state.question} maxLength={300} rows={2} placeholder="What would help me move forward?" onChange={e=>dispatch({type:'question',value:e.target.value})}/>
          <div className="prepare-actions"><label className="switch-label"><input type="checkbox" checked={state.reversals} onChange={e=>dispatch({type:'reversals',value:e.target.checked})}/><span className="switch-track"/><span>Include reversed cards<small>A different expression of the same story</small></span></label><button className="button primary" disabled={!hydrated} onClick={start}><Icon name="shuffle" size={18}/> Shuffle the deck <Icon name="arrow" size={17}/></button></div>
          {drawError&&<p role="alert" className="notice">{drawError}</p>}
          <div className="spread-preview">{positions.map((position,i)=><div key={position.name}><div className="preview-outline"><span>{['I','II','III','IV','V'][i]}</span><Icon name={['sun','star','moon','star','sun'][i]} size={22}/></div><b>{position.name}</b><span>{position.prompt}</span></div>)}</div>
        </div>:<div className="draw-panel stage-enter">
          <div className="draw-intro"><div><h3>{!complete?'Let a card catch your attention.':!allRevealed?'Your five cards are waiting.':'A story, beginning to unfold.'}</h3><p>{!complete?'Choose any five. There is no wrong place to begin.':!allRevealed?'Tap each card to turn it over, one thought at a time.':'Follow the threads below. Keep what feels useful.'}</p></div><button className="text-button view-toggle" onClick={()=>setSimple(!simple)} disabled={reduced||webglFailed}>{canAnimate?'Use simple view':'Simple view'}<Icon name="cards" size={15}/></button></div>
          {state.question&&<blockquote className="question-echo">“{state.question}”</blockquote>}
          {canAnimate&&<CardScene deck={state.deck} selected={state.selected} revealed={state.revealed} onSelect={index=>dispatch({type:'select',index})} onReveal={id=>dispatch({type:'reveal',id})} onFailure={()=>setWebglFailed(true)}/>}
          {!complete&&<><div className={`selection-strip ${!canAnimate?'large-strip':''}`} role="group" aria-label="Face-down deck. Choose five cards.">{state.deck.map((draw,index)=><button key={draw.id} className={`deck-choice ${state.selected.includes(index)?'chosen':''}`} aria-label={`Choose face-down card ${index+1}`} aria-pressed={state.selected.includes(index)} disabled={state.selected.includes(index)} onClick={()=>dispatch({type:'select',index})}><CardBack small/><span>{String(index+1).padStart(2,'0')}</span>{state.selected.includes(index)&&<Icon name="check" size={17}/>}</button>)}</div><p className="deck-hint">SCROLL TO EXPLORE THE DECK <span>↔</span> {78-state.selected.length} CARDS REMAINING</p></>}
          <div className={`selected-spread ${complete?'ready-spread':''}`} role="group" aria-label="Your five-card spread">{positions.map((position,i)=>{
            const draw=draws[i],card=draw?cardById.get(draw.id):undefined,revealed=draw&&state.revealed.includes(draw.id);
            return <div className="spread-slot" key={position.name}><span className="slot-number">0{i+1}</span><button disabled={!draw||!complete||!!revealed} onClick={()=>draw&&dispatch({type:'reveal',id:draw.id})} aria-label={revealed?`${card!.name}, ${draw.reversed?'reversed':'upright'}, ${position.label}`:complete?`Reveal ${position.label} card`:`${position.label}: ${draw?'card selected':'awaiting selection'}`} className={`spread-card ${revealed?'is-revealed':''} ${draw?'has-card':''}`}>
              {revealed?<img src={card!.image} alt="" width="480" height="800" className={draw.reversed?'reversed':''}/>:draw?<CardBack/>:<Icon name="star" size={25}/>}</button><h4>{position.name}</h4>{revealed?<><p className="draw-card-name">{card!.name}</p><span className="orientation">{draw.reversed?'↧ REVERSED':'↟ UPRIGHT'}</span></>:<p>{complete?'Tap to reveal':draw?'Chosen for you':position.prompt}</p>}</div>;
          })}</div>
          <div className="draw-bottom"><p aria-live="polite">{!complete?`${state.selected.length} of 5 cards chosen`:!allRevealed?`${state.revealed.length} of 5 cards revealed`:'Your reading is ready below.'}</p>{complete&&!allRevealed&&<button className="button secondary" onClick={revealAll}>Reveal all five <Icon name="star" size={16}/></button>}{allRevealed&&<button className="button primary" onClick={()=>results.current?.scrollIntoView({behavior:reduced?'instant':'smooth'})}>Explore your reading <Icon name="arrow" size={16}/></button>}<button className="text-button muted" onClick={()=>setResetOpen(true)}>Start again</button></div>
          {resetOpen&&<div className="reset-panel" role="group" aria-label="Start a new reading"><p>Let go of this reading and clear your question?</p><button className="button secondary" onClick={reset}>Start a new reading</button><button className="text-button" onClick={()=>setResetOpen(false)}>Keep this reading</button></div>}
          {webglFailed&&<p className="small muted">The illustrated card view is active. You can continue choosing and revealing normally.</p>}
        </div>}
        {storageError&&<p className="notice" role="status">Your browser couldn’t save this reading. You can continue here, but progress may be lost when you leave.</p>}
        <div className="table-footer"><span><Icon name="moon" size={13}/> A MOMENT OF REFLECTION, NOT A FIXED FUTURE.</span><span>RIDER–WAITE–SMITH · 78 CARDS</span></div>
      </div>
    </section>
    {allRevealed&&<section className="reading-results section-width stage-enter" ref={results} tabIndex={-1}>
      <span className="eyebrow">02 / YOUR READING</span><h2>The threads <em>between the cards.</em></h2>
      <div className="synthesis"><Icon name="sun" size={35}/><div><span className="eyebrow">THE STORY OF YOUR SPREAD</span><p>{summarizeReading(draws)}</p></div></div>
      <div className="connections-grid">{connections.map((connection,i)=><article className="connection-card" key={connection.ids.join('-')}><span className="connection-number">0{i+1} <Icon name="star" size={14}/></span><span className="eyebrow">{connection.kind==='bridge'?'MAJOR MEETS MINOR':connection.kind==='tension'?'A USEFUL TENSION':connection.kind==='resonance'?'A SHARED THREAD':'ACROSS THE SPREAD'}</span><h3>{connection.title}</h3><p>{connection.text}</p></article>)}</div>
      <div className="individual-readings">{draws.map((draw,i)=>{
        const card=cardById.get(draw.id)!,meaning=meaningFor(draw);
        return <article className="individual-reading" key={draw.id}><div className="reading-image"><img src={card.image} alt={`${card.name}, ${draw.reversed?'reversed':'upright'}`} width="480" height="800" className={draw.reversed?'reversed':''}/></div><div className="reading-copy"><span className="eyebrow">0{i+1} / {positions[i].label.toUpperCase()} <span className="reading-orientation">{draw.reversed?'REVERSED':'UPRIGHT'}</span></span><h3>{card.name}</h3><div className="keywords">{meaning.keywords.map(keyword=><span key={keyword}>{keyword}</span>)}</div><p className="position-context">{positions[i].context}, this card asks you to consider {meaning.keywords[0].toLowerCase()}.</p><p>{meaning.text}</p><div className="practical-note"><Icon name="star" size={16}/><p><strong>A thought to take with you</strong>{meaning.advice}</p></div><details className="opposite-meaning"><summary>Explore the {draw.reversed?'upright':'reversed'} meaning</summary><p>{(draw.reversed?card.upright:card.reversed).text}</p></details></div></article>;
      })}</div><div className="closing-note"><span>✧</span><h3>The cards offer a perspective.<br/><em>The next step is yours.</em></h3><button className="text-button" onClick={()=>{setResetOpen(true);ritual.current?.scrollIntoView({behavior:reduced?'instant':'smooth'});}}>Begin another reading <Icon name="arrow" size={17}/></button></div>
    </section>}

    <section className="learn-section section-width" id="about"><div className="section-heading"><div><span className="eyebrow">{allRevealed?'03':'02'} / LEARN THE LANGUAGE</span><h2>Every card holds <em>a story.</em></h2></div><Link href="/cards/" className="text-button">Explore all 78 cards <Icon name="arrow" size={17}/></Link></div><div className="learn-grid"><Link href="/cards/?arcana=major" className="learn-card major-learn"><div className="learn-symbol"><Icon name="sun" size={51}/></div><span className="eyebrow">22 CARDS · THE LARGER PICTURE</span><h3>The Major Arcana</h3><p>The turning points. The lessons. The experiences that shape who you’re becoming.</p><span className="learn-link">Meet the archetypes <Icon name="arrow" size={18}/></span></Link><Link href="/cards/?arcana=minor" className="learn-card minor-learn"><div className="suit-symbols"><span>♧</span><span>♜</span><span>⚔</span><span>◇</span></div><span className="eyebrow">56 CARDS · THE EVERYDAY DETAILS</span><h3>The Minor Arcana</h3><p>Our feelings, ideas, ambitions, and earthly lives. Four suits, a world of small revelations.</p><span className="learn-link">Discover the four suits <Icon name="arrow" size={18}/></span></Link><article className="learn-card reflection-learn"><Icon name="moon" size={35}/><span className="eyebrow">A NOTE ON READING</span><h3>A mirror,<br/><em>with many angles.</em></h3><p>Tarot makes space for a different question. You bring the meaning, the context, and the freedom to choose what comes next.</p><span className="reflection-signature">Stay curious. Stay your own.</span></article></div></section>
  </main>;
}
