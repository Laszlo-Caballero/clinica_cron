# Análisis de Casos y Robustez del Cron

Este documento analiza el comportamiento del cron job bajo distintos escenarios para asegurar su correcto funcionamiento a lo largo de su vida útil.

## Objetivo
Ejecutar un proceso de actualización por lotes (1000 registros) cada hora, persistir el progreso ante reinicios y detenerse automáticamente al finalizar.

## Escenarios Analizados

### 1. Ejecución Normal (Happy Path)
- **Comportamiento**: El cron dispara la tarea cada hora (`0 * * * *`).
- **Lógica**: Lee `page` actual -> Procesa -> Incrementa `page` -> Guarda estado.
- **Resultado**: Correcto.

### 2. Reinicio del Proceso / Caída del Servidor
- **Escenario**: El servidor se reinicia o el proceso de Node.js se detiene inesperadamente.
- **Solución implementada**: `stateManager.ts` guarda el número de página en disco.
- **Comportamiento**: Al reiniciar, carga la última página guardada y continúa.
- **Riesgo**: Si falla *durante* el procesamiento antes de guardar:
    - La página no se incrementa.
    - Se reprocesa la misma página.
    - **Mitigación**: La operación `UPDATE` es idempotente (actualizar el mismo registro con el mismo valor no rompe nada).
- **Veredicto**: **Seguro**.

### 3. Ejecución Superpuesta (Overlapping Execution) ⚠️
- **Escenario**: El procesamiento de una página (1000 registros) tarda **más de 1 hora** (debido a lentitud en DB, red, análisis pesado).
- **Riesgo**: El cron dispara la siguiente ejecución mientras la anterior sigue corriendo.
    - Ambas ejecuciones comparten la variable `page`.
    - Podrían procesar el mismo offset o experimentar condiciones de carrera al incrementar `page`.
- **Recomendación**: Implementar un "bloqueo" (flag) para evitar que una nueva tarea inicie si la anterior no ha terminado.

### 4. Error de Base de Datos (Conexión/Query)
- **Escenario**: La conexión SQL falla temporalmente.
- **Comportamiento**: La función `main()` lanzará una excepción.
- **Consecuencia**: El código se detiene, `page` no se incrementa, `saveState` no se llama.
- **Recuperación**: El siguiente cron (1 hora después) intentará de nuevo la misma página.
- **Veredicto**: **Correcto (Auto-reparable)**.

### 5. Lotes Finales (Paginación)
- **Escenario**: Total de registros no es múltiplo exacto de 1000 (ej. 10500).
- **Comportamiento**:
    - Página 10 (offset 10000) procesa 500 registros.
    - Página 11 (offset 11000) -> `OFFSET` fuera de rango -> Retorna 0 filas.
    - Código actual no falla, solo no itera nada.
- **Verificación de Parada**:
    - `count()` calcula `totalPages` (ej. 11).
    - Cuando `page` llega a 11, la condición `if (page >= totalPages)` detiene el cron.
- **Veredicto**: **Correcto**.

### 6. Crecimiento de la Base de Datos
- **Escenario**: Se insertan nuevos registros en `ecografiacliente` mientras el cron corre.
- **Comportamiento**: `totalPages` calculado por `count()` aumentará dinámicamente.
- **Resultado**: El cron procesará las nuevas páginas si no se ha detenido permanentemente.
    - *Nota*: Si la tarea ya se detuvo (`task.stop()`), no detectará nuevos registros automáticamete hasta reiniciar el proceso.
    - Si se espera que entren nuevos datos *después* de terminar, no deberíamos hacer `task.stop()` permanente, o deberíamos tener una lógica para "despertar".
    - *Asunción*: El requerimiento dice "hasta que finalice las paginas y que ya no actualize si ya alcanzo la ultima pagina", lo que implica un proceso finito.

## Conclusión y Mejoras Sugeridas

El sistema es robusto para la mayoría de los casos. Solo hay un riesgo potencial importante: **Ejecución Superpuesta**.

**Acción recomendada**: Agregar un flag `isProcessing` para evitar que el cron se ejecute si la vuelta anterior no ha terminado.

```typescript
let isProcessing = false;

cron.schedule("0 * * * *", async () => {
  if (isProcessing) {
      console.log("Proceso anterior aún en ejecución. Saltando...");
      return;
  }
  isProcessing = true;
  try {
      // ... lógica ...
  } finally {
      isProcessing = false;
  }
});
```
