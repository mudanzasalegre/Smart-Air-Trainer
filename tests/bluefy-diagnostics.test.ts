import {afterEach,describe,expect,it,vi} from 'vitest';
import 'fake-indexeddb/auto';
import {BluetoothManager} from '../src/bluetooth';
import {StandardAdapter,uuid,normalizeUuid,deviceInfoText} from '../src/protocols';
import {ResistanceController} from '../src/resistance';
import {buildDiagnostic} from '../src/diagnostics';
import {storage} from '../src/storage';
const d=(a:number[])=>new DataView(new Uint8Array(a).buffer);
class Characteristic extends EventTarget{
 value:DataView|null=null; writes:number[][]=[];
 constructor(public uuid:string,public properties:Record<string,boolean>,private initial?:DataView,private notifyError=false){super();}
 async readValue(){if(!this.initial)throw new Error('No value');this.value=this.initial;return this.initial;}
 async startNotifications(){if(this.notifyError)throw new Error('Bridge notification failed');return this;}
 emit(value:DataView){this.value=value;this.dispatchEvent(new Event('characteristicvaluechanged'));}
 async writeValueWithResponse(b:ArrayBuffer){const bytes=[...new Uint8Array(b)];this.writes.push(bytes);queueMicrotask(()=>this.emit(d([128,bytes[0],1])));}
}
async function connect(services:Record<string,Characteristic[]>){
 const server={connected:true,connect:async()=>server,disconnect:()=>{server.connected=false;},getPrimaryService:async(id:string)=>{const entry=Object.entries(services).find(([key])=>normalizeUuid(key)===id);if(!entry)throw new Error('NotFound');return {uuid:entry[0],getCharacteristics:async()=>entry[1]};}};
 const device={name:'BkoolAir test fixture',id:'private-device-id',gatt:server,addEventListener:()=>{},removeEventListener:()=>{}};
 vi.stubGlobal('navigator',{userAgent:'Bluefy bridge fixture',bluetooth:{requestDevice:vi.fn(async()=>device)}});vi.stubGlobal('isSecureContext',true);
 const m=new BluetoothManager(),received:any[]=[];m.onData=x=>received.push(x);await m.select();return {m,received};
}
afterEach(()=>{vi.unstubAllGlobals();vi.useRealTimers();});
describe('Bluefy short UUID regression and usable diagnostics',()=>{
 it('normalizes 16/32-bit and uppercase standard UUIDs without modifying proprietary identity',()=>{
  for(const value of ['2A63','2a63','00002A63','0x2A63',' 00002A63-0000-1000-8000-00805F9B34FB '])expect(normalizeUuid(value)).toBe(uuid(0x2a63));
  expect(normalizeUuid('F000AA01-0451-4000-B000-000000000000')).toBe('f000aa01-0451-4000-b000-000000000000');
 });
 it('decodes the actual zero-power packet in the screenshot and subsequent wheel telemetry',async()=>{
  const power=new Characteristic('2A63',{notify:true}),firmware=new Characteristic('2A26',{read:true},d([0x34,0x2e,0x33,0x32]));
  const {m,received}=await connect({'1818':[power],'180A':[firmware]});
  power.emit(d([0x10,0,0,0,0,0,0,0,0,0]));expect(received.at(-1)).toEqual({power:0});
  power.emit(d([0x10,0,148,0,2,0,0,0,0,8]));expect(received.at(-1).power).toBe(148);expect(received.at(-1).speed).toBeCloseTo(15.156);
  expect(m.protocols).toEqual(['CPS']);expect(m.rows[0]).toMatchObject({uuid:uuid(0x2a63),rawUuid:'2A63',service:uuid(0x1818),notifications:2,subscription:'Activa'});expect(m.rows[1].text).toBe('4.32');expect(m.readings.snapshot().cadence).toBeNull();expect(m.control).toBeNull();
 });
 it('preserves DataView offsets when decoding firmware and standard measurements',()=>{
  const bytes=new Uint8Array([255,52,46,51,50,255]);expect(deviceInfoText('2A26',new DataView(bytes.buffer,1,4))).toBe('4.32');
  expect(new StandardAdapter().decode('2A63',d([0,0,148,0]))).toEqual({power:148});
 });
 it('records malformed packets, bounds the ring and expires readings without inventing cadence',async()=>{
  vi.useFakeTimers({toFake:['Date']});vi.setSystemTime(100000);const power=new Characteristic('2A63',{notify:true});const {m}=await connect({'1818':[power]});
  for(let i=0;i<12;i++)power.emit(d([0,0,148,0]));power.emit(d([16]));expect(m.rows[0].notifications).toBe(13);expect(m.rows[0].decodeErrors).toBe(1);expect(m.rows[0].samples).toHaveLength(6);expect(m.rows[0].samples?.at(-1)?.error).toBeTruthy();
  vi.setSystemTime(106000);expect(m.readings.snapshot().power).toBeNull();m.disconnect();power.emit(d([0,0,200,0]));expect(m.rows[0].notifications).toBe(13);
 });
 it('does not claim subscriptions when the browser rejects notification setup',async()=>{
  const power=new Characteristic('2A63',{notify:true},undefined,true),{m}=await connect({'1818':[power]});expect(m.state).toBe('conectado');expect(m.protocols).toEqual([]);expect(m.rows[0].subscription).toContain('Error');expect(m.readings.snapshot().power).toBeNull();
 });
 it('normalizes FTMS features, ranges and indication response paths while requiring capabilities',async()=>{
  const features=new Characteristic('2ACC',{read:true},d([0,0,0,0,8,0,0,0])),range=new Characteristic('2AD8',{read:true},d([0,0,88,2,1,0])),control=new Characteristic('2AD9',{write:true,indicate:true});
  const {m}=await connect({'1826':[features,range,control]});const ctrl=new ResistanceController(m);expect(ctrl.available).toBe(true);await ctrl.start('erg',148);expect(ctrl.enabled).toBe(true);expect(control.writes.map(x=>x[0])).toEqual([0,5,7]);await ctrl.stop();expect(ctrl.enabled).toBe(false);
 });
 it('creates selectable text and JSON, redacts identifiers by default and retains a detached snapshot',async()=>{
  const power=new Characteristic('2A63',{notify:true}),serial=new Characteristic('2A25',{read:true},new DataView(new TextEncoder().encode('SERIAL-PRIVATE').buffer));
  const {m}=await connect({'1818':[power],'180A':[serial]});power.emit(d([0,0,148,0]));const managers={trainer:m,hr:new BluetoothManager(),cadence:new BluetoothManager()};const r=buildDiagnostic(managers);
  expect(r.text).toContain('Cycling Power Measurement');expect(r.text).toContain('"power":148');expect(r.json).not.toContain('private-device-id');expect(r.json).not.toContain('SERIAL-PRIVATE');expect(buildDiagnostic(managers,true).json).toContain('SERIAL-PRIVATE');
  power.emit(d([0,0,200,0]));expect(JSON.parse(r.json).devices.trainer.readings.power).toBe(148);await storage.saveDiagnosticReport(r);expect(await storage.diagnosticReport()).toEqual(r);m.disconnect();expect(buildDiagnostic(managers).text).toContain('desconectado');
 });
});
