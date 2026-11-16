import type {SavedDiagnostic} from './diagnostics';
import type {Session,Workout,Profile} from './domain';
import type {StoredRoute,ProviderSettings,SimulationSettings,RouteDraft} from './routes/types';
import type {EditorDraft} from './routes/editorDraft';
import type {PlanEntry,TrainingPreferences} from './training/model';
const DB='smart-air-trainer-v1';
let connection:Promise<IDBDatabase>|undefined;
function open(){if(!connection)connection=new Promise<IDBDatabase>((resolve,reject)=>{const r=indexedDB.open(DB,3);r.onupgradeneeded=()=>{for(const key of ['sessions','workouts','settings','routes','providerCache','plans'])if(!r.result.objectStoreNames.contains(key))r.result.createObjectStore(key);};r.onblocked=()=>{connection=undefined;reject(new Error('Cierra otras pestañas de Smart Air para completar la actualización local.'));};r.onsuccess=()=>{r.result.onversionchange=()=>{r.result.close();connection=undefined;};resolve(r.result);};r.onerror=()=>{connection=undefined;reject(r.error);};});return connection;}
async function op<T>(store:string,mode:IDBTransactionMode,fn:(s:IDBObjectStore)=>IDBRequest):Promise<T>{const db=await open();return new Promise((resolve,reject)=>{const tx=db.transaction(store,mode);let result:T;const r=fn(tx.objectStore(store));r.onsuccess=()=>result=r.result;tx.oncomplete=()=>resolve(result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('No se pudo guardar.'));});}
async function saveSessionAndPlan(v:Session){const db=await open();return new Promise<void>((resolve,reject)=>{const tx=db.transaction(['sessions','plans'],'readwrite');tx.objectStore('sessions').put(v,v.id);if(v.planId){const req=tx.objectStore('plans').get(v.planId);req.onsuccess=()=>{const p=req.result as PlanEntry|undefined;if(p&&p.mode===v.mode&&(p.kind==='route'?v.routeActivity?.route.id===p.resourceId:!v.routeActivity&&v.workout.id===p.resourceId)&&(!p.sessionId||p.sessionId===v.id)){tx.objectStore('plans').put({...p,status:'completed',sessionId:v.id},p.id);}};}tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});}
export const storage={
 veloDraft:()=>op<import('./velodrome/model').VeloDraft|undefined>('settings','readonly',s=>s.get('veloDraft')),
 saveVeloDraft:(v:import('./velodrome/model').VeloDraft)=>op('settings','readwrite',s=>s.put(v,'veloDraft')),
 clearVeloDraft:()=>op('settings','readwrite',s=>s.delete('veloDraft')),
 diagnosticReport:()=>op<SavedDiagnostic|undefined>('settings','readonly',s=>s.get('bleDiagnosticReport')),
 saveDiagnosticReport:(v:SavedDiagnostic)=>op('settings','readwrite',s=>s.put(v,'bleDiagnosticReport')),
 restoreBackup:async(value:{profile:Profile;workouts:Workout[];sessions:Session[];routes?:StoredRoute[];routeSettings?:{providers:ProviderSettings;simulation:SimulationSettings};plans?:PlanEntry[];trainingPreferences?:TrainingPreferences})=>{const db=await open();return new Promise<void>((resolve,reject)=>{const tx=db.transaction(['settings','workouts','sessions','routes','plans'],'readwrite');try{tx.objectStore('settings').put(value.profile,'profile');for(const key of ['workouts','sessions','routes','plans'] as const)for(const item of value[key]||[])tx.objectStore(key).put(item,item.id);if(value.routeSettings)tx.objectStore('settings').put(value.routeSettings,'routeSettings');if(value.trainingPreferences)tx.objectStore('settings').put(value.trainingPreferences,'trainingPreferences');}catch(e){tx.abort();reject(e);return;}tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('Restauración cancelada sin cambios.'));});},
 plans:()=>op<PlanEntry[]>('plans','readonly',s=>s.getAll()),
 savePlan:(v:PlanEntry)=>op('plans','readwrite',s=>s.put(v,v.id)),
 removePlan:(id:string)=>op('plans','readwrite',s=>s.delete(id)),
 trainingPreferences:()=>op<TrainingPreferences|undefined>('settings','readonly',s=>s.get('trainingPreferences')),
 saveTrainingPreferences:(v:TrainingPreferences)=>op('settings','readwrite',s=>s.put(v,'trainingPreferences')),

 editorDraft:()=>op<EditorDraft|undefined>('settings','readonly',s=>s.get('routeEditorDraft')),
 saveEditorDraft:(v:EditorDraft)=>op('settings','readwrite',s=>s.put(v,'routeEditorDraft')),
 clearEditorDraft:()=>op('settings','readwrite',s=>s.delete('routeEditorDraft')),
 routes:()=>op<StoredRoute[]>('routes','readonly',s=>s.getAll()),
 saveRoute:(v:StoredRoute)=>op('routes','readwrite',s=>s.put(v,v.id)),
 removeRoute:(id:string)=>op('routes','readwrite',s=>s.delete(id)),
 routeSettings:()=>op<{providers:ProviderSettings;simulation:SimulationSettings}|undefined>('settings','readonly',s=>s.get('routeSettings')),
 saveRouteSettings:(v:{providers:ProviderSettings;simulation:SimulationSettings})=>op('settings','readwrite',s=>s.put(v,'routeSettings')),
 routeDraft:()=>op<RouteDraft|undefined>('settings','readonly',s=>s.get('routeDraft')),
 saveRouteDraft:(v:RouteDraft)=>op('settings','readwrite',s=>s.put(v,'routeDraft')),
 clearRouteDraft:()=>op('settings','readwrite',s=>s.delete('routeDraft')),
 cacheGet:(key:string)=>op<{expires:number;value:any}|undefined>('providerCache','readonly',s=>s.get(key)),
 cachePut:(key:string,value:unknown,ttl:number)=>op('providerCache','readwrite',s=>s.put({expires:Date.now()+ttl,value},key)),
 pruneCache:async()=>{const db=await open();return new Promise<void>((resolve,reject)=>{const tx=db.transaction('providerCache','readwrite'),request=tx.objectStore('providerCache').openCursor();let count=0;request.onsuccess=()=>{const c=request.result;if(c){if(c.value.expires<Date.now()||++count>1000)c.delete();c.continue();}};tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);});},

 sessions:()=>op<Session[]>('sessions','readonly',s=>s.getAll()),
 saveSession:saveSessionAndPlan,
 removeSession:async(id:string)=>{const db=await open();return new Promise<void>((resolve,reject)=>{const tx=db.transaction(['sessions','plans'],'readwrite'),sessions=tx.objectStore('sessions'),req=sessions.get(id);req.onsuccess=()=>{const s=req.result as Session|undefined;sessions.delete(id);if(s?.planId){const p=tx.objectStore('plans').get(s.planId);p.onsuccess=()=>{if(p.result?.sessionId===id){const next={...p.result,status:'planned'};delete next.sessionId;tx.objectStore('plans').put(next,next.id);}};}};tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);});},
 workouts:()=>op<Workout[]>('workouts','readonly',s=>s.getAll()),
 saveWorkout:(v:Workout)=>op('workouts','readwrite',s=>s.put(v,v.id)),
 removeWorkout:(id:string)=>op('workouts','readwrite',s=>s.delete(id)),
 profile:()=>op<Profile|undefined>('settings','readonly',s=>s.get('profile')),
 saveProfile:(v:Profile)=>op('settings','readwrite',s=>s.put(v,'profile')),
 draft:()=>op<Session|undefined>('settings','readonly',s=>s.get('draft')),
 saveDraft:(v:Session)=>op('settings','readwrite',s=>s.put(v,'draft')),
 clearDraft:()=>op('settings','readwrite',s=>s.delete('draft'))
};
export function download(name:string,text:string,mime='application/json'){const blob=new Blob([text],{type:mime}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);}
export function csv(s:Session){const meta=['session_id,date,mode,ftp,workout,duration_s',`${s.id},${s.date},${s.mode},${s.ftp},"${s.workout.name.replace(/"/g,'""')}",${s.duration}`];return [...meta,'time_s,power_w,cadence_rpm,speed_kmh,heart_rate_bpm,target_w',...s.samples.map(x=>[x.t,x.power,x.cadence,x.speed,x.heartRate,x.target].join(','))].join('\r\n');}
