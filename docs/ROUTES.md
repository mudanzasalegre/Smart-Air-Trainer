# Rutas — versión 2

## Alcance y continuidad

Se amplía el proyecto existente. No hay backend de sesiones ni suscripción nueva. Se conserva la identidad y URL del Site. La publicación mantiene su audiencia privada existente. La autenticación del alojamiento es independiente de la app local. Bluetooth no se mueve a un servidor ni exige que Windows permanezca encendido.

La base `smart-air-trainer-v1` sube a versión 2 y añade únicamente stores `routes` y `providerCache`. `sessions`, `workouts` y `settings` siguen intactos. Las nuevas actividades incluyen un snapshot completo de la ruta en `Session.routeActivity`; editar o eliminar la ruta de la colección no altera actividades previas. Se preservan FTP y modo de cada sesión. Borradores de rutas y entrenamientos usan claves distintas. Guardado de borrador cada 10 s y al pausar/ocultar/finalizar; recuperación explícita, siempre pausada. Puede perderse lo no checkpointado ante cierre abrupto.

## Uso

1. Rutas → Explorar: buscar localidad (ejemplo Sagunto) o navegar sin GPS.
2. Crear y editar: tocar para añadir hasta 20 paradas; arrastrar para mover; reordenar/eliminar/deshacer/invertir/cerrar circuito. Calcular por carreteras invoca el proveedor real. Un error nunca se reemplaza con líneas rectas.
3. Obtener elevación: muestreo y cálculo explícitos. Revisar cobertura, fuente, resolución, desniveles y advertencias. Guardar para reutilizar sin volver a descargar alturas.
4. Alternativa: importar GPX desde el selector de archivos. Se separan tracks y segmentos discontinuos; el usuario elige el tramo. Se conservan las coordenadas originales y puntos de interés. Exportación GPX 1.1 como track de ruta, sin marcas de tiempo ficticias de actividad.
5. Preparar recorrido y elegir una única velocidad: sensor o modelo físico desde potencia. Seleccionar Demo antes de iniciar si no hay rodillo.
6. Durante recorrido: pausa/reanuda/finaliza, centra mapa, sigue posición, cambia fondo, inspecciona perfil. La inspección nunca modifica la distancia recorrida. Guarda la actividad en Historial; CSV telemetría y CSV recorrido distinguen origen de velocidad.

GPX: máximo 10 MB, 50.000 coordenadas y 100 segmentos; rutas de hasta 500 km. DTD/entidades externas se rechazan. XML válido y coordenadas/altitudes validadas. Todo nombre se renderiza como texto, nunca HTML externo. Se exportan las alturas del perfil elegido; las alturas GPX originales siguen disponibles dentro de la geometría guardada.

## Proveedores y condiciones

| Función | Inicial | Condiciones / alternativas |
|---|---|---|
| Render | Leaflet 1.9.4, BSD-2-Clause | Ligero, táctil, 2D, no requiere WebGL. Contrato MapProvider sustituible; MapLibre queda como alternativa futura con infraestructura vectorial propia. |
| Calles | OpenStreetMap raster | Datos ODbL, atribución visible, Referer normal del navegador, caché HTTP; sin prefetch ni paquetes offline. Servicio público sin SLA. |
| Topográfico | IGN España mapa-raster TMS | Licencia IGN compatible CC BY 4.0, cobertura España; `{-y}` para TMS. No es un servicio numérico de alturas. |
| Búsqueda | Open-Meteo / GeoNames | Localidades y códigos postales, CC BY 4.0, uso personal no comercial. Consulta explícita, no autocompletar. No es búsqueda exhaustiva de direcciones o comercios. |
| Búsqueda alternativa | Adaptador Nominatim | Configurar servidor propio/compatible con CORS. El servidor público de OSMF no se preconfigura: exige decisión informada del desarrollador responsable, máximo agregado 1 solicitud/s, caché y ausencia de autocompletar. |
| Enrutado | Valhalla FOSSGIS | API pública de demostración, perfil bicycle road/hybrid/cross, no certifica seguridad/acceso. Máximo 1 solicitud/s/usuario, límites globales y sin SLA. Para distribuir ampliamente, contactar al operador o autoalojar. Software MIT. |
| Enrutado alternativo | OSRM FOSSGIS routed-bike | Perfil ciclista único, máximo 1 solicitud/s, sin uso intensivo. El segmento URL `driving` de esta instancia no cambia su grafo de bicicleta. Software BSD-2-Clause. |
| Altitud | Open-Meteo / Copernicus DEM GLO-90 | Modelo de 90 m, hasta 100 coordenadas/consulta, atribución a ambos. API no comercial gratuita: 600/min, 5.000/h, 10.000/día; sin garantía de servicio. |
| Altitud alternativa | OpenTopoData, p.ej. EU-DEM 25 m | Endpoint configurable. Público: 100 coordenadas, 1 solicitud/s, 1.000/día; CORS puede impedir uso directo. Autoalojamiento y licencia del dataset por separado. |

La app serializa APIs por host con intervalo mínimo 1,2 s y un límite local conservador de 500 solicitudes/día/host. Búsqueda/enrutado en caché 7 días, altitudes 30 días; la ruta guardada conserva su propio perfil permanentemente hasta borrado. Caché acotada/purgable. Cancelación, timeout 25 s y errores HTTP explícitos. Estos límites locales no garantizan cumplir límites agregados si se amplía a múltiples usuarios o dispositivos simultáneos: para ese escenario se necesita coordinación/servidor propio. Endpoints HTTPS sustituibles sin recompilar; no claves privadas en código público.

Mapas y APIs envían las coordenadas o consultas necesarias al proveedor. No se envía potencia, pulso, FTP ni historial. No se solicita GPS. La cartografía no acredita firme, acceso legal ni seguridad.

