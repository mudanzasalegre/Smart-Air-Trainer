import {createContext,useContext} from 'react';
export const HeartPairing=createContext<{state:string;select:()=>void}|null>(null);

export function PairHeartButton(){
 const pairing=useContext(HeartPairing);
 if(!pairing||pairing.state==='conectado')return null;
 const busy=pairing.state==='buscando'||pairing.state==='conectando';
 return <button type="button" className="button secondary pair-heart" disabled={busy} onClick={pairing.select}>{busy?'Conectando reloj…':'Conectar reloj'}</button>;
}

export function GarminSetup(){
 return <details className="panel garmin-setup"><summary>Grabar Bici indoor en el Garmin y ver el pulso en el iPad</summary><ol>
  <li>Una vez, desde el widget de pulso del fēnix, mantén pulsado MENU y activa <b>Opciones de frecuencia cardiaca → Transmisión durante la actividad</b>.</li>
  <li>En el reloj, inicia el cronómetro de <b>Bici indoor</b>. Puedes seguir usando el Bkool como sensor ANT+ del Garmin.</li>
  <li>En modo Real, conecta el rodillo al iPad. La primera vez, pulsa <b>Conectar reloj</b> y selecciona el fēnix. La app recordará el reloj al aceptar su servicio de pulso.</li>
  <li>En las siguientes sesiones se intentará recuperar el reloj al conectar el rodillo. Si Bluefy pide selección o el reloj comenzó a emitir más tarde, pulsa <b>Conectar reloj</b> desde la actividad.</li>
 </ol><p>Si aparecen vatios pero faltan pulsaciones, comprueba que el reloj emite por Bluetooth durante esa actividad. La conexión ANT+ del rodillo al Garmin es independiente. Guarda la actividad en ambos dispositivos si quieres los dos registros.</p><a href="https://www8.garmin.com/manuals/webhelp/fenix66s6xpro/ES-XM/GUID-57A88A77-3813-4E79-9DB1-FC95B06F01BA.html" target="_blank" rel="noreferrer">Manual de Garmin para la serie fēnix 6 Pro</a></details>;
}
