# Bellamora — Arquitectura de backend y modelo de frontend

Documento de referencia técnica. Complementa `modelo-de-datos.md` y `schema.sql`.

## Por qué monolito modular, no microservicios

A esta escala (negocio mediano, crecimiento moderado, carga media de datos) un monolito modular en Next.js sobre Supabase da todo lo que se necesita sin el costo operativo de microservicios: sin orquestación entre servicios, sin latencia de red interna, un solo deploy. La modularidad se logra organizando el código por dominio (`agenda/`, `crm/`, `catalogo/`, `promociones/`, `mensajeria/`, `reportes/`), de modo que si en el futuro un módulo necesita escalar por separado (ej. mensajería con alto volumen), se puede extraer sin rediseñar todo.

## Capas de la arquitectura

**Cliente (navegador)** → **Next.js en Vercel** (Server Components + Server Actions/Route Handlers) → **Connection pooler (Supavisor)** → **Postgres con RLS (Supabase)**, con integraciones externas conectadas desde la capa de Next.js: **Stripe** (pagos), **WhatsApp Business API** (mensajería), **Scheduler** (recordatorios automáticos).

### Next.js (Vercel)
- Server Components por defecto para todo lo que es lectura (Reportes, listados de Catálogo/CRM) — se renderiza en el servidor, menos JavaScript al cliente, más rápido.
- Client Components ("islas") solo donde hay interactividad real: grid de Agenda, modales de nueva cita, toggles de Promociones y WhatsApp.
- Mutaciones vía Server Actions, no una API REST separada — la escritura y la revalidación de datos viven en el mismo lugar.
- Página de reserva pública (self-service para clientas) con SSR/ISR para velocidad, separada del panel interno.

### Connection pooler (Supavisor)
Cada función serverless de Vercel abre su propia conexión a Postgres. Sin pooler, tráfico moderado ya agota el límite de conexiones de la base — es la causa más común de incidentes en este tipo de stack. Se usa el *transaction pooler* (puerto 6543) para las funciones serverless, y el *session pooler* solo si hay algún proceso de larga duración.

### Postgres con RLS (Supabase)
Una sola base de datos, multi-tenant por `salon_id`, con Row Level Security como ya se definió en `schema.sql`. A este volumen no se justifica separar por schema ni por base de datos por salón — esa complejidad se pospone hasta que realmente haga falta.

### Integraciones externas
- **Stripe**: Route Handler dedicado para el webhook, con verificación de firma e idempotencia vía `stripe_payment_intent_id` único — evita procesar el mismo pago dos veces si Stripe reintenta la notificación.
- **WhatsApp Business API**: los envíos van a una cola, no a una llamada directa desde la request del usuario, para no bloquearla ni saturar la API en picos de tráfico.
- **Scheduler**: un cron (Vercel Cron o Supabase Edge Function + `pg_cron`) revisa periódicamente (cada 15 min) qué citas necesitan recordatorio y las encola.

## Transacciones — los 4 puntos que importan a esta escala

1. **Combos son una transacción atómica.** Las dos citas de un combo se crean juntas o no se crea ninguna, con una función de Postgres (`plpgsql`) envuelta en transacción — nunca dos `insert` separados desde el frontend.
2. **La validación de horario libre se repite en el servidor.** El prototipo valida en el navegador, pero dos recepcionistas pueden reservar el mismo slot a la vez — la constraint `exclude using gist` en `schema.sql` hace que sea Postgres, no la aplicación, quien garantice que no haya doble reserva.
3. **Idempotencia en webhooks de pago.** `stripe_payment_intent_id unique` evita cobrar dos veces por un reintento de Stripe.
4. **Mensajería en cola, no síncrona.** Evita que un pico de citas sature la API de WhatsApp o bloquee al usuario mientras espera respuesta.

## Modelo de frontend: islas sobre React Server Components

No es un SPA clásico. El patrón es "islas de interactividad" sobre un mar de contenido renderizado en servidor:

