import {useId} from 'react';
import {clock,type Session} from '../domain';
import {statistics} from '../stats';
import type {EffortRange} from './model';

export function EffortDetail({session,range}:{session:Session;range:EffortRange}){
 const titleId=useId();
 const points=session.samples.slice(range.start,range.start+range.seconds);
 if(points.length!==range.seconds||points.some(p=>p.power===null))return null;
 const stats=statistics(points,session.ftp);
 const max=Math.max(1,stats.maxPower??0);
 const stride=Math.ceil(points.length/160);
 const coordinates:string[]=[];
 for(let i=0;i<points.length;i+=stride){
  const count=Math.min(stride,points.length-i);
  let sum=0;
  for(let j=0;j<count;j++)sum+=points[i+j].power!;
  const x=4+392*(i+(count-1)/2)/Math.max(1,points.length-1);
  const y=64-56*(sum/count)/max;
  coordinates.push(x.toFixed(1)+','+y.toFixed(1));
 }
 return <section className="effort-detail" aria-labelledby={titleId}>
  <h3 id={titleId}>Tramo de la marca · {range.seconds<60?range.seconds+' s':range.seconds/60+' min'}</h3>
  <div className="effort-detail-metrics"><strong>{Math.round(stats.avgPower!)} W de media</strong><span>{stats.maxPower} W máx.</span><span>{stats.avgHr===null?'Sin pulso en el tramo':Math.round(stats.avgHr)+' ppm de media'}</span></div>
  <svg viewBox="0 0 400 72" preserveAspectRatio="none" role="img" aria-label={`Potencia del tramo entre ${clock(range.start)} y ${clock(range.start+range.seconds)} de tiempo activo`}>
   <line x1="0" x2="400" y1="64" y2="64" stroke="#37515a"/><polyline points={coordinates.join(' ')} fill="none" stroke="#8be4bb" strokeWidth="2.5" vectorEffect="non-scaling-stroke"/>
  </svg>
  <div className="effort-detail-axis"><span>{clock(range.start)}</span><span>Tiempo activo</span><span>{clock(range.start+range.seconds)}</span></div>
 </section>;
}
