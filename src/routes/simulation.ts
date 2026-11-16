import type {Mode,Session,Sample,Telemetry} from '../domain';
import {CyclingPhysicsEngine} from './physics';
import {profileAt} from './elevation';
import type {RouteActivity,RouteDraft,StoredRoute,SimulationSettings,RouteProgress} from './types';
type Snapshot=Record<keyof Required<Telemetry>,number|null>;
export class RouteSimulationEngine {
 planId?:string;
 state:'prepared'|'running'|'paused'|'disconnected'|'finished'|'error'='prepared';route:StoredRoute|null=null;settings:SimulationSettings|null=null;mode:Mode='real';ftp=148;distance=0;activeTime=0;elapsed=0;movingTime=0;stoppedTime=0;ascent=0;speed=0;reason='';samples:Sample[]=[];progress:RouteProgress[]=[];id='';date='';protocols=new Set<string>();private last=0;private started=0;private wallOffset=0;private physics:CyclingPhysicsEngine|null=null;private recorded=0;private initialized=false;
 prepare(route:StoredRoute,settings:SimulationSettings,mode:Mode,ftp:number){if(route.profile.distance<=0||route.profile.points.length<2)throw new Error('La ruta no tiene un perfil válido.');if(this.route?.id!==route.id||this.mode!==mode||this.initialized)this.planId=undefined;this.route=structuredClone(route);this.settings=structuredClone(settings);this.mode=mode;this.ftp=ftp;this.physics=new CyclingPhysicsEngine(settings.physics);this.state='prepared';this.distance=0;this.activeTime=0;this.elapsed=0;this.movingTime=0;this.stoppedTime=0;this.ascent=0;this.speed=0;this.samples=[];this.progress=[];this.id=crypto.randomUUID();this.date=new Date().toISOString();this.reason='';this.protocols.clear();this.recorded=0;this.initialized=false;}
 start(now:number){if(!this.route||!this.settings)throw new Error('Selecciona una ruta.');if(this.settings.speedSource==='physics'&&this.route.profile.points.some(p=>p.grade===null))throw new Error('La velocidad virtual necesita elevación y pendientes fiables en todo el recorrido. Calcula o revisa el perfil.');if(this.state==='finished')throw new Error('Prepara una nueva sesión.');if(!this.initialized){this.started=now;this.date=new Date().toISOString();this.initialized=true;}this.last=now;this.state='running';this.reason='';}
 tick(now:number,telemetry:Snapshot,connected:boolean,control='Sin control electrónico',maxActiveTime=Infinity){
 if(!this.route||!this.settings||!this.initialized)return;
 if(this.state!=='finished')this.elapsed=this.wallOffset+(now-this.started)/1000;
 if(this.state!=='running')return;
 const dt=(now-this.last)/1000;this.last=now;if(dt<0||!Number.isFinite(dt))return;if(dt>3){this.pause('Aplicación suspendida: reanuda para continuar.');return;}
 const source=this.settings.speedSource,value=source==='measured'?telemetry.speed:telemetry.power;
 if((this.mode==='real'&&!connected)||value===null||!Number.isFinite(value)||(source==='measured'&&(value<0||value>150))){this.state='disconnected';this.speed=0;this.physics?.reset();this.reason=this.mode==='real'?'Sin telemetría reciente. Progreso conservado; reconecta y reanuda.':'Faltan datos de simulación.';return;}
 const elapsed=Math.min(Math.max(0,maxActiveTime-this.activeTime),dt*(this.mode==='demo'?Math.max(1,Math.min(60,this.settings.demoRate)):1));let remaining=elapsed;
 while(remaining>1e-7&&this.state==='running'){
  const slice=Math.min(remaining,1),at=profileAt(this.route.profile,this.distance);let distanceStep=0;
  if(source==='physics'){if(at.grade===null){this.state='error';this.reason='Falta una pendiente fiable. El progreso se ha detenido.';this.speed=0;return;}const r=this.physics!.step(Math.max(0,value),at.grade,slice);this.speed=r.speed;distanceStep=r.distance;}else{this.speed=value;distanceStep=value/3.6*slice;}
  const old=this.distance;this.distance=Math.min(this.route.profile.distance,this.distance+distanceStep);const fraction=distanceStep>0?(this.distance-old)/distanceStep:1,used=slice*fraction;this.activeTime+=used;if(this.speed>.5)this.movingTime+=used;else this.stoppedTime+=used;const next=profileAt(this.route.profile,this.distance);if(at.altitude!==null&&next.altitude!==null&&at.grade!==null&&next.grade!==null)this.ascent+=Math.max(0,next.altitude-at.altitude);
  if(control!=='Sin control electrónico')this.protocols.add(control);
  while(this.recorded<Math.floor(this.activeTime)){if(this.samples.length>=21600){this.state='finished';this.reason='Se alcanzó el límite de 6 horas registradas.';break;}const t=this.recorded++;this.samples.push({t,power:telemetry.power,cadence:telemetry.cadence,speed:telemetry.speed,heartRate:telemetry.heartRate,target:null});this.progress.push({t,distance:this.distance,speed:this.speed,speedSource:this.mode==='demo'?'demo':source==='physics'?'virtual':'measured',altitude:next.altitude,grade:next.grade,ascent:this.ascent,power:telemetry.power,cadence:telemetry.cadence,heartRate:telemetry.heartRate,control});}
  if(this.distance>=this.route.profile.distance){this.state='finished';this.speed=0;this.reason='Ruta completada.';}remaining-=slice;
 }
 }
 pause(reason='Sesión pausada'){if(this.state==='running'){this.state='paused';this.speed=0;this.reason=reason;this.physics?.reset();}}
 disconnect(){if(this.state==='running'){this.state='disconnected';this.speed=0;this.physics?.reset();this.reason='Rodillo desconectado. Reanuda al recuperar datos.';}}
 finish(){if(this.route){this.state='finished';this.speed=0;this.reason=this.distance>=this.route.profile.distance?'Ruta completada.':'Recorrido finalizado antes de llegar al destino.';}}
 activity():RouteActivity{if(!this.route||!this.settings)throw new Error('No hay ruta.');return {route:structuredClone(this.route),progress:structuredClone(this.progress),distance:this.distance,ascent:this.ascent,movingTime:this.movingTime,stoppedTime:this.stoppedTime,speedSource:this.settings.speedSource,settings:structuredClone(this.settings),controlProtocols:[...this.protocols],completed:this.distance>=this.route.profile.distance};}
 toSession():Session{return {planId:this.planId,id:this.id,date:this.date,workout:{id:'route-'+this.route!.id,name:this.route!.name,description:'Recorrido virtual de una ruta geográfica',category:'Ruta',blocks:[]},mode:this.mode,ftp:this.ftp,duration:Math.floor(this.activeTime),elapsed:Math.floor(this.elapsed),samples:structuredClone(this.samples),routeActivity:this.activity(),interrupted:this.state==='disconnected'||undefined};}
 draft():RouteDraft{return {planId:this.planId,id:this.id,date:this.date,mode:this.mode,ftp:this.ftp,activeTime:this.activeTime,elapsed:this.elapsed,samples:structuredClone(this.samples),activity:this.activity()};}
 restore(draft:RouteDraft,now:number){this.prepare(draft.activity.route,draft.activity.settings,draft.mode,draft.ftp);this.planId=draft.planId;this.id=draft.id;this.date=draft.date;this.samples=draft.samples;this.progress=draft.activity.progress;this.distance=draft.activity.distance;this.ascent=draft.activity.ascent;this.movingTime=draft.activity.movingTime;this.stoppedTime=draft.activity.stoppedTime;this.activeTime=draft.activeTime;this.elapsed=draft.elapsed;this.wallOffset=draft.elapsed;this.recorded=this.samples.length;this.protocols=new Set(draft.activity.controlProtocols);this.started=now;this.last=now;this.initialized=true;this.state='paused';this.reason='Recuperada desde el último guardado. Revisa el modo y reanuda.';}
 reset(){this.planId=undefined;this.route=null;this.state='prepared';this.initialized=false;this.distance=0;this.samples=[];this.progress=[];}
 get engaged(){return this.route!==null&&this.initialized&&this.state!=='finished';}
 get startedSession(){return this.initialized;}
}
