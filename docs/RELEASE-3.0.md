# Smart Air Trainer 3.0.0

15 de noviembre de 2026. Ampliación del mismo proyecto y origen HTTPS; conserva las pantallas y los módulos de Bluetooth, entrenamientos, rutas, perfil, historial y PWA de 2.1.

## Funcionalidad entregada

- **Inicio**: próxima sesión, agenda semanal de lunes a domingo, minutos y sesiones frente a objetivos editables, biblioteca de favoritos, búsqueda y últimas actividades.
- **Agenda local**: programar entrenamientos y rutas, modificar fecha/recurso/notas, omitir planes y eliminarlos sin eliminar actividades. Cada plan conserva el modo Real/Demo. Los entrenamientos usan una instantánea; las rutas se resuelven por identificador al prepararlas.
- **Plan → actividad**: preparar desde la agenda, iniciar y guardar vincula el resultado al plan en una transacción. La etiqueta «Actividad guardada» no afirma haber completado toda la duración o distancia prevista. Resultados conserva el progreso efectivo. Eliminar la actividad vinculada reabre el plan; las notas de otras actividades no pueden adjudicarse a ese plan.
- **Recuperación de entrenamientos**: continuar desde el último borrador en pausa, con el mismo identificador, FTP, modo, muestras y vínculo de agenda. No rellena el tiempo con la aplicación cerrada ni reutiliza lecturas antiguas. El control electrónico permanece desactivado hasta una acción explícita. También puede guardarse o descartarse el borrador. Un borrador pendiente impide iniciar otra actividad que pudiera sobrescribirlo.
- **Progreso**: volumen de 4 o 12 semanas, mejores medias de potencia de 5 s, 30 s, 1 min, 5 min y 20 min con ventanas completas de tiempo activo y acceso a la sesión de origen. No infiere FTP. Comparación de dos actividades guardadas del mismo modo. Pausas excluidas del tiempo activo; datos ausentes invalidan ventanas.
- **Sensaciones**: valoración subjetiva de esfuerzo 1–10 y notas de hasta 2000 caracteres, editables en resultados guardados. Persisten y se incluyen en JSON de sesión e historial y en la copia completa. Los CSV de telemetría mantienen su estructura anterior.
- **Navegación móvil**: Inicio, Entrenar, Rutas, Historial y Equipo accesibles desde la barra inferior; Más reúne Entrenamientos, Estadísticas, Perfil y Configuración. Calendario y diálogos táctiles; gráficos extensos desplazan su contenido sin ensanchar toda la página.
- **Límites de registro**: sesiones libres limitadas a 6 horas, coherente con la capacidad de importación y el límite ya existente del simulador de rutas. Los datos previos no se recortan ni eliminan.

## Compatibilidad de almacenamiento

Se conserva el nombre IndexedDB `smart-air-trainer-v1`. La versión de esquema 3 añade únicamente el almacén `plans`. No recrea los almacenes existentes. Preferencias semanales y favoritos se guardan en `settings`; `planId`, `notes` y `rpe` son campos opcionales de sesión. Los borradores de recorrido incorporan `planId` opcional.

La copia JSON de versión 3 incluye perfil, entrenamientos personalizados, historial, rutas, ajustes de proveedores/simulador, agenda y preferencias. Se siguen aceptando copias v1 y v2. La restauración valida antes de escribir y usa una sola transacción: un error impide aplicar una copia parcialmente. Se fusionan identificadores; los registros no incluidos se conservan. Los borradores en curso son locales y no forman parte de esta copia de actividades guardadas.

No hay sincronización entre dispositivos, avisos externos, correo, calendario remoto, nueva API o suscripción. Para trasladar datos, exporta e importa la copia en el otro navegador.

## Validación automatizada

**89 pruebas aprobadas en 6 archivos**, manteniendo las 75 anteriores:

