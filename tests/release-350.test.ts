import {describe,expect,it} from 'vitest';
import {WorkoutEngine} from '../src/engine';
import {workouts} from '../src/domain';
import {CyclingPhysicsEngine} from '../src/routes/physics';
import {statistics} from '../src/stats';
import {csv} from '../src/storage';
import {defaultWorkoutMotion,validWorkoutMotion} from '../src/workoutSpeed';
import {effortRecords,bestEffortWindow} from '../src/training/model';
import {TelemetryProcessor} from '../src/telemetry';
import {VelodromeEngine,defaultVelo} from '../src/velodrome/model';

const cps={power:96,cadence:null,speed:null,heartRate:70};
const motion={...defaultWorkoutMotion,source:'physics' as const};
function begin(virtual=true){
 const e=new WorkoutEngine();
 e.start(workouts[0],148,'real',0,virtual?motion:defaultWorkoutMotion);
 return e;
}
describe('3.5 · entrenamiento y velocidad',()=>{
 it('integra la distancia del modelo en llano una sola vez y conserva la lectura de rueda',()=>{
  const e=begin(),reference=new CyclingPhysicsEngine(motion.physics);
  let meters=0;
  for(let i=1;i<=60;i++){
   e.tick(i*1000,{...cps,speed:40});
   meters+=reference.step(96,0,1).distance;
  }
  expect(statistics(e.session!.samples,148).distance).toBeCloseTo(meters/1000,9);
  expect(e.session!.samples[0]).toMatchObject({power:96,heartRate:70,cadence:null,sensorSpeed:40});
  expect(e.liveSpeed).toBeCloseTo(reference.speed*3.6);
  expect(csv(e.session!)).toContain('sensor_speed_kmh');
  expect(csv(e.session!)).toContain(',60,physics');
 });
 it('mantiene la velocidad medida aunque haya vatios y admite cero',()=>{
  const e=begin(false);
  e.tick(1000,cps);e.tick(2000,{...cps,speed:0});e.tick(3000,{...cps,speed:36});
  expect(e.session!.samples.map(s=>s.speed)).toEqual([null,0,36]);
  expect(statistics(e.session!.samples,148).distance).toBe(.01);
 });
 it('corta el avance ante potencia caducada o fuera de rango sin usar los km/h de otra fuente',()=>{
  const e=begin(),t=new TelemetryProcessor();
  t.ingest({power:96,speed:24},0);
  for(let i=1;i<=8;i++)e.tick(i*1000,t.snapshot(i*1000));
  expect(e.session!.samples.slice(5).every(s=>s.speed===null)).toBe(true);
  e.tick(9000,{...cps,power:4000,speed:24});
  expect(e.liveSpeed).toBeNull();
  e.tick(10000,cps);expect(e.session!.samples.at(-1)?.speed).toBe(e.session!.samples[0].speed);
 });
 it('mantiene distancia y configuración al pausar, recuperar y reanudar',()=>{
  const e=begin();e.tick(1000,cps);e.tick(2000,cps);e.pause(2000);
  const checkpoint=structuredClone(e.session!);
  e.tick(10000,cps);expect(e.session!.samples).toEqual(checkpoint.samples);
  const resumed=new WorkoutEngine();resumed.restore(checkpoint,12000);resumed.resume(13000);resumed.tick(14000,cps);
  expect(resumed.session!.samples[2]).toMatchObject({segmentStart:true,speed:checkpoint.samples[0].speed});
  expect(resumed.session!.workoutMotion).toEqual(motion);
 });
 it('conserva el comportamiento medido de borradores anteriores',()=>{
  const e=begin(false);e.tick(1000,cps);const old=structuredClone(e.session!);delete old.workoutMotion;
  e.restore(old,3000);e.resume(4000);e.tick(5000,cps);
  expect(e.session!.samples[1].speed).toBeNull();
 });
 it('rechaza configuraciones importadas inválidas',()=>{
  expect(validWorkoutMotion({source:'auto',physics:motion.physics})).toBe(false);
  expect(validWorkoutMotion({source:'physics',physics:{...motion.physics,riderMass:0}})).toBe(false);
  expect(validWorkoutMotion(null)).toBe(false);
 });
 it('calcula la edad del pulso sin alterar la antigüedad del rodillo',()=>{
  const t=new TelemetryProcessor();t.ingest({heartRate:70},0);
  expect(t.age(381,['heartRate'])).toBe(.381);expect(t.age(381)).toBeNull();
 });
});
describe('3.5 · marcas de potencia',()=>{
 it('sitúa el inicio exacto y excluye huecos y pausas',()=>{
  const e=begin();[100,190,235,260,250].forEach((power,i)=>e.tick((i+1)*1000,{...cps,power}));
  expect(bestEffortWindow(e.session!,2)).toEqual({power:255,start:3});
  e.pause(5000);e.resume(12000);e.tick(13000,{...cps,power:500});
  expect(bestEffortWindow(e.session!,2)).toEqual({power:255,start:3});
  e.tick(14000,{...cps,power:null});e.tick(15000,{...cps,power:500});
  expect(bestEffortWindow(e.session!,2)).toEqual({power:255,start:3});
 });
 it('separa las sesiones demo y conserva las marcas de cero vatios',()=>{
  const e=begin();for(let i=1;i<=5;i++)e.tick(i*1000,{...cps,power:0});
  const demo=structuredClone(e.session!);demo.mode='demo';demo.samples.forEach(s=>s.power=500);
  expect(effortRecords([e.session!,demo],'real')[0]).toMatchObject({power:0,start:0});
  expect(effortRecords([e.session!,demo],'demo')[0].power).toBe(500);
 });
 it('marca el corte al perder y recuperar la conexión en pista',()=>{
  const v=new VelodromeEngine();v.prepare({...workouts[0],velodrome:defaultVelo},'real',148);v.ride.start(0);
  v.tick(1000,cps,true);v.ride.disconnect();v.ride.start(5000);v.tick(6000,cps,true);
  expect(v.session().samples[1].segmentStart).toBe(true);
  expect(bestEffortWindow(v.session(),2)).toBeNull();
 });
});
