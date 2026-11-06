import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { cards } from '../src/data/cards';
import { connectReading, emptyReading, meaningFor, randomInt, readingReducer, restoreReading, shuffleDeck, summarizeReading, type DrawnCard } from '../src/lib/reading';
function rng(seed=76543){return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed;};}

test('complete deck includes original content, both orientations, and every local image',()=>{
  assert.equal(cards.length,78);assert.equal(new Set(cards.map(c=>c.id)).size,78);
  assert.equal(cards.filter(c=>c.arcana==='major').length,22);
  for(const suit of ['wands','cups','swords','pentacles'])assert.equal(cards.filter(c=>c.suit===suit).length,14);
  for(const card of cards){
    assert.ok(existsSync(`public${card.image}`),card.id);
    assert.notEqual(card.upright.text,card.reversed.text);
    for(const meaning of [card.upright,card.reversed]){
      assert.ok(meaning.text.split(/\s+/).length>=35,card.id);assert.ok(meaning.advice.length>35);assert.equal(meaning.keywords.length,3);assert.ok(meaning.themes.length>=2);
    }
  }
  assert.equal(cards.find(c=>c.id==='major-08')?.name,'Strength');
  assert.equal(cards.find(c=>c.id==='major-11')?.name,'Justice');
});
test('shuffle is a unique permutation and upright-only respects preference',()=>{
  const a=shuffleDeck(true,rng()),b=shuffleDeck(true,rng(321));
  assert.equal(a.length,78);assert.equal(new Set(a.map(c=>c.id)).size,78);assert.notDeepEqual(a,b);
  assert.ok(a.some(c=>c.reversed));assert.ok(a.some(c=>!c.reversed));assert.ok(shuffleDeck(false,rng()).every(c=>!c.reversed));
});
test('random range rejects out-of-range entropy instead of introducing modulo bias',()=>{
  const values=[0xffffffff,0xfffffffe,7];
  assert.equal(randomInt(3,()=>values.shift()!),2);
  assert.throws(()=>randomInt(0));
});
test('selection is limited to five unique cards and reveals cannot precede a full selection',()=>{
  let state=readingReducer(emptyReading,{type:'start',deck:shuffleDeck(true,rng())});
  state=readingReducer(state,{type:'select',index:1});
  assert.equal(readingReducer(state,{type:'select',index:1}),state);
  assert.equal(readingReducer(state,{type:'select',index:100}),state);
  assert.equal(readingReducer(state,{type:'reveal',id:state.deck[1].id}),state);
  for(const index of [2,3,4,5])state=readingReducer(state,{type:'select',index});
  assert.equal(readingReducer(state,{type:'select',index:6}),state);
  state=readingReducer(state,{type:'reveal',id:state.deck[1].id});
  assert.equal(state.revealed.length,1);
  assert.equal(readingReducer(state,{type:'reveal',id:state.deck[1].id}),state);
  assert.deepEqual(restoreReading(JSON.stringify(state)),state);
});
test('invalid persisted data is rejected without partially restoring a reading',()=>{
  assert.equal(restoreReading('{'),null);
  assert.equal(restoreReading(JSON.stringify({...emptyReading,version:2})),null);
  assert.equal(restoreReading(JSON.stringify({...emptyReading,selected:[0]})),null);
  const deck=shuffleDeck(false,rng());
  assert.equal(restoreReading(JSON.stringify({...emptyReading,deck,selected:[0,0]})),null);
  assert.equal(restoreReading(JSON.stringify({...emptyReading,deck,selected:[0],revealed:[deck[0].id]})),null);
  const corrupt=structuredClone(deck);corrupt[0].id='unknown';
  assert.equal(restoreReading(JSON.stringify({...emptyReading,deck:corrupt})),null);
});
test('connections respect actual draws and include a major/minor bridge when available',()=>{
  const draws:DrawnCard[]=[{id:'major-01',reversed:false},{id:'wands-01',reversed:false},{id:'cups-02',reversed:true},{id:'major-08',reversed:true},{id:'pentacles-08',reversed:false}];
  const connections=connectReading(draws);
  assert.equal(connections.length,3);assert.ok(connections.some(c=>c.kind==='bridge'));
  assert.equal(new Set(connections.map(c=>c.ids.join(','))).size,3);
  for(const connection of connections){for(const id of connection.ids)assert.ok(draws.some(d=>d.id===id));assert.ok(!connection.text.includes('undefined'));}
  const summary=summarizeReading(draws);assert.ok(summary.includes('Strength reversed'));assert.ok(summary.includes('Eight of Pentacles'));
});
test('all-major and all-minor spreads do not invent a cross-arcana relationship',()=>{
  for(const arcana of ['major','minor']){
    const draws=cards.filter(c=>c.arcana===arcana).slice(0,5).map(c=>({id:c.id,reversed:true}));
    const connections=connectReading(draws);
    assert.equal(connections.length,3);assert.ok(connections.every(c=>c.kind!=='bridge'));
    assert.ok(summarizeReading(draws).length>100);
  }
});
test('reversing cards changes the chosen meaning and connected reading',()=>{
  const upright:DrawnCard[]=['major-01','wands-01','cups-02','major-08','pentacles-08'].map(id=>({id,reversed:false}));
  const reversed=upright.map(c=>({...c,reversed:true}));
  assert.notDeepEqual(connectReading(upright),connectReading(reversed));
  assert.equal(meaningFor(reversed[0]),cards.find(c=>c.id===reversed[0].id)!.reversed);
});
test('reset removes the question and current reading while keeping the reversal preference',()=>{
  const state={...emptyReading,question:'A private question',reversals:false,deck:shuffleDeck(false,rng()),selected:[1]};
  assert.deepEqual(readingReducer(state,{type:'reset'}),{...emptyReading,reversals:false});
});
test('a committed selection prevents a second deck from replacing the reading',()=>{
  const first=shuffleDeck(true,rng()),next=shuffleDeck(true,rng(543));
  const ready=readingReducer(emptyReading,{type:'start',deck:first});
  assert.deepEqual(readingReducer(ready,{type:'start',deck:next}).deck,next);
  const selected=readingReducer(ready,{type:'select',index:3});
  assert.equal(readingReducer(selected,{type:'start',deck:next}),selected);
});
