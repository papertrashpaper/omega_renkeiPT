import {Camera} from './camera.js';
import {Simulation,ROLES,SYMBOLS,EVENTS,CFG,dist,rot,polar,bosses,lateBosses,weaponHits,markersVisible,targetFor} from './engine.js';
const $=id=>document.getElementById(id),canvas=$('arena'),ctx=canvas.getContext('2d');
const colors=['#fc7e89','#77cff2','#85e7bd','#d7a0f7'];
let saved={};try{saved=JSON.parse(localStorage.getItem('omega-renkei-settings')||'{}');}catch{}
let order=Array.isArray(saved.order)&&saved.order.length===8&&new Set(saved.order).size===8&&saved.order.every(r=>ROLES.includes(r))?saved.order:['MT','ST','H1','H2','D1','D2','D3','D4'];
for(const select of document.querySelectorAll('.angle'))select.innerHTML='<option value="random">ランダム</option>'+['北','北東','東','南東','南','南西','西','北西'].map((n,i)=>`<option value="${i}">${n}</option>`).join('');
const settingIds=['role','mode','male','female','weaponAngle','eyeAngle','knockAngle','control'];
for(const id of [...settingIds,'speed'])if(saved[id]!==undefined&&[...$(id).options].some(o=>o.value===saved[id]))$(id).value=saved[id];
function save(){const o={order,autoCamera:$('auto-camera').checked};for(const id of [...settingIds,'speed'])o[id]=$(id).value;try{localStorage.setItem('omega-renkei-settings',JSON.stringify(o));}catch{}}
const options=()=>Object.fromEntries([...settingIds.map(id=>[id,$(id).value]),['demo',$('control').value==='demo']]);
let sim=new Simulation(options()),keys=new Set(),mask=null,lastUI=0;
const camera=new Camera();$('auto-camera').checked=saved.autoCamera??true;
const debuffIcon=(kind)=>`<span class="status-icon ${kind}" role="img" aria-label="${kind==='middle'?'ミドル':kind==='far'?'ファー':'被ダメージ増加'}" title="${kind==='middle'?'ミドル 15～20m':kind==='far'?'ファー 38m以上':'被ダメージ増加'}"></span>`;
const imgs={};for(const name of ['male-sword','male-shield','female-staff','female-feet']){imgs[name]=new Image();imgs[name].src=`./assets/${name}.webp`;}
const xy=p=>{const q=rot(p,camera.angle);return {x:450+q.x*18,y:450+q.y*18};};
function resize(){const size=Math.max(1,Math.round(canvas.clientWidth*(window.devicePixelRatio||1)));if(canvas.width!==size){canvas.width=canvas.height=size;}}
new ResizeObserver(resize).observe(canvas);
function circle(p,r,fill,stroke,width=1){const q=xy(p);ctx.beginPath();ctx.arc(q.x,q.y,r*18,0,Math.PI*2);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.lineWidth=width;ctx.strokeStyle=stroke;ctx.stroke();}}
function textAt(text,p,color='#eee',size=13){const q=xy(p);ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`600 ${size}px system-ui`;ctx.fillStyle=color;ctx.fillText(text,q.x,q.y);}
function psIcon(symbol,x,y,size=14){ctx.save();ctx.translate(x,y);ctx.strokeStyle=colors[symbol];ctx.shadowColor=colors[symbol];ctx.shadowBlur=8;ctx.lineWidth=3.5;ctx.beginPath();if(symbol===0)ctx.arc(0,0,size*.7,0,Math.PI*2);if(symbol===1){ctx.moveTo(-size*.65,-size*.65);ctx.lineTo(size*.65,size*.65);ctx.moveTo(size*.65,-size*.65);ctx.lineTo(-size*.65,size*.65);}if(symbol===2){ctx.moveTo(0,-size*.8);ctx.lineTo(size*.8,size*.65);ctx.lineTo(-size*.8,size*.65);ctx.closePath();}if(symbol===3)ctx.rect(-size*.65,-size*.65,size*1.3,size*1.3);ctx.stroke();ctx.restore();}
function drawEye(s){const p=xy(polar(22,s.eyeAngle));ctx.save();ctx.translate(p.x,p.y);ctx.rotate(s.eyeAngle+camera.angle);const g=ctx.createRadialGradient(0,0,2,0,0,33);g.addColorStop(0,'#d2ffff');g.addColorStop(.25,'#559ec8');g.addColorStop(1,'#122243');ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(0,0,37,26,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#95dcfa';ctx.lineWidth=2;ctx.stroke();ctx.beginPath();ctx.arc(0,0,15,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#0b1832';ctx.beginPath();ctx.ellipse(0,0,5,13,0,0,Math.PI*2);ctx.fill();ctx.restore();}
function sprite(name,p,size=100,alpha=1){const q=xy(p),im=imgs[name];ctx.save();ctx.globalAlpha=alpha;circle(p,.75,'#090c1999','#8ea1ba88');if(im.complete&&im.naturalWidth)ctx.drawImage(im,q.x-size/3,q.y-size*.88,size*2/3,size);else textAt(name.startsWith('male')?'男':'女',p,'#fff',18);
  ctx.restore();}

function buildMask(){const c=document.createElement('canvas');c.width=c.height=400;const g=c.getContext('2d'),data=g.createImageData(400,400);for(let y=0;y<400;y++)for(let x=0;x<400;x++){const p={x:(x-200)/10,y:(y-200)/10};if(Math.hypot(p.x,p.y)>20)continue;const h=weaponHits(sim.scenario,p);if(h.male||h.female){const i=(y*400+x)*4;data.data.set([255,152,44,120],i);}}g.putImageData(data,0,0);mask=c;}
function draw(){
  const s=sim.scenario,t=sim.time,ended=['failed','success'].includes(sim.status),hint=$('hints').checked;
  resize();ctx.setTransform(canvas.width/900,0,0,canvas.height/900,0,0);ctx.clearRect(0,0,900,900);ctx.fillStyle='#091020';ctx.fillRect(0,0,900,900);
  const grad=ctx.createRadialGradient(450,450,30,450,450,360);grad.addColorStop(0,'#1b2c3c');grad.addColorStop(1,'#0e1b2a');circle({x:0,y:0},20,grad,'#518296',2);
  ctx.save();circle({x:0,y:0},20);ctx.clip();
  for(let i=-20;i<=20;i+=2.5){for(const [a,b] of [[{x:i,y:-20},{x:i,y:20}],[{x:-20,y:i},{x:20,y:i}]]){const p=xy(a),q=xy(b);ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.strokeStyle='#2c425242';ctx.lineWidth=1;ctx.stroke();}}
  for(const r of [5,10,14.3,17.5,19.5])circle({x:0,y:0},r,null,'#395568',r===14.3?1.7:1);
  circle({x:0,y:0},.22,'#b3dbed');
  const weaponFlash=sim.effects.some(e=>e.type==='weapon'&&t-e.at<.55);
  if(t>=11.3&&t<11.5||weaponFlash){if(!mask)buildMask();ctx.save();ctx.translate(450,450);ctx.rotate(camera.angle);ctx.drawImage(mask,-360,-360,720,720);ctx.restore();}
  if(t>=17.5&&t<18.2){ctx.save();ctx.translate(450,450);ctx.rotate(s.eyeAngle+camera.angle);ctx.fillStyle='#f49c4c8c';ctx.fillRect(-90,-360,180,720);ctx.restore();}
  if(t>=29)for(const p of lateBosses(s))circle(p,10,'#f5a34066','#ffbf61',2);
  ctx.restore();circle({x:0,y:0},20,null,'#8298b9',2);
  const markNames=['A','1','B','2','C','3','D','4'],markColors=['#ef747e','#ef747e','#e5d87f','#e5d87f','#72bdf9','#72bdf9','#c793f5','#c793f5'];
  for(let i=0;i<8;i++){const p=polar(14.3,i*Math.PI/4),q=xy(p),c=markColors[i];if(i%2===0)circle(p,.82,'#132230',c,2);else{ctx.fillStyle='#132230';ctx.fillRect(q.x-14,q.y-14,28,28);ctx.strokeStyle=c;ctx.lineWidth=2;ctx.strokeRect(q.x-14,q.y-14,28,28);}textAt(markNames[i],p,c,i%2===0?24:20);}
  textAt('N',{x:0,y:-21},'#a9bdce',13);
  if(t<5.5){sprite('male-sword',{x:-3,y:0});sprite('female-staff',{x:3,y:0});}
  if(t>=7.5&&t<17.5){drawEye(s);const b=bosses(s);sprite(`female-${s.female}`,b.otherFemale);sprite(`male-${s.male}`,b.otherMale);sprite(`male-${s.male}`,b.male);sprite(`female-${s.female}`,b.female);}
  if(t>=17.5){for(const p of lateBosses(s))sprite('male-sword',p,90);sprite('female-staff',{x:0,y:0},94);}
  for(const e of sim.effects){if(e.type==='flare'&&t-e.at<.6)for(const p of e.points)circle(p,5,'#f66b4b38','#ffc191',2);if(e.type==='knock'&&t-e.at<1.5)circle({x:0,y:0},2+Math.max(0,t-e.at)*10,null,'#a9e1ff',3);}
  if(t>=23.5&&t<25.5){
    const pulse=((t-23.5)%1),origin={x:0,y:0};
    circle(origin,2,'#a9e1ff1f','#b3e9ff',2);
    circle(origin,2+pulse*4,null,`rgba(160,220,255,${.8*(1-pulse)})`,2);
    for(let i=0;i<8;i++){
      const angle=i*Math.PI/4,from=xy(polar(2.4,angle)),to=xy(polar(4.3+pulse,angle));
      const a=xy(rot({x:-.45,y:-(3.6+pulse)},angle)),b=xy(rot({x:.45,y:-(3.6+pulse)},angle));
      ctx.beginPath();ctx.moveTo(from.x,from.y);ctx.lineTo(to.x,to.y);ctx.moveTo(a.x,a.y);ctx.lineTo(to.x,to.y);ctx.lineTo(b.x,b.y);ctx.strokeStyle='#baeaff';ctx.lineWidth=3;ctx.stroke();
    }
    textAt(`吹き飛ばし ${(25.5-t).toFixed(1)}s`,{x:0,y:3},'#d9f3ff',15);
  }
  if(t>=29)for(const id of s.stackIds)circle(sim.players[id],6,'#ffdc7829','#ffe8a0',2);
  if(t>=5.5){for(const p of sim.players){const pair=sim.pair(p);if(p.id>pair.id)continue;const a=xy(p),b=xy(pair);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.strokeStyle=sim.vulnerable(p)?'#efaaa6bb':'#9de0f4dd';ctx.lineWidth=2.5;ctx.stroke();}}
  if(hint&&t>=5.5){const target=targetFor(s,sim.me,t),q=xy(target);circle(target,1,null,'#a7ffe6',2);ctx.setLineDash([5,6]);const me=xy(sim.me);ctx.beginPath();ctx.moveTo(me.x,me.y);ctx.lineTo(q.x,q.y);ctx.strokeStyle='#a7ffe688';ctx.stroke();ctx.setLineDash([]);const pair=xy(sim.pair(sim.me));ctx.beginPath();ctx.moveTo(me.x,me.y);ctx.lineTo(pair.x,pair.y);ctx.strokeStyle=sim.vulnerable(sim.me)?'#fa8b82':'#92dfc5';ctx.stroke();}
  if(sim.click){circle(sim.click,.3,null,'#e1ffff',2);}
  for(const p of sim.players){const q=xy(p),isMe=p.id===sim.me.id;ctx.save();ctx.globalAlpha=p.alive?1:.38;if(isMe)circle(p,.99,null,'#ffffff',2.5);circle(p,.80,p.role[0]==='H'?'#83dab8':p.role[0]==='D'?'#f493a0':'#81b7ff','#0b1723',2);textAt(p.role,p,'#0b1723',15);if(!p.alive)textAt('×',p,'#ff7068',29);if(markersVisible(t))psIcon(p.symbol,q.x,q.y-32);
    if(t>=17.5&&s.stackIds.includes(p.id)){ctx.strokeStyle='#ffe691';ctx.lineWidth=3;for(const a of [0,Math.PI/2,Math.PI,Math.PI*1.5]){ctx.save();ctx.translate(q.x,q.y);ctx.rotate(a);ctx.beginPath();ctx.moveTo(29,-6);ctx.lineTo(22,0);ctx.lineTo(29,6);ctx.stroke();ctx.restore();}}
    if(isMe)textAt('YOU',{x:p.x,y:p.y+1.2},'#fff0a6',10);ctx.restore();
  }
  $('banner').hidden=sim.status==='running';
  if(sim.status==='paused')$('banner').innerHTML='<strong>一時停止</strong><span>Space または「再開」で続ける</span>';
  else if(ended)$('banner').innerHTML=`<strong>${sim.status==='success'?(sim.options.demo?'お手本 完了':'CLEAR'):'RETRY'}</strong><span>${sim.status==='success'?'頭割りまで処理できました':'下の結果で失敗理由を確認できます'}</span>`;
  else if(sim.status==='ready')$('banner').innerHTML='<strong>役割を選んで、練習開始</strong><span>記号を覚え、武器と目を見て移動。</span>';
}
function updateUI(){
  const s=sim.scenario,t=sim.time,running=sim.status==='running',active=running||sim.status==='paused',end=['success','failed'].includes(sim.status),hint=$('hints').checked;
  $('clock').textContent=`00:${t.toFixed(1).padStart(4,'0')}`;
  const evt=EVENTS.findLast(e=>e.time<=t),next=EVENTS.find(e=>e.time>t);
  $('status').textContent=sim.status==='ready'?'準備完了':sim.status==='paused'?'一時停止':end?(sim.status==='success'?'処理完了':'失敗'):evt.label;
  $('next').textContent=next?`次：${next.label} / ${(next.time-t).toFixed(1)}s`:'全工程完了';
  $('cast').hidden=t>=3||sim.status==='ready';$('cast-time').textContent=`${Math.max(0,3-t).toFixed(1)}s`;$('cast-progress').value=t;
  $('my-role').textContent=sim.me.role;$('mode-badge').textContent=t>=5.5?(s.mode==='middle'?'ミドル':'ファー'):'未付与';
  $('debuffs').innerHTML=t>=5.5?debuffIcon(s.mode)+(sim.vulnerable(sim.me)?debuffIcon('vulnerability'):''):'';
  $('instruction').textContent=t<5.5?'付与されたら記号と担当を覚えましょう。':t<7.5?'頭上の記号を確認。重複時は下から交換。':t<11.5?'男女の武器を確認。11.5秒に記号が消えます。':t<17.5?'目の方向を北として、覚えた配置へ散開。':t<25.5?'頭割りの偏りを確認。男3人側を北にして吹き飛ばし準備。':t<27?'吹き飛ばし中… 着地後に距離を調整。':t<29?'着地後も距離を調整し、4人で頭割り。':'練習終了。';
  $('guide-label').hidden=!hint;$('guide-text').hidden=!hint||t<5.5;
  const side=t>=17.5?s.headSides[sim.me.id]:sim.me.side;
  $('guide-text').textContent=`復習：${SYMBOLS[sim.me.symbol]} / ${side===0?'左':'右'}組 / ペア ${sim.pair(sim.me).role} / ${dist(sim.me,sim.pair(sim.me)).toFixed(1)}m${t>=17.5&&s.exchanged.includes(sim.me.id)?' / 頭割り交換担当':''}`;
  $('start').disabled=active;$('start').textContent=end?'新しい配置で開始':'練習開始';$('pause').disabled=!active;$('pause').textContent=sim.status==='paused'?'再開':'一時停止';
  const sprintRemain=10-(t-sim.sprintAt),cool=60-(t-sim.sprintAt);$('sprint').disabled=!running||cool>0||sim.options.demo;$('sprint').textContent=sprintRemain>0?`スプリント ${sprintRemain.toFixed(1)}s`:cool>0?'スプリント 使用済み':'スプリント [Shift]';
  for(const id of settingIds)$(id).disabled=active;
  for(const el of $('timeline').children){const time=Number(el.dataset.time);el.className=time===evt.time?'active':time<t?'done':'';}
  for(const role of order){const p=sim.players.find(p=>p.role===role),row=document.querySelector(`[data-role="${role}"]`);row.classList.toggle('me',p.id===sim.me.id);row.querySelector('.party-states').innerHTML=!p.alive?'<span class="debuff bad">戦闘不能</span>':t>=5.5?`${debuffIcon(s.mode)}${sim.vulnerable(p)?debuffIcon('vulnerability'):''}${t>=17.5&&s.stackIds.includes(p.id)?'<span class="debuff stack" title="頭割り">◆</span>':''}`:'<small>待機</small>';}
  $('result').hidden=!end;$('result').className=sim.status==='success'?'pass':'';
  if(end)$('result').innerHTML=`<strong>${sim.options.demo?'お手本モード / ':''}${sim.status==='success'?'成功':'失敗'} — ${t.toFixed(1)}秒</strong><br>`+sim.logs.map(l=>`${l.time.toFixed(1)}s ${l.role}：${l.reason}`).join('<br>')+`<br><small>配置番号：${s.seed}</small>`;
}
function party(){ $('party').innerHTML=order.map(role=>`<div class="party-row" data-role="${role}"><span class="role-chip ${role[0]==='H'?'healer':role[0]==='D'?'dps':''}">${role}</span><div class="party-states"></div><div class="order-buttons"><button data-dir="-1" aria-label="${role}を上へ">↑</button><button data-dir="1" aria-label="${role}を下へ">↓</button></div></div>`).join('');}
$('party').addEventListener('click',e=>{const b=e.target.closest('[data-dir]');if(!b)return;const role=b.closest('[data-role]').dataset.role,i=order.indexOf(role),j=i+Number(b.dataset.dir);if(j<0||j>=8)return;[order[i],order[j]]=[order[j],order[i]];save();party();updateUI();});
$('timeline').innerHTML=EVENTS.map(e=>`<li data-time="${e.time}"><time>${e.time.toFixed(1)}</time><span>${e.label}</span></li>`).join('');
function reset(same=false){const opts=same?{...sim.options,seed:sim.scenario.seed}:options();sim=new Simulation(opts);camera.reset();mask=null;keys.clear();save();updateUI();draw();}
$('start').onclick=()=>{if(sim.status!=='ready')reset();sim.start();canvas.focus();updateUI();};$('retry').onclick=()=>{reset(true);sim.start();canvas.focus();};$('pause').onclick=()=>{sim.togglePause();updateUI();};$('sprint').onclick=()=>{sim.sprint();canvas.focus();};
for(const id of settingIds)$(id).onchange=()=>reset();$('speed').onchange=save;$('auto-camera').onchange=()=>{camera.cancel();save();};$('camera-reset').onclick=()=>camera.turnTo(0);$('hints').onchange=()=>{updateUI();draw();};
window.addEventListener('keydown',e=>{if(['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName))return;if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ShiftLeft','ShiftRight','KeyW','KeyA','KeyS','KeyD'].includes(e.code)){e.preventDefault();keys.add(e.code);if(!e.repeat&&e.code==='Space')sim.togglePause();if(!e.repeat&&e.code.startsWith('Shift'))sim.sprint();}});
window.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',()=>{keys.clear();if(sim.status==='running')sim.togglePause();});document.addEventListener('visibilitychange',()=>{if(document.hidden){keys.clear();if(sim.status==='running')sim.togglePause();}});
let gesture=null;
canvas.addEventListener('pointerdown',e=>{if(e.button!==0&&e.button!==2)return;gesture={id:e.pointerId,x:e.clientX,y:e.clientY,last:e.clientX,drag:false};canvas.setPointerCapture(e.pointerId);canvas.focus();});
canvas.addEventListener('pointermove',e=>{if(!gesture||gesture.id!==e.pointerId)return;if(Math.hypot(e.clientX-gesture.x,e.clientY-gesture.y)>5)gesture.drag=true;if(gesture.drag){camera.cancel();camera.angle+=(e.clientX-gesture.last)*.007;}gesture.last=e.clientX;});
canvas.addEventListener('pointerup',e=>{if(!gesture||gesture.id!==e.pointerId)return;if(!gesture.drag&&e.button===0&&sim.status==='running'&&!sim.options.demo){const r=canvas.getBoundingClientRect();sim.click=rot({x:((e.clientX-r.left)/r.width*900-450)/18,y:((e.clientY-r.top)/r.height*900-450)/18},-camera.angle);}gesture=null;if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);});
canvas.addEventListener('pointercancel',()=>gesture=null);canvas.addEventListener('lostpointercapture',()=>gesture=null);canvas.addEventListener('contextmenu',e=>e.preventDefault());
let last=performance.now();function loop(now){const dt=Math.min((now-last)/1000,.1);last=now;sim.input={x:(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0),y:(keys.has('KeyS')||keys.has('ArrowDown')?1:0)-(keys.has('KeyW')||keys.has('ArrowUp')?1:0)};sim.input=rot(sim.input,-camera.angle);const before=sim.time;sim.advance(dt*Number($('speed').value));if($('auto-camera').checked){if(before<11.5&&sim.time>=11.5)camera.turnTo(-sim.scenario.eyeAngle);if(before<19&&sim.time>=19)camera.turnTo(-sim.scenario.knockAngle);}if(sim.status!=='paused')camera.update(dt);draw();if(now-lastUI>100){updateUI();lastUI=now;}requestAnimationFrame(loop);}
party();updateUI();requestAnimationFrame(loop);
