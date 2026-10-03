import test from 'node:test';import assert from 'node:assert/strict';
import {Simulation,distanceOK,markersVisible,assignSides,headSides,createScenario,weaponHits} from '../engine.js';
test('距離閾値と記号消失時刻',()=>{
  assert.equal(distanceOK('middle',14.99),false);assert.equal(distanceOK('middle',15),true);assert.equal(distanceOK('middle',20),true);assert.equal(distanceOK('middle',20.01),false);
  assert.equal(distanceOK('far',34.99),false);assert.equal(distanceOK('far',35),true);
  assert.equal(markersVisible(5.49),false);assert.equal(markersVisible(5.5),true);assert.equal(markersVisible(11.49),true);assert.equal(markersVisible(11.5),false);
});
test('重複と頭割りは同記号ペアを交換',()=>{
  const s=createScenario({seed:42}),sides=assignSides(s.players);
  for(let k=0;k<4;k++){const pair=s.players.filter(p=>p.symbol===k);assert.notEqual(sides[pair[0].id],sides[pair[1].id]);}
  const ids=s.players.filter(p=>p.side===0).slice(0,2).map(p=>p.id),h=headSides(s.players,ids,s.mode);
  assert.equal(h.sides.filter(v=>v===0).length,4);assert.notEqual(h.sides[ids[0]],h.sides[ids[1]]);assert.equal(s.players[h.exchanged[0]].symbol,s.players[h.exchanged[1]].symbol);
});
test('代表8ケースをNPCが29秒まで処理する',()=>{
  for(const mode of ['middle','far'])for(const male of ['sword','shield'])for(const female of ['staff','feet']){
    const sim=new Simulation({seed:42,mode,male,female,demo:true});sim.start();for(let i=0;i<3500&&sim.status==='running';i++)sim.advance(1/120);
    assert.equal(sim.time,29);assert.equal(sim.status,'success',JSON.stringify(sim.logs));assert.ok(sim.players.every(p=>p.alive),JSON.stringify(sim.logs));
  }
});
test('スプリント10秒・60秒リキャストと停止中の時間固定',()=>{
  const sim=new Simulation({seed:42});sim.start();assert.equal(sim.sprint(),true);assert.equal(sim.sprint(),false);sim.togglePause();sim.advance(1);assert.equal(sim.time,0);
});

import {Camera} from '../camera.js';
test('カメラは最短方向に0.5秒で回転',()=>{const c=new Camera();c.turnTo(Math.PI/2);c.update(.25);assert.ok(Math.abs(c.angle-Math.PI/4)<1e-8);c.update(.25);assert.ok(Math.abs(c.angle-Math.PI/2)<1e-8);assert.equal(c.motion,null);});
test('吹き飛ばしは瞬間移動せず1.5秒で15m、移動入力を受けない',()=>{
  const s=new Simulation({seed:42});s.start();s.time=25.5;for(const p of s.players){p.x=2;p.y=0;}s.input={x:0,y:1};s.knock();assert.equal(s.me.x,2);
  s.advance(.75);assert.ok(Math.abs(s.me.x-9.5)<1e-6);assert.equal(s.me.y,0);
  s.advance(.75);assert.ok(Math.abs(s.me.x-17)<1e-6);assert.equal(s.me.flight,undefined);
});
test('女杖は女側の外周安置を消し、男側の安置を残す',()=>{
  const s={weaponAngle:0,male:'shield',female:'staff'};
  assert.equal(weaponHits(s,{x:-10,y:14}).female,true);
  assert.deepEqual(weaponHits(s,{x:11,y:2}),{male:false,female:false});
  s.male='sword';assert.deepEqual(weaponHits(s,{x:13,y:6}),{male:false,female:false});
});

test('頭割り調整は目基準の南側を選び、ファー右組では記号順が反転する',()=>{
  // Role priority deliberately conflicts with scatter order.
  const players=Array.from({length:8},(_,id)=>({id,side:id<4?0:1,symbol:id%4,priority:3-id%4}));
  for(const mode of ['middle','far']){
    const left=headSides(players,[0,3],mode);assert.deepEqual(left.exchanged,[3,7]);
    const right=headSides(players,[4,7],mode);assert.deepEqual(right.exchanged,mode==='far'?[4,0]:[7,3]);
    const split=headSides(players,[0,7],mode);assert.deepEqual(split.exchanged,[]);
  }
});
