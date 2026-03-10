// src/components/map/Map.tsx
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { InputController, MobileJoystick } from './Input'
import { CollisionSystem } from './collision'
import { CharacterController } from './CharacterController'
import { MAP_CONFIG } from './Config'
import { NightSky } from './NightSky'
import { createNeonGridMaterial } from './Neon'

const PIN_NAMES = ['Pin008','Pin007','Pin004','Pin002','Pin005','Pin006','Pin01','Pin003']

const PIN_TO_PAGE: Record<string, string> = {
  'Pin004': 'AB1',
  'Pin007': 'FootballGround',
  'Pin01':  'GrandStairs',
  'Pin008': 'CricketGround',
  'Pin002': 'AB2',
  'Pin005': 'AB3',
  'Pin006': 'LHC',
  'Pin003': 'OldMess',
}

const OUTLINE_TARGETS  = ['AB1','AB2','AB3','LHCnew','Mess']
const HIDE_NAMES       = ['majorfloor','base_plane','ground_plane']
const NOCOLLIDE_NAMES  = new Set(PIN_NAMES)

// ── Neon bokeh floating lights ────────────────────────────────────────────────
function createBokehLights(scene: THREE.Scene): { update(t: number): void; dispose(): void } {
  const N = 60, SPREAD_R = 260, HEIGHT_LO = 4, HEIGHT_HI = 55
  const positions = new Float32Array(N * 3), phases = new Float32Array(N)
  const speeds = new Float32Array(N), sizes = new Float32Array(N)
  const colorIdx = new Float32Array(N), starFlag = new Float32Array(N)

  for (let i = 0; i < N; i++) {
    const angle = Math.random() * Math.PI * 2
    const r = Math.sqrt(Math.random()) * SPREAD_R
    positions[i*3]   = Math.cos(angle) * r
    positions[i*3+1] = HEIGHT_LO + Math.random() * (HEIGHT_HI - HEIGHT_LO)
    positions[i*3+2] = Math.sin(angle) * r
    phases[i]   = Math.random() * Math.PI * 2
    speeds[i]   = 0.08 + Math.random() * 0.16
    starFlag[i] = Math.random() < 0.35 ? 1.0 : 0.0
    sizes[i]    = starFlag[i] > 0.5 ? 14 + Math.random() * 22 : 130 + Math.random() * 200
    colorIdx[i] = Math.floor(Math.random() * 5)
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geo.setAttribute('phase',    new THREE.BufferAttribute(phases, 1))
  geo.setAttribute('spd',      new THREE.BufferAttribute(speeds, 1))
  geo.setAttribute('sz',       new THREE.BufferAttribute(sizes, 1))
  geo.setAttribute('cIdx',     new THREE.BufferAttribute(colorIdx, 1))
  geo.setAttribute('isStar',   new THREE.BufferAttribute(starFlag, 1))

  const mat = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 } },
    vertexShader: /* glsl */`
      uniform float time; attribute float phase,spd,sz,cIdx,isStar;
      varying float vAlpha,vCIdx,vStar;
      void main(){
        vec3 p=position;
        p.y+=sin(time*spd+phase)*5.5;
        p.x+=cos(time*spd*.35+phase*1.2)*2.5;
        p.z+=sin(time*spd*.28+phase*.9)*2.5;
        float tw=isStar>.5?pow(max(0.,sin(time*spd*4.+phase)),4.):.4+.6*(.5+.5*sin(time*spd*1.3+phase));
        vAlpha=tw; vCIdx=cIdx; vStar=isStar;
        vec4 mv=modelViewMatrix*vec4(p,1.); gl_Position=projectionMatrix*mv;
        gl_PointSize=sz*(160./-mv.z);
      }`,
    fragmentShader: /* glsl */`
      varying float vAlpha,vCIdx,vStar;
      vec3 nc(int ci){
        if(ci==0)return vec3(.20,.45,1.); if(ci==1)return vec3(.65,.15,1.);
        if(ci==2)return vec3(.00,.88,.82); if(ci==3)return vec3(1.,.25,.70);
        return vec3(.90,.95,1.);}
      void main(){
        vec2 uv=gl_PointCoord-.5; float d=length(uv); if(d>.5)discard;
        vec3 col=nc(int(vCIdx)); float a;
        if(vStar>.5){
          float s=max(smoothstep(.06,.0,abs(uv.x))*smoothstep(.5,.0,abs(uv.y)),
                      smoothstep(.06,.0,abs(uv.y))*smoothstep(.5,.0,abs(uv.x)));
          a=(1.-smoothstep(0.,.12,d))*.7+s*.9;
        }else{
          a=((1.-smoothstep(0.,.14,d))*.55+(1.-smoothstep(0.,.5,d))*.32)*vAlpha*.48;}
        gl_FragColor=vec4(col,a*vAlpha);}`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  })
  const pts = new THREE.Points(geo, mat)
  pts.frustumCulled = false
  scene.add(pts)
  return { update(t){ mat.uniforms.time.value=t }, dispose(){ scene.remove(pts);geo.dispose();mat.dispose() } }
}

