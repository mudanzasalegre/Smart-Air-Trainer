# Validation — 15 November 2026

## Automated application and protocol tests

35 Vitest tests passed before final review; final count and rerun are recorded in build output.

Coverage: exact 20/45/30/25 minute presets; interval boundaries; FTP versus absolute targets; pause/resume; wall versus active time; automatic pause after timer suspension; one-hour 1 Hz recording; numeric input constraints; independent telemetry expiry and zero handling; rolling 3-second power; all 7 zone boundaries; constant-power NP/IF/TSS; missing/short data suppression; estimated distance; FTMS optional fields, More Data and truncation; HR 8/16-bit; CPS wheel clock vs CSC clock; crank rollover; power-range validation; IndexedDB persistence and recovery; CSV null handling; FTMS feature gating, acknowledgments, rejection, timeout, opcode matching, rate limiting and stop; no demo periodic writes; missing browser API; fake GATT peripheral discovery/notifications with actual Web Bluetooth method shape.

Mocks verify our implementation, not a physical Bkool Smart Air or the BLE radio of an iPhone.

## Browser interaction verified in managed Chromium

- Navigation and initial real mode: metrics empty, no invented power/speed/cadence.
- Start demo, watch live values and chart, pause, resume, finish and save.
- Saved demo detail showed 2:43 active, 3:08 elapsed, coverage 100%, advanced metrics correctly absent under 10 minutes.
- CSV downloaded using actual UI download event.
- Custom workout edited from 20 to 16 minutes, saved, and present after reload.
- Demo history persisted after a page reload; real and demo filters separate.
- Responsive layout inspected inside a same-origin viewport harness: iPad 1024×768 shows power/cadence/speed/time/graph/current/next interval/session controls simultaneously. iPhone 390×844 and compact 375×667 use vertical scrolling and bottom navigation with persistent session controls.
- Devices view on the test browser correctly reported absence of Web Bluetooth and disabled device/control actions, with the Bluefy path shown.

The viewport harness checks CSS dimensions, not Safari or Bluefy execution. Browser device emulation tools are unavailable in this environment; no iOS hardware was used.

## PWA/build validation

TypeScript strict check and Vite production build. Local assets only; generated precache lists every built JS/CSS asset, manifest and icons. Offline behavior still requires on-device verification in the intended BLE browser. Sites access authentication, if enabled, is separate from browser-local app state and can affect initial online loading.

## Pending physical tests

1. Open published HTTPS URL in Bluefy on iPhone/iPad; verify account/access if the Site is owner-private.
2. With other trainer apps closed, select Smart Air from Dispositivos in real mode.
3. Export diagnostic JSON whether or not standard services appear. Discovery includes only explicitly authorized services; unknown proprietary UUIDs may need a native BLE scanner.
4. Verify power/cadence/speed against an independent known recording. External crank sensor may be required.
5. Only if FTMS control is discovered and admitted, test low initial ERG target, returned success, safe ramp, rejection, stop, signal loss and reconnect. Do not assume disconnect releases physical resistance.
6. Test lock/background pause, foreground reconnect, long-session performance, offline reopening and IndexedDB retention on the actual device/browser.

FIT, Strava, ANT+ and native iOS binary are not shipped. Native preparation is documented, not a signed application.

## Iteration 2 — routes

68 tests pass: the original 35 plus 32 route/provider/physics/GPX/FTMS tests and an explicit V1→V2 IndexedDB migration test. Strict TypeScript check and production build pass. New checks include geodesic distances and duplicate coordinates, bounded sampling, all editing operations, altitude gaps/interpolation/noise/extremes, short final segment gradient, original chainage preserved by refilter, GPX coordinate roundtrip/DTD rejection/tracks/routes/POIs/segment separation, physics startup/descending/equilibrium/bounds, coherent progress source, pause/disconnect/stale samples/resume, missing-height gate, accelerated demo/completion, draft recovery and coexistence with legacy sessions, FTMS signed gradient and physical parameter units/ramp/rate/demo gate, provider error/cancellation/cache/GeoJSON shape.

Actual managed Chromium UI checks:
- Open-Meteo locality search returned Sagunto, Provincia de Valencia, Comunidad Valenciana, España.
- OSM tiles visible and interactive; Valhalla returned a 65-coordinate road route (~0.96 km) between the two example points, not a straight connector.
- Open-Meteo provided all profile heights; displayed 90 m resolution, 100% coverage, ~3 m ascent /19 m descent, 40–59 m elevation. These are provider estimates, not hardware ground truth.
- Saved route survived full reload. Added a point on map; reordered and deleted points; undo restored full geometry/profile.
- Demo using physical speed, ×20, reached route end, stopped at ~0.96 km and saved to existing history next to the previous V1 Base aeróbica session. No Bluetooth connection/control was used.
- Second demo: start/pause, reload, explicit recovery, resume/finalize/save partial session.
- History displays route map, profile, telemetry, mode and separate export controls; real/demo histories remain separate.
- Actual GPX download event completed from top-level app. Reimport through browser file chooser preserved 65 coordinates and included heights. Download events from the test iframe were not captured by the automation, so export was checked outside the iframe.
- CSS viewport checks: iPad 1024×768, compact iPhone 375×667. iPad active mode shows map/metrics/profile/controls together; phone prioritizes metrics with fixed accessible session controls and scrollable map/profile.

