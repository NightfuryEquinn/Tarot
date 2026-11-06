/** Shared geometry for the DOM controls and WebGL card surfaces. */
export function fanColumns(width:number){return width>=1000?26:width<360?12:13;}
export function fanLayout(index:number,columns:number,count=78){
  const row=Math.floor(index/columns),slot=index%columns;
  const rowCount=Math.min(columns,count-row*columns);
  const offset=(columns-rowCount)/2;
  const t=rowCount>1?(slot/(rowCount-1)-.5)*2:0;
  return {row,column:slot,x:(offset+slot+.5)/columns,curve:t*t,angle:t*12};
}
export function adjacentCard(index:number,key:string,columns:number,selected:number[]){
  const step=key==='ArrowLeft'?-1:key==='ArrowRight'?1:key==='ArrowUp'?-columns:key==='ArrowDown'?columns:0;
  let next=key==='Home'?0:key==='End'?77:index+step;
  if(!step&&key!=='Home'&&key!=='End')return index;
  while(next>=0&&next<78&&selected.includes(next))next+=step|| (key==='Home'?1:-1);
  return next>=0&&next<78?next:index;
}
