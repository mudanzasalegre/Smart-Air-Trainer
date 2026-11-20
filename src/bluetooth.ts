import {appVersion} from './version';
import {SERVICES,StandardAdapter,uuid,normalizeUuid,deviceInfoText,powerRange,type Range} from './protocols';
import type {Telemetry} from './domain';
import {TelemetryProcessor} from './telemetry';
export type GattRow={service:string;uuid:string;rawService?:string;rawUuid?:string;properties:string[];value?:string;updated?:string;text?:string;reads?:number;notifications?:number;decodeErrors?:number;subscription?:string;decoded?:Telemetry;samples?:{at:string;hex:string;decoded?:Telemetry;error?:string}[]};
export type Log={at:string;level:string;message:string};
export function browserSupport(){return {secure:globalThis.isSecureContext===true,api:typeof navigator!=='undefined'&&typeof navigator.bluetooth?.requestDevice==='function',availability:typeof navigator!=='undefined'&&typeof navigator.bluetooth?.getAvailability==='function',remembered:typeof navigator!=='undefined'&&typeof navigator.bluetooth?.getDevices==='function'};}
export class BluetoothManager {
 device:BluetoothDevice|null=null;state='desconectado';rows:GattRow[]=[];logs:Log[]=[];protocols:string[]=[];features=0;range:Range|null=null;resistanceRange:Range|null=null;control:BluetoothRemoteGATTCharacteristic|null=null;
 readings=new TelemetryProcessor();connectedAt:string|null=null;
 changed=()=>{};onData=(d:Telemetry)=>{};onDisconnect=()=>{};onControlLost=()=>{};onResponse=(d:DataView)=>{};
 private adapter=new StandardAdapter();private chars=new Map<string,BluetoothRemoteGATTCharacteristic>();private listeners:{c:BluetoothRemoteGATTCharacteristic;fn:EventListener}[]=[];private manual=false;private attempt=0;private reconnectTimer:ReturnType<typeof setTimeout>|undefined;private allowed=SERVICES;private operation=0;
 log(message:string,level='info'){this.logs.push({at:new Date().toISOString(),level,message});if(this.logs.length>400)this.logs.shift();this.changed();}
 setWheel(mm:number){this.adapter.wheelMm=mm;}
 // The origin-scoped ID is saved only after a heart-rate subscription succeeds.
 private readonly heartKey='smart-air.preferred-heart.v1';
 private rememberHeart(device:BluetoothDevice){
  try{localStorage.setItem(this.heartKey,device.id);}catch{/* Per-session pairing still works. */}
 }
 forgetHeart(){
  try{localStorage.removeItem(this.heartKey);}catch{/* Storage may be disabled. */}
  this.disconnect();
  this.device=null;
 }
 async restoreHeart(){
  if(this.state!=='desconectado'||!browserSupport().api)return false;
  let id:string|null=null;
  try{id=localStorage.getItem(this.heartKey);}catch{return false;}
  if(!id)return false;
  const op=++this.operation;
  const cached=this.device?.id===id?this.device:null;
  if(!cached&&!browserSupport().remembered)return false;
  clearTimeout(this.reconnectTimer);
  this.state='conectando';this.changed();
  try{
   const device=cached??(await navigator.bluetooth.getDevices()).find(d=>d.id===id);
   if(op!==this.operation)return false;
   if(!device){this.state='desconectado';this.changed();return false;}
   this.allowed=[uuid(0x180d)];
   await this.attach(device,true);
   return this.protocols.includes('HR') && this.device===device && !this.manual;
  }catch(e){
   if(op===this.operation)this.state='desconectado';
   this.log('Reloj recordado sin conexión. Inicia Bici indoor con emisión de pulso o selecciona el reloj. '+this.error(e),'aviso');
   return false;
  }finally{this.changed();}
 }
 private async attach(device:BluetoothDevice,heartOnly:boolean){
  this.device=device;this.manual=false;this.attempt=0;
  device.removeEventListener('gattserverdisconnected',this.disconnected);
  device.addEventListener('gattserverdisconnected',this.disconnected);
  this.log(`Seleccionado: ${device.name||'Sin nombre'}`);
  const op=this.operation+1;
  await this.connect();
  if(op!==this.operation)return;
  if(heartOnly){
   if(!this.protocols.includes('HR')){
    this.disconnect();
    throw new Error('El reloj no ha habilitado las notificaciones de pulso BLE. Comprueba la emisión durante la actividad.');
   }
   this.rememberHeart(device);
  }
 }
 async select(heartOnly=false,extra:string[]=[]){if(this.state==='buscando'||this.state==='conectando')return;if(!browserSupport().api)throw new Error('Este navegador no expone Web Bluetooth. Prueba Bluefy en iPhone o iPad.');if(!browserSupport().secure)throw new Error('Bluetooth necesita HTTPS.');this.manual=true;clearTimeout(this.reconnectTimer);this.device?.removeEventListener('gattserverdisconnected',this.disconnected);this.device?.gatt?.disconnect();this.clearListeners();const op=++this.operation;this.rows=[];this.protocols=[];this.readings.clear();this.control=null;this.range=null;this.resistanceRange=null;this.features=0;this.state='buscando';this.changed();this.allowed=heartOnly?[uuid(0x180d)]:[...SERVICES,...extra];try{const device=await navigator.bluetooth.requestDevice(heartOnly?{filters:[{services:[uuid(0x180d)]}]}:{acceptAllDevices:true,optionalServices:this.allowed});if(op!==this.operation)return;await this.attach(device,heartOnly);}catch(e){if(op===this.operation)this.state='desconectado';this.log(this.error(e),'error');throw e;}}
 private clearListeners(){for(const {c,fn} of this.listeners)c.removeEventListener('characteristicvaluechanged',fn);this.listeners=[];this.chars.clear();}
 async connect(){if(!this.device?.gatt)throw new Error('El navegador no proporciona conexión GATT.');const op=++this.operation;this.state='conectando';this.changed();this.clearListeners();this.control=null;this.range=null;this.resistanceRange=null;this.features=0;this.protocols=[];this.rows=[];this.readings.clear();this.connectedAt=null;this.adapter=new StandardAdapter(this.adapter.wheelMm);try{const server=await this.device.gatt.connect();if(op!==this.operation)return;this.connectedAt=new Date().toISOString();for(const serviceId of this.allowed){let service:BluetoothRemoteGATTService;try{service=await server.getPrimaryService(serviceId);}catch(e){this.log(`Servicio ${serviceId}: ${this.error(e)}`,'diagnóstico');continue;}if(op!==this.operation)return;let chars:BluetoothRemoteGATTCharacteristic[];try{chars=await service.getCharacteristics();}catch(e){this.log(`No se pueden enumerar características: ${this.error(e)}`,'error');continue;}this.log(`Servicio autorizado ${service.uuid}: ${chars.length} características`);for(const c of chars){if(op!==this.operation)return;const props=['read','write','writeWithoutResponse','notify','indicate'].filter(k=>Boolean((c.properties as unknown as Record<string,boolean>)[k]));const cid=normalizeUuid(c.uuid),sid=normalizeUuid(service.uuid);const row:GattRow={service:sid,uuid:cid,rawService:service.uuid,rawUuid:c.uuid,properties:props,reads:0,notifications:0,decodeErrors:0,samples:[],subscription:'No solicitada'};this.rows.push(row);this.chars.set(cid,c);
 const receive=(value:DataView,kind:'read'|'notification')=>{if(op!==this.operation)return;const raw=Array.from(new Uint8Array(value.buffer,value.byteOffset,value.byteLength));row.value=raw.slice(0,256).map(b=>b.toString(16).padStart(2,'0')).join(' ')+(raw.length>256?' …':'');row.updated=new Date().toISOString();if(kind==='read')row.reads=(row.reads||0)+1;else row.notifications=(row.notifications||0)+1;
 const sample:{at:string;hex:string;decoded?:Telemetry;error?:string}={at:row.updated,hex:row.value};
 try{row.text=deviceInfoText(cid,value);if(cid===uuid(0x2ad9))this.onResponse(value);else if(cid===uuid(0x2ada)){this.log(`Estado FTMS: ${row.value}`);if(value.byteLength&&[1,2,255].includes(value.getUint8(0)))this.onControlLost();}else{const data=this.adapter.decode(cid,value);if(Object.keys(data).length){row.decoded=data;sample.decoded=data;this.readings.ingest(data);this.onData(data);}}}catch(e){row.decodeErrors=(row.decodeErrors||0)+1;sample.error=this.error(e);this.log(`Paquete ${cid}: ${sample.error}`,'error');}
 // A bounded ring: six recent packets per characteristic, no unbounded telemetry log.
 row.samples=[...(row.samples||[]).slice(-5),sample];};
 if(props.includes('read'))try{const val=await c.readValue();if(op!==this.operation)return;receive(val,'read');if(cid===uuid(0x2acc)&&val.byteLength>=8)this.features=val.getUint32(4,true);if(cid===uuid(0x2ad8))this.range=powerRange(val);if(cid===uuid(0x2ad6))this.resistanceRange=powerRange(val);}catch(e){this.log(`Lectura ${c.uuid}: ${this.error(e)}`,'error');}
 if(props.includes('notify')||props.includes('indicate')){const fn:EventListener=(event)=>{const value=(event.target as BluetoothRemoteGATTCharacteristic|null)?.value??c.value;if(value)receive(value,'notification');else this.log(`Notificación sin valor: ${cid}`,'error');};row.subscription='Solicitando';c.addEventListener('characteristicvaluechanged',fn);try{await c.startNotifications();if(op!==this.operation){c.removeEventListener('characteristicvaluechanged',fn);return;}row.subscription='Activa';this.listeners.push({c,fn});if(cid===uuid(0x2ad9)&&props.includes('indicate')&&props.includes('write')&&(typeof c.writeValueWithResponse==='function'||typeof c.writeValue==='function'))this.control=c;if([uuid(0x2a63),uuid(0x2a5b),uuid(0x2ad2),uuid(0x2a37)].includes(cid))this.protocols=Array.from(new Set([...this.protocols,cid===uuid(0x2ad2)?'FTMS':cid===uuid(0x2a63)?'CPS':cid===uuid(0x2a5b)?'CSC':'HR']));}catch(e){row.subscription='Error: '+this.error(e);c.removeEventListener('characteristicvaluechanged',fn);this.log(`Notificaciones ${c.uuid}: ${this.error(e)}`,'error');}}
 }}if(op!==this.operation)return;this.state='conectado';this.attempt=0;this.log(`GATT conectado · ${this.protocols.join(' + ')||'sin telemetría estándar detectada'}`);}catch(e){if(op!==this.operation)return;this.state='desconectado';this.log(this.error(e),'error');throw e;}finally{this.changed();}}
 private disconnected=()=>{this.operation++;this.readings.clear();for(const row of this.rows)if(row.subscription==='Activa')row.subscription='Interrumpida';this.state='desconectado';this.control=null;this.features=0;this.range=null;this.resistanceRange=null;this.clearListeners();this.onDisconnect();this.log('Conexión GATT cerrada. La resistencia física no está garantizada.','aviso');if(!this.manual&&this.attempt<3&&typeof document!=='undefined'&&document.visibilityState==='visible'){this.attempt++;this.reconnectTimer=setTimeout(()=>{this.log(`Reconexión ${this.attempt}/3`);void this.connect().catch(()=>{if(!this.manual&&this.attempt<3)this.disconnected();});},this.attempt*2000);}};
 disconnect(){this.readings.clear();for(const row of this.rows)if(row.subscription==='Activa')row.subscription='Cerrada';this.manual=true;this.operation++;clearTimeout(this.reconnectTimer);this.device?.gatt?.disconnect();this.device?.removeEventListener('gattserverdisconnected',this.disconnected);this.clearListeners();this.state='desconectado';this.control=null;this.onDisconnect();this.changed();}
 async reconnect(){if(!this.device)throw new Error('Selecciona primero un dispositivo.');this.manual=false;await this.connect();}
 diagnostic(){return {app:`Smart Air Trainer ${appVersion}`,connectedAt:this.connectedAt,readings:this.readings.snapshot(),lastReadingAgeSeconds:this.readings.age(Date.now(),['power','cadence','speed','heartRate']),at:new Date().toISOString(),userAgent:navigator.userAgent,support:browserSupport(),device:{name:this.device?.name,id:this.device?.id,state:this.state},permissions:this.allowed,scope:'Solo servicios solicitados y autorizados. No es un escaneo completo de servicios propietarios desconocidos.',protocols:this.protocols,features:this.features,powerRange:this.range,resistanceRange:this.resistanceRange,services:this.rows,events:this.logs};}
 error(e:unknown){return e instanceof Error?`${e.name}: ${e.message}`:String(e);}
}
