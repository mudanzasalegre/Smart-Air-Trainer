import {duration,intervalAt,target,type Session,type Workout,type Mode,type Telemetry} from './domain';
import {CyclingPhysicsEngine} from './routes/physics';
import {defaultWorkoutMotion,validWorkoutMotion,type WorkoutMotion} from './workoutSpeed';

type Snapshot=Record<keyof Required<Telemetry>,number|null>;
const emptySnapshot=():Snapshot=>({power:null,cadence:null,speed:null,heartRate:null});

export class WorkoutEngine {
 status:'idle'|'running'|'paused'|'finished'='idle';
 session:Session|null=null;
 activeMs=0;
 liveSpeed:number|null=null;
 private last=0;
 private started=0;
 private lastData:Snapshot=emptySnapshot();
 private freeTarget:number|null=null;
 private physics:CyclingPhysicsEngine|null=null;
 private segmentStart=false;

 private clearMotion(){
  this.physics?.reset();
  this.liveSpeed=null;
  this.lastData=emptySnapshot();
 }

 start(workout:Workout,ftp:number,mode:Mode,now=performance.now(),motion:WorkoutMotion=defaultWorkoutMotion){
  if(!validWorkoutMotion(motion))throw new Error('Revisa la configuración de velocidad del entrenamiento.');
  const workoutMotion=structuredClone(motion);
  this.session={id:crypto.randomUUID(),date:new Date().toISOString(),workout:structuredClone(workout),workoutMotion,ftp,mode,duration:0,elapsed:0,samples:[]};
  this.physics=motion.source==='physics'?new CyclingPhysicsEngine(workoutMotion.physics):null;
  this.status='running';this.activeMs=0;this.last=now;this.started=now;this.freeTarget=null;this.segmentStart=false;
  this.clearMotion();
 }

 tick(now:number,data:Snapshot,freeTarget:number|null=null){
  const session=this.session;
  if(!session)return;
  if(this.status==='paused')session.elapsed=Math.floor((now-this.started)/1000);
  if(this.status!=='running')return;
  const delta=Math.max(0,now-this.last);
  this.last=now;
  if(delta>3000){this.status='paused';session.interrupted=true;this.clearMotion();return;}
  this.lastData=data;
  this.freeTarget=freeTarget;
  const power=data.power;
  const usablePower=power!==null&&Number.isFinite(power)&&power>=0&&power<=3000;
  const measured=data.speed!==null&&Number.isFinite(data.speed)&&data.speed>=0&&data.speed<=150?data.speed:null;
  if(!this.physics)this.liveSpeed=measured;
  else if(!usablePower){this.physics.reset();this.liveSpeed=null;}
  const maximum=duration(session.workout)||21600;
  this.activeMs=Math.min(this.activeMs+delta,maximum*1000);
  const second=Math.floor(this.activeMs/1000);
  while(session.samples.length<second){
   const t=session.samples.length;
   let speed=measured;
   if(this.physics){
    const step=usablePower?this.physics.step(power,0,1):null;
    this.liveSpeed=step?.speed??null;
    // The mean over this recorded second integrates back to the modelled distance.
    speed=step?step.distance*3.6:null;
   }
   session.samples.push({t,...data,speed,...(this.physics?{sensorSpeed:measured}:{}),
    ...(this.segmentStart?{segmentStart:true as const}:{}),
    target:target(intervalAt(session.workout,t)?.block,session.ftp)??freeTarget});
   this.segmentStart=false;
  }
  session.duration=second;
  session.elapsed=Math.floor((now-this.started)/1000);
  if(this.activeMs>=maximum*1000){this.status='finished';this.clearMotion();}
 }

 pause(now=performance.now()){
  if(this.status!=='running')return;
  this.tick(now,this.lastData,this.freeTarget);
  if(this.status==='running')this.status='paused';
  this.clearMotion();
 }
 resume(now=performance.now()){
  if(this.status!=='paused')return;
  this.last=now;this.status='running';this.segmentStart=true;this.clearMotion();
 }
 finish(now=performance.now()){
  if(this.session){
   if(this.status==='running')this.tick(now,this.lastData,this.freeTarget);
   this.session.duration=Math.floor(this.activeMs/1000);this.session.elapsed=Math.floor((now-this.started)/1000);
   this.status='finished';this.clearMotion();
  }
  return this.session;
 }
 restore(saved:Session,now=performance.now()){
  if(saved.routeActivity||!Number.isInteger(saved.duration)||saved.duration<0||saved.duration>21600||saved.samples.length!==saved.duration||!Number.isFinite(saved.elapsed)||saved.elapsed<saved.duration)throw new Error('El borrador no tiene una duración válida.');
  if(saved.workoutMotion&&!validWorkoutMotion(saved.workoutMotion))throw new Error('El borrador tiene ajustes de velocidad inválidos.');
  this.session=structuredClone(saved);this.session.interrupted=true;
  this.physics=saved.workoutMotion?.source==='physics'?new CyclingPhysicsEngine(this.session.workoutMotion!.physics):null;
  this.clearMotion();this.segmentStart=true;this.freeTarget=null;
  this.activeMs=saved.duration*1000;this.last=now;this.started=now-saved.elapsed*1000;
  const total=duration(saved.workout);
  this.status=(total&&saved.duration>=total)||saved.duration>=21600?'finished':'paused';
 }
 reset(){this.status='idle';this.session=null;this.activeMs=0;this.physics=null;this.clearMotion();}
}
