import {afterEach,describe,expect,it,vi} from 'vitest';
import {BluetoothManager} from '../src/bluetooth';

function fixture(){
 const cache=new Map<string,string>();
 vi.stubGlobal('localStorage',{getItem:(k:string)=>cache.get(k)??null,setItem:(k:string,v:string)=>cache.set(k,v),removeItem:(k:string)=>cache.delete(k)});
 vi.stubGlobal('isSecureContext',true);
 const c=Object.assign(new EventTarget(),{uuid:'2A37',properties:{notify:true},startNotifications:vi.fn(async()=>{}),value:new DataView(new Uint8Array([6,70]).buffer)});
 const services=vi.fn(async(_uuid:string)=>({uuid:'180D',getCharacteristics:async()=>[c]}));
 const device=Object.assign(new EventTarget(),{id:'allowed-watch',name:'fēnix',gatt:{connect:vi.fn(async()=>({getPrimaryService:services})),disconnect:vi.fn()}});
 const bt={requestDevice:vi.fn(async()=>device),getDevices:vi.fn(async()=>[device])};
 vi.stubGlobal('navigator',{bluetooth:bt});
 return {device,bt,c,cache,services};
}
afterEach(()=>vi.unstubAllGlobals());
describe('Reloj de pulso recordado',()=>{
 it('solo recupera un reloj elegido previamente y recibe pulsaciones sin otro selector',async()=>{
  const {bt,c,services}=fixture();
  expect(await new BluetoothManager().restoreHeart()).toBe(false);
  const first=new BluetoothManager();await first.select(true);first.disconnect();
  const next=new BluetoothManager();expect(await next.restoreHeart()).toBe(true);
  expect(bt.requestDevice).toHaveBeenCalledTimes(1);expect(bt.getDevices).toHaveBeenCalledTimes(1);
  expect(services.mock.calls.map(args=>args[0])).toEqual(Array(2).fill('0000180d-0000-1000-8000-00805f9b34fb'));
  c.dispatchEvent(new Event('characteristicvaluechanged'));expect(next.readings.snapshot().heartRate).toBe(70);
  next.forgetHeart();expect(await next.restoreHeart()).toBe(false);expect(next.readings.snapshot().heartRate).toBeNull();
 });
 it('respeta permisos revocados y no abre un selector automáticamente',async()=>{
  const {bt}=fixture();await new BluetoothManager().select(true);bt.getDevices.mockResolvedValue([]);
  const next=new BluetoothManager();expect(await next.restoreHeart()).toBe(false);expect(next.state).toBe('desconectado');expect(bt.requestDevice).toHaveBeenCalledTimes(1);
 });
 it('cancela la recuperación pendiente al pasar a demo o desconectar',async()=>{
  const {bt,device}=fixture();await new BluetoothManager().select(true);
  let release!:(ds:typeof device[])=>void;bt.getDevices.mockImplementation(()=>new Promise(r=>{release=r;}));
  const next=new BluetoothManager(),pending=next.restoreHeart();next.disconnect();release([device]);expect(await pending).toBe(false);expect(device.gatt.connect).toHaveBeenCalledTimes(1);
 });
 it('mantiene disponible la selección normal si el navegador no ofrece getDevices',async()=>{
  const {bt,device}=fixture();await new BluetoothManager().select(true);
  vi.stubGlobal('navigator',{bluetooth:{requestDevice:bt.requestDevice}});
  const next=new BluetoothManager();expect(await next.restoreHeart()).toBe(false);
  await next.select(true);expect(next.device?.id).toBe(device.id);
 });
 it('exige una suscripción válida antes de recordar el reloj',async()=>{
  const {c,cache}=fixture();c.startNotifications.mockRejectedValue(new Error('BLE'));
  await expect(new BluetoothManager().select(true)).rejects.toThrow('pulso BLE');expect(cache.size).toBe(0);
 });
});
