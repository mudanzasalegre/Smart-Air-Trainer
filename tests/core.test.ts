import {describe,it,expect,vi,afterEach} from 'vitest';
import 'fake-indexeddb/auto';
import {workouts,duration,intervalAt,target,zone,validateWorkout,type Sample} from '../src/domain';
import {WorkoutEngine} from '../src/engine';
import {TelemetryProcessor} from '../src/telemetry';
import {indoorBike,heartRate,StandardAdapter,powerRange,powerCommand,uuid} from '../src/protocols';
import {statistics} from '../src/stats';
import {storage,csv} from '../src/storage';
import {BluetoothManager,browserSupport} from '../src/bluetooth';
import {ResistanceController} from '../src/resistance';
const d=(arr:number[])=>new DataView(new Uint8Array(arr).buffer);
const metrics={power:148,cadence:90,speed:30,heartRate:130};
const samples=(n:number,p=148):Sample[]=>Array.from({length:n},(_,t)=>({t,...metrics,power:p,target:148}));
afterEach(()=>{vi.useRealTimers();vi.unstubAllGlobals();});
describe('Workout engine',()=>{
 it('presets have exact requested durations',()=>expect(workouts.map(duration)).toEqual([0,1200,2700,1800,1500]));
 it('interval boundaries choose the next block exactly',()=>{const w=workouts[4];expect(intervalAt(w,299)?.block.name).toBe('Calentamiento');expect(intervalAt(w,300)?.index).toBe(1);expect(intervalAt(w,420)?.index).toBe(2);expect(intervalAt(w,1500)).toBe(null);});
 it('FTP and absolute targets are distinct',()=>{expect(target({name:'a',duration:10,unit:'ftp',intensity:105},148)).toBe(155);expect(target({name:'b',duration:10,unit:'watts',intensity:105},148)).toBe(105);});
 it('does not accumulate pauses and samples at 1 Hz',()=>{const e=new WorkoutEngine();e.start(workouts[0],148,'real',0);e.tick(1000,metrics);e.pause(1000);e.tick(5000,metrics);expect(e.activeMs).toBe(1000);expect(e.session!.elapsed).toBe(5);e.resume(6000);e.tick(7000,metrics);expect(e.session!.samples.length).toBe(2);expect(e.activeMs).toBe(2000);expect(e.finish(8000)?.mode).toBe('real');});
 it('auto pauses after suspension without fabricated samples',()=>{const e=new WorkoutEngine();e.start(workouts[0],148,'real',0);e.tick(1000,metrics);e.tick(10000,metrics);expect(e.status).toBe('paused');expect(e.session!.samples).toHaveLength(1);expect(e.session!.interrupted).toBe(true);});
 it('finishes timed sessions and freezes FTP snapshot',()=>{const e=new WorkoutEngine();e.start({...workouts[1],blocks:[{name:'short',duration:10,unit:'ftp',intensity:50}]},148,'demo',0);for(let t=1;t<=12;t++)e.tick(t*1000,metrics);expect(e.status).toBe('finished');expect(e.session!.samples).toHaveLength(10);expect(e.session!.ftp).toBe(148);});
 it('rejects invalid custom durations and target values',()=>{const w={...workouts[1]};expect(validateWorkout(w)).toBe(true);expect(validateWorkout({...w,blocks:[{...w.blocks[0],duration:0}]})).toBe(false);expect(validateWorkout({...w,blocks:[{...w.blocks[0],intensity:NaN}]})).toBe(false);});
});
describe('Telemetry and statistics',()=>{
 it('expires each metric independently and preserves legitimate zero',()=>{const t=new TelemetryProcessor();t.ingest({power:0},1000);t.ingest({cadence:80},4000);expect(t.snapshot(6500)).toEqual({power:null,cadence:80,speed:null,heartRate:null});expect(t.snapshot(1000).power).toBe(0);});
 it('3-second smoothing expires and rejects nonfinite data',()=>{const t=new TelemetryProcessor();t.ingest({power:100},1000);t.ingest({power:200},2000);t.ingest({power:NaN},2500);expect(t.smooth(3000)).toBe(150);expect(t.smooth(6000)).toBeNull();});
 it('zones use exact boundaries',()=>expect([55,56,75,76,90,91,105,106,120,121,150,151].map(x=>zone(x,100))).toEqual([0,1,1,2,2,3,3,4,4,5,5,6]));
 it('calculates constant power NP IF TSS and distance correctly',()=>{const s=statistics(samples(3600),148);expect(s.np).toBeCloseTo(148,6);expect(s.intensity).toBeCloseTo(1);expect(s.tss).toBeCloseTo(100);expect(s.distance).toBeCloseTo(30);expect(s.zones[3]).toBe(3600);});
 it('withholds advanced metrics below 10 min or on any power gap',()=>{expect(statistics(samples(599),148).np).toBeNull();const a=samples(600);a[20].power=null;const s=statistics(a,148);expect(s.np).toBeNull();expect(s.coverage).toBeCloseTo(599/600);expect(s.zones.reduce((a,b)=>a+b,0)).toBe(599);});
 it('does not turn missing metrics into zero averages or distance',()=>{const s=statistics([{t:0,power:null,speed:null,cadence:null,heartRate:null,target:null}],148);expect(s.avgPower).toBeNull();expect(s.distance).toBeNull();expect(s.avgHr).toBeNull();});
 it('records a one-hour workout without dropping samples',()=>{const e=new WorkoutEngine();e.start(workouts[0],148,'demo',0);for(let t=1;t<=3600;t++)e.tick(t*1000,metrics);expect(e.session!.samples.length).toBe(3600);expect(statistics(e.session!.samples,148).tss).toBeCloseTo(100);});
});
describe('Bluetooth standard packet decoding',()=>{
 it('decodes FTMS mandatory speed, optional cadence and signed power',()=>expect(indoorBike(d([0x44,0,0x18,0x0b,180,0,148,0]))).toEqual({speed:28.4,cadence:90,power:148}));
 it('honors More Data flag: speed is omitted',()=>expect(indoorBike(d([0x41,0,0x9b,0]))).toEqual({power:155}));
 it('skips optional fields with correct offsets including energy',()=>expect(indoorBike(d([0xff,3,0,0,180,0,0,0,1,2,3,10,0,150,0,0,0,1,0,1,0,1,130]))).toEqual({cadence:90,power:150,heartRate:130}));
 it('rejects truncated packets',()=>expect(()=>indoorBike(d([0x44,0,0]))).toThrow());
 it('parses HR 8/16 bit and contact loss',()=>{expect(heartRate(d([0,150]))).toEqual({heartRate:150});expect(heartRate(d([1,44,1]))).toEqual({heartRate:300});expect(heartRate(d([4,90]))).toEqual({});});
 it('CPS optional pedal and torque precede crank fields',()=>{const a=new StandardAdapter();expect(a.decode(uuid(0x2a63),d([0x25,0,148,0,50,1,0,1,0,0,4]))).toEqual({power:148});expect(a.decode(uuid(0x2a63),d([0x25,0,148,0,50,1,0,2,0,0,8]))).toEqual({power:148,cadence:60});});
 it('CSC crank rollover uses modular count and event time',()=>{const a=new StandardAdapter();a.decode(uuid(0x2a5b),d([2,255,255,0,252]));expect(a.decode(uuid(0x2a5b),d([2,0,0,0,0])).cadence).toBe(60);});
 it('CPS wheel uses 2048 ticks; CSC wheel uses 1024',()=>{const a=new StandardAdapter(2000);a.decode(uuid(0x2a63),d([16,0,100,0,0,0,0,0,0,0]));expect(a.decode(uuid(0x2a63),d([16,0,100,0,1,0,0,0,0,8])).speed).toBeCloseTo(7.2);const b=new StandardAdapter(2000);b.decode(uuid(0x2a5b),d([1,0,0,0,0,0,0]));expect(b.decode(uuid(0x2a5b),d([1,1,0,0,0,0,4])).speed).toBeCloseTo(7.2);});
 it('validates power range and encodes signed little endian target',()=>{expect(powerRange(d([0,0,0x58,2,1,0]))).toEqual({min:0,max:600,step:1});expect([...powerCommand(300)]).toEqual([5,44,1]);expect(()=>powerRange(d([0,0,1,0,0,0]))).toThrow();});
});
describe('Persistence and export',()=>{
 it('stores profile workout and separate demo/real sessions',async()=>{await storage.saveProfile({name:'Test',ftp:148,wheelMm:2105});expect((await storage.profile())?.ftp).toBe(148);await storage.saveWorkout({...workouts[1],id:'custom',custom:true});expect((await storage.workouts()).some(w=>w.id==='custom')).toBe(true);const e=new WorkoutEngine();e.start(workouts[0],148,'demo',0);e.tick(1000,metrics);await storage.saveSession(e.session!);expect((await storage.sessions()).find(s=>s.id===e.session!.id)?.mode).toBe('demo');await storage.saveDraft(e.session!);expect((await storage.draft())?.id).toBe(e.session!.id);await storage.clearDraft();expect(await storage.draft()).toBeUndefined();});
 it('CSV retains metadata and null fields remain empty',()=>{const e=new WorkoutEngine();e.start(workouts[0],148,'real',0);e.tick(1000,{...metrics,power:null});const out=csv(e.session!);expect(out).toContain('time_s,power_w,cadence_rpm,speed_kmh,heart_rate_bpm,target_w');expect(out).toContain('0,,90,30,130,');expect(out).toContain(',real,148,');});
});
function controllerHarness(ack=true,result=1){const manager=new BluetoothManager(),writes:number[][]=[];manager.features=8;manager.range={min:0,max:600,step:1};manager.state='conectado';const control={writeValueWithResponse:async(buf:ArrayBuffer)=>{const bytes=[...new Uint8Array(buf)];writes.push(bytes);if(ack)queueMicrotask(()=>manager.onResponse(d([0x80,bytes[0],result])));}};manager.control=control as unknown as BluetoothRemoteGATTCharacteristic;return {manager,ctrl:new ResistanceController(manager),writes};}
describe('FTMS control',()=>{
 it('requires advertised power feature and valid range',()=>{const {ctrl,manager}=controllerHarness();expect(ctrl.available).toBe(true);manager.features=0;expect(ctrl.available).toBe(false);});
 it('requests ownership, confirms initial target and start before ramp',async()=>{const {ctrl,writes}=controllerHarness();await ctrl.start('erg',148);expect(writes).toEqual([[0],[5,0,0],[7]]);expect(ctrl.enabled).toBe(true);await ctrl.tick(1000,148,false);expect(writes.at(-1)).toEqual([5,10,0]);expect(ctrl.accepted).toBe(10);});
 it('never transmits periodic commands in demo',async()=>{const {ctrl,writes}=controllerHarness();await ctrl.start('erg',148);const n=writes.length;await ctrl.tick(2000,200,true);expect(writes.length).toBe(n);});
 it('rate limits and ramps targets',async()=>{const {ctrl,writes}=controllerHarness();await ctrl.start('erg',148);await ctrl.tick(1000,600,false);await ctrl.tick(1100,600,false);expect(writes).toHaveLength(4);await ctrl.tick(2000,600,false);expect(ctrl.accepted).toBe(20);});
 it('does not confuse rejected commands with accepted control',async()=>{const {ctrl}=controllerHarness(true,5);await expect(ctrl.start('erg',148)).rejects.toThrow('rechazó');expect(ctrl.enabled).toBe(false);expect(ctrl.accepted).toBeNull();});
 it('times out without starting control',async()=>{vi.useFakeTimers();const {ctrl}=controllerHarness(false);const pending=expect(ctrl.start('erg',148)).rejects.toThrow('Sin confirmación');await vi.advanceTimersByTimeAsync(5001);await pending;expect(ctrl.enabled).toBe(false);});
 it('stop is acknowledged and disables setpoint loop',async()=>{const {ctrl,writes}=controllerHarness();await ctrl.start('erg',148);await ctrl.stop();expect(writes.at(-1)).toEqual([8,1]);expect(ctrl.enabled).toBe(false);const n=writes.length;await ctrl.tick(1000,148,false);expect(writes).toHaveLength(n);});
 it('rejects unsolicited mismatched indications',async()=>{vi.useFakeTimers();const {ctrl,manager}=controllerHarness(false);const pending=expect(ctrl.start('erg',148)).rejects.toThrow('Sin confirmación');manager.onResponse(d([128,5,1]));await vi.advanceTimersByTimeAsync(5001);await pending;});
});
describe('Browser and real GATT transport with a fake peripheral',()=>{
 it('detects missing API without attempting permissions',()=>{vi.stubGlobal('navigator',{});vi.stubGlobal('isSecureContext',true);expect(browserSupport()).toMatchObject({api:false,secure:true});});
 it('requests only authorized services, connects and subscribes real API shape',async()=>{const calls:string[]=[];let notification:EventListener|undefined;const c={uuid:uuid(0x2a63),properties:{notify:true},value:d([0,0,148,0]),addEventListener:(_n:string,fn:EventListener)=>notification=fn,removeEventListener:()=>{},startNotifications:async()=>{calls.push('notify');}};const service={uuid:uuid(0x1818),getCharacteristics:async()=>[c]};const server={connect:async()=>server,connected:true,disconnect:()=>{},getPrimaryService:async(id:string)=>{calls.push(id);if(id!==uuid(0x1818))throw new Error('NotFound');return service;}};const device={name:'Fake CPS test fixture',id:'test',gatt:server,addEventListener:()=>{},removeEventListener:()=>{}};const request=vi.fn(async(_options:RequestDeviceOptions)=>device);vi.stubGlobal('navigator',{bluetooth:{requestDevice:request}});vi.stubGlobal('isSecureContext',true);const m=new BluetoothManager();const received:any[]=[];m.onData=x=>received.push(x);await m.select();notification!(new Event('characteristicvaluechanged'));expect(m.state).toBe('conectado');expect(m.protocols).toContain('CPS');expect(received).toContainEqual({power:148});expect(request).toHaveBeenCalledTimes(1);expect(request.mock.calls[0]?.[0]).toEqual({acceptAllDevices:true,optionalServices:[0x1826,0x1818,0x1816,0x180d,0x180a].map(uuid)});expect(m.rows[0].properties).toContain('notify');expect(calls).toContain('notify');});
});
