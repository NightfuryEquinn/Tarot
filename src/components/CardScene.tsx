'use client';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { getProject, types } from '@theatre/core';
import animationState from '@/animation/ritual.theatre.json';
import { cards } from '@/data/cards';
import type { DrawnCard } from '@/lib/reading';
import type { RitualStage } from '@/lib/cinematic';

type Props={stage:RitualStage;focus:number;deck:DrawnCard[];selected:number[];revealed:string[];browse:number;skipVersion:number;onFailure:()=>void;onReady:()=>void};
let instance=0;
export default function CardScene(props:Props){
  const host=useRef<HTMLDivElement>(null),current=useRef(props);current.current=props;
  const sync=useRef<()=>void>(()=>{});
  useEffect(()=>{sync.current();},[props.stage,props.focus,props.deck,props.selected,props.revealed,props.browse,props.skipVersion]);
  useEffect(()=>{
    const container=host.current;if(!container)return;
    const world=container.parentElement!;
    let renderer:THREE.WebGLRenderer;
    try{renderer=new THREE.WebGLRenderer({alpha:true,antialias:false,powerPreference:'low-power'});}catch{current.current.onFailure();return;}
    renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<700?1.25:1.5));
    renderer.setClearColor(0x050a16,0);renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.domElement.setAttribute('aria-hidden','true');container.appendChild(renderer.domElement);
    const scene=new THREE.Scene();scene.background=new THREE.Color(0x060b17);
    const camera=new THREE.PerspectiveCamera(40,1,.1,100);
    camera.position.z=12;
    const composer=new EffectComposer(renderer),renderPass=new RenderPass(scene,camera);
    const bloom=new UnrealBloomPass(new THREE.Vector2(600,600),.35,.4,1.05);
    const finish=new ShaderPass({
      uniforms:{tDiffuse:{value:null},strength:{value:.18},time:{value:0}},
      vertexShader:'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
      fragmentShader:'uniform sampler2D tDiffuse;uniform float strength;uniform float time;varying vec2 vUv;void main(){vec4 c=texture2D(tDiffuse,vUv);float edge=smoothstep(.2,.72,distance(vUv,vec2(.5)));float grain=fract(sin(dot(vUv+fract(time)*.001,vec2(12.9898,78.233)))*43758.5453)-.5;c.rgb=c.rgb*(1.-strength*edge)+grain*.006;gl_FragColor=vec4(max(c.rgb,vec3(0.)),c.a);}'
    });
    const output=new OutputPass();composer.addPass(renderPass);composer.addPass(bloom);composer.addPass(finish);composer.addPass(output);
    const project=getProject('Midnight Arcana Celestial',{state:animationState}),key=String(++instance);
    const arrival=project.sheet('Arrival',key),arrivalMotion=arrival.object('Motion',{gather:types.number(0),camera:types.number(0),vignette:types.number(.18)});
    const fan=project.sheet('Fan',key),fanMotion=fan.object('Motion',{spread:types.number(1),shuffle:types.number(0),camera:types.number(0)});
    const finale=project.sheet('Finale',key),finaleMotion=finale.object('Motion',{progress:types.number(1),glow:types.number(0)});
    const sheets=new Set([arrival,fan,finale]),playing=new Set<typeof fan>();let paused:(typeof fan)[]=[];
    let live=true,frame=0,readySent=false,firstSync=true,last=0,time=0,slowFrames=0,wasStage: RitualStage|undefined,skip=current.current.skipVersion,loaded=false;
    const disposables:{dispose:()=>void}[]=[composer,bloom,finish,output];
    const textures:THREE.Texture[]=[];
    const play=(sheet:typeof fan)=>{sheet.sequence.pause();sheet.sequence.position=0;playing.add(sheet);void sheet.sequence.play().then(()=>playing.delete(sheet));};
    // One reusable procedural texture gives points a soft, circular light profile.
    const glowCanvas=document.createElement('canvas');glowCanvas.width=64;glowCanvas.height=64;
    const glowContext=glowCanvas.getContext('2d')!;
    const gradient=glowContext.createRadialGradient(32,32,0,32,32,32);gradient.addColorStop(0,'#fff');gradient.addColorStop(.12,'#ffffffee');gradient.addColorStop(.45,'#ffffff33');gradient.addColorStop(1,'#ffffff00');glowContext.fillStyle=gradient;glowContext.fillRect(0,0,64,64);
    const glowTexture=new THREE.CanvasTexture(glowCanvas);textures.push(glowTexture);
    for(const [x,y,color] of [[-4,1,0x335c81],[5,-1,0x4a3a70]] as const){
      const material=new THREE.SpriteMaterial({map:glowTexture,color,transparent:true,opacity:.13,depthWrite:false,blending:THREE.AdditiveBlending});
      const nebula=new THREE.Sprite(material);nebula.position.set(x,y,-9);nebula.scale.set(28,12,1);material.rotation=-.35;scene.add(nebula);disposables.push(material);
    }
    const starPositions=new Float32Array(420*3),starBase=new Float32Array(420*3);
    let seed=831;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
    for(let i=0;i<420;i++){starBase[i*3]=(rand()-.5)*27;starBase[i*3+1]=(rand()-.5)*19;starBase[i*3+2]=-2-rand()*15;}starPositions.set(starBase);
    const starGeometry=new THREE.BufferGeometry();starGeometry.setAttribute('position',new THREE.BufferAttribute(starPositions,3));
    starGeometry.setDrawRange(0,innerWidth<700?200:420);
    const starMaterial=new THREE.PointsMaterial({map:glowTexture,color:new THREE.Color(1.3,1.65,2.1),size:.065,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false});
    const stars=new THREE.Points(starGeometry,starMaterial);scene.add(stars);disposables.push(starGeometry,starMaterial);
    const haloMaterial=new THREE.SpriteMaterial({map:glowTexture,color:new THREE.Color(1.2,1.6,2.2),transparent:true,opacity:.1,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false});
    const halo=new THREE.Sprite(haloMaterial);halo.position.z=-.8;scene.add(halo);disposables.push(haloMaterial);
    const lineGeometry=new THREE.BufferGeometry();lineGeometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(15),3));
    const lineMaterial=new THREE.LineBasicMaterial({color:new THREE.Color(1.4,1.5,1.8),transparent:true,opacity:0,depthWrite:false,toneMapped:false});
    const constellation=new THREE.Line(lineGeometry,lineMaterial);scene.add(constellation);disposables.push(lineGeometry,lineMaterial);
    const backCanvas=document.createElement('canvas');backCanvas.width=300;backCanvas.height=500;const ctx=backCanvas.getContext('2d')!;
    ctx.fillStyle='#101d30';ctx.fillRect(0,0,300,500);ctx.strokeStyle='#c6ab77';ctx.lineWidth=2;ctx.strokeRect(10,10,280,480);ctx.strokeRect(20,20,260,460);
    ctx.globalAlpha=.35;ctx.beginPath();ctx.arc(150,250,87,0,Math.PI*2);ctx.stroke();
    for(let i=0;i<12;i++){const a=i*Math.PI/6;ctx.beginPath();ctx.moveTo(150+63*Math.cos(a),250+63*Math.sin(a));ctx.lineTo(150+100*Math.cos(a),250+100*Math.sin(a));ctx.stroke();}ctx.globalAlpha=1;
    ctx.beginPath();ctx.ellipse(150,250,67,30,0,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.arc(150,250,23,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.arc(150,250,6,0,Math.PI*2);ctx.fillStyle='#cfaf75';ctx.fill();
    for(const y of [65,435]){ctx.beginPath();ctx.moveTo(150,y-12);ctx.lineTo(156,y);ctx.lineTo(150,y+12);ctx.lineTo(144,y);ctx.closePath();ctx.stroke();}
    const backTexture=new THREE.CanvasTexture(backCanvas);backTexture.colorSpace=THREE.SRGBColorSpace;textures.push(backTexture);
    const geometry=new THREE.PlaneGeometry(1,1),edgeGeometry=new THREE.PlaneGeometry(1.025,1.015);
    const backMaterial=new THREE.MeshBasicMaterial({map:backTexture}),edgeMaterial=new THREE.MeshBasicMaterial({color:0xc8ac76,side:THREE.DoubleSide});disposables.push(geometry,edgeGeometry,backMaterial,edgeMaterial);
    const nodes=new Map(cards.map(card=>{
      const group=new THREE.Group(),frontMaterial=new THREE.MeshBasicMaterial({color:0xe5d8ba});
      const front=new THREE.Mesh(geometry,frontMaterial);front.position.z=.012;
      const back=new THREE.Mesh(geometry,backMaterial);back.position.z=-.012;back.rotation.y=Math.PI;
      group.add(front,back,new THREE.Mesh(edgeGeometry,edgeMaterial));group.visible=false;scene.add(group);
      const revealSheet=project.sheet('Reveal',`${key}-${card.id}`),revealObject=revealSheet.object('Motion',{progress:types.number(0)});
      const selectSheet=project.sheet('Select',`${key}-${card.id}`),selectObject=selectSheet.object('Motion',{progress:types.number(0)});
      sheets.add(revealSheet);sheets.add(selectSheet);
      disposables.push(frontMaterial);
      const node={group,front,frontMaterial,revealSheet,revealObject,selectSheet,selectObject,loaded:false,selected:false,revealed:false};
      return [card.id,node] as const;
    }));
    const loader=new THREE.TextureLoader();
    const update=()=>{
      if(!loaded||!live)return;
      const p=current.current;
      if(p.stage!==wasStage){
        if(p.stage==='gather')play(arrival);
        if(p.stage==='choose'){if(wasStage==='gather')play(fan);else fan.sequence.position=2.3;}
        if(p.stage==='complete'){if(wasStage==='reveal')play(finale);else finale.sequence.position=1.2;}
        wasStage=p.stage;
      }
      nodes.forEach((node,id)=>{
        const index=p.deck.findIndex(draw=>draw.id===id),chosen=p.selected.includes(index),turned=p.revealed.includes(id);
        if(chosen&&!node.selected){if(firstSync)node.selectSheet.sequence.position=.65;else play(node.selectSheet);}
        if(turned&&!node.revealed){if(firstSync)node.revealSheet.sequence.position=.8;else play(node.revealSheet);}
        if(!chosen)node.selectSheet.sequence.position=0;
        if(!turned)node.revealSheet.sequence.position=0;
        node.selected=chosen;node.revealed=turned;
        if(chosen&&!node.loaded){node.loaded=true;loader.load(`/cards/${id}.webp`,texture=>{
          if(!live){texture.dispose();return;}texture.colorSpace=THREE.SRGBColorSpace;textures.push(texture);node.frontMaterial.map=texture;node.frontMaterial.color.set(0xffffff);node.frontMaterial.needsUpdate=true;
        },undefined,()=>{if(live)current.current.onFailure();});}
      });
      firstSync=false;
      if(skip!==p.skipVersion){skip=p.skipVersion;playing.forEach(sheet=>sheet.sequence.pause());playing.clear();arrival.sequence.position=1.9;fan.sequence.position=2.3;finale.sequence.position=1.2;nodes.forEach(node=>{if(node.revealed)node.revealSheet.sequence.position=.8;if(node.selected)node.selectSheet.sequence.position=.65;});}
    };
    sync.current=update;
    let targets=new Map<number,DOMRect>(),focal:DOMRect|undefined,tableau:DOMRect[]=[];
    const measure=()=>{
      targets=new Map([...world.querySelectorAll<HTMLElement>('[data-card-index]')].map(el=>[Number(el.dataset.cardIndex),el.getBoundingClientRect()]));
      focal=world.querySelector('.focal-frame')?.getBoundingClientRect();
      tableau=[...world.querySelectorAll('.tableau-frame')].map(el=>el.getBoundingClientRect());
    };
    const observer=new ResizeObserver(()=>{const width=container.clientWidth,height=container.clientHeight;renderer.setSize(width,height);composer.setSize(width,height);bloom.setSize(width*.6,height*.6);camera.aspect=width/height;camera.updateProjectionMatrix();measure();});observer.observe(container);observer.observe(world);
    const rectToWorld=(rect:DOMRect)=>{
      const bounds=container.getBoundingClientRect(),height=2*Math.tan(THREE.MathUtils.degToRad(camera.fov/2))*camera.position.z,width=height*camera.aspect;
      return {x:((rect.left+rect.width/2-bounds.left)/bounds.width-.5)*width,y:(.5-(rect.top+rect.height/2-bounds.top)/bounds.height)*height,w:rect.width/bounds.width*width,h:rect.height/bounds.height*height};
    };
    function render(now:number){
      if(!live)return;frame=requestAnimationFrame(render);
      const elapsed=now-last;if(elapsed<(innerWidth<700?32:16))return;
      if(last&&elapsed>48)slowFrames++;else slowFrames=Math.max(0,slowFrames-1);
      if(slowFrames>45){bloom.enabled=false;starGeometry.setDrawRange(0,120);}
      time+=Math.min(elapsed/1000,.05);last=now;
      measure(); // HTML anchors are also the pointer and keyboard hit targets.
      const p=current.current,motion=arrivalMotion.value;camera.position.z=12-motion.camera*.5;
      finish.uniforms.strength.value=p.stage==='gather'?motion.vignette:.18;finish.uniforms.time.value=time;
      const gathering=p.stage==='gather'?motion.gather:0;
      for(let i=0;i<420;i++){starPositions[i*3]=starBase[i*3]*(1-gathering*.45)+Math.sin(time*.07+i)*.08;starPositions[i*3+1]=starBase[i*3+1]*(1-gathering*.45)+Math.sin(time*.09+i*.7)*.12;}
      starGeometry.attributes.position.needsUpdate=true;stars.rotation.z=Math.sin(time*.025)*.015;
      nodes.forEach(node=>{node.group.visible=false;});
      const place=(id:string,rect:DOMRect,rotation=0,spread=1)=>{
        const node=nodes.get(id)!;const pos=rectToWorld(rect);node.group.visible=true;
        node.group.position.set(pos.x*spread,pos.y*spread,0);node.group.scale.set(pos.w,pos.h,1);node.group.rotation.set(0,Math.PI*(1-node.revealObject.value.progress),rotation);
        const draw=p.deck.find(d=>d.id===id);node.front.rotation.z=draw?.reversed?Math.PI:0;
        return pos;
      };
      halo.visible=p.stage==='question'||p.stage==='gather'||p.stage==='reveal'||p.stage==='complete';
      halo.scale.set(5.5,5.5,1);halo.position.set(0,-.2,-.8);haloMaterial.opacity=.025+gathering*.15;
      if(p.stage==='gather'){
        p.deck.slice(0,13).forEach((draw,i)=>{const node=nodes.get(draw.id)!;node.group.visible=true;node.group.scale.set(.7,1.16,1);node.group.position.set(Math.sin(i*2)*motion.gather*.35,-.7+Math.cos(i)*motion.gather*.12,i*.005);node.group.rotation.set(0,Math.PI,(i-6)*.015);});
      }
      if(p.stage==='choose')targets.forEach((rect,index)=>{
        const draw=p.deck[index];if(!draw)return;const node=nodes.get(draw.id)!;
        if(node.selected&&node.selectObject.value.progress>=.99)return;
        const pos=place(draw.id,rect,0,fanMotion.value.spread);node.group.position.y=pos.y+node.selectObject.value.progress*1.8;node.group.scale.multiplyScalar(1-node.selectObject.value.progress*.75);
      });
      if(p.stage==='reveal'&&focal){
        const draw=p.deck[p.selected[p.focus]];if(draw){const pos=place(draw.id,focal);const progress=nodes.get(draw.id)!.revealObject.value.progress;halo.position.set(pos.x,pos.y,-.8);halo.scale.set(pos.w*2.4,pos.h*1.7,1);haloMaterial.opacity=.055+Math.sin(progress*Math.PI)*.2;}
      }
      if(p.stage==='complete'){
        const positions=p.selected.map((index,i)=>tableau[i]?place(p.deck[index].id,tableau[i]):null).filter(Boolean);
        if(positions.length===5){const array=lineGeometry.attributes.position.array as Float32Array;for(let i=0;i<5;i++){array[i*3]=positions[i]!.x;array[i*3+1]=positions[i]!.y;array[i*3+2]=-.5;}lineGeometry.attributes.position.needsUpdate=true;lineMaterial.opacity=.16*finaleMotion.value.progress;haloMaterial.opacity=.04+finaleMotion.value.glow*.06;}
      }else lineMaterial.opacity=0;
      try{composer.render();if(!readySent){readySent=true;current.current.onReady();}}catch{current.current.onFailure();cancelAnimationFrame(frame);}
    }
    const lost=(event:Event)=>{event.preventDefault();current.current.onFailure();};
    const visibility=()=>{
      if(document.hidden){cancelAnimationFrame(frame);paused=[...playing];paused.forEach(sheet=>sheet.sequence.pause());}
      else{last=0;paused.forEach(sheet=>{playing.add(sheet);void sheet.sequence.play().then(()=>playing.delete(sheet));});paused=[];frame=requestAnimationFrame(render);}
    };
    renderer.domElement.addEventListener('webglcontextlost',lost);document.addEventListener('visibilitychange',visibility);
    void project.ready.then(()=>{if(!live)return;loaded=true;update();frame=requestAnimationFrame(render);});
    return()=>{
      live=false;sync.current=()=>{};cancelAnimationFrame(frame);observer.disconnect();playing.forEach(sheet=>sheet.sequence.pause());paused.forEach(sheet=>sheet.sequence.pause());sheets.forEach(sheet=>sheet.detachObject('Motion'));
      renderer.domElement.removeEventListener('webglcontextlost',lost);document.removeEventListener('visibilitychange',visibility);textures.forEach(texture=>texture.dispose());disposables.forEach(resource=>resource.dispose());
      renderer.forceContextLoss();renderer.dispose();renderer.domElement.remove();
    };
  },[]);
  return <div ref={host} className="cinema-canvas" aria-hidden="true"/>;
}
