# Smart Air Trainer 3.0.2 — diagnóstico Bluefy

## Problema y corrección

Las capturas aportadas por el usuario muestran conexión GATT y notificaciones de Cycling Power Measurement (servicio 1818, característica 2A63). Bluefy devuelve UUID cortos y en mayúsculas; el código anterior los comparaba con UUID completos en minúsculas. Por eso se podían mostrar paquetes HEX sin reconocer el protocolo ni alimentar la telemetría.

Esta versión normaliza los UUID de 16 y 32 bits y los UUID completos antes de identificar servicios, interpretar mediciones y manejar características FTMS. No añade UUID ni órdenes propietarias. El control sigue condicionado a características, capacidades, autorización explícita y respuestas del dispositivo.

La captura de Device Information indica fabricante BKOOL, modelo BkoolAir, firmware **4.32** y hardware **0x19**. La revisión de hardware no es firmware. No se ha verificado que 4.32 sea la última versión. El paquete de potencia visible contiene 0 W y contadores de rueda a cero: no demuestra todavía recepción al pedalear, cadencia ni control FTMS.

## Diagnóstico desde iPad o iPhone

1. Abre la misma URL HTTPS en Bluefy y comprueba que aparezca 3.0.2.
2. En Dispositivos, selecciona Real y conecta el rodillo. Cierra otras aplicaciones que estén usando su conexión.
3. En «Diagnóstico para pegar en el chat», pulsa «Observar 30 segundos» y pedalea suavemente manteniendo esta pantalla visible.
4. Al terminar, pulsa «Copiar informe» y pégalo en el chat.
5. Si Bluefy bloquea el portapapeles, pulsa «Seleccionar todo» o mantén pulsado dentro del texto y utiliza Copiar de iOS. Descargar un JSON ya no es necesario.

«Generar informe ahora» permite obtener una instantánea en cualquier momento, incluso después de desconectar. El último informe se guarda en IndexedDB de ese navegador y origen. Al volver se identifica como informe anterior: genera otro tras la siguiente conexión. No borres los datos del navegador para actualizar la página.

La observación no inicia una actividad ni envía consignas. Salir de esa pantalla cancela su temporizador; una suspensión larga se identifica en el informe. Los contadores abarcan la conexión y se retienen los seis paquetes más recientes por característica, no una grabación completa de 30 segundos. Las métricas visibles caducan a los cinco segundos sin nuevas lecturas.

## Contenido y privacidad

El informe separa estado GATT, suscripción aceptada, paquetes recibidos, interpretación y errores. Incluye servicios y características autorizados, UUID recibidos y normalizados, propiedades, firmware/modelo legibles, contadores, muestras HEX, métricas y eventos recientes. Los errores de lectura o suscripción permanecen visibles.

Por defecto se omiten el ID del dispositivo y su número de serie; se pueden incluir mediante una casilla explícita. El informe no contiene rutas ni historial deportivo. Solo se conserva el último informe en este navegador; no se transmite automáticamente. Texto y JSON son instantáneas estables mientras se copian. Compartir texto se ofrece únicamente cuando existe la API del navegador.

## Validación y límites

La suite contiene **103 pruebas aprobadas y dos pruebas externas omitidas por defecto**. Se añaden siete pruebas con dobles GATT: UUID cortos, notificaciones de potencia/rueda, firmware y offsets DataView, caducidad, paquetes malformados, suscripción rechazada, respuestas FTMS y persistencia/redacción del informe. Las pruebas de proveedores externos de 3.0.1 no se repiten para este cambio BLE.

La revisión de interfaz comprobó generación de texto y JSON, selección manual completa, recuperación del informe tras recarga y ausencia de desbordamiento horizontal a 1024 y 375 píxeles CSS. El botón Copiar obtuvo respuesta de éxito del navegador de prueba, pero su portapapeles no pudo verificarse a través de la herramienta externa; la copia automática y Compartir requieren confirmación en Bluefy.

No se dispone físicamente del Smart Air del usuario. Las pruebas automatizadas no certifican Bluefy en un iPad real ni el control del rodillo. El siguiente paso es recibir el informe generado al pedalear para confirmar potencia, velocidad y cualquier otra capacidad disponible. No se habilita control propietario ni se presupone FTMS a partir de Cycling Power Service.

El esquema IndexedDB y las sesiones, rutas y entrenamientos existentes se conservan. La guía y estas notas se incluyen en la aplicación publicada.
