import {BluetoothManager} from './bluetooth';
import {SHORT,uuid} from './protocols';
export type SavedDiagnostic={at:string;text:string;json:string};
export function buildDiagnostic(managers:{trainer:BluetoothManager;hr:BluetoothManager;cadence:BluetoothManager},includeIdentifiers=false,note='Instantánea manual'):SavedDiagnostic{
 const at=new Date().toISOString();
 const report={version:'3.1.0',at,note,scope:'Lecturas y notificaciones de servicios autorizados; no se envían consignas ni se inicia una actividad.',identifiersIncluded:includeIdentifiers,devices:Object.fromEntries(Object.entries(managers).map(([key,m])=>{
  const d=structuredClone(m.diagnostic());
  if(!includeIdentifiers){delete d.device.id;d.services=d.services.map(row=>row.uuid===uuid(0x2a25)?{service:row.service,uuid:row.uuid,properties:row.properties,text:'Identificador omitido'}:row);}
  return [key,d];
 }))};
 const lines=['SMART AIR TRAINER · DIAGNÓSTICO 3.1.0',`Fecha: ${at}`,`Captura: ${note}`,report.scope,'Identificadores: '+(includeIdentifiers?'incluidos':'ID y número de serie omitidos'),''];
 for(const [key,d] of Object.entries(report.devices)){
  lines.push(`=== ${key} · ${d.device.name||'Sin seleccionar'} ===`,`Estado GATT: ${d.device.state}`,`Conectado desde: ${d.connectedAt||'—'}`,`Protocolos con suscripción aceptada: ${d.protocols.join(', ')||'ninguno'}`,`Navegador: ${d.userAgent}`,`API: ${JSON.stringify(d.support)}`,`Lecturas recientes (caducan a 5 s): ${JSON.stringify(d.readings)}`,`Antigüedad última métrica: ${d.lastReadingAgeSeconds??'—'} s`,`Control FTMS: bits ${d.features}, potencia ${JSON.stringify(d.powerRange)}, resistencia ${JSON.stringify(d.resistanceRange)}`);
  if(includeIdentifiers)lines.push(`ID: ${d.device.id||'—'}`);
  lines.push(`Características accesibles: ${d.services.length}`);
  for(const row of d.services){
   lines.push(`${SHORT[row.uuid]||row.uuid} | servicio ${row.service} | UUID recibido ${row.rawUuid||row.uuid}`,`  ${row.properties.join(', ')} | suscripción: ${row.subscription||'—'} | lecturas: ${row.reads||0} | notificaciones: ${row.notifications||0} | errores: ${row.decodeErrors||0}`);
   if(row.text!==undefined)lines.push(`  Texto: ${row.text}`);
   if(row.value)lines.push(`  Último HEX (${row.updated}): ${row.value}`);
   for(const sample of row.samples||[])lines.push(`  ${sample.at}: ${sample.hex}${sample.decoded?' => '+JSON.stringify(sample.decoded):''}${sample.error?' ERROR '+sample.error:''}`);
  }
  lines.push('Eventos recientes (máximo 35):',...d.events.slice(-35).map(e=>`${e.at} [${e.level}] ${e.message}`),'');
 }
 lines.push('FIN DEL DIAGNÓSTICO · No confirma compatibilidad de control físico.');
 return {at,text:lines.join('\n'),json:JSON.stringify(report,null,2)};
}
