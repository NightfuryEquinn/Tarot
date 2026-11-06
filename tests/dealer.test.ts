import test from 'node:test';
import assert from 'node:assert/strict';
import { adjacentCard,fanColumns,fanLayout } from '../src/lib/dealer';

test('all 78 rotated cards fit in the available fan area, including short screens',()=>{
  for(const [width,height] of [[296,160],[351,280],[406,110],[650,220],[760,300],[1160,420]]){
    const columns=fanColumns(width);
    const positions=Array.from({length:78},(_,index)=>fanLayout(index,columns,width,height));
    assert.equal(new Set(positions.map(p=>`${p.x},${p.row*p.rowHeight+p.y}`)).size,78);
    for(const p of positions){
      const radians=Math.abs(p.angle)*Math.PI/180;
      const halfWidth=(p.width*Math.cos(radians)+p.height*Math.sin(radians))/2;
      const halfHeight=(p.height*Math.cos(radians)+p.width*Math.sin(radians))/2;
      const centerY=p.row*p.rowHeight+p.y;
      assert.ok(p.x-halfWidth>=-1e-6&&p.x+halfWidth<=width+1e-6,`${width}×${height}: card clipped horizontally`);
      assert.ok(centerY-halfHeight>=-1e-6&&centerY+halfHeight<=height+1e-6,`${width}×${height}: card clipped vertically`);
      assert.ok(p.hitWidth>0&&p.height>0);
    }
    assert.ok(positions[0].angle<0&&positions[columns-1].angle>0);
    assert.ok(positions[0].y>positions[Math.floor(columns/2)].y);
  }
});

test('keyboard navigation reaches every card in either fan arrangement and skips chosen cards',()=>{
  for(const columns of [26,39]){
    let index=0;
    const visited=new Set([index]);
    for(let n=1;n<78;n++){index=adjacentCard(index,'ArrowRight',columns,[]);visited.add(index);}
    assert.equal(visited.size,78);
    assert.equal(adjacentCard(0,'ArrowDown',columns,[]),columns);
    assert.equal(adjacentCard(columns,'ArrowUp',columns,[]),0);
    assert.equal(adjacentCard(0,'ArrowRight',columns,[1,2]),3);
    assert.equal(adjacentCard(0,'End',columns,[77]),76);
    assert.equal(adjacentCard(77,'Home',columns,[0]),1);
  }
});
