# Bellamora — Modelo de datos

Stack: **PostgreSQL vía Supabase** (mismo enfoque que FisioFlow), con Row Level Security multi-tenant por `salon_id`.

## Resumen de entidades

| Tabla | Propósito |
|---|---|
| `salons` | Cada salón que usa la plataforma (multi-tenant) |
| `users` | Cuentas de acceso (dueño/admin/recepcionista), vinculadas a `auth.users` de Supabase |
| `staff` | Especialistas (Renata, Andrea, Milagros...) |
| `service_categories` | Cabello, Uñas, Facial, Maquillaje |
| `services` | Catálogo: duración, buffer, estado |
| `service_staff_prices` | Precio de cada servicio **por especialista** (N:N) |
| `combos` / `combo_services` | Paquetes combinables (N:N con servicios) |
| `clients` | CRM: contacto, preferencias, fecha de nacimiento |
| `appointments` | Citas — el corazón del sistema |
| `promotions` | Cupones y campañas |
| `promotion_redemptions` | Registro de canjes |
| `loyalty_programs` / `loyalty_progress` | Programa de sellos/fidelidad |
| `whatsapp_messages` | Log de mensajes enviados/recibidos |
| `automation_rules` | Reglas de mensajería automática (on/off, plantilla) |
| `payments` | Pagos asociados a una cita |

## Decisiones clave (y por qué)

**1. Duración y buffer viven en `services`, no en `appointments`.**
Cuando se crea una cita, `duration_minutes` y `buffer_minutes` se copian del servicio hacia la cita (`appointments.duration_minutes`, `appointments.buffer_minutes`) en el momento de la reserva. Esto es intencional: si mañana cambias la duración de "Corte + Balayage" en el catálogo, las citas ya agendadas **no deben moverse retroactivamente**. El catálogo es la fuente de verdad al momento de crear la cita; la cita guarda una copia inmutable.

**2. Precio por especialista vive en una tabla puente, no en `services`.**
`service_staff_prices (service_id, staff_id, price)` permite que "Corte + Balayage" cueste S/180 con Renata y S/140 con Andrea, sin duplicar el servicio. Al crear una cita, el precio también se copia a `appointments.price` por la misma razón que la duración: inmutabilidad histórica para reportes correctos aunque los precios cambien después.

**3. Combos se modelan como citas vinculadas, no como un tipo de cita especial.**
Un combo genera **dos filas normales en `appointments`**, cada una con su propio `service_id`, `staff_id` y horario — pero comparten un `combo_group_id` (uuid) para poder mostrarlas juntas en la UI y cancelarlas/reprogramarlas como unidad. Esto evita tener una tabla `appointments` con columnas nulas condicionales y mantiene los reportes simples (cada fila sigue siendo "una cita con un especialista").

**4. El bloqueo de horario (duración + buffer) se valida en el backend, no solo en el frontend.**
La función `fn_is_slot_free(staff_id, start_time, end_time)` (o su equivalente en la API route de Next.js) debe repetir la misma lógica que el prototipo de Agenda: verificar que no exista otra cita de ese especialista cuyo rango [inicio, fin+buffer] se solape. El frontend puede sugerir disponibilidad, pero la validación final vive en el servidor para evitar dobles reservas por condiciones de carrera (dos clientas reservando el mismo slot al mismo tiempo).

**5. Los "tags" de clientas (VIP, inactiva, cumpleañera) no se guardan como columna.**
Se calculan con una vista (`view_client_segments`) a partir de `visit_count`, `last_visit_at` y `birth_date`. Guardarlos como columna estática los desactualizaría constantemente; calcularlos en una vista los mantiene siempre correctos.

**6. Reportes son vistas SQL, no tablas separadas.**
`view_revenue_by_week`, `view_top_services`, `view_staff_performance` se recalculan on-demand. Para un salón pequeño el volumen de datos no justifica una tabla de agregados; si más adelante se necesita, se puede materializar la vista.

## Diagrama de relaciones (simplificado)

```
salons ──< staff
       ──< service_categories ──< services ──< service_staff_prices >── staff
       ──< clients ──< appointments >── services
                        appointments >── staff
                        appointments ──< payments
       ──< combos ──< combo_services >── services
       ──< promotions ──< promotion_redemptions >── clients
       ──< automation_rules
       ──< whatsapp_messages >── clients
```

## Siguiente paso sugerido

Con este modelo ya se puede generar el seed data (como hicimos en FisioFlow) y las API routes de Next.js para cada módulo. El archivo `schema.sql` adjunto tiene el `CREATE TABLE` completo, listo para correr en Supabase.