## ElevationEngine

Distancias Haversine con radio medio terrestre 6.371.008,8 m, acumuladas sobre toda la geometría original. Remuestreo configurable 10–500 m, máximo ~5.001 muestras; DEM inicial no se consulta con separación inferior a 90 m. Las cifras de pendiente son estimaciones de terreno a esa resolución, no rampas medidas de carretera ni puentes/túneles.

Alturas distinguen original/interpolada/DEM/ausente, conservan rawAltitude y procedencia. Interpolación solo entre extremos conocidos y huecos ≤300 m por defecto, sin extrapolar inicio/fin. Filtro mediana de 3 y media local configurable; elevación filtrada para ascenso/descenso. Pendiente = 100 Δaltura / distancia horizontal, usando ventana suficiente incluso al final si queda un segmento corto. Cero distancia no divide. Pendientes absolutas >30% se marcan no fiables y se omiten del desnivel; cobertura parcial se declara. El refiltrado mantiene la distancia de la geometría original, no la de atajos entre puntos muestreados.

Mapa/perfil sincronizados por distancia acumulada y proyección de selección al segmento más próximo. Gráficos muestreados hasta ~600 trazos, fondo local opcional. No hay recálculo de elevaciones en cada notificación BLE.

## CyclingPhysicsEngine y RouteSimulationEngine

Modelo longitudinal:

`m dv/dt = eta P / v − m g sin(theta) − Crr m g cos(theta) − 0.5 rho CdA v²`, con `theta=atan(pendiente/100)`.

Valores genéricos editables: ciclista 70 kg, bicicleta 10 kg, Crr .005, CdA .32 m², rho 1.225 kg/m³, eficiencia .97. No se presentan como medidas del usuario. Arranque regularizado con mínimo denominador .5 m/s y fuerza motriz máxima 1.000 N; integración subpasos ≤.1 s, aceleración acotada −5..2 m/s², velocidad 0..100 km/h. Son límites numéricos de simulación, no un modelo calibrado del Smart Air. Pendientes negativas permiten inercia/descenso aun con potencia cero, pero potencia ausente bloquea avance. El modelo requiere elevación y pendientes fiables en todo el trazado.

Fuente única por sesión: velocidad recibida o física. Nunca se suman. Velocidad recibida debe ser 0..150 km/h; muestras caducan a los 2 s para avanzar. Pausa/desconexión conservan distancia, nunca rellenan segundos perdidos; reanudar es explícito. Suspensión >3 s pausa. Estado prepared/running/paused/disconnected/finished/error. Alcanzar destino finaliza automáticamente. Máximo 6 h de muestras 1 Hz; gráficas acotadas. Demo ×1/5/20/60 afecta solo tiempo virtual demo, se rotula y no escribe Bluetooth. Tiempo transcurrido es reloj real y por tanto puede ser menor que tiempo virtual en demo acelerada.

## Control real, no supuesto

Reutiliza ResistanceController y BluetoothManager de V1. Se activa únicamente en Real, en marcha, con control point FTMS y target feature bit 13 detectados y pendiente válida. Solicitud de control 0x00, consigna inicial neutra, Start 0x07; procedimiento 0x11 Indoor Bike Simulation Parameters: viento 0 m/s, grade int16 LE en .01%, Crr uint8 en .0001, wind resistance coefficient rho*CdA uint8 en .01 kg/m. Parámetros fuera de rango se rechazan. Gradiente acotado ±10%, rampa .5 puntos porcentuales/s, máximo 1 orden/s y una única confirmación pendiente.

Cada éxito necesita respuesta 0x80/opcode/0x01. Rechazo, timeout y pérdida de control desactivan automatismo. Pausar/finalizar/pérdida de datos detienen el envío y solicitan Stop cuando hay enlace. Reanudar/reconectar nunca reactiva control automáticamente. La pendiente no se convierte en porcentaje de resistencia. No se escriben comandos propietarios Bkool. La resistencia física tras desconectar es desconocida. Se mantiene la vía de diagnósticos BLE para comprobar la unidad real.

## Offline y plataforma

Service Worker precachea interfaz/assets locales, incluidos módulos de mapas y XML. No intercepta teselas ni APIs externas. Rutas/perfiles locales y simulación pueden operar sin fondo cartográfico usando Solo trazado. Primera carga, autenticación del alojamiento y caché efectiva dependen del navegador. No se prometen mapas offline ni conexión BLE bajo bloqueo iOS. Safari/PWA no obtiene Web Bluetooth por instalarse; Bluefy continúa como vía de prueba. La arquitectura de motores independientes se comparte con la futura capa Capacitor/CoreBluetooth descrita en native/README.md; no se ha firmado ni distribuido un binario iOS.

## Fuentes primarias consultadas (2026-11-15)

- https://leafletjs.com/reference.html
- https://operations.osmfoundation.org/policies/tiles/
- https://operations.osmfoundation.org/policies/nominatim/
- https://www.ign.es/web/ign/portal/ide-area-nodo-ide-ign
- https://www.ign.es/web/ign/portal/politica-datos
- https://valhalla.github.io/valhalla/api/route/api-reference/
- https://valhalla.github.io/valhalla/start/introduction/
- https://routing.openstreetmap.de/about.html
- https://open-meteo.com/en/docs/geocoding-api
- https://open-meteo.com/en/docs/elevation-api
- https://open-meteo.com/en/terms
- https://www.opentopodata.org/api/
- https://www.opentopodata.org/server/
- https://arxiv.org/abs/2005.04229
- https://arxiv.org/abs/2103.09806
- https://www.bluetooth.com/specifications/specs/fitness-machine-service-1-0-1/
