import type {WorkoutMotion} from './workoutSpeed';
import {validVelo,type VeloConfig,type VeloActivity} from './velodrome/model';
import type {RouteActivity} from './routes/types';
export type Mode = 'real' | 'demo';
export type Metric = 'power'|'cadence'|'speed'|'heartRate';
export type Telemetry = Partial<Record<Metric, number>>;
export type Sample = {segmentStart?:true; sensorSpeed?:number|null; t:number; power:number|null; cadence:number|null; speed:number|null; heartRate:number|null; target:number|null};
export type Block = {name:string; duration:number; unit:'ftp'|'watts'; intensity:number};
export type Workout = {id:string; name:string; description:string; category:string; blocks:Block[]; custom?:boolean; velodrome?:VeloConfig};
export type Session = {workoutMotion?:WorkoutMotion;planId?:string;notes?:string;rpe?:number|null;id:string; date:string; workout:Workout; mode:Mode; ftp:number; duration:number; elapsed:number; samples:Sample[]; velodrome?:VeloActivity; routeActivity?:RouteActivity; interrupted?:boolean};
export type Profile = {workoutMotion?:WorkoutMotion;name:string; ftp:number; wheelMm:number};
export const defaultProfile:Profile={name:'Jonsui',ftp:148,wheelMm:2105};
const b=(name:string,duration:number,intensity:number):Block=>({name,duration,intensity,unit:'ftp'});
export const workouts:Workout[]=[
 {id:'free',name:'A tu ritmo',description:'Tú marcas el camino. Sin bloques. Hasta 6 horas por sesión.',category:'Libre',blocks:[]},
 {id:'recovery',name:'Recuperación',description:'Soltar las piernas también es entrenar.',category:'Recuperación',blocks:[b('Pedaleo suave',1200,55)]},
 {id:'endurance',name:'Base aeróbica',description:'Construye resistencia, pedalada a pedalada.',category:'Resistencia',blocks:[b('Calentamiento',300,50),b('Resistencia aeróbica',2100,68),b('Enfriamiento',300,45)]},
 {id:'tempo',name:'Encuentra tu tempo',description:'Un esfuerzo sostenido, controlado y constante.',category:'Tempo',blocks:[b('Calentamiento',300,50),b('Tempo',1200,80),b('Enfriamiento',300,45)]},
 {id:'intervals',name:'Un paso más',description:'Tres esfuerzos de calidad. Recupera y vuelve.',category:'Intervalos',blocks:[b('Calentamiento',300,50),...Array.from({length:3},(_,i)=>[b(`Esfuerzo ${i+1}/3`,120,105),b(`Recuperación ${i+1}/3`,180,50)]).flat(),b('Enfriamiento',300,45)]}
];
export const duration=(w:Workout)=>w.blocks.reduce((s,b)=>s+b.duration,0);
export const target=(b:Block|undefined,ftp:number)=>b?Math.round(b.unit==='watts'?b.intensity:b.intensity*ftp/100):null;
export function intervalAt(w:Workout,seconds:number){let start=0;for(let i=0;i<w.blocks.length;i++){const block=w.blocks[i];if(seconds<start+block.duration)return {block,index:i,start,remaining:start+block.duration-seconds,next:w.blocks[i+1]};start+=block.duration;}return null;}
export const zoneNames=['Recuperación','Resistencia','Tempo','Umbral','VO₂ máx.','Anaeróbica','Neuromuscular'];
export const zoneColors=['#829ba6','#62b8e5','#70dab0','#e4d06e','#efad6e','#ed818b','#b59ef4'];
export const zone=(p:number,ftp:number)=>{const i=[.55,.75,.90,1.05,1.20,1.50].findIndex(v=>p<=ftp*v);return i<0?6:i;};
export const clock=(s:number)=>{s=Math.max(0,Math.floor(s));return `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;};
export function validateWorkout(w:Workout){if(w.velodrome)return w.name.trim().length>0&&w.name.length<=80&&w.blocks.length===0&&validVelo(w.velodrome);return w.name.trim().length>0&&w.name.length<=80&&w.blocks.length>0&&w.blocks.length<=100&&duration(w)<=21600&&w.blocks.every(b=>Number.isFinite(b.duration)&&b.duration>=10&&b.duration<=7200&&Number.isFinite(b.intensity)&&b.intensity>=0&&b.intensity<=(b.unit==='ftp'?250:1000));}
export interface NativeTransportContract {connect(options:{services:string[]}):Promise<void>;read(service:string,characteristic:string):Promise<DataView>;subscribe(service:string,characteristic:string,onValue:(value:DataView)=>void):Promise<()=>Promise<void>>;write(service:string,characteristic:string,value:Uint8Array):Promise<void>;disconnect():Promise<void>}
export interface TrainerProtocolAdapter {id:string; decode(characteristic:string,value:DataView):Telemetry;}
export const bkoolSmartAirAdapter={id:'bkool-smart-air',status:'diagnostic-only',reason:'No se ha verificado un protocolo propietario para Smart Air. Se usan únicamente servicios estándar detectados.'} as const;
export interface FutureSessionExporter {format:'fit';export(session:Session):Promise<Uint8Array>}
export const futureIntegrations={antFec:'Requiere transporte ANT+ externo; Web Bluetooth no proporciona ANT+.',fit:'Pendiente de implementar un codificador FIT y validar sus archivos.',strava:'Pendiente de OAuth y una integración segura; no hay sincronización activa.'};
