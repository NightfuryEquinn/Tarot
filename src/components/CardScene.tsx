'use client';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { getProject, types } from '@theatre/core';
import animationState from '@/animation/ritual.theatre.json';
import type { DrawnCard } from '@/lib/reading';

type Props = { deck: DrawnCard[]; selected: number[]; revealed: string[]; onSelect: (index: number) => void; onReveal: (id: string) => void; onFailure: () => void };
let instance = 0;
export default function CardScene(props: Props) {
  const host = useRef<HTMLDivElement>(null);
  const current = useRef(props); current.current = props;
  const synchronize = useRef<() => void>(() => {});
  useEffect(() => { synchronize.current(); }, [props.selected, props.revealed]);
  useEffect(() => {
    if (!host.current) return;
    const container = host.current;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' }); }
    catch { current.current.onFailure(); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x0c101b, 0);
    renderer.domElement.setAttribute('aria-hidden', 'true');
    container.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, .1, 100);
    camera.position.set(0, 0.4, 14);
    const project = getProject('Midnight Arcana Ritual', { state: animationState });
    const key = String(++instance);
    const fan = project.sheet('Fan', key);
    const sheets = [fan];
    const motion = fan.object('Motion', { spread: types.number(0), shuffle: types.number(0), camera: types.number(0) });
    let live = true, frame = 0, hover = -1;
    const textures: THREE.Texture[] = [];
    const cleanups: (() => void)[] = [];
    type Playback = { sequence: { pause: () => void; play: () => Promise<boolean> } };
    const playing = new Set<Playback>();
    let paused: Playback[] = [];
    const requestRender = () => { if (!frame && live && !document.hidden) frame = requestAnimationFrame(render); };
    const backCanvas = document.createElement('canvas'); backCanvas.width = 300; backCanvas.height = 500;
    const ctx = backCanvas.getContext('2d')!;
    ctx.fillStyle = '#111b2b'; ctx.fillRect(0,0,300,500);
    ctx.strokeStyle = '#b99a60'; ctx.lineWidth = 2;
    ctx.strokeRect(12,12,276,476); ctx.strokeRect(22,22,256,456);
    ctx.globalAlpha = .45;
    for (let i = 0; i < 12; i++) { const a = i*Math.PI/6; ctx.beginPath(); ctx.moveTo(150+58*Math.cos(a),250+58*Math.sin(a)); ctx.lineTo(150+96*Math.cos(a),250+96*Math.sin(a)); ctx.stroke(); }
    ctx.globalAlpha = 1;
    ctx.beginPath(); ctx.ellipse(150,250,64,28,0,0,Math.PI*2); ctx.stroke();
    ctx.beginPath(); ctx.arc(150,250,20,0,Math.PI*2); ctx.stroke();
    for (const y of [65,435]) { ctx.beginPath(); ctx.moveTo(150,y-12); ctx.lineTo(156,y); ctx.lineTo(150,y+12); ctx.lineTo(144,y); ctx.closePath(); ctx.stroke(); }
    const back = new THREE.CanvasTexture(backCanvas); back.colorSpace = THREE.SRGBColorSpace; textures.push(back);
    const cardGeometry = new THREE.PlaneGeometry(1.36,2.28);
    const edgeGeometry = new THREE.PlaneGeometry(1.42,2.34);
    const backMaterial = new THREE.MeshBasicMaterial({ map: back });
    const edgeMaterial = new THREE.MeshBasicMaterial({ color: 0xc6a66a, side: THREE.DoubleSide });
    const loader = new THREE.TextureLoader();
    const nodes = props.deck.map((draw,index) => {
      const group = new THREE.Group();
      const frontMaterial = new THREE.MeshBasicMaterial({ color: 0xfff4da });
      const front = new THREE.Mesh(cardGeometry,frontMaterial); front.position.z=.012; front.rotation.z=draw.reversed?Math.PI:0;
      const reverse = new THREE.Mesh(cardGeometry,backMaterial); reverse.position.z=-.012; reverse.rotation.y=Math.PI;
      const edge = new THREE.Mesh(edgeGeometry,edgeMaterial);
      group.add(front,reverse,edge); group.userData.index=index; scene.add(group);
      return {group,frontMaterial,selected:0,reveal:0,loaded:false,wasSelected:false,wasRevealed:false};
    });
    const update = () => {
      const {selected,revealed} = current.current;
      nodes.forEach((node,index) => {
        const isSelected=selected.includes(index), isRevealed=revealed.includes(props.deck[index].id);
        if (isSelected && !node.wasSelected) {
          node.wasSelected=true;
          const sheet=project.sheet('Select',`${key}-${index}`);
          sheets.push(sheet);
          const object=sheet.object('Motion',{progress:types.number(0)});
          cleanups.push(object.onValuesChange(v=>{node.selected=v.progress;requestRender();}));
          playing.add(sheet); sheet.sequence.position=0; void sheet.sequence.play().then(()=>playing.delete(sheet));
        }
        if (isRevealed && !node.wasRevealed) {
          node.wasRevealed=true;
          const sheet=project.sheet('Reveal',`${key}-${index}`);
          sheets.push(sheet);
          const object=sheet.object('Motion',{progress:types.number(0)});
          cleanups.push(object.onValuesChange(v=>{node.reveal=v.progress;requestRender();}));
          playing.add(sheet); sheet.sequence.position=0; void sheet.sequence.play().then(()=>playing.delete(sheet));
        }
        if (isSelected && !node.loaded) {
          node.loaded=true;
          loader.load(`/cards/${props.deck[index].id}.webp`,texture=>{
            if(!live){texture.dispose();return;}
            texture.colorSpace=THREE.SRGBColorSpace; textures.push(texture); node.frontMaterial.map=texture;node.frontMaterial.color.set(0xffffff);node.frontMaterial.needsUpdate=true;requestRender();
          },undefined,()=>{ if(live) current.current.onFailure(); });
        }
      });
      requestRender();
    };
    synchronize.current=update;
    function render() {
      frame=0;if(!live)return;
      const values=motion.value;
      const {selected}=current.current;
      const compact=container.clientWidth<600;
      const total=props.deck.length;
      nodes.forEach((node,index)=>{
        const t=(index/(total-1)-.5);
        const angle=t*1.5;
        const spread=values.spread;
        const x=Math.sin(angle)*7.1*spread + Math.sin(index*2)*values.shuffle*.75;
        const y=(Math.cos(angle)-1)*5*spread - .5 + Math.cos(index)*values.shuffle*.12;
        const slot=selected.indexOf(index);
        const targetX=slot>=0?(slot-2)*1.85:x;
        const targetY=selected.length===5?0:1.7;
        const p=node.selected;
        node.group.position.set(THREE.MathUtils.lerp(x,targetX,p),THREE.MathUtils.lerp(y,targetY,p)+(index===hover ? .18 : 0),index*.002+p*.5);
        node.group.rotation.set(0,Math.PI*(1-node.reveal),THREE.MathUtils.lerp(-angle*spread,0,p));
        const scale=slot>=0?(selected.length===5?1.12:.8):1;
        node.group.scale.setScalar(scale);
        node.group.visible=selected.length<5||slot>=0;
      });
      camera.position.y=.3+values.camera;
      camera.position.z=compact?19:14;
      renderer.render(scene,camera);
    }
    cleanups.push(motion.onValuesChange(requestRender));
    const resize=new ResizeObserver(()=>{
      const width=container.clientWidth,height=container.clientHeight;
      renderer.setSize(width,height);camera.aspect=width/height;camera.updateProjectionMatrix();requestRender();
    }); resize.observe(container);
    const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
    const hit=(event:PointerEvent)=>{
      const rect=renderer.domElement.getBoundingClientRect();
      pointer.set(((event.clientX-rect.left)/rect.width)*2-1,-((event.clientY-rect.top)/rect.height)*2+1);
      raycaster.setFromCamera(pointer,camera);
      const intersection=raycaster.intersectObjects(nodes.filter(n=>n.group.visible).map(n=>n.group),true)[0];
      return intersection?.object.parent?.userData.index as number|undefined;
    };
    const move=(event:PointerEvent)=>{hover=hit(event)??-1;renderer.domElement.style.cursor=hover<0?'default':'pointer';requestRender();};
    let pointerStart:{x:number;y:number}|null=null;
    const down=(event:PointerEvent)=>{pointerStart={x:event.clientX,y:event.clientY};};
    const click=(event:PointerEvent)=>{
      if(!pointerStart||Math.hypot(event.clientX-pointerStart.x,event.clientY-pointerStart.y)>8){pointerStart=null;return;}
      pointerStart=null;
      const index=hit(event);if(index===undefined)return;
      if(current.current.selected.length===5){if(current.current.selected.includes(index))current.current.onReveal(props.deck[index].id);}
      else current.current.onSelect(index);
    };
    const leave=()=>{hover=-1;requestRender();};
    const visibility=()=>{
      if(document.hidden){paused=[...playing];paused.forEach(sheet=>sheet.sequence.pause());}
      else{paused.forEach(sheet=>{playing.add(sheet);void sheet.sequence.play().then(()=>playing.delete(sheet));});paused=[];requestRender();}
    };
    const lost=(event:Event)=>{event.preventDefault();current.current.onFailure();};
    renderer.domElement.addEventListener('pointerdown',down);renderer.domElement.addEventListener('pointermove',move);renderer.domElement.addEventListener('pointerup',click);renderer.domElement.addEventListener('pointerleave',leave);renderer.domElement.addEventListener('webglcontextlost',lost);
    document.addEventListener('visibilitychange',visibility);
    void project.ready.then(()=>{if(live){fan.sequence.position=0;playing.add(fan);void fan.sequence.play().then(()=>playing.delete(fan));update();}});
    return ()=>{
      live=false;synchronize.current=()=>{};cancelAnimationFrame(frame);resize.disconnect();
      playing.forEach(s=>s.sequence.pause());cleanups.forEach(fn=>fn());
      // ponytail: Theatre 0.7 can't remove a sheet, only its objects; empty sheet shells remain per reading.
      sheets.forEach(s=>s.detachObject('Motion'));
      nodes.forEach(node=>node.frontMaterial.dispose()); textures.forEach(texture=>texture.dispose());cardGeometry.dispose();edgeGeometry.dispose();backMaterial.dispose();edgeMaterial.dispose();
      document.removeEventListener('visibilitychange',visibility);
      renderer.domElement.removeEventListener('pointerdown',down);renderer.domElement.removeEventListener('pointermove',move);renderer.domElement.removeEventListener('pointerup',click);renderer.domElement.removeEventListener('pointerleave',leave);renderer.domElement.removeEventListener('webglcontextlost',lost);
      renderer.forceContextLoss();renderer.dispose();renderer.domElement.remove();
    };
  }, [props.deck]);
  return <div className="card-scene" ref={host} aria-hidden="true" />;
}
