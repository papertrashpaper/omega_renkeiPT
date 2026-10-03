// Distances are metres; y points south. Geometry is independent of rendering.
export const ROLES=['H1','MT','D1','D3','H2','ST','D2','D4'];
export const SYMBOLS=['○','×','△','□'];
export const CFG={radius:20,walk:6.25,sprint:8.125,sprintDuration:10,sprintCooldown:60,maleRadius:10,lineHalfWidth:5,flareRadius:5,stackRadius:6,knockback:15};
export const EVENTS=[{time:0,label:'連携プログラムPT 詠唱'},{time:3,label:'詠唱完了'},{time:5.5,label:'記号・距離デバフ付与'},{time:7.5,label:'男女・目 出現'},{time:11.3,label:'武器攻撃 予兆'},{time:11.5,label:'武器着弾・記号消失'},{time:17.5,label:'目・ファイラ／頭割り付与'},{time:25.5,label:'中央から15m吹き飛ばし'},{time:29,label:'男5人の円範囲・頭割り'}];
export const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export const rot=(p,a)=>({x:p.x*Math.cos(a)-p.y*Math.sin(a),y:p.x*Math.sin(a)+p.y*Math.cos(a)});
export const polar=(r,a)=>({x:r*Math.sin(a),y:-r*Math.cos(a)});
const shuffle=(arr,rng)=>{const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
export function random(seed){let a=seed>>>0;return()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
export function assignSides(players){
  const sides=players.map(p=>p.initialSide),leftOut=[],rightOut=[];
  for(let s=0;s<4;s++) for(let side=0;side<2;side++){
    const pair=players.filter(p=>p.symbol===s&&p.initialSide===side);
    if(pair.length===2)(side===0?leftOut:rightOut).push(pair.sort((a,b)=>b.priority-a.priority)[0].id);
  }
  for(const id of leftOut)sides[id]=1;for(const id of rightOut)sides[id]=0;
  return sides;
}
export function headSides(players,stackIds){
  const sides=players.map(p=>p.side);let exchanged=[];
  if(sides[stackIds[0]]===sides[stackIds[1]]){
    const a=stackIds.map(id=>players[id]).sort((a,b)=>b.priority-a.priority)[0];
    const b=players.find(p=>p.symbol===a.symbol&&p.id!==a.id);
    sides[a.id]=1-sides[a.id];sides[b.id]=1-sides[b.id];exchanged=[a.id,b.id];
  }
  return {sides,exchanged};
}
export const distanceOK=(mode,d)=>mode==='far'?d>=38-1e-7:d>=15-1e-7&&d<=20+1e-7;
// Coordinates use the tips/feet of the reference icons, not their heads.
export const BOSS_LAYOUT={male:{x:8,y:-4},female:{x:-8,y:4},otherFemale:{x:-8,y:-8},otherMale:{x:0,y:0}};
export function bosses(s){return Object.fromEntries(Object.entries(BOSS_LAYOUT).map(([k,p])=>[k,rot(p,s.weaponAngle)]));}
export function weaponHits(s,point,margin=0){
  const p=rot(point,-s.weaponAngle),m=BOSS_LAYOUT.male,f=BOSS_LAYOUT.female;
  const dm=dist(p,m),male=s.male==='sword'?dm<10+margin:dm>10-margin;
  const len=Math.hypot(f.x,f.y),ux=-f.x/len,uy=-f.y/len;
  const dx=p.x-f.x,dy=p.y-f.y,along=dx*ux+dy*uy,across=-dx*uy+dy*ux;
  const staff=Math.abs(along)<5+margin||Math.abs(across)<5+margin;
  return {male,female:s.female==='staff'?staff:Math.abs(across)>5-margin};
}
export function openingTarget(p,side=p.initialSide){return {x:(side===0?-1:1)*[6,8,8,6][p.priority],y:[-7,-2.3,2.3,7][p.priority]};}
export function psTarget(s,p){
  const row=p.side===1&&s.mode==='far'?3-p.symbol:p.symbol;
  const ys=s.mode==='far'?[-18.3,-5.5,5.5,18.3]:[-17.5,-5.5,5.5,17.5];
  const x=s.mode==='far'?Math.sqrt(19.5*19.5-ys[row]*ys[row]):8.5;
  return rot({x:(p.side===0?-1:1)*x,y:ys[row]},s.eyeAngle);
}
export function stackTarget(s,p,pre=false){
  const side=s.headSides[p.id],direction=side===0?-Math.PI/2:s.mode==='far'?Math.PI/2:Math.PI;
  // 2m + 15m knockback, then move to the middle/far safe pockets.
  const r=pre?2:s.mode==='far'?19.4:13.5;
  const base=polar(r,direction+s.knockAngle);
  if(pre)return base;
  const peers=s.players.filter(q=>s.headSides[q.id]===side),i=peers.findIndex(q=>q.id===p.id);
  return {x:base.x+(i%2?0.12:-0.12),y:base.y+(i<2?0.12:-0.12)};
}
export function lateBosses(s){return [-Math.PI/4,0,Math.PI/4,3*Math.PI/4,5*Math.PI/4].map(a=>polar(13.5,a+s.knockAngle));}
export function safeWeaponTarget(s,p){
  const desired=psTarget(s,p);let best=null,score=Infinity;
  for(let x=-17;x<=17;x+=0.5)for(let y=-17;y<=17;y+=0.5){
    const q={x,y},h=weaponHits(s,q,0.65);if(Math.hypot(x,y)>18||h.male||h.female)continue;
    const cost=dist(q,desired)+0.2*Math.hypot(x,y);if(cost<score){score=cost;best=q;}
  }
  if(!best)throw Error('No weapon safe point');return best;
}
export function createScenario(options={}){
  const seed=options.seed??Math.floor(Math.random()*4294967296),rng=random(seed);
  const choose=(v,a)=>v&&v!=='random'?v:a[Math.floor(rng()*a.length)];
  const angle=v=>v!==undefined&&v!=='random'?Number(v)*Math.PI/4:Math.floor(rng()*8)*Math.PI/4;
  const symbols=shuffle([0,0,1,1,2,2,3,3],rng);
  const players=ROLES.map((role,id)=>({id,role,priority:id%4,initialSide:id<4?0:1,symbol:symbols[id],side:0,x:(id<4?-1:1)*(1+(id%4)*0.4),y:1+(id%4)*0.7,alive:true}));
  players.forEach(p=>Object.assign(p,openingTarget(p)));
  const sides=assignSides(players);players.forEach(p=>p.side=sides[p.id]);
  // A pair cannot supply both stack markers: otherwise paired swaps cannot split them.
  const first=Math.floor(rng()*8),second=shuffle(players.filter(p=>p.symbol!==players[first].symbol),rng)[0].id;
  const head=headSides(players,[first,second]);
  const s={seed,mode:choose(options.mode,['middle','far']),male:choose(options.male,['sword','shield']),female:choose(options.female,['staff','feet']),weaponAngle:angle(options.weaponAngle),eyeAngle:angle(options.eyeAngle),knockAngle:angle(options.knockAngle),players,stackIds:[first,second],headSides:head.sides,exchanged:head.exchanged};
  s.weaponTargets=players.map(p=>safeWeaponTarget(s,p));return s;
}
export const markersVisible=t=>t>=5.5&&t<11.5;
export function targetFor(s,p,t){
  if(t<7.5)return openingTarget(p,t<5.5?p.initialSide:p.side);
  if(t<11.5)return s.weaponTargets[p.id];
  if(t<17.5)return psTarget(s,p);
  return stackTarget(s,p,t<25.5);
}
export class Simulation{
  constructor(options={}){this.options=options;this.scenario=createScenario(options);this.players=this.scenario.players;this.me=this.players.find(p=>p.role===(options.role??'H2'));this.time=0;this.status='ready';this.logs=[];this.effects=[];this.sprintAt=-Infinity;this.processed=new Set();this.input={x:0,y:0};this.click=null;}
  start(){if(this.status==='ready')this.status='running';}
  togglePause(){if(this.status==='running')this.status='paused';else if(this.status==='paused')this.status='running';}
  sprint(){if(this.status==='running'&&this.time-this.sprintAt>=60){this.sprintAt=this.time;return true;}return false;}
  pair(p){return this.players.find(q=>q.symbol===p.symbol&&q.id!==p.id);}
  vulnerable(p){return this.time>=5.5&&!distanceOK(this.scenario.mode,dist(p,this.pair(p)));}
  fail(p,reason){if(!p.alive)return;p.alive=false;this.logs.push({time:this.time,role:p.role,reason,kind:'fail'});}
  checkWeapons(){for(const p of this.players){const h=weaponHits(this.scenario,p);if(h.male||h.female)this.fail(p,`${h.male?'男':'女'}の武器範囲に被弾`);}this.effects.push({type:'weapon',at:this.time});}
  checkFlare(){
    const alive=this.players.filter(p=>p.alive);const failures=[];
    for(const p of alive){
      const q=rot(p,-this.scenario.eyeAngle);if(Math.abs(q.x)<5)failures.push([p,'目の直線範囲に被弾']);
      if(this.vulnerable(p))failures.push([p,`距離条件未達でファイラ（ペア間 ${dist(p,this.pair(p)).toFixed(1)}m）`]);
      if(alive.some(q=>q.id!==p.id&&dist(p,q)<5))failures.push([p,'他のプレイヤーのファイラに被弾']);
      const row=p.side===1&&this.scenario.mode==='far'?3-p.symbol:p.symbol;
      const limits=this.scenario.mode==='far'?[-Infinity,-11.9,0,11.9,Infinity]:[-Infinity,-11.5,0,11.5,Infinity];
      if((p.side===0?q.x>=0:q.x<=0)||q.y<limits[row]||q.y>limits[row+1])failures.push([p,'マクロの担当側・記号の並びと異なる散開位置']);
    }
    for(const [p,r] of failures)this.fail(p,r);
    this.effects.push({type:'flare',at:this.time,points:alive.map(p=>({x:p.x,y:p.y}))});
  }
  knock(){for(const p of this.players.filter(p=>p.alive)){const d=Math.hypot(p.x,p.y);if(d<0.01){this.fail(p,'吹き飛ばしの方向が定まらない（中央）');continue;}p.x*=1+15/d;p.y*=1+15/d;if(Math.hypot(p.x,p.y)>20)this.fail(p,'吹き飛ばしで外周へ落下');}this.click=null;this.effects.push({type:'knock',at:this.time});}
  checkStack(){
    const s=this.scenario,alive=this.players.filter(p=>p.alive),fails=[];
    for(const p of alive){
      if(lateBosses(s).some(b=>dist(p,b)<10))fails.push([p,'男の半径10m範囲に被弾']);
      if(this.vulnerable(p))fails.push([p,`距離条件未達で頭割り（ペア間 ${dist(p,this.pair(p)).toFixed(1)}m）`]);
      const q=rot(p,-s.knockAngle),side=s.headSides[p.id];
      if(side===0?(-q.x<Math.abs(q.y)):s.mode==='far'?(q.x<Math.abs(q.y)):(q.y<Math.abs(q.x)))fails.push([p,'調整後の担当組と頭割り方向が異なる']);
      const covers=s.stackIds.filter(id=>this.players[id].alive&&dist(p,this.players[id])<=6);
      if(covers.length!==1)fails.push([p,covers.length===0?'頭割りに参加していない':'頭割りを重ねて受けた']);
    }
    for(const id of s.stackIds){const source=this.players[id],group=alive.filter(p=>dist(p,source)<=6);if(!source.alive||group.length!==4)for(const p of group)fails.push([p,`頭割り人数不足・超過（${group.length}/4人）`]);}
    for(const [p,r] of fails)this.fail(p,r);
    this.effects.push({type:'stack',at:this.time});
    this.status=this.me.alive?'success':'failed';
    if(this.me.alive)this.logs.push({time:this.time,role:this.me.role,reason:'全ギミックを生存して処理',kind:'pass'});
  }
  process(t){if(this.processed.has(t))return;this.processed.add(t);if(t===11.5)this.checkWeapons();if(t===17.5)this.checkFlare();if(t===25.5)this.knock();if(t===29)this.checkStack();if(!this.me.alive&&this.status==='running')this.status='failed';}
  advance(dt){
    if(this.status!=='running')return;
    let remaining=Math.max(0,Math.min(dt,1));
    while(remaining>1e-8&&this.status==='running'){
      const next=EVENTS.find(e=>e.time>this.time+1e-8)?.time??29;
      const step=Math.min(remaining,1/120,next-this.time);if(step<=1e-8)break;
      for(const p of this.players){if(!p.alive)continue;let target,speed=CFG.walk;
        if(p.id!==this.me.id||this.options.demo)target=targetFor(this.scenario,p,this.time);
        else{speed=this.time-this.sprintAt<10?CFG.sprint:CFG.walk;const len=Math.hypot(this.input.x,this.input.y);if(len){target={x:p.x+this.input.x/len*100,y:p.y+this.input.y/len*100};this.click=null;}else target=this.click;}
        if(target){const d=dist(p,target),v=Math.min(d,speed*step);if(d>1e-8){p.x+=(target.x-p.x)/d*v;p.y+=(target.y-p.y)/d*v;}}
        if(Math.hypot(p.x,p.y)>20+1e-6)this.fail(p,'外周へ落下');
      }
      this.time=Math.min(29,this.time+step);remaining-=step;
      if(Math.abs(this.time-next)<1e-7){this.time=next;this.process(next);}
      if(!this.me.alive&&this.status==='running')this.status='failed';
    }
  }
}
