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
  const ids=s.players.filter(p=>p.side===0).slice(0,2).map(p=>p.id),h=headSides(s.players,ids);
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
