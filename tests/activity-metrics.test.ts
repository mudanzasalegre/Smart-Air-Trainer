import {describe,it,expect} from 'vitest';
import {energyEstimate,remainingEstimate,routeMeanSpeed,timeDisplay} from '../src/activityMetrics';
import type {Sample} from '../src/domain';
import type {RouteProgress} from '../src/routes/types';
const samples=(p:(number|null)[]):Sample[]=>p.map((power,t)=>({t,power,cadence:null,speed:null,heartRate:null,target:null}));
const progress=(n:number,meters=5):RouteProgress[]=>Array.from({length:n},(_,t)=>({t,distance:t*meters,speed:meters*3.6,speedSource:'virtual',power:100,heartRate:null,cadence:null,altitude:0,grade:0,ascent:0,control:'none'}));
describe('Activity energy and remaining-time estimates',()=>{
 it('integrates one-second power samples and distinguishes missing power from zero',()=>{expect(energyEstimate(samples([100,100,null,0]))).toEqual({kj:.2,kcal:200/(.24*4184),coverage:.75});expect(energyEstimate(samples([null,null])).kcal).toBeNull();expect(energyEstimate(samples([0,0])).kcal).toBe(0);});
 it('does not include pauses absent from the active sample series',()=>{expect(energyEstimate(samples([200,200])).kj).toBe(.4);});
 it('waits for thirty seconds of progress and hides ETA on pause, dropout or no motion',()=>{expect(remainingEstimate(progress(30),1000,true,18)).toBeNull();expect(remainingEstimate(progress(31),1000,true,18)).toBe(200);expect(remainingEstimate(progress(61),1000,false,18)).toBeNull();expect(remainingEstimate(progress(61,0),1000,true,0)).toBeNull();});
 it('uses only the last minute and returns zero at the finish',()=>{const p=progress(121);p[0].distance=-9000;expect(remainingEstimate(p,1000,true,18)).toBe(200);expect(remainingEstimate(p,0,false,0)).toBe(0);});
 it('calculates route mean from the same distance source and formats long sessions',()=>{expect(routeMeanSpeed(5000,600)).toBeCloseTo(30);expect(routeMeanSpeed(0,0)).toBeNull();expect(timeDisplay(3661)).toBe('1:01:01');expect(timeDisplay(null)).toBe('—');});
});
