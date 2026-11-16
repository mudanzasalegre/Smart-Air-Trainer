import {type Session,type Mode} from '../domain';
import {statistics} from '../stats';
import {localDay,shiftDay} from './model';
export type AnalysisRow={session:Session;stats:ReturnType<typeof statistics>;powerSeconds:number;hrSeconds:number;targetSeconds:number;matchedSeconds:number};
export function analyzeSession(session:Session):AnalysisRow{
 let powerSeconds=0,hrSeconds=0,targetSeconds=0,matchedSeconds=0;
 for(const s of session.samples){const valid=s.power!==null&&Number.isFinite(s.power)&&s.power>=0;if(valid)powerSeconds++;if(s.heartRate!==null&&Number.isFinite(s.heartRate)&&s.heartRate>0)hrSeconds++;
 if(s.target!==null&&Number.isFinite(s.target)&&s.target>0&&valid){targetSeconds++;if(Math.abs(s.power!-s.target)<=s.target*.1)matchedSeconds++;}}
 return {session,stats:statistics(session.samples,session.ftp),powerSeconds,hrSeconds,targetSeconds,matchedSeconds};
}
export function summarize(rows:AnalysisRow[]){const seconds=rows.reduce((n,r)=>n+r.session.duration,0),powerSeconds=rows.reduce((n,r)=>n+r.powerSeconds,0),validTss=rows.filter(r=>r.stats.tss!==null),targetSeconds=rows.reduce((n,r)=>n+r.targetSeconds,0);
 return {count:rows.length,seconds,powerSeconds,coverage:seconds?Math.min(1,powerSeconds/seconds):null,hrCoverage:seconds?Math.min(1,rows.reduce((n,r)=>n+r.hrSeconds,0)/seconds):null,
 avgPower:powerSeconds?rows.reduce((n,r)=>n+(r.stats.avgPower??0)*r.powerSeconds,0)/powerSeconds:null,
 tss:validTss.length?validTss.reduce((n,r)=>n+r.stats.tss!,0):null,tssCount:validTss.length,
 zones:rows.reduce((acc,r)=>acc.map((n,i)=>n+r.stats.zones[i]),[0,0,0,0,0,0,0]),targetSeconds,adherence:targetSeconds?rows.reduce((n,r)=>n+r.matchedSeconds,0)/targetSeconds:null,
 rpeCount:rows.filter(r=>r.session.rpe!=null).length};}
export function periodAnalysis(sessions:Session[],mode:Mode,days:number,day=localDay()){
 const start=shiftDay(day,1-days),previousStart=shiftDay(start,-days),end=shiftDay(day,1);
 const all=sessions.filter(s=>s.mode===mode).map(analyzeSession);
 const inRange=(a:string,b:string)=>all.filter(r=>{const d=localDay(new Date(r.session.date));return d>=a&&d<b;}).sort((a,b)=>b.session.date.localeCompare(a.session.date));
 const current=inRange(start,end),previous=inRange(previousStart,start);
 const trend=Array.from({length:Math.ceil(days/7)},(_,i)=>{const from=shiftDay(start,i*7),to=shiftDay(from,Math.min(7,days-i*7));return {from,to,...summarize(inRange(from,to))};});
 return {start,end,previousStart,current,previous,summary:summarize(current),baseline:summarize(previous),trend};
}
export function lapAnalysis(session:Session,excludeFirst=true){const laps=(session.velodrome?.laps??[]).filter(l=>(!excludeFirst||l.number>1)&&Number.isFinite(l.seconds)&&l.seconds>0);const mean=laps.length?laps.reduce((n,l)=>n+l.seconds,0)/laps.length:null;
 return {laps,mean,best:mean===null?null:Math.min(...laps.map(l=>l.seconds)),cv:mean===null||laps.length<3?null:Math.sqrt(laps.reduce((n,l)=>n+(l.seconds-mean)**2,0)/laps.length)/mean*100};}
export function followupHints(a:ReturnType<typeof periodAnalysis>){const s=a.summary;const hints:{title:string;body:string;workoutId?:string}[]=[];
 if(!s.count)return [{title:'Construye tu primera referencia',body:'Guarda una sesión con potencia y anota el esfuerzo percibido. El seguimiento utiliza solo actividades guardadas.',workoutId:'free'}];
 if(s.coverage!==null&&s.coverage<.9)hints.push({title:'Primero, mejora la continuidad de los datos',body:`Solo el ${Math.round(s.coverage*100)} % del tiempo activo tiene potencia registrada. Revisa las desconexiones antes de interpretar cambios de rendimiento.`});
 if(s.rpeCount<s.count)hints.push({title:'Añade contexto a los números',body:`${s.count-s.rpeCount} sesiones sin esfuerzo percibido. Abre sus resultados y anota sensaciones para interpretar la carga junto a los vatios.`});
 if(s.targetSeconds>=300)hints.push({title:'Revisa el ajuste al objetivo',body:`Pasaste el ${Math.round(s.adherence!*100)} % de las muestras con objetivo y potencia dentro de ±10 % de la consigna. Abre los bloques para revisar dónde te alejaste; este porcentaje no mide por sí solo tu condición física.`});
 if(a.baseline.count)hints.push({title:'Compara periodos equivalentes',body:`Has registrado ${Math.round(s.seconds/60)} minutos frente a ${Math.round(a.baseline.seconds/60)} en el periodo anterior. La diferencia refleja lo guardado; los días sin registro no demuestran descanso.`});
 hints.push({title:'Repite una referencia conocida',body:'Puedes repetir una sesión guardada con el mismo objetivo y ajustes. Compara potencia, pulso, parciales y esfuerzo percibido; una mayor velocidad virtual por sí sola no prueba una mejora.',workoutId:'endurance'});
 return hints;
}
export function analysisCsv(rows:AnalysisRow[]){const quote=(s:string)=>'"'+(/^[=+@\-\t\r]/.test(s)?"'"+s:s).replaceAll('"','""')+'"';return 'fecha,nombre,modo,tiempo_activo_s,potencia_media_w,NP_w,IF,TSS,cobertura_potencia_pct,pulso_medio_ppm,RPE,ajuste_objetivo_pct\n'+rows.map(r=>[quote(r.session.date),quote(r.session.workout.name),r.session.mode,r.session.duration.toFixed(3),r.stats.avgPower,r.stats.np,r.stats.intensity,r.stats.tss,(r.session.duration?Math.min(1,r.powerSeconds/r.session.duration)*100:0).toFixed(1),r.stats.avgHr,r.session.rpe??'',r.targetSeconds?(r.matchedSeconds/r.targetSeconds*100).toFixed(1):''].map(x=>x??'').join(',')).join('\n');}