- **Server Components por defecto**, Client Components solo donde el usuario interactúa en tiempo real.
- **Server Actions** para mutaciones — reemplazan la necesidad de una capa de API REST tradicional consumida con `fetch`.
- **Estado del lado del cliente mínimo**: casi todo el estado vive en la base de datos y se revalida vía Server Actions; para UI puramente local (qué modal está abierto) alcanza con `useState`.
- **Organización por dominio**, no por tipo de archivo — cada módulo prototipado (Agenda, CRM, Catálogo, Promociones, WhatsApp, Reportes) se convierte en una carpeta autocontenida con sus propios componentes, acciones y tipos.
- **Sistema de diseño compartido**: los tokens visuales usados en los 6 prototipos (tipografía Fraunces + Inter, paleta rosa/dorado/salvia, radios y sombras) se extraen a un tema de Tailwind + primitivos de shadcn/ui, para que los módulos dejen de ser archivos HTML independientes y compartan componentes reales (un solo `<Ticket>`, un solo `<Modal>`, etc.).
- **Formularios** con React Hook Form + Zod — el mismo esquema de validación se reutiliza en el cliente (feedback inmediato) y en la Server Action (fuente de verdad).

## Decisiones cerradas en la revisión (2026-07-19)

Tras revisar la arquitectura contra `schema.sql`, se corrigió el schema y se cerraron estas decisiones que estaban abiertas:

