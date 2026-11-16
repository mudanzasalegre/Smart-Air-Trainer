import {memo,useMemo} from 'react';
import {previewRuns} from '../discovery';
import {gradeColor} from './ElevationChart';
import type {ElevationProfile} from './types';
export const RouteProfilePreview=memo(function RouteProfilePreview({profile:p}:{profile:ElevationProfile}){
 const data=useMemo(()=>{const runs=previewRuns(p.points);let min=Infinity,max=-Infinity;for(const r of runs)for(const x of r){min=Math.min(min,x.altitude!);max=Math.max(max,x.altitude!);}const range=Math.max(20,max-min);return {runs,min,max,x:(d:number)=>8+304*d/Math.max(1,p.distance),y:(h:number)=>76-(h-min)/range*60};},[p]);
 if(!data.runs.length)return <div className="profile-preview empty-profile">Perfil de elevación pendiente<span>Abre Editar para obtener altitudes</span></div>;
 return <div className="profile-preview"><svg viewBox="0 0 320 90" role="img" aria-label={`Perfil de elevación: ${Math.round(data.min)} a ${Math.round(data.max)} metros${p.coverage<.999?', con tramos sin altitud':''}`} preserveAspectRatio="none"><path d="M8 79H312" stroke="#30464c"/>{data.runs.map((run,j)=><g key={j}><path d={`M${data.x(run[0].distance)} 79 ${run.map(a=>`L${data.x(a.distance)} ${data.y(a.altitude!)}`).join(' ')} L${data.x(run.at(-1)!.distance)} 79 Z`} fill="#96e6c322"/>{run.slice(1).map((a,i)=><line key={i} x1={data.x(run[i].distance)} y1={data.y(run[i].altitude!)} x2={data.x(a.distance)} y2={data.y(a.altitude!)} stroke={gradeColor(a.grade)} strokeWidth="2" vectorEffect="non-scaling-stroke"/>)}</g>)}</svg><span>{Math.round(data.min)}–{Math.round(data.max)} m altitud · {p.coverage<.999?`${Math.round(p.coverage*100)} % con datos`:'perfil completo'}</span></div>;
});
