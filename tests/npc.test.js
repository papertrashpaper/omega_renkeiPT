import test from 'node:test';
import assert from 'node:assert/strict';
import {Simulation} from '../engine.js';
function check(options){
  const sim=new Simulation({...options,demo:true});sim.start();
  for(let i=0;i<60&&sim.status==='running';i++)sim.advance(.5);
  assert.equal(sim.time,29,JSON.stringify({options,logs:sim.logs}));
  assert.ok(sim.players.every(p=>p.alive),JSON.stringify({options,logs:sim.logs}));
}
test('NPC: 200 seeds across all eight weapon/distance combinations',()=>{
  for(let seed=0;seed<200;seed++)for(const mode of ['middle','far'])for(const male of ['sword','shield'])for(const female of ['staff','feet'])check({seed,mode,male,female});
});
test('NPC: all 512 direction combinations across eight weapon/distance combinations',()=>{
  for(const mode of ['middle','far'])for(const male of ['sword','shield'])for(const female of ['staff','feet'])
    for(let weaponAngle=0;weaponAngle<8;weaponAngle++)for(let eyeAngle=0;eyeAngle<8;eyeAngle++)for(let knockAngle=0;knockAngle<8;knockAngle++)
      check({seed:weaponAngle*64+eyeAngle*8+knockAngle,mode,male,female,weaponAngle,eyeAngle,knockAngle});
});
