"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";

/** A purely decorative scene. Cards and reading state never enter WebGL. */
export default function CelestialScene({
  onFailure,
}: {
  onFailure: () => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const failure = useRef(onFailure);
  failure.current = onFailure;
  useEffect(() => {
    const container = host.current;
    if (!container) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: false,
        powerPreference: "low-power",
      });
    } catch {
      failure.current();
      return;
    }
    container.appendChild(renderer.domElement);
    const mobile = matchMedia("(pointer: coarse)").matches || innerWidth < 768;
    const ratio = Math.min(devicePixelRatio, mobile ? 1 : 1.4);
    renderer.setPixelRatio(ratio);
    renderer.setClearColor(0x090e19, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 50);
    camera.position.z = 8;
    const resources: { dispose: () => void }[] = [];
    let composer: EffectComposer;
    let bloom: UnrealBloomPass;
    try {
      composer = new EffectComposer(renderer);
      bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.55, 0.65, 0.8);
      const output = new OutputPass();
      composer.addPass(new RenderPass(scene, camera));
      composer.addPass(bloom);
      composer.addPass(output);
      resources.push(composer, bloom, output);
    } catch {
      renderer.dispose();
      renderer.domElement.remove();
      failure.current();
      return;
    }
    const nebula = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: false,
      uniforms: { time: { value: 0 }, aspect: { value: 1 } },
      vertexShader:
        "varying vec2 vUv; void main(){vUv=uv;gl_Position=vec4(position.xy,1.,1.);}",
      fragmentShader: `varying vec2 vUv; uniform float time; uniform float aspect;
        void main(){
          vec2 p=vUv-vec2(.7,.58);p.x*=aspect;
          float a=atan(p.y,p.x), r=length(p);
          float mist=exp(-r*3.8)*(.6+.4*sin(a*3.+r*6.-time*.06));
          float ribbon=exp(-abs(p.y+sin(p.x*3.+time*.035)*.1)*9.)*exp(-abs(p.x)*1.5);
          vec3 color=mix(vec3(.16,.22,.36),vec3(.37,.24,.16),smoothstep(-.3,.7,p.x));
          gl_FragColor=vec4(color,clamp(mist*.3+ribbon*.15,0.,.4));
        }`,
    });
    const planeGeometry = new THREE.PlaneGeometry(2, 2);
    const plane = new THREE.Mesh(planeGeometry, nebula);
    plane.frustumCulled = false;
    scene.add(plane);
    resources.push(planeGeometry, nebula);
    const count = mobile ? 100 : 220;
    const positions = new Float32Array(count * 3);
    let seed = 782;
    const random = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (random() - 0.5) * 22;
      positions[i * 3 + 1] = (random() - 0.5) * 15;
      positions[i * 3 + 2] = -random() * 9;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { time: { value: 0 }, pixelRatio: { value: ratio } },
      vertexShader: `uniform float time; uniform float pixelRatio; varying float glow;
        void main(){vec4 p=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*p;
        glow=.65+.35*sin(time*.4+position.x*3.);gl_PointSize=clamp(26./-p.z,1.5,5.)*pixelRatio;}`,
      fragmentShader: `varying float glow;void main(){float d=length(gl_PointCoord-.5);
        float a=exp(-d*d*22.)*glow;gl_FragColor=vec4(vec3(1.8,1.5,1.05),a);}`,
    });
    const stars = new THREE.Points(geometry, material);
    scene.add(stars);
    resources.push(geometry, material);
    let live = true,
      frame = 0,
      previous = 0,
      lastRender = 0,
      time = 0,
      slow = 0,
      degraded = false;
    const resize = () => {
      const w = container.clientWidth,
        h = container.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h);
      composer.setSize(w, h);
      // Keep the same glow on phones with a smaller offscreen bloom buffer.
      bloom.setSize(w * 0.4, h * 0.4);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      nebula.uniforms.aspect.value = w / h;
    };
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();
    const render = (now: number) => {
      if (!live || document.hidden) return;
      frame = requestAnimationFrame(render);
      if (previous)
        slow = now - previous > 55 ? slow + 1 : Math.max(0, slow - 0.5);
      previous = now;
      if (slow > 45 && !degraded) {
        degraded = true;
        renderer.setPixelRatio(0.75);
        composer.setPixelRatio(0.75);
        geometry.setDrawRange(0, Math.min(count, 70));
        resize();
      }
      const interval = 1000 / (mobile || degraded ? 30 : 45);
      if (lastRender && now - lastRender < interval - 0.5) return;
      time += lastRender ? Math.min((now - lastRender) / 1000, 0.1) : 0;
      lastRender = now;
      stars.rotation.z = Math.sin(time * 0.025) * 0.035;
      material.uniforms.time.value = time;
      nebula.uniforms.time.value = time;
      try {
        composer.render();
      } catch {
        cancelAnimationFrame(frame);
        failure.current();
      }
    };
    const visibility = () => {
      cancelAnimationFrame(frame);
      previous = 0;
      lastRender = 0;
      if (!document.hidden) frame = requestAnimationFrame(render);
    };
    const lost = (event: Event) => {
      event.preventDefault();
      cancelAnimationFrame(frame);
      failure.current();
    };
    renderer.domElement.addEventListener("webglcontextlost", lost);
    document.addEventListener("visibilitychange", visibility);
    visibility();
    return () => {
      live = false;
      cancelAnimationFrame(frame);
      observer.disconnect();
      document.removeEventListener("visibilitychange", visibility);
      renderer.domElement.removeEventListener("webglcontextlost", lost);
      resources.forEach((resource) => resource.dispose());
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
  }, []);
  return (
    <div
      ref={host}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-[5] [&>canvas]:block"
    />
  );
}
