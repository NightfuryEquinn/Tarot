import test from 'node:test';
import assert from 'node:assert/strict';
import { canTurn, nextReveal, resumeRitual } from '../src/lib/cinematic';
import { emptyReading, readingReducer, restoreReading, shuffleDeck } from '../src/lib/reading';
const deck=shuffleDeck(true,(()=>{let n=72;return()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n;};})());
test('saved readings resume question, selection, reveal, and completion without changing cards',()=>{
  assert.equal(resumeRitual(emptyReading).stage,'question');
  let reading=readingReducer(emptyReading,{type:'start',deck});
  reading=readingReducer(reading,{type:'select',index:3});
  assert.equal(resumeRitual(reading).stage,'choose');
  for(const index of [7,9,12,16])reading=readingReducer(reading,{type:'select',index});
  assert.deepEqual(resumeRitual(reading),{stage:'reveal',focus:0});
  reading=readingReducer(reading,{type:'reveal',id:deck[3].id});
  assert.deepEqual(resumeRitual(restoreReading(JSON.stringify(reading))!),{stage:'reveal',focus:1});
  assert.deepEqual(reading.deck,deck);
  for(const index of reading.selected)reading=readingReducer(reading,{type:'reveal',id:deck[index].id});
  assert.deepEqual(resumeRitual(reading),{stage:'complete',focus:4});
});
test('sequential reveals honor old readings whose cards were revealed out of order',()=>{
  let reading={...emptyReading,deck,selected:[0,1,2,3,4],revealed:[deck[1].id,deck[3].id]};
  assert.equal(resumeRitual(reading).focus,0);
  for(const focus of [0,2,4]){
    assert.equal(canTurn(reading,'reveal',focus,false),true);
    assert.equal(canTurn(reading,'reveal',focus,true),false);
    assert.equal(canTurn(reading,'choose',focus,false),false);
    reading=readingReducer(reading,{type:'reveal',id:deck[focus].id});
    assert.equal(canTurn(reading,'reveal',focus,false),false);
    assert.equal(nextReveal(reading,focus),focus===4?-1:focus+2);
  }
  assert.equal(reading.revealed.length,5);
});
test('repeated input and resumed animations cannot create a sixth card or duplicate reveal',()=>{
  let reading={...emptyReading,deck,selected:[0,1,2,3,4]};
  const chosen=reading.selected;
  for(let i=0;i<10;i++)reading=readingReducer(reading,{type:'select',index:i});
  assert.deepEqual(reading.selected,chosen);
  for(let i=0;i<10;i++)reading=readingReducer(reading,{type:'reveal',id:deck[0].id});
  assert.deepEqual(reading.revealed,[deck[0].id]);
  assert.equal(canTurn(reading,'complete',4,false),false);
  assert.deepEqual(restoreReading(JSON.stringify(reading))!.deck,deck);
});