// ── Neon building outline ─────────────────────────────────────────────────────
function createBuildingOutline(scene: THREE.Scene, box: THREE.Box3, timeRef: { value: number }): () => void {
  const pad=3, cx=(box.min.x+box.max.x)/2, cz=(box.min.z+box.max.z)/2
  const w=(box.max.x-box.min.x)+pad*2, d=(box.max.z-box.min.z)+pad*2
  const geo = new THREE.PlaneGeometry(w, d); geo.rotateX(-Math.PI/2)
  const mat = new THREE.ShaderMaterial({
    uniforms:{ time:timeRef, sz:{value:new THREE.Vector2(w,d)} },
    vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`uniform float time;uniform vec2 sz;varying vec2 vUv;void main(){
      float lw=.048+.008*sin(time*1.6);float bx=min(vUv.x,1.-vUv.x),by=min(vUv.y,1.-vUv.y);
      float bd=min(bx,by);if(bd>lw)discard;
      float arc;if(bx<by)arc=vUv.x<.5?vUv.y*sz.y:sz.x+sz.y+(1.-vUv.y)*sz.y;
      else arc=vUv.y<.5?sz.y+(1.-vUv.x)*sz.x:sz.y+sz.x+sz.y+vUv.x*sz.x;
      float dash=fract(arc*.08-time*1.6);if(dash<.30)discard;
      float pulse=.75+.25*sin(time*2.);float edge=smoothstep(lw,lw*.05,bd),glow=smoothstep(lw,0.,bd)*.5;
      vec3 col=mix(vec3(.5,1.,1.),vec3(1.,1.,1.),.6)*( 2.2+pulse*.8);gl_FragColor=vec4(col,(edge+glow)*pulse);}`,
    transparent:true, depthWrite:false, blending:THREE.AdditiveBlending, side:THREE.DoubleSide,
  })
  const mesh = new THREE.Mesh(geo, mat)
  mesh.position.set(cx, 0.04, cz); mesh.renderOrder=1; scene.add(mesh)
  return () => { scene.remove(mesh); geo.dispose(); mat.dispose() }
}

// ── Pin sparkles ──────────────────────────────────────────────────────────────
function createPinSparkles(scene: THREE.Scene, wp: THREE.Vector3): { update(t:number):void; dispose():void } {
  const N=40, ph=new Float32Array(N), sp=new Float32Array(N)
  const r=new Float32Array(N), bh=new Float32Array(N), tw=new Float32Array(N)
  const base=new Float32Array(N*3)
  for(let i=0;i<N;i++){
    ph[i]=(i/N)*Math.PI*2+Math.random()*.4; sp[i]=.4+Math.random()*.8
    r[i]=.5+Math.random()*1.2; bh[i]=Math.random()*3.2; tw[i]=Math.random()*Math.PI*2
    base[i*3]=wp.x; base[i*3+1]=wp.y; base[i*3+2]=wp.z
  }
  const geo=new THREE.BufferGeometry()
  geo.setAttribute('position',new THREE.BufferAttribute(base,3))
  geo.setAttribute('phase',new THREE.BufferAttribute(ph,1))
  geo.setAttribute('spd',new THREE.BufferAttribute(sp,1))
  geo.setAttribute('orb',new THREE.BufferAttribute(r,1))
  geo.setAttribute('bh',new THREE.BufferAttribute(bh,1))
  geo.setAttribute('tw',new THREE.BufferAttribute(tw,1))
  const mat=new THREE.ShaderMaterial({
    uniforms:{time:{value:0}},
    vertexShader:`uniform float time;attribute float phase,spd,orb,bh,tw;varying float vA;
      void main(){float t=time*spd+phase,dr=mod(time*.22+phase*.5,3.2),twk=pow(max(0.,sin(time*3.1+tw)),5.);
      vA=twk*(1.-dr/3.2)*.95+.04;
      vec3 p=vec3(position.x+cos(t)*orb,position.y-bh+dr,position.z+sin(t)*orb);
      vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=(2.+twk*8.)*(200./-mv.z);}`,
    fragmentShader:`varying float vA;void main(){vec2 uv=gl_PointCoord-.5;float d=length(uv);if(d>.5)discard;
      float s=max(smoothstep(.07,.0,abs(uv.x))*smoothstep(.5,.0,abs(uv.y)),smoothstep(.07,.0,abs(uv.y))*smoothstep(.5,.0,abs(uv.x)));
      float a=(1.-smoothstep(0.,.22,d))*.8+(1.-smoothstep(.1,.5,d))*.25+s*.6;gl_FragColor=vec4(.9,.96,1.,a*vA);}`,
    transparent:true, depthWrite:false, blending:THREE.AdditiveBlending,
  })
  const pts=new THREE.Points(geo,mat); pts.frustumCulled=false; scene.add(pts)
  return { update(t){mat.uniforms.time.value=t}, dispose(){scene.remove(pts);geo.dispose();mat.dispose()} }
}

