# Smart Air Trainer 2.1 · flujos de uso

## Diseñar y guardar una ruta

1. Abre Rutas, busca una localidad o utiliza los puntos de ejemplo de Sagunto.
2. En Crear y editar, activa la edición de puntos para añadir o mover paradas. La edición del mapa se desactiva al calcular el recorrido o abrir una ruta guardada, para poder inspeccionar el perfil sin cambiar el trazado.
3. Calcula por carreteras y obtén elevación cuando falte. Los tres pasos muestran el estado del trazado, elevación y guardado.
4. Guarda la ruta, o pulsa Guardar y preparar. Una ruta incompleta se conserva como borrador de edición; no se presenta como ruta terminada en Mis rutas.
5. Para abrir otro trazado con cambios pendientes, elige Guardar y continuar, Descartar cambios o Seguir editando. Un GPX solo pasa a edición por carreteras después de una conversión explícita.

El borrador se guarda tras 600 ms de inactividad en IndexedDB, separado del progreso de entrenamiento. Al volver a abrir Rutas se ofrece recuperarlo. El guardado local no garantiza la supervivencia frente al borrado de datos del navegador; las copias JSON incluyen registros guardados, no ediciones pendientes. La última fracción de segundo antes de cerrar puede no llegar a persistirse, por lo que se mantiene el aviso de salida con cambios.

## Preparar y recorrer

La preparación permite elegir una única fuente de velocidad, comprobar el perfil y cambiar explícitamente a Demo. Cancelar preparación conserva la ruta guardada. El modo físico no permite iniciar con pendientes ausentes. El modo real muestra los requisitos de conexión y recepción de datos; sin telemetría fresca no se avanza.

Al iniciar se pasa al panel de entrenamiento. Pausar conserva el progreso y solicita detener el control cuando está activo. Los avisos de pausa/desconexión permanecen visibles en los diseños compactos. Finalizar muestra un resumen con datos agregados y acciones separadas para guardar o descartar. Tras guardar se puede abrir Resultados o elegir otra ruta. Demo nunca envía comandos al hardware.

## Otras mejoras

- Mis rutas: búsqueda, orden por nombre/distancia/modificación y deshacer la última eliminación mientras siga abierta la aplicación.
- Historial: búsqueda por nombre/fecha, filtro rutas/entrenamientos y estado vacío con limpieza de filtros. Los totales resumen todo el historial del modo elegido; la lista aplica los filtros.
- Entrenamientos: identidad estable durante la edición, duplicar y reordenar bloques, insertar series antes del enfriamiento y confirmar cambios al cerrar.
- Perfil: guardar, deshacer y aviso antes de abandonar cambios pendientes.
- Ajustes de rutas: cancelar restaura la instantánea previa; los errores de validación aparecen dentro del diálogo.
- Restauración: selector accesible, explicación previa de combinación/sustitución por identificador, bloqueo mientras exista una actividad activa o pendiente de guardar.
- Diálogos: foco inicial, ciclo de Tab, Escape, restauración de foco y controles táctiles. Movimiento reducido respetado. Formularios móviles a 16 px; navegación de seis accesos con Más para Estadísticas, Perfil y Configuración.

## Compatibilidad de datos

Se conserva `smart-air-trainer-v1`, esquema 2. Se añade únicamente la clave `routeEditorDraft` al almacén `settings`; no se eliminan almacenes ni datos de V1/V2. Las actividades conservan su copia de la ruta, incluso si se modifica o elimina la original. Las rutas GPX mantienen sus coordenadas y sus alturas originales al exportar cuando están disponibles.
