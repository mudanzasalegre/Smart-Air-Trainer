import {duration,type Workout} from './domain';
import type {StoredRoute,ProfilePoint} from './routes/types';

export const searchText=(value:string)=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es').trim();
export function estimatedMinutes(meters:number,speed:number){return Number.isFinite(meters)&&meters>0&&Number.isFinite(speed)&&speed>=5&&speed<=60?meters/1000/speed*60:null;}
export function timeLabel(minutes:number|null){if(minutes===null)return 'Sin duración';const m=Math.max(1,Math.round(minutes));return m>=60?`${Math.floor(m/60)} h${m%60?` ${m%60} min`:''}`:`${m} min`;}
export function workoutMinutes(w:Workout):number|null{if(w.velodrome)return w.velodrome.goal==='time'?w.velodrome.amount:null;return duration(w)>0?duration(w)/60:null;}
export type Bounds={south:number;north:number;west:number;east:number};
export function startInBounds(r:StoredRoute,b:Bounds){const p=r.geometry[0];if(!p||p.lat<b.south||p.lat>b.north)return false;if(b.east-b.west>=360)return true;const wrap=(n:number)=>((n+180)%360+360)%360-180,w=wrap(b.west),e=wrap(b.east),lon=wrap(p.lon);return w<=e?lon>=w&&lon<=e:lon>=w||lon<=e;}
export type RouteFilters={query:string;distance:string;ascent:string;time:string;type:string;source:string;favoritesOnly:boolean;sort:string};
export const initialRouteFilters:RouteFilters={query:'',distance:'all',ascent:'all',time:'all',type:'all',source:'all',favoritesOnly:false,sort:'recent'};
const between=(v:number|null,lo:number,hi:number)=>v!==null&&Number.isFinite(v)&&v>=lo&&v<hi;
export function filterRoutes(routes:StoredRoute[],f:RouteFilters,favorites:string[],speed:number,bounds?:Bounds){
 const ranges:Record<string,[number,number]>={short:[0,20000],medium:[20000,50000],long:[50000,Infinity],low:[0,300],rolling:[300,800],high:[800,Infinity],quick:[0,60],standard:[60,120],endurance:[120,Infinity]};
 const within=(v:number|null,k:string)=>k==='all'||!!ranges[k]&&between(v,...ranges[k]);
 return routes.filter(r=>searchText(r.name+' '+r.description).includes(searchText(f.query))&&(f.type==='all'||r.rideType===f.type)&&(f.source==='all'||r.source===f.source)&&(!f.favoritesOnly||favorites.includes('route:'+r.id))&&within(r.profile.distance,f.distance)&&within(r.profile.coverage>=.999?r.profile.ascent:null,f.ascent)&&within(estimatedMinutes(r.profile.distance,speed),f.time)&&(!bounds||startInBounds(r,bounds))).sort((a,b)=>{
  if(f.sort==='name')return a.name.localeCompare(b.name,'es');
  if(f.sort==='distance'||f.sort==='time')return a.profile.distance-b.profile.distance;
  if(f.sort==='ascent'){const av=a.profile.coverage>=.999?a.profile.ascent:null,bv=b.profile.coverage>=.999?b.profile.ascent:null;return (av??Infinity)-(bv??Infinity)||a.name.localeCompare(b.name,'es');}
  return b.updatedAt.localeCompare(a.updatedAt);
 });
}
/** Each run stays separate: unavailable elevation must not become a fictitious hill. */
export function previewRuns(points:ProfilePoint[],budget=160){const runs:ProfilePoint[][]=[];let run:ProfilePoint[]=[];for(const p of points){if(p.altitude===null||!Number.isFinite(p.altitude)){if(run.length)runs.push(run);run=[];}else run.push(p);}if(run.length)runs.push(run);const step=Math.max(1,Math.ceil(points.length/budget));return runs.map(r=>r.filter((_,i)=>i===0||i===r.length-1||i%step===0));}
export function clusterStarts(routes:StoredRoute[],project:(lat:number,lon:number)=>{x:number;y:number},size=64){const groups=new Map<string,StoredRoute[]>();for(const r of routes){const p=r.geometry[0];if(!p)continue;const {x,y}=project(p.lat,p.lon),key=`${Math.floor(x/size)}:${Math.floor(y/size)}`;groups.set(key,[...(groups.get(key)||[]),r]);}return [...groups.values()];}
