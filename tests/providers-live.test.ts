// Opt-in only: these tests contact public providers. Do not enable on every CI run.
import {describe,it,expect} from 'vitest';
import 'fake-indexeddb/auto';
import {ValhallaProvider,OpenMeteoElevation,OpenMeteoGeocoding} from '../src/routes/providers';
import {defaultProviders,type Coordinate} from '../src/routes/types';
import {buildElevation} from '../src/routes/elevation';
const enabled=import.meta.env.VITE_LIVE_PROVIDERS==='1';
describe.skipIf(!enabled)('Live public provider contract — opt in',()=>{
 it('calculates 19 Sagunto stops with the production provider adapter',async()=>{
  const points=Array.from({length:19},(_,i)=>({lat:39.6798+i*.0001,lon:-.2785+i*.0002}));
  const r=await new ValhallaProvider(defaultProviders.routingUrl).calculate(points,'road',new AbortController().signal);
  expect(r.geometry.length).toBeGreaterThan(19);expect(buildElevation(r.geometry).distance).toBeGreaterThan(100);
  console.log('LIVE Valhalla: 19 stops, geometry points:',r.geometry.length);
 },90000);
 it('finds Sagunto and obtains numeric elevation from the configured providers',async()=>{
  const signal=new AbortController().signal;
  const found=await new OpenMeteoGeocoding(defaultProviders.geocodingUrl).search('Sagunto, Valencia, España',signal);
  expect(found.some((p:Coordinate)=>p.lat>39&&p.lat<40&&p.lon<0&&p.lon>-.5)).toBe(true);
  const heights=await new OpenMeteoElevation(defaultProviders.elevationUrl).fetch([{lat:39.6798,lon:-.2785},{lat:39.6822,lon:-.2715}],signal);
  expect(heights).toHaveLength(2);expect(heights.every(x=>typeof x==='number'&&Number.isFinite(x))).toBe(true);console.log('LIVE Sagunto: search results',found.length,'elevation',heights);
 },90000);
});
