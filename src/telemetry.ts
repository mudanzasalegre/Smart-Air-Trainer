import type {Telemetry,Metric} from './domain';
export class TelemetryProcessor {
 private values:Partial<Record<Metric,{value:number;time:number}>>={};
 private recent:{value:number;time:number}[]=[];
 ingest(data:Telemetry,now=Date.now()){for(const [key,value] of Object.entries(data)){if(typeof value==='number'&&Number.isFinite(value)){this.values[key as Metric]={value,time:now};if(key==='power')this.recent.push({value,time:now});}}this.recent=this.recent.filter(x=>now-x.time<=3000);}
 snapshot(now=Date.now(),maxAge=5000):Record<Metric,number|null>{return Object.fromEntries((['power','cadence','speed','heartRate'] as Metric[]).map(k=>[k,this.values[k]&&now-this.values[k]!.time<=maxAge?this.values[k]!.value:null])) as Record<Metric,number|null>;}
 age(now=Date.now()){const t=['power','cadence','speed'].map(k=>this.values[k as Metric]?.time||0);const last=Math.max(...t);return last?Math.max(0,(now-last)/1000):null;}
 smooth(now=Date.now()){const v=this.recent.filter(x=>now-x.time<=3000);return v.length?v.reduce((s,x)=>s+x.value,0)/v.length:null;}
 clear(){this.values={};this.recent=[];}
}
