import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const { getProject, types }=createRequire(import.meta.url)('@theatre/core') as typeof import('@theatre/core');
import state from '../src/animation/ritual.theatre.json';

test('committed Theatre sequences produce a closed deck, expanded fan, and complete reveal',async()=>{
  const project=getProject('Midnight Arcana Animation Test',{state});
  await project.ready;
  const fan=project.sheet('Fan');
  const fanObject=fan.object('Motion',{spread:types.number(0),shuffle:types.number(0),camera:types.number(0)});
  fan.sequence.position=0;assert.equal(fanObject.value.spread,0);
  fan.sequence.position=.25;assert.equal(fanObject.value.shuffle,1);
  fan.sequence.position=2.3;assert.equal(fanObject.value.spread,1);assert.equal(fanObject.value.shuffle,0);assert.equal(fanObject.value.camera,0);
  for(const [name,duration] of [['Select',.65],['Reveal',.8]] as const){
    const sheet=project.sheet(name);const motion=sheet.object('Motion',{progress:types.number(0)});
    sheet.sequence.position=0;assert.equal(motion.value.progress,0);
    sheet.sequence.position=duration/2;assert.ok(motion.value.progress>0&&motion.value.progress<1);
    sheet.sequence.position=duration;assert.equal(motion.value.progress,1);
  }
});
