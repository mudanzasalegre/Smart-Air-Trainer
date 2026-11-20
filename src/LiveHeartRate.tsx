import {PairHeartButton} from './HeartPairing';
import {Heart} from 'lucide-react';
/** Receives only fresh, real HR samples; independent of trainer power and session pause. */
export function LiveHeartRate({value,connected,demo,onConnect}:{value:number|null;connected:boolean;demo:boolean;onConnect:()=>void}){
 const valid=!demo&&connected&&value!==null&&Number.isFinite(value)&&value>0;
 return <section className={`live-heart-rate ${valid?'has-pulse':''}`} aria-label="Pulsaciones en directo"><Heart size={25} aria-hidden="true"/><div className="live-heart-title"><strong>Pulsaciones</strong><span>{demo?'Demo · sin sensor de pulso':valid?'Sensor Bluetooth · en directo':connected?'Esperando lectura reciente':'Sensor desconectado'}</span></div><div className="live-heart-value"><strong>{valid?Math.round(value):'—'}</strong><span>ppm</span></div>{!demo&&!connected&&<PairHeartButton/>}{!demo&&connected&&<button className="button secondary" onClick={onConnect}>{connected?'Ver sensor':'Conectar pulso'}</button>}</section>;
}