// ── Pin ground rings ──────────────────────────────────────────────────────────
function createPinGroundRings(scene: THREE.Scene, wp: THREE.Vector3, timeRef: { value: number }): () => void {
  const RINGS=[{inner:1.4,outer:2.6},{inner:3.6,outer:4.6},{inner:6.0,outer:7.0}]
  const meshes: THREE.Mesh[]=[], mats: THREE.ShaderMaterial[]=[]
  for(const ring of RINGS){
    const geo=new THREE.RingGeometry(ring.inner,ring.outer,80,1)
    const mat=new THREE.ShaderMaterial({
      uniforms:{time:timeRef,innerR:{value:ring.inner},outerR:{value:ring.outer},centre:{value:new THREE.Vector2(wp.x,wp.z)}},
      vertexShader:`varying vec2 vWorld;void main(){vec4 p=modelMatrix*vec4(position,1.);vWorld=p.xz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader:`uniform float time,innerR,outerR;uniform vec2 centre;varying vec2 vWorld;
        void main(){float d=length(vWorld-centre),band=outerR-innerR;if(d<innerR||d>outerR)discard;
        float t=(d-innerR)/band,fill=smoothstep(0.,.25,t),rim=1.-smoothstep(.72,1.,t);
        float ang=atan(vWorld.y-centre.y,vWorld.x-centre.x),dash=smoothstep(.20,.32,fract(ang/(3.14159*2.)*12.-time*.4));
        float pulse=.70+.30*sin(time*1.8),alpha=fill*rim*dash*pulse*.95;
        vec3 col=vec3(.92,.97,1.)*(2.+pulse*.4);gl_FragColor=vec4(col,alpha);}`,
      transparent:true, depthWrite:false, blending:THREE.AdditiveBlending, side:THREE.DoubleSide,
    })
    const mesh=new THREE.Mesh(geo,mat)
    mesh.rotation.x=-Math.PI/2; mesh.position.set(wp.x,.04,wp.z); mesh.renderOrder=2
    scene.add(mesh); meshes.push(mesh); mats.push(mat)
  }
  return ()=>{ for(const m of meshes){scene.remove(m);m.geometry.dispose()} for(const m of mats)m.dispose() }
}

// ── Character ground trail ────────────────────────────────────────────────────
function createCharacterTrail(scene: THREE.Scene): { stamp(x:number,z:number):void; update(dt:number):void; dispose():void } {
  const POOL=300, BURST=10, TRAIL_LIFE=1.1
  const COLOURS=[0x00ffec,0xff00cc,0xaa44ff,0x00cfff,0xffffff,0xff44aa]
  let colourIdx=0
  const makeGeos=()=>{
    const d=new THREE.PlaneGeometry(.32,.32); d.rotateX(-Math.PI/2); d.rotateZ(Math.PI/4)
    const ts=new THREE.Shape([new THREE.Vector2(0,.22),new THREE.Vector2(.19,-.12),new THREE.Vector2(-.19,-.12)])
    const tri=new THREE.ShapeGeometry(ts); tri.rotateX(-Math.PI/2)
    const ring=new THREE.RingGeometry(.12,.22,6); ring.rotateX(-Math.PI/2)
    const sq=new THREE.PlaneGeometry(.20,.20); sq.rotateX(-Math.PI/2)
    return [d,tri,ring,sq]
  }
  const geoT=makeGeos()
  type P={mesh:THREE.Mesh;mat:THREE.MeshBasicMaterial;age:number;active:boolean;vx:number;vz:number}
  const pool: P[]=[]
  for(let i=0;i<POOL;i++){
    const geo=geoT[i%geoT.length].clone()
    const mat=new THREE.MeshBasicMaterial({color:0x00ffec,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide})
    const mesh=new THREE.Mesh(geo,mat); mesh.renderOrder=3; mesh.visible=false; scene.add(mesh)
    pool.push({mesh,mat,age:0,active:false,vx:0,vz:0})
  }
  let head=0
  return {
    stamp(x,z){
      for(let b=0;b<BURST;b++){
        const p=pool[head%POOL]; head++
        const angle=Math.random()*Math.PI*2, r=.1+Math.random()*.7
        p.age=0; p.active=true; p.vx=Math.cos(angle)*r; p.vz=Math.sin(angle)*r
        p.mesh.position.set(x+p.vx*.15,.06,z+p.vz*.15); p.mesh.rotation.y=Math.random()*Math.PI*2
        p.mesh.scale.setScalar(.5+Math.random()*1.1); p.mesh.visible=true
        p.mat.color.setHex(COLOURS[colourIdx%COLOURS.length]); colourIdx++; p.mat.opacity=1
      }
    },
    update(dt){
      for(const p of pool){
        if(!p.active)continue; p.age+=dt; const prog=p.age/TRAIL_LIFE
        if(prog>=1){p.active=false;p.mesh.visible=false;continue}
        p.mesh.position.x+=p.vx*dt*2.2; p.mesh.position.z+=p.vz*dt*2.2
        p.mesh.rotation.y+=dt*1.5; p.mat.opacity=Math.pow(1-prog,1.4)
        p.mesh.scale.setScalar((.5+(1-prog)*1.1)*(1-prog*.5))
      }
    },
    dispose(){
      for(const p of pool){scene.remove(p.mesh);p.mesh.geometry.dispose();p.mat.dispose()}
      geoT.forEach(g=>g.dispose())
    },
  }
}

// ─────────────────────────────────────────────────────────────────────────────
export default function Map({ onPinClick, activePage }: { onPinClick?: (page: string) => void; activePage?: string | null }) {
  const mountRef     = useRef<HTMLDivElement>(null)
  const activePageRef = useRef(activePage)
  activePageRef.current = activePage

  useEffect(() => {
    const mount = mountRef.current; if (!mount) return

    // ── Renderer ──────────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias:true, powerPreference:'high-performance' })
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
    renderer.setSize(innerWidth, innerHeight)
    renderer.shadowMap.enabled    = true
    renderer.shadowMap.type       = THREE.PCFSoftShadowMap
    renderer.outputColorSpace     = THREE.SRGBColorSpace
    renderer.toneMapping          = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure  = 1.1
    mount.appendChild(renderer.domElement)

    // ── Scene ─────────────────────────────────────────────────────────────────
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(MAP_CONFIG.skyColor)
    scene.fog = new THREE.FogExp2(MAP_CONFIG.fogColor, MAP_CONFIG.fogDensity * 0.55)

    // ── Camera ────────────────────────────────────────────────────────────────
    const camera = new THREE.PerspectiveCamera(60, innerWidth/innerHeight, 0.1, 1200)
    camera.position.set(0, 20, 40)

    // ── Lights ────────────────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xddeeff, 0.75))
    const sun = new THREE.DirectionalLight(0xe0f0ff, 1.9)
    sun.position.set(60,120,60); sun.castShadow=true
    sun.shadow.mapSize.set(MAP_CONFIG.shadowMapSize, MAP_CONFIG.shadowMapSize)
    sun.shadow.camera.near=0.5; sun.shadow.camera.far=500
    sun.shadow.camera.left=sun.shadow.camera.bottom=-150
    sun.shadow.camera.right=sun.shadow.camera.top=150
    sun.shadow.bias=-0.0004; scene.add(sun)
    const fill = new THREE.DirectionalLight(0xadd8ff, 0.55)
    fill.position.set(-60,50,-60); scene.add(fill)

    // ── Neon grid floor ───────────────────────────────────────────────────────
    const neonMat  = createNeonGridMaterial()
    const floorGeo = new THREE.PlaneGeometry(2000,2000,1,1)
    const floorMesh = new THREE.Mesh(floorGeo, neonMat)
    floorMesh.rotation.x = -Math.PI/2; scene.add(floorMesh)
    const sharedTime = neonMat.uniforms.time as { value: number }

    // ── Loading helpers ───────────────────────────────────────────────────────
    const barEl  = document.getElementById('map-bar')
    const textEl = document.getElementById('map-text')
    const setProg = (p:number, msg?:string) => {
      if(barEl) barEl.style.width=p+'%'
      if(msg && textEl) textEl.textContent=msg
    }
    const gltfLoader = new GLTFLoader()
    const loadGLTF = (url:string, a:number, b:number, label:string) =>
      new Promise<{scene:THREE.Group;animations:THREE.AnimationClip[]}>((res,rej) =>
        gltfLoader.load(url, g=>{setProg(b,label+' loaded');res(g)}, xhr=>{if(xhr.lengthComputable)setProg(a+(xhr.loaded/xhr.total)*(b-a))}, rej)
      )

    // ── Runtime state ─────────────────────────────────────────────────────────
    let raf = 0
    let charCtrl: CharacterController | null = null
    let mobileSprint = false
    const clock    = new THREE.Clock()
    const nightSky = new NightSky(scene)
    const isTouch  = window.matchMedia('(pointer: coarse)').matches

    const pins:     { obj:THREE.Object3D; baseY:number; phase:number; name:string }[] = []
    const sparkles: { update(t:number):void; dispose():void }[] = []
    const outlines: (()=>void)[] = []
    const pinRings: (()=>void)[] = []
    const trail          = createCharacterTrail(scene)
    let   trailTimer     = 0
    const TRAIL_INTERVAL = 0.09
    let   lastTrailPos   = new THREE.Vector3()
    const INTERACT_RADIUS   = 12
    const AUTO_CLOSE_RADIUS = 20
    const pinWorldPositions: { name:string; pos:THREE.Vector3 }[] = []
    let nearbyPin: string | null = null
    const promptEl = document.getElementById('pin-prompt')
    const WORLD_Y  = new THREE.Vector3(0,1,0)
    const bokeh    = createBokehLights(scene)

    // ── Pin prompt interaction ─────────────────────────────────────────────────
    const handlePromptClick = () => {
      if(!onPinClick) return
      if(activePageRef.current){ onPinClick(activePageRef.current); return }
      if(nearbyPin){ const page=PIN_TO_PAGE[nearbyPin]; if(page) onPinClick(page) }
    }
    if(promptEl){
      promptEl.addEventListener('click', handlePromptClick)
      if(isTouch) promptEl.innerHTML='Tap here to interact'
    }
    const pinKeyHandler = (e:KeyboardEvent) => {
      if(e.code!=='KeyE' && e.key!=='e' && e.key!=='E') return
      if(!onPinClick) return
      if(activePageRef.current){ onPinClick(activePageRef.current); return }
      if(nearbyPin){ const page=PIN_TO_PAGE[nearbyPin]; if(page) onPinClick(page) }
    }
    window.addEventListener('keydown', pinKeyHandler)

    // ── JOYSTICK + INPUT — created immediately, before async asset load ───────
    // Critical: if these are created inside the async block, the character
    // won't respond to input until models finish loading (5-10s delay).
    const isTouchDevice = window.matchMedia('(pointer: coarse)').matches
    const joyBase  = document.getElementById('joy-base')
    const joyKnob  = document.getElementById('joy-knob')
    const sprintBtn = document.getElementById('joy-sprint')

    const joystick = isTouchDevice && joyBase && joyKnob
      ? new MobileJoystick(joyBase, joyKnob)
      : new MobileJoystick(document.createElement('div'), document.createElement('div'))

    const inputCtrl = new InputController()

    // Sprint button — hold for sprint on mobile
    if(isTouchDevice && sprintBtn){
      sprintBtn.addEventListener('touchstart', e=>{ e.preventDefault(); mobileSprint=true; sprintBtn.classList.add('active') }, { passive:false })
      const stopSprint=()=>{ mobileSprint=false; sprintBtn.classList.remove('active') }
      sprintBtn.addEventListener('touchend',    stopSprint, { passive:true })
      sprintBtn.addEventListener('touchcancel', stopSprint, { passive:true })
    }

    // ── Render loop — starts immediately, character updates once loaded ───────
    const tick = () => {
      raf = requestAnimationFrame(tick)
      const dt = Math.min(clock.getDelta(), 0.05)
      const t  = clock.getElapsedTime()

      sharedTime.value += dt
      if(charCtrl && neonMat.uniforms.charPos)
        (neonMat.uniforms.charPos as {value:THREE.Vector3}).value.copy(charCtrl.position)

      // Pins
      for(const p of pins){
        p.obj.rotateOnWorldAxis(WORLD_Y, dt*0.28)
        p.obj.position.y = p.baseY + Math.sin(t*1.1+p.phase)*0.09
      }
      for(const sp of sparkles) sp.update(t)
      bokeh.update(t)

      // ── Character — joystick always available here ────────────────────────
      if(charCtrl){
        const joy = joystick.getInput()
        charCtrl.update(dt, inputCtrl, {
          x:      joy.x,
          y:      joy.y,
          sprint: joy.sprint || mobileSprint,
          active: joy.active,
        })
      }

      // Speed indicator
      const speedEl = document.getElementById('speed-indicator')
      if(speedEl) speedEl.classList.toggle('sprinting', inputCtrl.isSprinting() || mobileSprint)

      // Trail
      if(charCtrl){
        trailTimer += dt
        const moved = charCtrl.position.distanceTo(lastTrailPos)
        if(trailTimer>=TRAIL_INTERVAL && moved>0.08){
          trail.stamp(charCtrl.position.x, charCtrl.position.z)
          lastTrailPos.copy(charCtrl.position)
          trailTimer=0
        }
      }
      trail.update(dt)

      // Pin proximity
      if(charCtrl && promptEl){
        let closest: string|null=null, closestDist=Infinity
        for(const pw of pinWorldPositions){
          const dx=charCtrl.position.x-pw.pos.x, dz=charCtrl.position.z-pw.pos.z
          const dist=Math.sqrt(dx*dx+dz*dz)
          if(dist<INTERACT_RADIUS && dist<closestDist && PIN_TO_PAGE[pw.name]){ closest=pw.name; closestDist=dist }
        }
        nearbyPin=closest
        if(nearbyPin){
          promptEl.style.opacity='1'
          promptEl.style.transform=isTouch?'translate(-50%,-50%) scale(1)':'translate(-50%,0) scale(1)'
        } else {
          promptEl.style.opacity='0'
          promptEl.style.transform=isTouch?'translate(-50%,calc(-50% + 8px)) scale(.95)':'translate(-50%,8px) scale(.95)'
        }
        if(activePageRef.current && onPinClick){
          let stillNear=false
          for(const pw of pinWorldPositions){
            if(PIN_TO_PAGE[pw.name]!==activePageRef.current) continue
            const dx=charCtrl.position.x-pw.pos.x, dz=charCtrl.position.z-pw.pos.z
            if(Math.sqrt(dx*dx+dz*dz)<AUTO_CLOSE_RADIUS){ stillNear=true; break }
          }
          if(!stillNear) onPinClick(activePageRef.current)
        }
      }

      nightSky.update(dt, camera.position)
      renderer.render(scene, camera)
    }

    // ── Async asset load ──────────────────────────────────────────────────────
    ;(async()=>{
      try{
        setProg(5,'Loading map…')
        const mapGLTF = await loadGLTF(MAP_CONFIG.mapModelPath,5,55,'Map')
        const bldBoxMap: Record<string,THREE.Box3>={}

        mapGLTF.scene.traverse(c=>{
          const obj=c as THREE.Mesh, name=obj.name, nl=name.toLowerCase()
          if(HIDE_NAMES.some(n=>name===n||nl.includes(n.toLowerCase()))){ obj.visible=false; return }
          const s=obj.scale
          if(s.x<0||s.y<0||s.z<0){
            if(obj.isMesh&&obj.geometry){
              obj.geometry=obj.geometry.clone()
              obj.geometry.applyMatrix4(new THREE.Matrix4().makeScale(s.x<0?-1:1,s.y<0?-1:1,s.z<0?-1:1))
              const nor=obj.geometry.attributes.normal
              if(nor){for(let i=0;i<nor.count;i++){if(s.x<0)nor.setX(i,-nor.getX(i));if(s.y<0)nor.setY(i,-nor.getY(i));if(s.z<0)nor.setZ(i,-nor.getZ(i))};nor.needsUpdate=true}
            }
            s.set(Math.abs(s.x),Math.abs(s.y),Math.abs(s.z))
          }
          if(obj.isMesh){
            obj.castShadow=obj.receiveShadow=true
            for(const bn of OUTLINE_TARGETS){
              if(name===bn||nl===bn.toLowerCase()){
                obj.updateWorldMatrix(true,false)
                const mb=new THREE.Box3().setFromObject(obj)
                if(!bldBoxMap[bn])bldBoxMap[bn]=mb.clone(); else bldBoxMap[bn].union(mb)
              }
            }
          }
        })
        mapGLTF.scene.updateMatrixWorld(true)
        scene.add(mapGLTF.scene)
        mapGLTF.scene.updateMatrixWorld(true)

        for(const [bn,box] of Object.entries(bldBoxMap)){
          outlines.push(createBuildingOutline(scene,box,sharedTime))
          console.log(`[Outline] '${bn}'`)
        }
        const mapBox=new THREE.Box3().setFromObject(mapGLTF.scene)
        const mapSize=mapBox.getSize(new THREE.Vector3())
        console.log('[Map] size',mapSize)

        mapGLTF.scene.traverse(c=>{
          if(!PIN_NAMES.includes(c.name)) return
          c.updateWorldMatrix(true,false)
          const wp=new THREE.Vector3(); c.getWorldPosition(wp)
          pins.push({obj:c,baseY:c.position.y,phase:Math.random()*Math.PI*2,name:c.name})
          pinWorldPositions.push({name:c.name,pos:wp.clone()})
          sparkles.push(createPinSparkles(scene,wp))
          pinRings.push(createPinGroundRings(scene,wp,sharedTime))
          console.log(`[Pin] '${c.name}' at`,wp.toArray().map((v:number)=>v.toFixed(1)))
        })
        console.log(`[Pins] ${pins.length} registered`)

        setProg(55,'Loading character…')
        const charGLTF = await loadGLTF(MAP_CONFIG.characterModelPath,55,90,'Character')
        charGLTF.scene.traverse(c=>{ const m=c as THREE.Mesh; if(m.isMesh){m.castShadow=m.receiveShadow=true} })
        charGLTF.scene.updateMatrixWorld(true)
        const rawH=new THREE.Box3().setFromObject(charGLTF.scene).getSize(new THREE.Vector3()).y||1
        const targetH=Math.max(mapSize.x,mapSize.z)*0.015
        charGLTF.scene.scale.setScalar(targetH/rawH)
        charGLTF.scene.updateMatrixWorld(true)
        const charHeight=new THREE.Box3().setFromObject(charGLTF.scene).getSize(new THREE.Vector3()).y
        scene.add(charGLTF.scene)
        console.log(`[Char] height=${charHeight.toFixed(2)}`)

        const collision=new CollisionSystem(
          mapGLTF.scene,
          name=>!NOCOLLIDE_NAMES.has(name),
          name=>!NOCOLLIDE_NAMES.has(name)
        )
        const INSET=2
        collision.setBoundary(
          new THREE.Vector2(mapBox.min.x+INSET,mapBox.min.z+INSET),
          new THREE.Vector2(mapBox.max.x-INSET,mapBox.max.z-INSET)
        )
        const spawnProbe=new THREE.Vector3(0,50,0)
        const groundY=collision.getGroundY(spawnProbe,charHeight)
        const spawnPos=new THREE.Vector3(0,groundY,0)
        lastTrailPos.copy(spawnPos)
        console.log('[Spawn] groundY=',groundY)

        // CharacterController created after models load (needs collision + charHeight)
        charCtrl=new CharacterController({
          model:      charGLTF.scene,
          mixer:      charGLTF.animations.length ? new THREE.AnimationMixer(charGLTF.scene) : null,
          animations: charGLTF.animations,
          camera, collision, mapBounds:mapBox, spawnPos, charHeight,
        })

        setProg(100,'Ready!')
        const loadEl=document.getElementById('map-loading')
        if(loadEl) setTimeout(()=>{ loadEl.style.opacity='0'; setTimeout(()=>loadEl.remove(),700) },300)
        const hint=document.getElementById('map-hint')
        if(hint&&isTouch) hint.textContent='Drag joystick · Hold RUN to sprint · Tap to interact'
        setTimeout(()=>{ if(hint) hint.style.opacity='0' },6000)

      }catch(err){
        console.error('[Map] load error:',err)
        if(textEl) textEl.textContent='Error loading — see console.'
      }
    })()

    // Start render loop immediately
    tick()

    const onResize=()=>{ camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth,innerHeight) }
    window.addEventListener('resize', onResize)

    return ()=>{
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('keydown', pinKeyHandler)
      promptEl?.removeEventListener('click', handlePromptClick)
      inputCtrl.destroy()
      nightSky.destroy()
      neonMat.dispose(); floorGeo.dispose()
      sparkles.forEach(s=>s.dispose())
      pinRings.forEach(d=>d())
      bokeh.dispose(); trail.dispose()
      outlines.forEach(d=>d())
      renderer.dispose()
      if(mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement)
    }
  }, [])

  return (
    <>
      <style>{`
        *,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
        html,body,#root{width:100%;height:100%;overflow:hidden;background:#000;touch-action:none}

        #screentone{
          position:fixed;inset:0;pointer-events:none;z-index:50;
          background-image:radial-gradient(circle,rgba(0,0,0,.22) 1px,transparent 1px);
          background-size:4px 4px;mix-blend-mode:multiply;
        }
        #screentone::after{content:'';position:absolute;inset:0;
          background-image:repeating-linear-gradient(-45deg,transparent,transparent 3px,rgba(0,0,0,.055) 3px,rgba(0,0,0,.055) 4px);
          mix-blend-mode:multiply;}
        #screentone::before{content:'';position:absolute;inset:0;
          background:radial-gradient(ellipse at 50% 40%,transparent 35%,rgba(0,0,0,.62) 100%);}

        #map-loading{position:fixed;inset:0;background:#08080f;display:flex;flex-direction:column;
          align-items:center;justify-content:center;z-index:9999;transition:opacity .7s ease;}
        #map-loading h1{color:#e4ddd4;font-size:1.9rem;font-weight:300;letter-spacing:.45em;
          text-transform:uppercase;font-family:system-ui,sans-serif;margin-bottom:2rem;}
        #map-bar-wrap{width:260px;height:2px;background:#1a1a2a;border-radius:2px;overflow:hidden}
        #map-bar{height:100%;width:0%;background:linear-gradient(90deg,#00ffec,#ff00ff);
          border-radius:2px;transition:width .25s ease}
        #map-text{margin-top:1rem;color:#44445a;font-size:.72rem;letter-spacing:.22em;
          text-transform:uppercase;font-family:system-ui,sans-serif}

        #map-hint{position:fixed;top:20px;left:50%;transform:translateX(-50%);
          background:rgba(0,0,0,.55);backdrop-filter:blur(8px);
          border:1px solid rgba(255,255,255,.10);border-radius:8px;
          padding:8px 22px;color:rgba(255,255,255,.72);font-size:.72rem;letter-spacing:.13em;
          text-transform:uppercase;font-family:system-ui,sans-serif;pointer-events:none;
          transition:opacity 1.2s ease;z-index:100;white-space:nowrap;}

        #speed-indicator{position:fixed;top:20px;right:20px;background:rgba(0,0,0,.55);
          backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.10);border-radius:8px;
          padding:8px 14px;color:rgba(255,255,255,.6);font-size:.7rem;letter-spacing:.12em;
          text-transform:uppercase;font-family:system-ui,sans-serif;pointer-events:none;
          display:flex;align-items:center;gap:8px;opacity:0;
          transition:opacity .3s,color .3s,border-color .3s;z-index:100;}
        #speed-indicator.sprinting{opacity:1;color:#ff6b35;border-color:rgba(255,107,53,.35)}
        .spd-dot{width:6px;height:6px;border-radius:50%;background:currentColor;
          animation:sdp .6s ease-in-out infinite alternate}
        @keyframes sdp{from{transform:scale(1);opacity:1}to{transform:scale(1.6);opacity:.4}}

        #joy-zone{display:none}
        @media(pointer:coarse){
          #joy-zone{display:block;position:fixed;bottom:0;left:0;width:240px;height:240px;
            pointer-events:all;z-index:200;}
          #joy-base{position:absolute;bottom:28px;left:28px;width:130px;height:130px;
            border-radius:50%;
            background:radial-gradient(circle at 50% 50%,rgba(10,0,30,.82) 0%,rgba(20,5,55,.75) 55%,rgba(80,0,160,.18) 100%);
            border:1.5px solid transparent;background-clip:padding-box;
            box-shadow:0 0 0 1.5px rgba(140,80,255,.55),0 0 22px rgba(100,40,255,.35),0 0 55px rgba(60,0,180,.22),inset 0 0 20px rgba(180,100,255,.08);
            backdrop-filter:blur(6px);touch-action:none;}
          #joy-base::before{content:'';position:absolute;inset:6px;border-radius:50%;
            border:1px dashed rgba(160,100,255,.30);animation:joyOrbit 8s linear infinite;}
          #joy-base::after{content:'';position:absolute;inset:18px;border-radius:50%;
            border:1px solid rgba(100,200,255,.15);box-shadow:inset 0 0 12px rgba(80,160,255,.12);}
          @keyframes joyOrbit{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
          #joy-knob{width:50px;height:50px;border-radius:50%;
            background:radial-gradient(circle at 35% 35%,#c084fc 0%,#7c3aed 40%,#4c1d95 75%,#1e0a3c 100%);
            border:1.5px solid rgba(200,160,255,.70);position:absolute;left:50%;top:50%;
            transform:translate(-50%,-50%);
            box-shadow:0 0 12px rgba(168,85,247,.80),0 0 30px rgba(124,58,237,.50),0 0 55px rgba(88,28,135,.30),inset 0 0 10px rgba(255,255,255,.15);
            cursor:grab;touch-action:none;transition:box-shadow .15s ease;}
          #joy-sprint{display:flex;align-items:center;justify-content:center;
            position:absolute;bottom:36px;right:20px;width:62px;height:62px;border-radius:50%;
            background:radial-gradient(circle at 40% 35%,#f472b6 0%,#db2777 45%,#831843 100%);
            border:1.5px solid rgba(251,182,206,.65);
            box-shadow:0 0 14px rgba(236,72,153,.70),0 0 32px rgba(190,24,93,.40),inset 0 0 10px rgba(255,255,255,.12);
            color:rgba(255,220,235,.95);font-size:.58rem;font-weight:800;letter-spacing:.10em;
            text-transform:uppercase;font-family:system-ui,sans-serif;cursor:pointer;
            touch-action:none;user-select:none;transition:box-shadow .12s ease,transform .12s ease;}
          #joy-sprint.active{box-shadow:0 0 24px rgba(251,113,133,1),0 0 60px rgba(236,72,153,.80);
            transform:scale(0.93);animation:sprintPulse .35s ease-in-out infinite alternate;}
          @keyframes sprintPulse{
            from{box-shadow:0 0 18px rgba(251,113,133,.9),0 0 45px rgba(236,72,153,.6)}
            to{box-shadow:0 0 30px rgba(253,164,175,1),0 0 80px rgba(251,113,133,.8)}}
        }
        #jump-btn{display:none !important}

        #pin-prompt{position:fixed;bottom:80px;left:50%;transform:translate(-50%,8px) scale(.95);
          background:rgba(0,0,0,.7);backdrop-filter:blur(12px);
          border:1px solid rgba(77,216,230,.35);border-radius:10px;
          padding:10px 28px;color:rgba(255,255,255,.85);font-size:.82rem;letter-spacing:.1em;
          text-transform:uppercase;font-family:'Orbitron',system-ui,sans-serif;
          opacity:0;transition:opacity .3s ease,transform .3s ease,background .2s ease;
          z-index:100;white-space:nowrap;box-shadow:0 0 20px rgba(77,216,230,.12);
          cursor:pointer;pointer-events:auto;user-select:none;}
        @media(max-width:768px){#pin-prompt{bottom:20%;}}
        #pin-prompt:active{background:rgba(77,216,230,.25);transform:translate(-50%,0) scale(.98) !important;}
        #pin-prompt kbd{display:inline-block;padding:2px 10px;margin:0 4px;
          background:rgba(77,216,230,.18);border:1px solid rgba(77,216,230,.45);
          border-radius:5px;color:#4dd8e6;font-weight:700;font-family:'Orbitron',monospace;font-size:.9rem;}
      `}</style>

      <div style={{position:'fixed',inset:0,width:'100vw',height:'100vh'}}>
        <div ref={mountRef} style={{width:'100%',height:'100%'}} />
        <div id="screentone" />
        <div id="map-loading">
          <h1>World</h1>
          <div id="map-bar-wrap"><div id="map-bar" /></div>
          <div id="map-text">Loading assets…</div>
        </div>
        <div id="map-hint">WASD · Space jump · Shift sprint · Drag to orbit</div>
        <div id="speed-indicator"><span className="spd-dot" />Sprinting</div>
        <div id="pin-prompt">Press <kbd>E</kbd> to interact</div>
        <div id="joy-zone">
          <div id="joy-base"><div id="joy-knob" /></div>
          <div id="joy-sprint">RUN</div>
        </div>
      </div>
    </>
  )
}