- **Cola de WhatsApp = tabla `message_queue` + cron.** No se agrega un broker externo: los mensajes se encolan en Postgres (`message_queue`, con `scheduled_for`, `status`, `attempts`) y el mismo Vercel Cron de recordatorios (cada 15 min) los procesa con la service role key. Si el volumen crece, se migra a Supabase Queues sin tocar el resto del sistema.
- **Página pública de reservas = Server Actions con service role, sin policies anónimas.** Las clientas no son usuarios de Supabase Auth; el acceso anónimo a disponibilidad y creación de citas pasa exclusivamente por Server Actions del lado del servidor que usan el cliente service-role con validación estricta de `salon_id` y de los datos de entrada. RLS queda solo para el panel interno.
- **Multi-tenant vía `fn_current_salon_id()`.** Las policies no consultan `users` directamente (recursión de RLS): una función `security definer` resuelve el salón del usuario autenticado. Las tablas sin `salon_id` (`payments`, `service_staff_prices`, `combo_services`, `promotion_redemptions`, `loyalty_progress`) filtran vía join con su tabla padre.
- **Vistas de reportes con `security_invoker = true`** — sin esto las vistas corren con permisos del owner y saltan RLS, exponiendo datos de todos los salones.
- **Estados derivables no se almacenan.** `promotions.status` se eliminó como columna; `view_promotions_with_status` lo deriva de `valid_from`/`valid_to`/`usage_limit` (consistente con la decisión #5 del modelo de datos).
- **Dinero siempre en centavos**, incluidos los descuentos `fixed` de promociones.
- **Pendiente de confirmar: proveedor de pago online.** Verificar disponibilidad de Stripe para comercios en Perú antes de integrar; el seed ya asume Yape/Plin/efectivo como métodos dominantes y `payments.method` abstrae el proveedor, así que cambiar a Culqi/MercadoPago/Izipay no afecta el modelo.

## Decisiones cerradas al implementar Mensajería WhatsApp (2026-07-20)

- **Sender plugeable, simulado por defecto.** `lib/whatsapp/sender.ts` define la interfaz `WhatsappSender`; sin credenciales reales (`WHATSAPP_PROVIDER=simulated`, el default) los mensajes se loguean y se marcan como enviados, así toda la cola/cron/historial se puede construir y probar sin cuenta de Meta/Twilio/360dialog. Conectar un proveedor real es implementar la interfaz e incluirla en `getSender()` — nada más cambia.
- **Encolado por evento para reglas atadas a una cita; escaneo periódico solo para las que no lo están.** `confirmacion`/`recordatorio_24h`/`recordatorio_2h`/`resena` se encolan una sola vez, al crear la cita (`lib/whatsapp/queue.ts`), con `scheduled_for` ya calculado — el cron no necesita preguntar "¿ya toca este recordatorio?", solo "¿qué está `pendiente` con `scheduled_for <= now()`?". `cumpleanos` y `reactivacion` no tienen evento de creación que las dispare, así que sí requieren un escaneo periódico (`lib/whatsapp/scheduler.ts`) con *dedupe* (por año calendario y por cooldown de 30 días respectivamente) para no reencolar en cada tick de 15 min.
- **El cron corre con la service role key, sin sesión de usuario** (`lib/supabase/service.ts`) — es el primer uso real de esa key documentada desde el bootstrap. Como la service role salta RLS por completo, cada query del cron filtra `salon_id` a mano; no hay protección automática de multi-tenant fuera del panel autenticado.
- **Cancelar una cita limpia su cola pendiente.** Sin esto, cancelar no evita que salga un recordatorio para una cita que ya no existe.
- **El endpoint de cron se protege con `CRON_SECRET`**, el patrón estándar de Vercel Cron Jobs (`Authorization: Bearer $CRON_SECRET`) — sin este secreto configurado, el endpoint rechaza todo por defecto.

## Decisiones cerradas al implementar Productos y Ventas — cobranza (2026-07-21)

- **Sin facturación electrónica SUNAT.** Solo un recibo interno (HTML imprimible en `/ventas/[id]`), etiquetado explícitamente "no es comprobante de pago SUNAT". Integrar un PSE (Nubefact u otro) queda documentado como fase aparte — requiere RUC del salón y credenciales de un proveedor certificado.
- **`payments` dejó de colgar de una cita.** Se introdujo `sales` como la unidad real de cobranza: `payments.sale_id` reemplaza a `payments.appointment_id` (que era `not null`, forzando 1 pago = 1 cita, sin lugar para productos). Una `sales` row puede tener `appointment_id` (el servicio que se cobra), cero o más `sale_items` (productos), o ambos — así "servicio + 2 productos" es un solo cobro, no dos registros sueltos. Se hizo ahora porque todavía no existía ninguna UI de cobro construida (solo 5 filas de seed dependían del shape viejo) — más adelante habría sido una migración con datos reales de por medio.
- **Stock nunca se muta directo.** `products.stock_quantity` se deriva de `stock_movements` (ledger de entrada/salida) vía trigger, mismo patrón que `clients.visit_count` se deriva de `appointments`. Da auditoría completa (reposición, merma, venta) en vez de solo un número final.
- **`fn_register_sale` bloquea con `for update` antes de vender.** Mismo problema de condición de carrera que `no_overlap` resuelve para citas (dos cobros concurrentes del mismo producto), resuelto aquí con un lock de fila porque es una cantidad acumulada, no un rango de tiempo — una exclusion constraint no aplica.
- **Ingresos por producto se suman vía `sale_items`, nunca vía `sales.total_cents`.** `sales.total_cents` de una venta vinculada a una cita YA incluye el precio del servicio (para que el cobro sea uno solo) — sumarlo de nuevo junto con `appointments.price_cents` habría contado el servicio dos veces en Reportes. `sale_items.subtotal_cents` es siempre solo la parte de productos, así que sumarlo aparte no tiene ese riesgo.
- **Pedido por WhatsApp = registro manual con `channel = 'whatsapp'`.** No se conecta al webhook de mensajes entrantes (fuera de alcance del módulo de Mensajería) — es la recepcionista registrando la venta, igual que una venta en tienda.

## Siguiente paso

Este documento, junto con `modelo-de-datos.md`, `schema.sql`, `seed.sql` y los 6 prototipos HTML, es el contexto que se le pasa a Claude Code para levantar el proyecto Next.js real.
