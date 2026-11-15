# Smart Air Trainer · 3.1.0

Aplicación personal de ciclismo indoor para **iPad y iPhone**, con entrenamientos, rutas geográficas, historial local y conexión BLE directa con dispositivos compatibles. Diseñada alrededor del **Bkool Smart Air**; no necesita que Windows permanezca encendido cuando se utiliza desde una web alojada.

- **Web existente:** https://smart-air-trainer-jonsui.monmode.chatgpt.site
- **GitHub:** https://github.com/mudanzasalegre/Smart-Air-Trainer
- **Versión:** 3.1.0 · React + TypeScript + Vite · IndexedDB · Web Bluetooth · Leaflet.
- Sin backend de sesiones, cuenta deportiva, analítica ni API de pago obligatoria.
- La web y el repositorio son públicos; los datos deportivos permanecen en el almacenamiento local del navegador.

> **Estado real de compatibilidad:** las capturas del usuario en Bluefy muestran conexión GATT y notificaciones Cycling Power Service de su BkoolAir, con firmware declarado 4.32. Los informes posteriores del usuario confirman potencia variable de 91–96 W y pulsaciones BLE del Garmin de 70–77 ppm; no se ha validado el control físico del rodillo. No hay una configuración que pueda garantizar por sí sola la lectura y el control si el firmware no expone servicios compatibles. La primera conexión debe confirmar qué anuncia tu unidad. Este README diferencia funcionamiento de la app, acceso Bluetooth y control efectivo del rodillo.

## Contenido

