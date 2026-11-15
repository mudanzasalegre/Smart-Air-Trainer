# Smart Air Trainer 3.0.1 — rutas largas y configuración iOS

15 de noviembre de 2026. Actualización del mismo Site, sin migración ni borrado de datos. Publicación GitHub aplazada por el propietario.

## Incidencia reproducida y corrección

La interfaz admite hasta 20 paradas, pero la instancia pública actual de Valhalla/FOSSGIS limita cada cálculo a 10. Una petición real con 19 puntos devolvió HTTP 400: en formato OSRM, `InvalidValue`; en el formato nativo, `error_code: 150`, `Exceeded max locations: 10`. La captura del usuario muestra 19 paradas. No se dispone del archivo con sus 19 coordenadas exactas: las comprobaciones usan puntos de prueba en Sagunto.

El adaptador ahora procesa grupos ordenados de hasta 10 paradas, compartiendo una parada entre grupos. Para 19 son 10 + 10; para 20 son 10 + 10 + 2. Usa el mismo perfil de bicicleta y el mismo proveedor, conserva todas las paradas y no cambia silenciosamente a coche o a líneas rectas. Se valida la continuidad de la geometría devuelta con tolerancia de redondeo de 1 m. Un fallo muestra tramo/paradas y conserva el borrador; no devuelve una ruta parcial. Se mantienen caché, cola por servidor, separación mínima de 1,2 s y cuota local de 500 peticiones/día. Los límites del servicio público pueden cambiar.

Se muestran causas distintas para límites, ruta inexistente, HTTP 400, indisponibilidad, timeout y red/CORS. Se permite cancelar entre grupos. El cálculo informa del progreso.

## Bluefy y documentación

La ficha oficial de Bluefy mantiene el identificador 1492822055 y la desarrolla PNN SOFT. No era un identificador de app incorrecto. Se añade apertura directa `itms-apps:`, ficha HTTPS sin región forzada y alternativa manual desde App Store/Safari para vistas integradas que no abren enlaces externos. No se afirma haber probado la apertura nativa desde un iPhone físico.

Dispositivos (cuando no hay API BLE) y Configuración incluyen una guía iOS, dirección seleccionable y copia al portapapeles con alternativa si la API falla. El README completo está disponible para lectura dentro de Configuración y descarga desde `/README.md`; se genera desde el mismo archivo fuente y se incluye en la caché de producción.

La guía explica permisos, acceso privado de Sites, BLE del Smart Air, sensores, Garmin, FTMS condicional, mapas, persistencia independiente por navegador/dispositivo, copia/restauración, Windows, despliegue HTTPS, PWA y límites de Capacitor/iOS.

## Pruebas

- `npm test`: 96 pruebas automáticas aprobadas; 2 pruebas externas desactivadas por defecto.
- `VITE_LIVE_PROVIDERS=1 npm test -- tests/providers-live.test.ts`: las 2 pruebas externas aprobadas. Ruta real calculada con 19 paradas en Sagunto y 139 coordenadas de geometría. Búsqueda de Sagunto correcta; dos elevaciones numéricas devueltas: 59 y 43 m.
- Nuevas regresiones: 19/20 paradas, continuidad, error intermedio, cancelación, mensajes y coordenadas/distancia inválidas.
- Navegador de QA: recuperación de borrador, cálculo de carreteras, elevación, guardado, preparación y cancelación conservando la ruta; descarte de edición sin sobrescribir la ruta guardada.

Las pruebas externas son voluntarias para no consultar servicios públicos en cada ejecución de CI. Su resultado verifica disponibilidad durante esta revisión, no un SLA.

## Límites

Sin validación física del Bkool Smart Air, Bluefy en iOS ni comandos de resistencia. La conexión GATT y los adaptadores estándar siguen implementados, pero el protocolo de la unidad concreta requiere diagnóstico real. No se añade protocolo propietario, no se simula éxito BLE y no se habilita control por el simple hecho de instalar Bluefy.

Para recibir la actualización: guardar la sesión, cerrar todas las ventanas/pestañas de Smart Air y volver a abrir con conexión. Verificar `v3.0.1` en Configuración. No borrar el almacenamiento del navegador.