Not verified: physical Smart Air, real BLE radio, actual Safari/Bluefy/iOS file picker, multi-hour on-device performance, offline service-worker reopening on iOS. Fake peripheral tests validate standard command handling only. Public routing/elevation/map servers are external and availability is not guaranteed. OpenTopoData/custom servers are configurable alternatives, not certified live endpoints. No hardware compatibility claim was added.

## Iteración 3 · usabilidad · v2.1 · 15 noviembre 2026

75 pruebas automatizadas: las 68 anteriores y 7 nuevas para el borrador independiente de edición, identidad de ruta, recuperación sin alterar sesiones ni geometrías guardadas, conservación de nombres de paradas y cancelación de preparación. Compilación TypeScript y Vite completada.

Pruebas manuales con navegador de escritorio en la previsualización local, manteniendo el IndexedDB existente de V1/V2. Dimensiones CSS mediante iframe: 1024×768, 390×844 y 375×667; no constituyen emulación ni validación física de iOS.

Flujos ejecutados:
- Navegación por Entrenar, Entrenamientos, Rutas, Historial, Dispositivos, Estadísticas, Perfil y Configuración; menú Más en móvil y etiquetas de navegación en tablet.
- Ruta de Sagunto calculada por Valhalla: 65 coordenadas, aproximadamente 0,96 km; elevación Open-Meteo con cobertura completa. Guardado y apertura desde Mis rutas.
- Añadir una parada tocando el mapa; reordenar, eliminar, invertir y deshacer. Deshacer restaura también la geometría y elevación anteriores y vuelve a dejar la ruta sin cambios pendientes.
- Aviso al sustituir una edición; Seguir editando conserva datos. Descartar cambios no modifica la ruta ya guardada. Eliminación de la ruta de prueba y recuperación con Deshacer eliminación.
- Cambio de nombre sin guardar, recarga y Recuperar edición: conserva nombre, 65 coordenadas, perfil y vínculo a la ruta original.
- Exportación GPX y reimportación mediante selector real de archivos. Tocar el GPX cambia la posición del perfil y conserva sus 65 coordenadas. Archivo XML inválido rechazado con un error visible.
- Preparación y cancelación de recorrido. Cambio explícito de Real a Demo, selección de velocidad física y aceleración ×60. Llegada al destino, guardado y consulta de resultados dentro del historial existente.
- Segundo recorrido en dimensiones iPad/iPhone: inicio, pausa, reanudación, finalización y guardado. Cancelar el diálogo de descarte conserva la actividad; confirmar el descarte de una actividad de prueba vuelve a Mis rutas.
- Sesión estructurada Demo: inicio, pausa, reanudación, finalización y descarte desde el dashboard.
- Editor de entrenamientos: nombre, duplicación y reordenación de bloques, confirmación de cambios al cerrar y guardado desde ese diálogo. Duración resultante de la prueba: 30 min / 4 bloques.
- Perfil: modificación del FTP, navegación a otra sección, aviso de cambios y descarte que mantiene 148 W.
- Ajustes de rutas: modificar masa y cancelar; al reabrir se conserva el valor original. Escape cierra el diálogo; el foco regresa al botón de apertura.
- Historial: filtro por rutas, búsqueda sin resultados, limpiar filtros; estadísticas siguen incluyendo actividades anteriores y separando Real/Demo.
- Copia JSON descargada y restaurada desde el selector real; explicación de combinación de registros antes de restaurar. Restauración correcta sin duplicar IDs.
- Dispositivos: estado de navegador sin Web Bluetooth y acciones BLE deshabilitadas, alternativas y diagnóstico visibles. No hay acceso a un rodillo físico desde este entorno.

Capturas de evidencia: `docs/screenshots/v21-ipad.jpg` y `v21-iphone.jpg`. Telemetría de las capturas identificada como Demo. No se ha validado físicamente Bluetooth, resistencia ni ejecución en Bluefy/Safari en un iPad/iPhone real. La publicación conserva el acceso privado del sitio; el navegador de pruebas llega a la pantalla de autenticación de Sites, por lo que la verificación interactiva se realizó en la previsualización y la publicación se verifica con el resultado de despliegue.
