export class Camera {
  constructor(){this.reset();}
  reset(){this.angle=0;this.motion=null;}
  cancel(){this.motion=null;}
  turnTo(target){const delta=Math.atan2(Math.sin(target-this.angle),Math.cos(target-this.angle));this.motion={start:this.angle,delta,elapsed:0};}
  update(dt){if(!this.motion)return;const m=this.motion;m.elapsed=Math.min(.5,m.elapsed+dt);const t=m.elapsed/.5,e=t*t*(3-2*t);this.angle=m.start+m.delta*e;if(t>=1)this.motion=null;}
}
