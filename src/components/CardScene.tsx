'use client';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';
import { getProject, types } from '@theatre/core';
import animationState from '@/animation/ritual.theatre.json';
import { cards } from '@/data/cards';
import type { DrawnCard } from '@/lib/reading';
import type { Locale } from '@/lib/locale';
import type { RitualStage } from '@/lib/cinematic';

type Props={stage:RitualStage;focus:number;deck:DrawnCard[];selected:number[];revealed:string[];preview:number|null;pending:boolean;generation:number;locale:Locale;onIntroComplete:(generation:number)=>void;onPickComplete:(generation:number)=>void;skipVersion:number;onFailure:()=>void;onReady:()=>void};
let instance=0;
export default function CardScene(props:Props){
  const host=useRef<HTMLDivElement>(null),current=useRef(props);current.current=props;
  const sync=useRef<()=>void>(()=>{});
  useEffect(()=>{sync.current();},[props.stage,props.focus,props.deck,props.selected,props.revealed,props.preview,props.pending,props.generation,props.locale,props.skipVersion]);
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
    // FXAA works on display-space color, after the single output conversion.
    const output=new OutputPass(),fxaa=new ShaderPass(FXAAShader);
    composer.addPass(renderPass);composer.addPass(bloom);composer.addPass(finish);composer.addPass(output);composer.addPass(fxaa);
    const drawingSize=new THREE.Vector2();
    const resize=()=>{
      const width=Math.max(1,container.clientWidth),height=Math.max(1,container.clientHeight);
      renderer.setSize(width,height);composer.setSize(width,height);bloom.setSize(width*.6,height*.6);
      renderer.getDrawingBufferSize(drawingSize);
      fxaa.uniforms.resolution.value.set(1/drawingSize.x,1/drawingSize.y);
      camera.aspect=width/height;camera.updateProjectionMatrix();
    };
    resize();
    const project=getProject('Midnight Arcana Celestial',{state:animationState}),key=String(++instance);
    const arrival=project.sheet('Arrival',key),arrivalMotion=arrival.object('Motion',{gather:types.number(0),camera:types.number(0),vignette:types.number(.18)});
    const fan=project.sheet('Fan',key),fanMotion=fan.object('Motion',{spread:types.number(1),shuffle:types.number(0),camera:types.number(0)});
    const finale=project.sheet('Finale',key),finaleMotion=finale.object('Motion',{progress:types.number(1),glow:types.number(0)});
    const dealer=project.sheet('Dealer',key),dealerMotion=dealer.object('Motion',{progress:types.number(0)});
    const sheets=new Set([arrival,fan,finale,dealer]),playing=new Set<typeof fan>();let paused:(typeof fan)[]=[];
    let live=true,frame=0,readySent=false,firstSync=true,layoutDirty=true,snapFrames=0,last=0,lastDraw=0,time=0,slowFrames=0,wasStage: RitualStage|undefined,skip=current.current.skipVersion,loaded=false,introCompleteSent=false,pickCompleted=0,generation=current.current.generation,lowPower=false;
    const disposables:{dispose:()=>void}[]=[composer,bloom,finish,output,fxaa];
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
      const backFace=backMaterial.clone(),edgeFace=edgeMaterial.clone();
      backFace.transparent=true;edgeFace.transparent=true;frontMaterial.transparent=true;
      disposables.push(backFace,edgeFace);
      const back=new THREE.Mesh(geometry,backFace);back.position.z=-.012;back.rotation.y=Math.PI;
      group.add(front,back,new THREE.Mesh(edgeGeometry,edgeFace));group.visible=false;scene.add(group);
      const revealSheet=project.sheet('Reveal',`${key}-${card.id}`),revealObject=revealSheet.object('Motion',{progress:types.number(0)});
      const selectSheet=project.sheet('Select',`${key}-${card.id}`),selectObject=selectSheet.object('Motion',{progress:types.number(0)});
      sheets.add(revealSheet);sheets.add(selectSheet);
      disposables.push(frontMaterial);
      const node={group,front,frontMaterial,backFace,edgeFace,targetPosition:new THREE.Vector3(),targetScale:new THREE.Vector3(),targetRotation:0,opacity:0,initialized:false,revealSheet,revealObject,selectSheet,selectObject,loaded:false,selected:false,revealed:false};
      return [card.id,node] as const;
    }));
    const loader=new THREE.TextureLoader();
    const update=()=>{
      if(!loaded||!live)return;
      const p=current.current;layoutDirty=true;
      if(generation!==p.generation){generation=p.generation;introCompleteSent=false;pickCompleted=0;wasStage=undefined;playing.forEach(sheet=>sheet.sequence.pause());playing.clear();nodes.forEach(node=>{node.initialized=false;node.opacity=0;node.selected=false;node.revealed=false;});}
      if(p.stage!==wasStage){
        if(p.stage==='gather'){introCompleteSent=false;play(dealer);play(arrival);}
        if(p.stage==='choose'){dealer.sequence.position=3.2;fan.sequence.position=2.3;}
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
      if(skip!==p.skipVersion){snapFrames=2;skip=p.skipVersion;playing.forEach(sheet=>sheet.sequence.pause());playing.clear();dealer.sequence.position=3.2;arrival.sequence.position=1.9;fan.sequence.position=2.3;finale.sequence.position=1.2;nodes.forEach(node=>{if(node.revealed)node.revealSheet.sequence.position=.8;if(node.selected)node.selectSheet.sequence.position=.65;});}
    };
    sync.current=update;
    let targets=new Map<number,DOMRect>(),angles=new Map<number,number>(),focal:DOMRect|undefined,preview:DOMRect|undefined,tableau:DOMRect[]=[],tray:DOMRect[]=[];
    let bounds=container.getBoundingClientRect();
    const measure=()=>{
      bounds=container.getBoundingClientRect();layoutDirty=false;
      targets=new Map([...world.querySelectorAll<HTMLElement>('[data-card-index]')].map(el=>[Number(el.dataset.cardIndex),(el.querySelector('.dealer-card-position')??el).getBoundingClientRect()]));
      angles=new Map([...world.querySelectorAll<HTMLElement>('[data-card-index]')].map(el=>[Number(el.dataset.cardIndex),Number(el.dataset.angle)||0]));
      preview=world.querySelector('.preview-frame')?.getBoundingClientRect();
      tray=[...world.querySelectorAll('.tray-frame')].map(el=>el.getBoundingClientRect());
      focal=world.querySelector('.focal-frame')?.getBoundingClientRect();
      tableau=[...world.querySelectorAll('.tableau-frame')].map(el=>el.getBoundingClientRect());
    };
    const observer=new ResizeObserver(()=>{resize();layoutDirty=true;});observer.observe(container);observer.observe(world);
    const markLayout=()=>{layoutDirty=true;};window.addEventListener('resize',markLayout);window.addEventListener('scroll',markLayout,{passive:true});document.fonts?.addEventListener('loadingdone',markLayout);
    const rectToWorld=(rect:DOMRect)=>{
      const height=2*Math.tan(THREE.MathUtils.degToRad(camera.fov/2))*camera.position.z,width=height*camera.aspect;
      return {x:((rect.left+rect.width/2-bounds.left)/bounds.width-.5)*width,y:(.5-(rect.top+rect.height/2-bounds.top)/bounds.height)*height,w:rect.width/bounds.width*width,h:rect.height/bounds.height*height};
    };
    function render(now:number){
      if(!live)return;frame=requestAnimationFrame(render);
      const interval=1000/(lowPower?30:60),elapsed=now-last;if(elapsed<interval-.5)return;
      const delta=lastDraw?Math.min((now-lastDraw)/1000,.08):1/60;lastDraw=now;
      if(last&&elapsed>48)slowFrames++;else slowFrames=Math.max(0,slowFrames-1);
      if(slowFrames>45){lowPower=true;bloom.enabled=false;fxaa.enabled=false;starGeometry.setDrawRange(0,120);}
      time+=delta;last=now-(elapsed%interval);
      if(layoutDirty)measure(); // Read layout only after a state, viewport, or scroll change.
      const p=current.current,motion=arrivalMotion.value;camera.position.z=12-motion.camera*.5;
      finish.uniforms.strength.value=p.stage==='gather'?motion.vignette:.18;finish.uniforms.time.value=time;
      const progress=dealerMotion.value.progress;
      const gathering=p.stage==='gather'?Math.sin(progress*Math.PI):0;
      for(let i=0;i<420;i++){starPositions[i*3]=starBase[i*3]*(1-gathering*.45)+Math.sin(time*.07+i)*.08;starPositions[i*3+1]=starBase[i*3+1]*(1-gathering*.45)+Math.sin(time*.09+i*.7)*.12;}
      starGeometry.attributes.position.needsUpdate=true;stars.rotation.z=Math.sin(time*.025)*.015;
      const active=new Set<string>();
      const place=(id:string,rect:DOMRect,rotation=0,spread=1)=>{
        const node=nodes.get(id)!;const pos=rectToWorld(rect);active.add(id);
        node.group.renderOrder=p.deck.findIndex(draw=>draw.id===id)+1;
        node.targetPosition.set(pos.x*spread,pos.y*spread,0);node.targetScale.set(pos.w,pos.h,1);node.targetRotation=rotation;
        const draw=p.deck.find(d=>d.id===id);node.front.rotation.z=draw?.reversed?Math.PI:0;
        return pos;
      };
      halo.visible=p.stage==='question'||p.stage==='gather'||p.stage==='reveal'||p.stage==='complete';
      halo.scale.set(5.5,5.5,1);halo.position.set(0,-.2,-.8);haloMaterial.opacity=.025+gathering*.15;
      const smooth=(value:number)=>{const t=THREE.MathUtils.clamp(value,0,1);return t*t*(3-2*t);};
      if(p.stage==='gather'){
        // One timeline retains each mesh from the deck through the final fan position.
        const cut=smooth((progress-.12)/.15)*(1-smooth((progress-.48)/.18));
        const spread=smooth((progress-.69)/.31);
        p.deck.forEach((draw,i)=>{
          const rect=targets.get(i);if(!rect)return;
          const node=nodes.get(draw.id)!,pos=place(draw.id,rect),side=i%2?1:-1;
          const riffle=smooth((progress-(.38+i/78*.2))/.08);
          const packet=smooth((progress-.12)/.15)*(1-riffle);
          const stackX=side*packet*1.05;
          const stackY=-.35+Math.sin(riffle*Math.PI)*.22+Math.sin(i*.18+progress*10)*packet*.08;
          node.targetPosition.set(THREE.MathUtils.lerp(stackX,pos.x,spread),THREE.MathUtils.lerp(stackY,pos.y,spread),THREE.MathUtils.lerp(i*.003,0,spread));
          node.targetScale.set(THREE.MathUtils.lerp(.8,pos.w,spread),THREE.MathUtils.lerp(1.33,pos.h,spread),1);
          node.targetRotation=THREE.MathUtils.lerp(side*cut*.22,THREE.MathUtils.degToRad(-(angles.get(i)??0)),spread);
        });
        haloMaterial.opacity=.07+cut*.12;halo.scale.set(5,5,1);
      }
      if(p.stage==='choose'){
        targets.forEach((rect,index)=>{
          const draw=p.deck[index];if(!draw||p.selected.includes(index))return;
          const lifted=p.preview===index&&preview;
          place(draw.id,lifted?preview!:rect,lifted?0:THREE.MathUtils.degToRad(-(angles.get(index)??0)));
          if(lifted){nodes.get(draw.id)!.targetPosition.z=.08;nodes.get(draw.id)!.group.renderOrder=200;}
        });
        p.selected.forEach((index,slot)=>{if(tray[slot])place(p.deck[index].id,tray[slot]);});
      }
      if(p.stage==='reveal'&&focal){
        const draw=p.deck[p.selected[p.focus]];if(draw){const pos=place(draw.id,focal);const progress=nodes.get(draw.id)!.revealObject.value.progress;halo.position.set(pos.x,pos.y,-.8);halo.scale.set(pos.w*2.4,pos.h*1.7,1);haloMaterial.opacity=.055+Math.sin(progress*Math.PI)*.2;}
      }
      if(p.stage==='complete'){
        const positions=p.selected.map((index,i)=>tableau[i]?place(p.deck[index].id,tableau[i]):null).filter(Boolean);
        if(positions.length===5){const array=lineGeometry.attributes.position.array as Float32Array;for(let i=0;i<5;i++){array[i*3]=positions[i]!.x;array[i*3+1]=positions[i]!.y;array[i*3+2]=-.5;}lineGeometry.attributes.position.needsUpdate=true;lineMaterial.opacity=.16*finaleMotion.value.progress;haloMaterial.opacity=.04+finaleMotion.value.glow*.06;}
      }else lineMaterial.opacity=0;
      const blend=snapFrames>0?1:1-Math.exp(-9*delta);
      nodes.forEach((node,id)=>{
        const visible=active.has(id);
        if(visible&&!node.initialized){node.initialized=true;node.group.position.copy(node.targetPosition);node.group.scale.copy(node.targetScale).multiplyScalar(.9);}
        node.opacity=THREE.MathUtils.lerp(node.opacity,visible?1:0,blend);
        node.group.visible=node.opacity>.008;
        if(!node.group.visible)return;
        node.group.position.lerp(node.targetPosition,blend);node.group.scale.lerp(node.targetScale,blend);
        node.group.rotation.y=Math.PI*(1-node.revealObject.value.progress);
        node.group.rotation.z=THREE.MathUtils.lerp(node.group.rotation.z,node.targetRotation,blend);
        node.frontMaterial.opacity=node.opacity;node.backFace.opacity=node.opacity;node.edgeFace.opacity=node.opacity;
      });
      const settled=(node:typeof nodes extends Map<string,infer N>?N:never)=>node.group.position.distanceTo(node.targetPosition)<.012&&node.group.scale.distanceTo(node.targetScale)<.012;
      if(p.stage==='gather'&&progress>=.999&&!introCompleteSent&&p.deck.every(draw=>settled(nodes.get(draw.id)!))){introCompleteSent=true;current.current.onIntroComplete(generation);}
      if(p.stage==='choose'&&p.pending&&p.selected.length>pickCompleted){const node=nodes.get(p.deck[p.selected[p.selected.length-1]].id)!;if(node.selectObject.value.progress>=.999&&settled(node)){pickCompleted=p.selected.length;current.current.onPickComplete(generation);}}
      if(snapFrames>0)snapFrames--;
      try{composer.render();if(!readySent){readySent=true;current.current.onReady();}}catch{current.current.onFailure();cancelAnimationFrame(frame);}
    }
    const lost=(event:Event)=>{event.preventDefault();current.current.onFailure();};
    const visibility=()=>{
      if(document.hidden){cancelAnimationFrame(frame);paused=[...playing];paused.forEach(sheet=>sheet.sequence.pause());}
      else{last=0;lastDraw=0;layoutDirty=true;paused.forEach(sheet=>{playing.add(sheet);void sheet.sequence.play().then(()=>playing.delete(sheet));});paused=[];frame=requestAnimationFrame(render);}
    };
    renderer.domElement.addEventListener('webglcontextlost',lost);document.addEventListener('visibilitychange',visibility);
    void project.ready.then(()=>{if(!live)return;loaded=true;update();frame=requestAnimationFrame(render);});
    return()=>{
      live=false;document.fonts?.removeEventListener('loadingdone',markLayout);window.removeEventListener('resize',markLayout);window.removeEventListener('scroll',markLayout);sync.current=()=>{};cancelAnimationFrame(frame);observer.disconnect();playing.forEach(sheet=>sheet.sequence.pause());paused.forEach(sheet=>sheet.sequence.pause());sheets.forEach(sheet=>sheet.detachObject('Motion'));
      renderer.domElement.removeEventListener('webglcontextlost',lost);document.removeEventListener('visibilitychange',visibility);textures.forEach(texture=>texture.dispose());disposables.forEach(resource=>resource.dispose());
      renderer.forceContextLoss();renderer.dispose();renderer.domElement.remove();
    };
  },[]);
  return <div ref={host} className="cinema-canvas" aria-hidden="true"/>;
}
