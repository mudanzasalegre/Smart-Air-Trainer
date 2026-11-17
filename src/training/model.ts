import {validateWorkout} from '../domain';
import type {Mode,Session,Workout} from '../domain';
export type PlanEntry={id:string;date:string;mode:Mode;kind:'workout'|'route';resourceId:string;title:string;workout?:Workout;notes:string;status:'planned'|'completed'|'skipped';sessionId?:string};
export type TrainingPreferences={weeklyMinutes:number;weeklySessions:number;favorites:string[]};
export const defaultTrainingPreferences:TrainingPreferences={weeklyMinutes:120,weeklySessions:3,favorites:[]};
export function localDay(date=new Date()){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;}
export function parseDay(day:string){const [y,m,d]=day.split('-').map(Number);return new Date(y,m-1,d,12);}
export function shiftDay(day:string,amount:number){const d=parseDay(day);d.setDate(d.getDate()+amount);return localDay(d);}
export function weekStart(day=localDay()){const d=parseDay(day);return shiftDay(day,-((d.getDay()+6)%7));}
export function weekDays(day=localDay()){const start=weekStart(day);return Array.from({length:7},(_,i)=>shiftDay(start,i));}
export function validPlan(p:unknown):p is PlanEntry{const v=p as PlanEntry;return !!v&&typeof v.id==='string'&&v.id.length>0&&v.id.length<=100&&typeof v.date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v.date)&&v.date>='2020-01-01'&&v.date<='2100-12-31'&&localDay(parseDay(v.date))===v.date&&['real','demo'].includes(v.mode)&&['workout','route'].includes(v.kind)&&typeof v.resourceId==='string'&&typeof v.title==='string'&&v.title.length<=150&&typeof v.notes==='string'&&v.notes.length<=1000&&['planned','completed','skipped'].includes(v.status)&&(v.sessionId===undefined||typeof v.sessionId==='string')&&(v.kind==='route'||!!v.workout&&typeof v.workout.id==='string'&&Array.isArray(v.workout.blocks)&&typeof v.workout.name==='string'&&v.workout.name.trim().length>0&&v.workout.name.length<=80&&typeof v.workout.description==='string'&&typeof v.workout.category==='string'&&v.workout.id===v.resourceId&&(v.workout.blocks.length===0||v.workout.blocks.every(b=>b&&typeof b.name==='string'&&['ftp','watts'].includes(b.unit))&&validateWorkout(v.workout)));}
export function validPreferences(p:unknown):p is TrainingPreferences{const v=p as TrainingPreferences;return !!v&&Number.isInteger(v.weeklyMinutes)&&v.weeklyMinutes>=0&&v.weeklyMinutes<=3000&&Number.isInteger(v.weeklySessions)&&v.weeklySessions>=0&&v.weeklySessions<=21&&Array.isArray(v.favorites)&&v.favorites.length<=500&&v.favorites.every(x=>typeof x==='string'&&x.length<200);}
export function weeklySummary(sessions:Session[],mode:Mode,day=localDay()){const start=weekStart(day),end=shiftDay(start,7),list=sessions.filter(s=>s.mode===mode&&localDay(new Date(s.date))>=start&&localDay(new Date(s.date))<end);return {start,list,minutes:list.reduce((a,s)=>a+s.duration,0)/60,count:list.length,days:weekDays(day).map(date=>({date,minutes:list.filter(s=>localDay(new Date(s.date))===date).reduce((a,s)=>a+s.duration,0)/60}))};}
export type EffortRange={start:number;seconds:number};
export const effortDurations=[5,30,60,300,1200];
/** A power interval uses uninterrupted one-second samples within one activity. */
export function bestEffortWindow(session:Session,seconds:number){
 if(!Number.isInteger(seconds)||seconds<1)return null;
 let start=0,sum=0;
 let best:{power:number;start:number}|null=null;
 for(let i=0;i<session.samples.length;i++){
  const point=session.samples[i];
  if(point.segmentStart){start=i;sum=0;}
  if(point.t!==i||point.power===null||!Number.isFinite(point.power)||point.power<0){start=i+1;sum=0;continue;}
  sum+=point.power;
  if(i-start+1>seconds){sum-=session.samples[start].power!;start++;}
  if(i-start+1===seconds&&(!best||sum/seconds>best.power))best={power:sum/seconds,start};
 }
 return best;
}
export function bestEffort(session:Session,seconds:number){return bestEffortWindow(session,seconds)?.power??null;}
export function effortRecords(sessions:Session[],mode:Mode){
 const eligible=sessions.filter(s=>s.mode===mode);
 return effortDurations.map(seconds=>{
  let power:number|null=null,start:number|null=null,session:Session|undefined;
  for(const candidate of eligible){
   const effort=bestEffortWindow(candidate,seconds);
   if(effort&&(power===null||effort.power>power)){
    power=effort.power;start=effort.start;session=candidate;
   }
  }
  return {seconds,power,start,session};
 });
}