- 35 pruebas de motor, telemetría, protocolos y controlador BLE con dobles de prueba.
- 32 pruebas de rutas, GPX, elevación, física y simulación.
- 7 pruebas del editor protegido, borradores y límites de almacenamiento.
- Migración de esquema v1 conservando perfil, entrenamientos e historial.
- Migración v2 → v3 conservando rutas, sesiones y ambos borradores.
- 13 pruebas nuevas: semanas entre años y año bisiesto, fechas inválidas, objetivos, separación Real/Demo, ventanas de potencia completas/cero/huecos, recuperación de sesión y límite de registro, asociación correcta de plan/actividad, recuperación de ruta vinculada, restauración sin borrar otros datos y rollback tras error de clave.

Compilación TypeScript y build de producción Vite comprobados. El build genera los recursos y el Service Worker de la interfaz.

## Validación interactiva observada

En navegador de escritorio, usando la aplicación real del preview y sus controles:

1. Crear plan Demo de Recuperación → preparar → iniciar → pausar → recargar → continuar borrador → reanudar → finalizar → guardar. Se conservó el progreso y se enlazó el resultado a la agenda.
2. Guardar RPE 4/10 y notas, abrir Inicio y comprobar el resumen de la sesión.
3. Marcar Base aeróbica como favorita y conservarla tras recarga/restauración.
4. Editar los objetivos a 150 minutos y 4 sesiones; comprobar su persistencia. Son valores de prueba, no datos iniciales de los usuarios.
5. Planificar la ruta existente de Sagunto → preparar → Demo ×60 → completar → guardar y comprobar vínculo y estadísticas. Mapa real, perfil y controles visibles simultáneamente a 1024 × 768.
6. Consultar estadísticas y comparativas; cambiar a 12 semanas. Detectado y corregido un desbordamiento en móvil; ancho de documento comprobado igual al ancho visible en 375 y 390 px.
7. Crear un plan con cambios y cancelar: confirmación de descarte; el plan no se guardó. Editar un plan a 16 de noviembre y comprobar el cambio de semana y la fecha guardada.
8. Editar el nombre de una ruta existente y descartar al crear otra: la ruta guardada conservó su nombre original.
9. Descargar la copia v3 y restaurar el mismo archivo mediante el selector: mensaje de éxito, datos anteriores presentes. El evento de descarga del marco responsive agotó la espera de la herramienta; la prueba se completó correctamente en la página principal.
10. Revisar Dispositivos sin API Web Bluetooth: explica la alternativa móvil y mantiene conexión/control deshabilitados.
11. Dimensiones CSS comprobadas: iPad 1024 × 768; iPhone 390 × 844; iPhone compacto 375 × 667. No son emulación ni pruebas físicas de iOS. Capturas en `docs/screenshots/smart-air-v3-*.jpg`.

Las actividades y planes de prueba están únicamente en el almacenamiento del navegador de QA. No se incluyen como datos precargados en la aplicación publicada.

## Límites pendientes de hardware y plataforma

No se ha conectado físicamente un Bkool Smart Air ni validado su firmware o sus comandos. Se mantienen el diagnóstico GATT y los adaptadores estándar existentes, con control condicionado a capacidades, rangos y respuestas FTMS. No se añadieron comandos propietarios ni se convirtió la demo en telemetría real.

No se ha validado esta versión en un iPad/iPhone físico ni la permanencia de BLE en segundo plano. El navegador de QA no expone Web Bluetooth. La instalación PWA no añade esa API a Safari. Mapas, búsquedas, enrutamiento y elevación siguen sujetos a los proveedores y condiciones documentados en la versión anterior; no se añaden nuevos proveedores en 3.0.

La publicación conserva acceso privado del propietario. La página alojada muestra el acceso de ChatGPT en el navegador de QA sin sesión; la comprobación funcional se hizo en preview y la publicación se verifica mediante el resultado del servicio Sites.

Para recibir una actualización PWA, termina y guarda cualquier sesión, cierra las pestañas/ventanas de la aplicación y vuelve a abrirla con conexión. No borres los datos del navegador. La actualización no fuerza una recarga en mitad de un entrenamiento.
