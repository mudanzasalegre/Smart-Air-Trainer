import {describe,it,expect,vi,afterEach} from 'vitest';
import 'fake-indexeddb/auto';
import {ValhallaProvider,providerError} from '../src/routes/providers';
import type {Coordinate} from '../src/routes/types';
const stops=(n:number):Coordinate[]=>Array.from({length:n},(_,i)=>({lat:39.68+i*.0001,lon:-.28+i*.0001}));
const response=(points:Coordinate[])=>new Response(JSON.stringify({code:'Ok',routes:[{geometry:{type:'LineString',coordinates:points.map(p=>[p.lon,p.lat])}}]}));
afterEach(()=>vi.unstubAllGlobals());
describe('Public Valhalla limit regression: routes with 19/20 stops',()=>{
 for(const n of [19,20])it(`routes all ${n} stops in ordered overlapping groups without losing geometry`,async()=>{
  const received:Coordinate[][]=[];const fetcher=vi.fn(async(url:URL)=>{const p=JSON.parse(url.searchParams.get('json')!).locations;received.push(p);if(p.length>10)return new Response(JSON.stringify({code:'InvalidValue'}),{status:400});return response(p);});vi.stubGlobal('fetch',fetcher);
  const progress:number[]=[];const points=stops(n),r=await new ValhallaProvider(`https://batch-${n}.example/route`).calculate(points,'road',new AbortController().signal,x=>progress.push(x));
  expect(received.map(p=>p.length)).toEqual(n===19?[10,10]:[10,10,2]);expect(received[0][9]).toEqual(received[1][0]);expect(r.geometry).toEqual(points);expect(progress.at(-1)).toBe(1);
 },10000);
 it('reports the failed batch and never returns a partial or straight fallback route',async()=>{
  let count=0;vi.stubGlobal('fetch',vi.fn(async(url:URL)=>++count===1?response(JSON.parse(url.searchParams.get('json')!).locations):new Response(JSON.stringify({code:'NoRoute',message:'Impossible route between points'}),{status:400})));
  await expect(new ValhallaProvider('https://batch-error.example/route').calculate(stops(19),'road',new AbortController().signal)).rejects.toThrow('Tramo 2/2 · paradas 10–19: No se encontró');expect(count).toBe(2);
 },10000);
 it('refuses discontinuous server geometry at a shared stop',async()=>{
  let count=0;vi.stubGlobal('fetch',vi.fn(async(url:URL)=>{const p=JSON.parse(url.searchParams.get('json')!).locations;if(++count===2)p[0]={lat:40,lon:0};return response(p);}));
  await expect(new ValhallaProvider('https://batch-gap.example/route').calculate(stops(19),'road',new AbortController().signal)).rejects.toThrow('no enlazan en la parada 10');
 },10000);
 it('cancels between groups without another request',async()=>{
  const c=new AbortController(),fetcher=vi.fn(async(url:URL)=>response(JSON.parse(url.searchParams.get('json')!).locations));vi.stubGlobal('fetch',fetcher);
  await expect(new ValhallaProvider('https://batch-abort.example/route').calculate(stops(20),'road',c.signal,()=>c.abort())).rejects.toMatchObject({name:'AbortError'});expect(fetcher).toHaveBeenCalledTimes(1);
 });
 it('preserves HTTP details and distinguishes provider limits and route errors',()=>{
  expect(providerError(400,{error_code:150,error:'Exceeded max locations: 10'})).toContain('limita las paradas');
  expect(providerError(400,{code:'NoSegment'})).toContain('Acerca los puntos');
  expect(providerError(400,{error_code:100,error:'Failed to parse json request'})).toContain('código 100');
 });
 it('validates coordinates and distance before sending network requests',async()=>{
  const fetcher=vi.fn();vi.stubGlobal('fetch',fetcher);const p=new ValhallaProvider('https://invalid-points.example/route');
  await expect(p.calculate([{lat:NaN,lon:0},{lat:39,lon:0}],'road',new AbortController().signal)).rejects.toThrow('inválidas');
  await expect(p.calculate([{lat:0,lon:0},{lat:40,lon:0}],'road',new AbortController().signal)).rejects.toThrow('500 km');expect(fetcher).not.toHaveBeenCalled();
 });
});