1. [Qué incluye y qué falta](#1-qué-incluye-y-qué-falta)
2. [Empezar desde iPad o iPhone](#2-empezar-desde-ipad-o-iphone)
3. [Conectar el Smart Air](#3-conectar-el-smart-air)
4. [Sensores y Garmin Fenix 6 Solar](#4-sensores-y-garmin-fenix-6-solar)
5. [Entrenamientos, ERG y seguridad](#5-entrenamientos-erg-y-seguridad)
6. [Mapas, rutas y simulación](#6-mapas-rutas-y-simulación)
7. [Guardar, recuperar y cambiar de dispositivo](#7-guardar-recuperar-y-cambiar-de-dispositivo)
8. [Instalación para desarrollo en Windows](#8-instalación-para-desarrollo-en-windows)
9. [Despliegue HTTPS sin PC encendido](#9-despliegue-https-sin-pc-encendido)
10. [PWA, actualizaciones y funcionamiento offline](#10-pwa-actualizaciones-y-funcionamiento-offline)
11. [Solución de problemas](#11-solución-de-problemas)
12. [Lista de validación con hardware real](#12-lista-de-validación-con-hardware-real)
13. [Arquitectura y futura aplicación nativa](#13-arquitectura-y-futura-aplicación-nativa)
14. [Pruebas, privacidad y fuentes](#14-pruebas-privacidad-y-fuentes)

## 1. Qué incluye y qué falta

| Componente | Estado de 3.0.1 |
|---|---|
| Entrenamientos libres y estructurados, editor, FTP y siete zonas | Implementados; FTP inicial 148 W, editable |
| Inicio, agenda semanal, objetivos y favoritos | Implementados; planes y actividades Real/Demo separados |
| Potencia, cadencia, velocidad y pulso | Lectores estándar; cada métrica depende del dispositivo y sus notificaciones |
| Diagnóstico BLE | Selección real, conexión GATT, servicios autorizados, propiedades, valores y exportación JSON |
| Smart Air: CPS, CSC, FTMS o protocolo propietario | CPS observado en capturas de Bluefy; CSC, FTMS y control propietario no confirmados |
| ERG, resistencia manual y pendiente | Control FTMS condicional; requiere capacidades y respuestas aceptadas |
| Mapas, búsqueda, rutas por carreteras, GPX, elevación y simulador | Implementados; proveedores externos sujetos a disponibilidad y límites |
| Historial, estadísticas, notas, RPE y copias JSON | Locales en IndexedDB; exportación CSV de telemetría y recorrido |
| Recuperación de borradores | Entrenamiento y ruta, reanudación explícita; checkpoints, no recuperación de datos nunca guardados |
| PWA e interfaz offline | Implementadas cuando el navegador admite Service Workers; no mapas offline completos |
| App nativa iOS | Arquitectura y configuración de ejemplo; **no hay binario iOS ni transporte nativo integrado** |
| ANT+ FE-C, FIT, Garmin Connect y Strava | No implementados; no son requisitos para la vía web BLE |

La documentación de ROUVY identifica el **Smart Air** como compatible por Bluetooth, pero no publica en esa ficha el protocolo GATT utilizado. Esa compatibilidad en otra app **no demuestra FTMS** para esta implementación ni debe confundirse con Smart Pro, Smart Go o BKOOL Bike. [Fuente: ROUVY](https://support.rouvy.com/hc/en-us/articles/14059132272529-Supported-Trainers).

## 2. Empezar desde iPad o iPhone

### Ruta recomendada: web HTTPS dentro de Bluefy

1. Instala **[Bluefy – Web BLE Browser](https://apps.apple.com/app/bluefy-web-ble-browser/id1492822055)** desde App Store. Revisa la ficha y las condiciones vigentes; no hace falta contratar un servicio de entrenamiento.
2. Abre **Bluefy directamente** y escribe la URL de Smart Air Trainer. Un enlace abierto dentro de ChatGPT, Safari u otro navegador no se traslada automáticamente a Bluefy.
3. Si la web de Sites pide acceso, inicia sesión con la cuenta propietaria **en ese navegador**. Tener sesión en Safari no garantiza tenerla en Bluefy. Si ese flujo de acceso no funciona en Bluefy, utiliza un despliegue HTTPS alternativo de este código: el login del alojamiento y Bluetooth son problemas diferentes.
4. Entra en **Configuración** y comprueba `v3.1.0`; después, en **Perfil**, revisa el FTP, nombre y circunferencia de rueda.
5. Prueba primero **Demo**, inicia una sesión corta y guárdala. Así verificas navegación, gráficos y almacenamiento antes de probar el hardware.
6. Termina y guarda o descarta esa demo. Cambia a **Real** y sigue el apartado de conexión.

Bluefy proporciona la capa BLE; la página debe implementar el protocolo del dispositivo. HTTPS y la pulsación de un botón de conexión son parte del flujo documentado por su fabricante. [Guía oficial](https://bluefy.app/guide.html).

### Si no se abre App Store

La ficha de Bluefy es válida, pero algunas vistas integradas bloquean enlaces externos o esquemas de apps. En Dispositivos y Configuración hay un botón `Abrir la app App Store`, una ficha web alternativa y el enlace de Smart Air en un campo seleccionable. Si no se abre desde ChatGPT, abre App Store manualmente y busca **Bluefy – Web BLE Browser**, desarrollador **PNN SOFT**. También puedes pegar la ficha HTTPS en Safari. Después abre Bluefy por su icono y pega allí la URL de Smart Air. Los botones no trasladan automáticamente el historial de Safari ni garantizan abrir otra aplicación.

### Qué navegador elegir

| Entorno | Uso previsto |
|---|---|
| Bluefy en iOS/iPadOS | Primera vía de prueba para conexión web BLE; comprobar las operaciones que admite su versión |
| Safari y PWA de Safari | Interfaz, agenda, rutas y Demo; no contar con Web Bluetooth por instalar la PWA |
| WebBLE | Alternativa para investigar; no presumir paridad de API ni gratuidad. [Proyecto y limitaciones](https://github.com/daphtdazz/WebBLE) |
| Navegador integrado de otra app | No asumir acceso BLE; abrir la URL en Bluefy |
| Chrome/Edge en Windows con adaptador BLE | Pruebas alternativas de GATT; no es el puente obligatorio del iPad |

La comprobación decisiva es **Dispositivos → Selector BLE**. La aplicación detecta `navigator.bluetooth.requestDevice`, contexto seguro y métodos opcionales. La presencia de la API no certifica todos los métodos GATT ni el hardware. La ausencia de `getAvailability` por sí sola tampoco demuestra que BLE sea imposible.

### Ajustes del dispositivo Apple

- Activa Bluetooth y autoriza a Bluefy cuando iOS lo solicite. Si lo denegaste, revisa el permiso Bluetooth de la app en Ajustes; los nombres de menús pueden variar con la versión.
- Mantén Bluefy visible y la pantalla desbloqueada durante la prueba. El bloqueo o cambio de app puede suspender el enlace.
- Configuración ofrece **Mantener pantalla encendida** si el navegador expone Wake Lock. Si no, ajusta temporalmente el bloqueo automático del dispositivo.
- Evita navegación privada para datos que quieras conservar. No borres datos de la web para actualizarla.
- Utiliza un solo iPad o iPhone como controlador del rodillo durante la prueba. El segundo puede servir para consultar instrucciones; no es una pantalla sincronizada.

## 3. Conectar el Smart Air

### Preparación

1. Enciende el Smart Air conforme a su manual y coloca el iPad cerca.
2. Cierra otras apps o dispositivos que estén conectados al rodillo: Bkool, Zwift, ROUVY, PC, otro móvil, etc. Su manual contempla una conexión Bluetooth simultánea.
3. Usa un desarrollo cómodo y empieza con esfuerzo suave. La transmisión de 7 velocidades no requiere una configuración BLE ni implica cambio virtual electrónico.
4. Abre la web HTTPS en Bluefy, en **Real**, y ve a **Dispositivos**.

### Conexión y comprobación

1. Pulsa **Conectar rodillo**. La solicitud se inicia desde esta interacción; la app no pide permisos repetidamente en segundo plano.
2. Selecciona el dispositivo que corresponda a tu Smart Air. El nombre anunciado puede variar: no selecciones sensores ajenos ni presupongas un nombre exacto.
3. Espera a que termine el descubrimiento GATT. **Conectado** significa que existe enlace; no significa que ya haya telemetría ni control.
4. Revisa **Protocolo detectado**, servicios, características y valores del diagnóstico.
5. Pedalea y verifica que cambian los datos. Regresa a Entrenar para observar las métricas y la antigüedad de las lecturas.
6. Si hay potencia pero no cadencia o velocidad, no inventes esos valores: pueden requerir otro servicio o sensor.
7. Exporta **Diagnóstico → Exportar JSON**, tanto si funciona como si no. Conserva también modelo exacto, firmware conocido, versión de iOS/Bluefy y pasos realizados.

El selector estándar no obliga normalmente a emparejar previamente un periférico BLE en los ajustes Bluetooth de iOS. Si el fabricante exige un emparejamiento específico, sigue sus instrucciones. [Bluefy](https://bluefy.app/guide.html).

### Servicios que sabe interpretar la aplicación

UUID cortos Bluetooth SIG, **no una declaración de lo que anuncia el Smart Air**:

| Servicio estándar | UUID corto | Lecturas posibles según características y flags |
|---|---|---|
| Cycling Power Service | `0x1818` | Potencia; revoluciones/eventos de rueda o biela si están presentes |
| Cycling Speed and Cadence | `0x1816` | Revoluciones/eventos para cadencia y velocidad calculadas |
| Fitness Machine Service | `0x1826` | Indoor Bike Data; funciones de control, rangos y estados cuando se anuncian |
| Heart Rate Service | `0x180D` | Frecuencia cardíaca |

Los UUID completos usan la base estándar Bluetooth. La app solicita autorización para servicios concretos y enumera solo los accesibles. **La ausencia de un servicio en el diagnóstico no demuestra que no haya servicios propietarios no autorizados.**

La opción **Autorizar UUID adicionales** acepta UUID conocidos por documentación o una captura fiable. Hace falta volver a seleccionar el dispositivo para ampliar permisos. No introduzcas UUID o comandos tomados de otros modelos Bkool por semejanza de nombre.

### Diagnóstico sin descargar JSON (3.0.2)

Las capturas del usuario muestran UUID cortos en mayúsculas (`1818`, `2A63`). La app ahora los normaliza al UUID estándar completo antes de identificar protocolos, interpretar notificaciones o gestionar FTMS. Se conserva también el UUID original para diagnóstico. El paquete de la captura contiene potencia 0 W y contadores de rueda en cero; no demuestra que haya velocidad ni cadencia disponibles al pedalear.

1. En Bluefy, verifica **v3.1.0** en Configuración, cambia a Real y conecta el rodillo.
2. En Dispositivos → **Diagnóstico para pegar en el chat**, pulsa **Observar 30 segundos**.
3. Pedalea suavemente manteniendo la app visible. No hace falta iniciar una actividad ni activar ERG.
4. Al terminar aparece un informe de texto fijo. Pulsa **Copiar informe**, vuelve al chat y pégalo.
5. Si el portapapeles no funciona, pulsa **Seleccionar todo** o mantén pulsado dentro del campo: Seleccionar todo → Copiar. También existe Compartir texto cuando el navegador lo permite.
6. Puedes cambiar a JSON en pantalla o solicitar descarga TXT/JSON. Una descarga solicitada no se presenta como archivo guardado: el texto visible permanece como alternativa.

El último informe generado se guarda en IndexedDB y puede recuperarse después de desconectar o recargar. La observación de 30 s necesita mantener la pantalla visible; salir de Dispositivos cancela su temporizador. El informe indica cuándo se generó: no cambia mientras se copia. Contiene contadores desde la conexión, los últimos seis paquetes por característica, datos recientes, firmware/hardware/modelo, estado de suscripciones y errores. No es una grabación íntegra de todos los paquetes de 30 s. Las métricas caducan a los 5 s; un enlace GATT o una suscripción aceptada no garantizan telemetría válida.

Por defecto se omiten los campos ID y número de serie; pueden incluirse explícitamente. No contiene actividades ni rutas, pero sí lecturas y datos del dispositivo/navegador. No se transmite automáticamente a ningún servidor. Se conserva un solo informe y no forma parte de la copia deportiva general.

La revisión de firmware muestra el texto declarado por el dispositivo; **4.32 no implica que sea la versión más reciente**. No se incluye ninguna función de actualización de firmware.

## 4. Sensores y Garmin Fenix 6 Solar

### Sensor BLE de pulso

En Real, activa la emisión del sensor y usa **Dispositivos → Frecuencia cardíaca → Conectar Frecuencia cardíaca**. El selector busca Heart Rate Service. Solo se registrará pulso cuando lleguen datos compatibles.

### Cadencia y velocidad

Usa **Dispositivos → Cadencia y velocidad** para un sensor CSC o potenciómetro compatible. Cuando la velocidad se deriva de revoluciones de rueda, revisa la circunferencia en Perfil: **2105 mm es un valor inicial, no una medida del Smart Air**. Una velocidad FTMS directa no usa ese parámetro. Si se conectan fuentes con métricas coincidentes, evita emisores duplicados: esta versión mantiene el último valor recibido, no un selector avanzado de fuente por métrica.

### Garmin Fenix 6 Solar

Garmin incluye la familia fēnix 6 Solar entre los relojes compatibles con **Carrera virtual / Virtual Run**, perfil que puede emitir datos por Bluetooth. No se debe equiparar automáticamente «Emitir FC» con emisión BLE en cualquier modo.

1. Comprueba que el reloj dispone del perfil Carrera virtual y del software requerido.
2. Activa ese perfil conforme a las instrucciones de Garmin y busca el reloj desde la sección de pulso de esta app.
3. Comprueba que aparece Heart Rate Service y que llega frecuencia cardíaca. Si no sucede, no hay integración de pulso confirmada; prueba un sensor BLE compatible o exporta el diagnóstico.
4. No uses la velocidad ni la cadencia de carrera del reloj como si fueran medidas de ciclismo del rodillo.

[Instrucciones oficiales de Garmin](https://support.garmin.com/en-GB/?faq=pyniXQfLiu3BS1yKFlLn36). Esta aplicación no sincroniza con Garmin Connect; una grabación simultánea en el reloj es independiente.

## 5. Entrenamientos, ERG y seguridad

- **Libre:** sin bloques obligatorios, con un límite de registro de 6 horas por sesión.
- **Recuperación:** 20 min al 55 % FTP.
- **Base aeróbica:** 45 min, calentamiento, resistencia y enfriamiento.
- **Tempo:** 30 min con bloque central al 80 % FTP.
- **Intervalos:** 25 min: 5 min + 3 × (2 min al 105 % + 3 min al 50 %) + 5 min.
- **Personalizado:** bloques, vatios o % FTP, repeticiones y recuperaciones.

Selecciona una sesión desde Entrenamientos o un plan desde Inicio. Inicia, pausa, reanuda, finaliza y **guarda**. Guardar vincula el resultado al plan, sin afirmar que hayas completado todos sus minutos. El historial conserva el FTP usado; cambiarlo después no reescribe sesiones anteriores.

### Activar control electrónico solo si está disponible

| Modo | Requisito adicional |
|---|---|
| ERG | FTMS, capacidad objetivo de potencia, rango válido y punto de control con indicaciones |
| Resistencia manual | Capacidad FTMS y rango de resistencia válido |
| Pendiente | Capacidad FTMS de simulación; no es «% pendiente = % resistencia» |

La activación es explícita y se permite durante la sesión. Se solicita control, se envían consignas y se esperan respuestas del rodillo. **Escribir una orden no equivale a que el rodillo la acepte.** La app limita frecuencia y cambios de consigna; no envía comandos propietarios inventados.

Pausar o finalizar solicita detener el control si hay enlace. El botón **Detener control electrónico** es distinto de detener el cronómetro. Una desconexión o confirmación protocolaria no garantiza resistencia física cero. Tras reconectar, el automatismo no se reactiva solo. En Demo nunca se envían órdenes BLE.

Si el control no aparece disponible, los entrenamientos y rutas siguen proporcionando objetivos visuales. Instalar otro navegador no convierte un protocolo propietario desconocido en FTMS.

## 6. Mapas, rutas y simulación

### Crear una ruta por carreteras

1. Rutas → Explorar; busca una localidad, por ejemplo **Sagunto**. La búsqueda inicial es de localidades/códigos postales, no un buscador completo de comercios.
2. Crear ruta → activa la edición de puntos y marca salida, paradas y destino.
3. Usa **Calcular por carreteras**. Se admiten 2–20 paradas, calculadas en grupos de hasta 10: el servidor público actual limita cada petición a 10. Los grupos comparten una parada, se consultan en orden con separación mínima de 1,2 s y se comprueba que sus geometrías enlacen (tolerancia de redondeo de 1 m). Si falla un grupo no se publica un trazado parcial ni se sustituye por segmentos rectos. El error indica el tramo y las paradas que conviene revisar; el borrador permanece protegido.
4. Obtén o recalcula elevación. Revisa fuente, resolución, cobertura, perfil y pendientes.
5. Pon nombre y guarda. «Guardar ruta» y «Guardar actividad» son acciones distintas.
6. Pulsa **Preparar recorrido** y elige una única fuente de velocidad.

Puedes reordenar/eliminar puntos, deshacer, invertir, cerrar circuito, editar, duplicar, guardar o descartar. Los cambios de edición no sustituyen la ruta guardada hasta guardar explícitamente. Los borradores se protegen localmente.

### Importar GPX desde Archivos de iOS

Rutas → Importar GPX → selecciona el archivo en Archivos. Elige el track/segmento cuando haya varios. Puedes conservar alturas incluidas o solicitar DEM. Se validan XML, coordenadas y límites; no se ejecuta HTML ni contenido activo. Los tramos discontinuos no se unen silenciosamente. Límite actual: 10 MB, 50.000 puntos, 100 segmentos y 500 km por ruta.

Al editar un GPX, la geometría original permanece protegida frente a toques casuales. Convertirlo a paradas y recalcular por carreteras puede cambiar el trazado. Exportar GPX produce una **ruta**, no una actividad FIT ni una grabación con tiempos ficticios.

### Elegir cómo avanzas

- **Velocidad medida:** avanza con velocidad recibida de rodillo/sensor; si ese dato no está disponible, no avanza.
- **Velocidad virtual desde potencia:** requiere potencia reciente y perfil de pendientes válido. Ajusta masas y parámetros físicos en los ajustes del simulador. Los valores iniciales son genéricos, no mediciones personales.
- **Demo:** datos simulados y aceleración ×1/×5/×20/×60, identificados como tales. El tiempo virtual acelerado no es tiempo real de pedaleo.

Nunca se suman ambas velocidades. Desconexión, datos caducados o suspensión conservan progreso y requieren reanudar. La pendiente automática se activa por separado y solo con FTMS compatible; sin ello se muestra guía manual.

### Proveedores iniciales y configuración

Se configuran desde **Rutas → Proveedores, licencias y ajustes**. No hacen falta claves privadas para los valores iniciales.

| Función | Proveedor/endpoint inicial | Consideraciones |
|---|---|---|
| Render del mapa | Leaflet | Biblioteca incluida en el build |
| Calles | Teselas OpenStreetMap | Atribución, sin descargas masivas ni garantía de servicio |
| Topográfico | IGN España | Cobertura España; un mapa raster no es por sí mismo una API de altitudes |
| Búsqueda | `https://geocoding-api.open-meteo.com/v1/search` | Open-Meteo / GeoNames |
| Enrutamiento | `https://valhalla1.openstreetmap.de/route` | Servicio público FOSSGIS; rutas ciclistas |
| Elevación | `https://api.open-meteo.com/v1/elevation` | Copernicus DEM GLO-90, resolución aproximada 90 m |

Los datos de elevación son estimaciones; no describen con precisión cada rampa, puente o túnel. El trazado de OSM no garantiza seguridad ni acceso permitido.

Open-Meteo limita su API gratuita a uso no comercial y establece cuotas; FOSSGIS publica límites y prohíbe uso intensivo. La app aplica cola, caché y límites locales, pero no garantiza cumplir cuotas agregadas si se amplía a muchos usuarios. Ver [documentación de rutas](docs/ROUTES.md), [Open-Meteo](https://open-meteo.com/en/terms), [FOSSGIS](https://routing.openstreetmap.de/about.html) y [política de teselas OSM](https://operations.osmfoundation.org/policies/tiles/).

Para cambiar proveedor: elige un adaptador implementado y su endpoint HTTPS compatible con CORS. Hay alternativas OSRM, Nominatim y OpenTopoData. Un servidor autoalojado exige infraestructura propia; no lo hace funcionar este frontend por sí solo. No pongas claves privadas en variables `VITE_*`, porque quedarían visibles en el navegador.

## 7. Guardar, recuperar y cambiar de dispositivo

La base IndexedDB conserva el nombre `smart-air-trainer-v1` y usa **esquema 3**. El nombre histórico no significa que el programa sea la versión 1. Las migraciones añaden almacenes sin borrar los anteriores.

- Datos separados por **origen web, navegador y dispositivo**. Bluefy y Safari no comparten automáticamente historial; iPad e iPhone tampoco.
- Configuración → **Copia de seguridad**: perfil, entrenamientos, actividades, rutas, ajustes, agenda, favoritos y objetivos en JSON v3.
- Configuración → **Restaurar copia**: importa JSON v1/v2/v3 validado, fusionando identificadores; no duplica registros iguales. El perfil/ajustes incluidos sustituyen los actuales. La escritura es atómica para evitar restauraciones parciales.
- Los borradores no finalizados no forman parte de esa copia: recupera y guarda una sesión antes de trasladarla a otro dispositivo.
- Los resultados permiten CSV de telemetría, CSV de recorrido si corresponde y JSON. FIT y Strava quedan pendientes.
- Agenda, historial y estadísticas diferencian Real y Demo. Las notas y RPE viajan en JSON; los CSV conservan sus columnas de telemetría.

**Antes de cambiar dominio o alojamiento**, exporta desde la URL antigua e importa en la nueva. Subir código a GitHub **no copia tus entrenamientos** ni modifica el almacenamiento del iPad.

Los checkpoints se guardan aproximadamente cada 10 segundos y en transiciones relevantes. Tras un cierre abrupto puede faltar el último tramo no guardado. La recuperación nunca inventa tiempo o telemetría durante el cierre. Una sesión recuperada vuelve pausada, con control electrónico desactivado.

## 8. Instalación para desarrollo en Windows

### Requisitos

- Git y una copia del código. El repositorio GitHub indicado abajo es el destino previsto: los comandos de clonación serán aplicables cuando se suba el código.
- Node.js **24.x** y npm; el proyecto se verificó con Node 24.22.1. El lockfile fija las dependencias instaladas. Revisa los requisitos de Vite si eliges otro Node.
- No hacen falta MySQL, Docker, un backend, cuenta Bkool ni variables `.env` para la configuración inicial.

En PowerShell o terminal:

```powershell
git clone https://github.com/mudanzasalegre/Smart-Air-Trainer.git
cd Smart-Air-Trainer
npm ci
npm test
npm run build
npm run dev
```

Usa la URL local que imprima Vite; normalmente `http://localhost:5173`. `localhost` puede considerarse contexto seguro en el mismo ordenador. **En el iPad, `localhost` significa el propio iPad**, no tu Windows.

`npm run dev` escucha en la red por la configuración existente, pero acceder mediante `http://IP-DEL-PC:5173` no ofrece el HTTPS necesario para BLE. Tampoco resuelve la independencia del ordenador: al apagarlo, desaparece ese servidor. Usa una publicación HTTPS para entrenar habitualmente.

Para previsualizar un build en Windows:

```powershell
npx vite preview --host 127.0.0.1
```

Eso es una comprobación local, no un servidor de producción. Si PowerShell bloquea `npm.ps1`, puedes usar `npm.cmd ci`, `npm.cmd test` y `npm.cmd run build` sin cambiar globalmente la política de ejecución.

### Qué debe existir después del build

`dist/index.html`, `dist/assets/`, iconos, `manifest.webmanifest` y `sw.js`. El script `scripts/generate-sw.mjs` se ejecuta automáticamente al terminar Vite. No edites a mano los nombres de assets ni el manifiesto de caché generado.

## 9. Despliegue HTTPS sin PC encendido

### Opción A: continuar con ChatGPT Sites

La web ya publicada funciona independientemente de Windows. `.openai/hosting.json` conserva la identidad del Site existente y declara `dist` como salida estática. Este identificador no es una contraseña.

**Un push a este repositorio GitHub no actualiza automáticamente Sites.** No se ha configurado una sincronización GitHub → Sites ni un workflow de despliegue. Para una actualización hay que compilar y publicarla mediante el flujo de Sites conservando el proyecto y su audiencia.

### Opción B: alojamiento estático HTTPS propio

1. Ejecuta `npm ci`, `npm test` y `npm run build`.
2. Publica **el contenido de `dist/`** en la raíz de un origen HTTPS con certificado válido.
3. Sirve HTML, JavaScript, CSS, JSON/manifest, PNG y SVG con tipos correctos.
4. Evita caché inmutable para `index.html`, `sw.js` y `manifest.webmanifest`; permite revalidarlos. Los assets con hash sí pueden usar caché larga.
5. Si configuras `Permissions-Policy`, no bloquees Bluetooth para el propio sitio. Abre la página directamente, no dentro de un iframe sin permisos.
6. Prueba la URL desde Bluefy y verifica el diagnóstico, carga de recursos y persistencia.

La configuración actual usa rutas absolutas (`/assets`, `/sw.js`, `/manifest.webmanifest`, iconos y scope `/`). **Está preparada para la raíz de un dominio/subdominio**, no para publicarla sin cambios bajo `/Smart-Air-Trainer/`. Un despliegue en subcarpeta requiere adaptar conjuntamente Vite base, manifest, Service Worker y rutas de recursos. Por eso no se entrega un workflow de GitHub Pages que daría una falsa impresión de compatibilidad inmediata.

El repositorio privado no hace privado automáticamente el alojamiento externo. Si necesitas acceso privado, configura autenticación en el alojamiento y comprueba que sea utilizable en Bluefy. No añadas secretos de GitHub al frontend. No se ha cambiado la visibilidad del Site existente ni se ha subido esta entrega a GitHub.

El servidor de alojamiento sí debe estar disponible para servir la página y sus actualizaciones; **tu PC doméstico no tiene que estar encendido**. Bluetooth circula entre el rodillo y el dispositivo móvil, no a través del servidor.

## 10. PWA, actualizaciones y funcionamiento offline

- El Service Worker solo se registra en el build de producción. `npm run dev` no es una prueba de funcionamiento offline.
- Tras una primera carga satisfactoria, el navegador compatible puede conservar interfaz y recursos. La primera autenticación del alojamiento y la disponibilidad de caché siguen siendo requisitos reales.
- Rutas y perfiles guardados se reutilizan sin descargar alturas otra vez. Elige **Solo trazado / Sin fondo** si no hay cartografía.
- Búsqueda, cálculo de nuevas rutas, DEM y teselas necesitan sus proveedores. No se descargan mapas completos para offline.
- Añadir a inicio en Safari no añade Web Bluetooth. Si Bluefy no ofrece instalación PWA, úsala dentro de Bluefy.
- Para actualizar: guarda la sesión, cierra todas las ventanas de la app y vuelve a abrir con conexión. El Service Worker no fuerza una recarga durante el entrenamiento.
- No se promete ejecución en segundo plano ni enlace activo con la pantalla bloqueada.

## 11. Solución de problemas

| Síntoma | Qué comprobar y siguiente paso |
|---|---|
| «Navegador sin Web Bluetooth» | URL abierta realmente en Bluefy, no Safari/ChatGPT. HTTPS. Versión del navegador. No se soluciona instalando una PWA de Safari. |
| El Smart Air no aparece | Alimentación, proximidad, permiso Bluetooth, otras apps conectadas y estado del periférico. No usar el PC como puente obligatorio. |
| GATT conectado pero sin vatios | Pedalear; revisar servicios, UUID, notificaciones y valores. Puede faltar protocolo compatible. Exportar diagnóstico. |
| Potencia sí, cadencia no | Revisar flags recibidos; probar sensor de cadencia compatible. No dar por hecho que el rodillo la emite. |
| Sin velocidad, pero con potencia | En rutas puede elegirse velocidad virtual si el perfil está completo; se etiqueta como estimación. |
| ERG/pendiente deshabilitados | Capacidades, rango y control FTMS no confirmados, sesión no iniciada o modo Demo. No habilitar a la fuerza ni enviar comandos propietarios. |
| Orden rechazada o timeout | El control no está confirmado: revisar log, app competidora y estado del rodillo. Reconectar y activar explícitamente si procede. |
| Al bloquear pantalla deja de avanzar | Suspensión del navegador/iOS. Recuperar conexión y reanudar; no rellenar huecos con lecturas antiguas. |
| Sites pide iniciar sesión | Autenticación del alojamiento en ese navegador. No es una cuenta deportiva ni un fallo del rodillo. |
| HTTP 400 con muchas paradas en 3.0.0 | El proveedor limita a 10 paradas por petición. Actualiza a 3.0.1: se fracciona el cálculo sin eliminar tus paradas. Recupera el borrador y vuelve a calcular. |
| La App Store no abre desde ChatGPT | Usar el botón de apertura nativa, pegar la ficha web en Safari o buscar Bluefy de PNN SOFT manualmente en App Store. |
| Ruta no calculada / HTTP 429 / CORS | Revisar proveedor, endpoint y límites. Esperar o usar proveedor propio compatible; no desactivar seguridad del navegador. |
| Sin elevación | Conservar alturas GPX válidas o consultar DEM. No usar modelo físico sobre pendientes desconocidas. |
| Historial aparentemente vacío | Revisar modo Real/Demo, URL, navegador y dispositivo. Restaurar copia si cambiaste alguno. |
| Otra pestaña impide migrar IndexedDB | Cerrar las otras pestañas de Smart Air y abrir la versión nueva; no borrar la base. |
| Se sigue viendo una versión anterior | Guardar, cerrar todas las instancias y volver a abrir con conexión; no vaciar los datos locales. |
| El calendario no envía avisos | La agenda es local; no hay recordatorios push ni integración externa. |

Para incidencias de hardware, comparte el JSON diagnóstico revisado y las versiones usadas. Puede contener nombre/identificador del dispositivo y user agent: evita publicarlo indiscriminadamente. No subas copias con actividades personales al repositorio salvo que lo decidas expresamente.

## 12. Lista de validación con hardware real

Esta lista está **pendiente**, no es una certificación de pruebas ya realizadas:

- [ ] Abrir HTTPS en Bluefy y verificar Selector BLE disponible.
- [ ] Seleccionar y conectar el Smart Air exacto; registrar firmware conocido.
- [ ] Exportar diagnóstico y confirmar servicios/características accesibles.
- [ ] Comprobar potencia en movimiento y lecturas ausentes/caducadas al dejar de recibirse.
- [ ] Comprobar cadencia, velocidad y pulso únicamente donde haya datos reales.
- [ ] Grabar una sesión corta, guardar, recargar y revisar historial/CSV/JSON.
- [ ] Si FTMS está disponible, verificar solicitud y aceptación de control a una consigna moderada; no confundir un ACK con una calibración física.
- [ ] Pausar, detener control y reconectar; comprobar que no vuelve a activarse por sí solo.
- [ ] Recorrer una ruta guardada con una única fuente de velocidad.
- [ ] Solo si está soportado, verificar respuesta física gradual a pendiente y tratamiento de rechazos.
- [ ] Comprobar recuperación tras ocultar/cerrar la app y los límites de iOS.
- [ ] Repetir las pruebas en el segundo dispositivo, sin conexión simultánea al mismo rodillo.

Si falla la lectura/control por servicios propietarios, el siguiente trabajo es desarrollar un adaptador a partir de evidencia del **Smart Air concreto**. Si el impedimento es el navegador, valorar transporte nativo. Si solo se dispone de ANT+ FE-C, hace falta una solución de transporte distinta: Web Bluetooth no recibe ANT+.

## 13. Arquitectura y futura aplicación nativa

| Módulo | Responsabilidad |
|---|---|
| `src/domain.ts` | Perfil, zonas, entrenamientos, contratos de transporte/adaptadores |
| `src/bluetooth.ts`, `src/protocols.ts` | Permisos GATT, descubrimiento, diagnóstico y decodificación estándar |
| `src/telemetry.ts` | Antigüedad de valores y suavizado |
| `src/engine.ts` | Entrenamiento, pausas, recuperación y muestras a 1 Hz |
| `src/resistance.ts` | Control FTMS serializado, confirmaciones, rangos y rampas |
| `src/storage.ts`, `src/stats.ts` | IndexedDB, transacciones, exportación y métricas |
| `src/routes/` | Proveedores, GPX, geometría, elevación, física, simulador y mapas |
| `src/training/` | Agenda, objetivos, favoritos, comparativas y sensaciones |
| `public/`, `scripts/generate-sw.mjs` | Iconos, manifest y caché de aplicación |
| `tests/` | Pruebas de motores, protocolos, almacenamiento y migraciones |
| `native/` | Plan de integración y configuración Capacitor de ejemplo |

**Capacitor no está instalado ni integrado en esta versión.** Copiar el ejemplo o ejecutar `cap add ios` no conecta automáticamente BluetoothManager con CoreBluetooth.

La vía nativa requiere un adaptador de transporte BLE, conectar notificaciones a TelemetryProcessor y adaptar el controlador conservando colas/ACK. Puede usarse `@capacitor-community/bluetooth-le` con una versión compatible de Capacitor. Hace falta macOS/Xcode, configuración de permisos Bluetooth, firma y pruebas en dispositivos reales. Windows por sí solo no proporciona toda esa cadena.

Apple permite pruebas personales con Personal Team y restricciones; los perfiles gratuitos caducan a los 7 días. La distribución habitual por TestFlight/App Store requiere el programa correspondiente. No se ha contratado, firmado ni distribuido una app nativa aquí. Ver [native/README.md](native/README.md), [Capacitor iOS](https://capacitorjs.com/docs/ios), [plugin BLE](https://github.com/capacitor-community/bluetooth-le) y [cuentas Apple Developer](https://developer.apple.com/help/account/basics/about-your-developer-account).

Un transporte nativo resuelve acceso a la radio; no descifra por sí solo un protocolo propietario del rodillo.

## 14. Pruebas, privacidad y fuentes

```powershell
npm ci
npm test
npm run build
```

Validación 3.0.2: **103 pruebas automatizadas** de entrenamientos, parsers BLE y controlador con dobles de prueba, GPX, elevación, simulación, agenda, persistencia y migraciones v1/v2 → v3. Revisiones visuales a dimensiones CSS de iPad/iPhone, sin emulación física de iOS. Las comprobaciones de navegador y build no equivalen a una prueba con el rodillo. Además, en 3.0.1 se ejecutaron dos pruebas externas voluntarias (no repetidas para este cambio BLE): ruta de 19 paradas en Sagunto, búsqueda de localidad y elevación, todas correctas. Para repetirlas de manera puntual en PowerShell: `$env:VITE_LIVE_PROVIDERS="1"; npm test -- tests/providers-live.test.ts; Remove-Item Env:VITE_LIVE_PROVIDERS`. No habilitarlas de forma recurrente en CI contra servicios públicos.

- [Diagnóstico Bluefy 3.0.2](docs/RELEASE-3.0.2.md)
- [Corrección 3.0.1 y pruebas de proveedores](docs/RELEASE-3.0.1.md)
- [Notas de la versión 3.0](docs/RELEASE-3.0.md)
- [Pruebas y limitaciones previas](docs/VALIDATION.md)
- [Rutas, proveedores y algoritmos](docs/ROUTES.md)
- [Revisión de usabilidad](docs/USABILITY.md)

Los documentos históricos de v1/v2 describen esas versiones; prevalecen las notas de 3.0 para esquema, agenda y comportamiento actual.

Las sesiones permanecen en el dispositivo. Las búsquedas y coordenadas necesarias para mapas/rutas/elevación sí llegan a esos proveedores; no se les envían FTP, potencia o historial. No se solicita GPS. Las licencias de dependencias/datos siguen siendo aplicables; repositorio privado no significa que todas las dependencias o servicios estén libres de condiciones.

Fuentes adicionales de referencia técnica. Guía revisada el 15 de noviembre de 2026:

- [Web Bluetooth: especificación](https://webbluetoothcg.github.io/web-bluetooth/)
- [Fitness Machine Service](https://www.bluetooth.com/specifications/specs/fitness-machine-service-1-0-1/)
- [Cycling Power Service](https://www.bluetooth.com/specifications/specs/cycling-power-service-1-1/)
- [Cycling Speed and Cadence](https://www.bluetooth.com/wp-content/uploads/Files/Specification/HTML/CSCS_v1.0/out/en/index-en.html)
- [Heart Rate Service](https://www.bluetooth.com/specifications/specs/heart-rate-service-1-0/)
- [QZ: proyecto de referencia; otros modelos no prueban compatibilidad Smart Air](https://github.com/cagnulein/qdomyos-zwift)

**Objetivo de uso:** abrir una web HTTPS desde Bluefy, conectar localmente dispositivos compatibles y entrenar sin PC encendido. **Pendiente imprescindible:** confirmar la telemetría y, si existe, el control de tu Smart Air real mediante el diagnóstico y la lista anterior.

## Actualización 3.0.3: pulsaciones visibles durante el ejercicio

Entrenar y Rutas incluyen una franja de pulsaciones que permanece visible al desplazar la página. Durante una actividad también se mantiene al navegar por otras secciones. Usa las lecturas recientes del sensor de frecuencia cardíaca conectado, incluso durante una pausa y aunque el rodillo no transmita potencia. A los cinco segundos sin una nueva lectura muestra «—»; al desconectar indica el estado. En Demo no se presentan pulsaciones reales como simuladas.

La prueba del usuario confirma potencia CPS y pulso HR en Bluefy con un fenix 6X Pro Solar. El reloj recibe el rodillo mediante ANT+, mientras la web usa BLE; los paquetes CPS observados no permiten calcular velocidad porque los contadores de rueda permanecen en cero.

## Pantalla dedicada de actividad · 3.1.0

Al iniciar un entrenamiento o recorrido se abre automáticamente una pantalla de actividad sin menú lateral. **Volver al panel** conserva la sesión en marcha; **Abrir pantalla de actividad** permite regresar. Sensores abre Dispositivos. Pausar, reanudar, finalizar, guardar y descartar reutilizan los motores existentes. El guardado sigue siendo explícito y local.

- Rutas: perfil geográfico completo, línea completada en menta, tramo pendiente gris y marcador de posición. El progreso utiliza exclusivamente la fuente seleccionada: velocidad recibida o velocidad virtual desde potencia y terreno. Sin datos recientes el motor conserva el progreso y se detiene.
- Entrenamientos: perfil de bloques completado según tiempo activo, intervalo actual, objetivo, siguiente bloque y tiempo restante. En libre se muestra la potencia de los últimos cinco minutos, sin inventar una ruta.
- Métricas grandes: potencia y zona FTP, pulso en ppm, velocidad, cadencia si llega del sensor, medias y energía estimada. No se ha añadido cálculo ni sensor de cadencia. La demo conserva su identificación visible.
- Kcal: suma de potencia válida × un segundo / (0,24 × 4184). Se asume eficiencia metabólica del 24 %, no medida al usuario. Se muestra el trabajo mecánico en kJ y se indica cálculo parcial cuando hay muestras sin potencia. Sin potencia no se muestra cero ficticio.
- Tiempo restante de ruta: distancia restante / velocidad media de progreso de los últimos 60 segundos. Requiere al menos 30 segundos; se oculta en pausa, pérdida de datos o velocidad inferior a 0,5 km/h. Es una estimación de tiempo activo al ritmo reciente, sin predecir futuras pendientes.
- Media de velocidad en ruta: distancia virtual recorrida / tiempo activo, usando la misma fuente que el progreso. En entrenamientos sin ruta se promedian únicamente las muestras válidas del sensor.
- iPhone: controles y resumen compacto de potencia, pulso y velocidad permanecen en la parte inferior. iPad horizontal: perfil, terreno, métricas y controles comparten la pantalla.

No cambia el esquema de IndexedDB ni los protocolos BLE. No se añaden vídeos, avatares ni órdenes propietarias. La pendiente de ruta es geográfica; no implica control electrónico del Smart Air.
