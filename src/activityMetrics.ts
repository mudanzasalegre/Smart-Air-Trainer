import type {Sample} from './domain';
import type {RouteProgress} from './routes/types';
/** Each saved Sample is one active second. Missing power is never filled. */
export function energyEstimate(samples:Sample[]){
 let joules=0,validSeconds=0;
 for(const s of samples)if(s.power!==null&&Number.isFinite(s.power)&&s.power>=0){joules+=s.power;validSeconds++;}
 return {kcal:validSeconds?joules/(.24*4184):null,kj:validSeconds?joules/1000:null,coverage:samples.length?validSeconds/samples.length:0};
}
/** Remaining active riding time from the last 60 recorded seconds, not a promised arrival. */
export function remainingEstimate(progress:RouteProgress[],remainingMeters:number,running:boolean,speed:number):number|null{
 if(remainingMeters<=0)return 0;
 if(!running||!Number.isFinite(speed)||speed<.5||progress.length<31)return null;
 const end=progress[progress.length-1],start=progress[Math.max(0,progress.length-61)],dt=end.t-start.t,ds=end.distance-start.distance;
 if(dt<30||ds<=1)return null;
 const estimate=remainingMeters/(ds/dt);
 return Number.isFinite(estimate)&&estimate<=86400?estimate:null;
}
export function routeMeanSpeed(distanceMeters:number,activeSeconds:number){return activeSeconds>0?distanceMeters/activeSeconds*3.6:null;}
export function timeDisplay(seconds:number|null){if(seconds===null||!Number.isFinite(seconds))return '—';const s=Math.max(0,Math.floor(seconds));return s>=3600?`${Math.floor(s/3600)}:${String(Math.floor(s/60)%60).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`:`${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;}
