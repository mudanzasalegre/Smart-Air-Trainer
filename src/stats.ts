import {zone,type Sample} from './domain';
export function statistics(samples:Sample[],ftp:number){
 const values=(k:'power'|'cadence'|'speed'|'heartRate')=>samples.map(s=>s[k]).filter((v):v is number=>v!==null&&Number.isFinite(v));
 const avg=(v:number[])=>v.length?v.reduce((s,x)=>s+x,0)/v.length:null;
 const max=(v:number[])=>v.length?v.reduce((a,b)=>Math.max(a,b),-Infinity):null;
 const powers=values('power'),speeds=values('speed'),cadences=values('cadence'),hr=values('heartRate');
 const zones=[0,0,0,0,0,0,0];powers.forEach(p=>zones[zone(p,ftp)]++);
 let np:number|null=null;
 // Conservative: at least ten minutes of complete 1 Hz power, no fabricated gaps.
 const complete=samples.length>=600&&powers.length===samples.length&&samples.every((s,i)=>i===0||s.t===samples[i-1].t+1);
 if(complete){let sum=0,fourth=0,n=0;for(let i=0;i<powers.length;i++){sum+=powers[i];if(i>=30)sum-=powers[i-30];if(i>=29){fourth+=(sum/30)**4;n++;}}np=(fourth/n)**.25;}
 const intensity=np!==null?np/ftp:null;
 return {avgPower:avg(powers),maxPower:max(powers),avgCadence:avg(cadences),maxCadence:max(cadences),avgSpeed:avg(speeds),maxSpeed:max(speeds),avgHr:avg(hr),maxHr:max(hr),distance:speeds.length?speeds.reduce((a,b)=>a+b,0)/3600:null,zones,coverage:samples.length?powers.length/samples.length:0,np,intensity,tss:intensity===null?null:samples.length/3600*intensity**2*100};
}
