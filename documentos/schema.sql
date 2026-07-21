-- ============================================================
-- Bellamora — Schema PostgreSQL / Supabase
-- Multi-tenant por salon_id. RLS activado en todas las tablas.
-- Revisado 2026-07-19: constraint anti doble-reserva activa,
-- RLS completo (incluye tablas sin salon_id vía join), vistas
-- con security_invoker, funciones de negocio y triggers.
-- ============================================================

create extension if not exists "uuid-ossp";
create extension if not exists btree_gist; -- requerido por la constraint no_overlap

-- ------------------------------------------------------------
-- 1. SALONES, ESPECIALISTAS Y USUARIOS
-- (staff antes que users para poder referenciarla con FK)
-- ------------------------------------------------------------
create table salons (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  whatsapp_number text,
  timezone      text default 'America/Lima',
  plan          text not null default 'starter'
                constraint chk_salons_plan check (plan in ('starter', 'pro', 'enterprise')),
  created_at    timestamptz default now()
);

create table staff (
  id            uuid primary key default uuid_generate_v4(),
  salon_id      uuid not null references salons(id) on delete cascade,
  name          text not null,
  level         text not null default 'senior'
                constraint chk_staff_level check (level in ('senior', 'junior')),
  color_hex     text default '#B8697A',
  active        boolean default true,
  created_at    timestamptz default now()
);

-- Vincula un usuario de Supabase Auth con un salón y rol
create table users (
  id            uuid primary key references auth.users(id) on delete cascade,
  salon_id      uuid not null references salons(id) on delete cascade,
  staff_id      uuid references staff(id) on delete set null, -- null si es admin sin ficha de especialista
  role          text not null default 'staff'
                constraint chk_users_role check (role in ('owner', 'admin', 'staff')),
  email         text not null,
  created_at    timestamptz default now()
);

-- ------------------------------------------------------------
-- 2. CATÁLOGO DE SERVICIOS
-- ------------------------------------------------------------
create table service_categories (
  id            uuid primary key default uuid_generate_v4(),
  salon_id      uuid not null references salons(id) on delete cascade,
  name          text not null,                 -- Cabello, Uñas, Facial, Maquillaje
  color_hex     text
);

create table services (
  id                uuid primary key default uuid_generate_v4(),
  salon_id          uuid not null references salons(id) on delete cascade,
  category_id       uuid not null references service_categories(id),
  name              text not null,
  description       text,
  duration_minutes  int not null check (duration_minutes > 0),
  buffer_minutes    int not null default 0 check (buffer_minutes >= 0), -- limpieza/preparación posterior
  status            text not null default 'activo'
                    constraint chk_services_status check (status in ('activo', 'pausado')),
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

-- Precio por especialista (N:N). Una especialista senior puede cobrar
-- distinto que una junior por el mismo servicio.
create table service_staff_prices (
  id            uuid primary key default uuid_generate_v4(),
  service_id    uuid not null references services(id) on delete cascade,
  staff_id      uuid not null references staff(id) on delete cascade,
  price_cents   int not null check (price_cents >= 0), -- centavos evita errores de redondeo
  unique(service_id, staff_id)
);

-- ------------------------------------------------------------
-- 3. COMBOS
-- ------------------------------------------------------------
create table combos (
  id                  uuid primary key default uuid_generate_v4(),
  salon_id            uuid not null references salons(id) on delete cascade,
  name                text not null,
  combined_price_cents int not null check (combined_price_cents >= 0),
  active              boolean default true
);

create table combo_services (
  id            uuid primary key default uuid_generate_v4(),
  combo_id      uuid not null references combos(id) on delete cascade,
  service_id    uuid not null references services(id) on delete cascade
);

-- ------------------------------------------------------------
-- 4. CLIENTES (CRM)
-- ------------------------------------------------------------
create table clients (
  id            uuid primary key default uuid_generate_v4(),
  salon_id      uuid not null references salons(id) on delete cascade,
  name          text not null,
  phone         text,
  email         text,
  birth_date    date,
  preferences   text,                          -- alergias, gustos, notas libres
  visit_count   int default 0,                 -- mantenido por trg_update_client_stats
  total_spent_cents int default 0,             -- mantenido por trg_update_client_stats
  last_visit_at timestamptz,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ------------------------------------------------------------
-- 5. CITAS (el núcleo del sistema)
-- ------------------------------------------------------------
create table appointments (
  id                uuid primary key default uuid_generate_v4(),
  salon_id          uuid not null references salons(id) on delete cascade,
  client_id         uuid not null references clients(id),
  service_id        uuid not null references services(id),
  staff_id          uuid not null references staff(id),
  combo_group_id    uuid,                      -- mismo uuid en ambas citas de un combo

  start_time        timestamptz not null,
  end_time          timestamptz not null,      -- start_time + duration_minutes (calculado en app)
  buffer_minutes    int not null default 0 check (buffer_minutes >= 0),

  -- Copias inmutables del catálogo al momento de la reserva:
  duration_minutes  int not null check (duration_minutes > 0),
  price_cents       int not null check (price_cents >= 0),

  status            text not null default 'pendiente'
                    constraint chk_appointments_status
                    check (status in ('pendiente', 'confirmada', 'completada', 'cancelada', 'no_show')),
  notes             text,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now(),

  constraint chk_time_order check (end_time > start_time)
);

-- Garantía anti doble-reserva: Postgres, no la aplicación, impide que un
-- especialista tenga dos citas cuyos rangos [inicio, fin + buffer] se solapen.
-- Las citas canceladas liberan el horario. make_interval es immutable, por lo
-- que puede usarse dentro de la expresión del índice GiST.
alter table appointments add constraint no_overlap
  exclude using gist (
    staff_id with =,
    tstzrange(start_time, end_time + make_interval(mins => buffer_minutes)) with &&
  ) where (status <> 'cancelada');

create index idx_appointments_staff_time on appointments (staff_id, start_time);
create index idx_appointments_salon_time on appointments (salon_id, start_time);
create index idx_appointments_client on appointments (client_id);

-- ------------------------------------------------------------
-- 6. PROMOCIONES Y FIDELIDAD
-- ------------------------------------------------------------
-- Nota: el estado (activa | programada | vencida) NO se almacena — se deriva
-- de valid_from/valid_to en view_promotions_with_status (decisión #5 del
-- modelo de datos: no guardar estados derivables que se desactualizan).
create table promotions (
  id              uuid primary key default uuid_generate_v4(),
  salon_id        uuid not null references salons(id) on delete cascade,
  name            text not null,
  category_id     uuid references service_categories(id), -- null = aplica a todas
  discount_type   text not null
                  constraint chk_promotions_discount_type check (discount_type in ('percent', 'fixed')),
  discount_value  numeric not null check (discount_value > 0),
                  -- percent: puntos porcentuales (20 = 20%)
                  -- fixed: CENTAVOS (15000 = S/150), misma unidad que el resto del schema
  valid_from      date,
  valid_to        date,
  usage_limit     int,                          -- null = ilimitado
  usage_count     int default 0,
  send_whatsapp   boolean default true,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create table promotion_redemptions (
  id              uuid primary key default uuid_generate_v4(),
  promotion_id    uuid not null references promotions(id) on delete cascade,
  client_id       uuid not null references clients(id),
  appointment_id  uuid references appointments(id),
  redeemed_at     timestamptz default now()
);

create table loyalty_programs (
  id                uuid primary key default uuid_generate_v4(),
  salon_id          uuid not null references salons(id) on delete cascade,
  visits_required   int not null default 6 check (visits_required > 0),
  reward_description text,
  active            boolean default true
);

create table loyalty_progress (
  id              uuid primary key default uuid_generate_v4(),
  client_id       uuid not null references clients(id) on delete cascade,
  program_id      uuid not null references loyalty_programs(id) on delete cascade,
  stamps          int default 0 check (stamps >= 0),
  last_stamp_at   timestamptz,
  unique(client_id, program_id)
);

-- ------------------------------------------------------------
-- 7. MENSAJERÍA WHATSAPP
-- ------------------------------------------------------------
create table automation_rules (
  id              uuid primary key default uuid_generate_v4(),
  salon_id        uuid not null references salons(id) on delete cascade,
  type            text not null
                  constraint chk_automation_rules_type
                  check (type in ('confirmacion', 'recordatorio_24h', 'recordatorio_2h',
                                  'resena', 'reactivacion', 'cumpleanos')),
  enabled         boolean default true,
  template_text   text not null,                -- placeholders {nombre} {servicio} {fecha} {hora}
  offset_minutes  int,                           -- ej. -1440 para 24h antes, null si no aplica
  created_at      timestamptz default now()
);

-- Cola de envíos: los mensajes NO se envían de forma síncrona desde la request
-- del usuario. Se encolan aquí y el cron (Vercel Cron, cada 15 min) los procesa
-- con la service role key. A esta escala una tabla + cron reemplaza a un broker.
create table message_queue (
  id              uuid primary key default uuid_generate_v4(),
  salon_id        uuid not null references salons(id) on delete cascade,
  client_id       uuid references clients(id) on delete cascade,
  appointment_id  uuid references appointments(id) on delete cascade,
  rule_type       text,                          -- referencia a automation_rules.type si es automático
  body            text not null,
  scheduled_for   timestamptz not null default now(), -- cuándo debe salir
  status          text not null default 'pendiente'
                  constraint chk_message_queue_status
                  check (status in ('pendiente', 'enviando', 'enviado', 'fallido')),
  attempts        int not null default 0,
  last_error      text,
  created_at      timestamptz default now()
);

create index idx_message_queue_pending on message_queue (status, scheduled_for)
  where status = 'pendiente';

-- Log histórico de mensajes ya enviados/recibidos (la cola es tránsito, esto es registro)
create table whatsapp_messages (
  id              uuid primary key default uuid_generate_v4(),
  salon_id        uuid not null references salons(id) on delete cascade,
  client_id       uuid references clients(id),
  appointment_id  uuid references appointments(id),
  direction       text not null
                  constraint chk_whatsapp_direction check (direction in ('outbound', 'inbound')),
  rule_type       text,
  body            text not null,
  status          text default 'enviado'
                  constraint chk_whatsapp_status check (status in ('enviado', 'entregado', 'leido', 'fallido')),
  sent_at         timestamptz default now()
);

create index idx_whatsapp_messages_salon on whatsapp_messages (salon_id, sent_at desc);

-- ------------------------------------------------------------
-- 8. PAGOS
-- ------------------------------------------------------------
create table payments (
  id              uuid primary key default uuid_generate_v4(),
  appointment_id  uuid not null references appointments(id) on delete cascade,
  amount_cents    int not null check (amount_cents >= 0),
  method          text not null
                  constraint chk_payments_method check (method in ('stripe', 'efectivo', 'yape', 'plin')),
  status          text not null default 'pendiente'
                  constraint chk_payments_status check (status in ('pendiente', 'pagado', 'reembolsado')),
  stripe_payment_intent_id text unique,          -- idempotencia: un intent de Stripe = un pago
  paid_at         timestamptz
);

-- ============================================================
-- FUNCIONES DE NEGOCIO
-- ============================================================

-- Fuente única del tenant del usuario autenticado. security definer para que
-- las policies puedan consultarla sin recursión de RLS sobre `users`.
create or replace function fn_current_salon_id()
returns uuid
language sql stable security definer
set search_path = public
as $$
  select salon_id from users where id = auth.uid();
$$;

-- Validación de horario libre en el servidor (modelo-de-datos, decisión #4).
-- El frontend sugiere disponibilidad; esta función (y en última instancia la
-- constraint no_overlap) es quien decide. p_exclude_appointment permite
-- reprogramar una cita sin que choque consigo misma.
create or replace function fn_is_slot_free(
  p_staff_id uuid,
  p_start timestamptz,
  p_end timestamptz,
  p_buffer_minutes int default 0,
  p_exclude_appointment uuid default null
)
returns boolean
language sql stable
as $$
  select not exists (
    select 1
    from appointments a
    where a.staff_id = p_staff_id
      and a.status <> 'cancelada'
      and (p_exclude_appointment is null or a.id <> p_exclude_appointment)
      and tstzrange(a.start_time, a.end_time + make_interval(mins => a.buffer_minutes))
          && tstzrange(p_start, p_end + make_interval(mins => p_buffer_minutes))
  );
$$;

-- Creación atómica de combos (arquitectura, transacción #1): las N citas de un
-- combo se crean todas o ninguna. Al ejecutarse como una sola llamada, todo el
-- cuerpo corre dentro de una transacción; cualquier raise exception revierte
-- las citas ya insertadas. p_items: [{"service_id","staff_id","start_time"}].
-- Devuelve el combo_group_id compartido.
create or replace function fn_create_combo_appointments(
  p_salon_id uuid,
  p_client_id uuid,
  p_combo_id uuid,
  p_items jsonb
)
returns uuid
language plpgsql
as $$
declare
  v_group_id uuid := uuid_generate_v4();
  v_item jsonb;
  v_service services%rowtype;
  v_staff_id uuid;
  v_price int;
  v_start timestamptz;
  v_end timestamptz;
begin
  if jsonb_array_length(p_items) < 1 then
    raise exception 'Un combo necesita al menos un servicio';
  end if;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_staff_id := (v_item->>'staff_id')::uuid;
    v_start := (v_item->>'start_time')::timestamptz;

    select * into v_service
    from services
    where id = (v_item->>'service_id')::uuid and salon_id = p_salon_id;
    if not found then
      raise exception 'Servicio % no existe en el salón', v_item->>'service_id';
    end if;

    select price_cents into v_price
    from service_staff_prices
    where service_id = v_service.id and staff_id = v_staff_id;
    if v_price is null then
      raise exception 'No hay precio definido de % para el especialista %', v_service.name, v_staff_id;
    end if;

    v_end := v_start + make_interval(mins => v_service.duration_minutes);

    if not fn_is_slot_free(v_staff_id, v_start, v_end, v_service.buffer_minutes) then
      raise exception 'Horario ocupado: % de % a %', v_staff_id, v_start, v_end;
    end if;

    insert into appointments
      (salon_id, client_id, service_id, staff_id, combo_group_id,
       start_time, end_time, buffer_minutes, duration_minutes, price_cents, status, notes)
    values
      (p_salon_id, p_client_id, v_service.id, v_staff_id, v_group_id,
       v_start, v_end, v_service.buffer_minutes, v_service.duration_minutes, v_price,
       'pendiente', 'Combo ' || p_combo_id);
  end loop;

  return v_group_id;
end;
$$;

-- ============================================================
-- TRIGGERS --- falta
-- ============================================================

-- Mantiene clients.visit_count / total_spent_cents / last_visit_at cuando una
-- cita pasa a 'completada' (y revierte si se saca de 'completada').
create or replace function fn_update_client_stats()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'completada'
     and (tg_op = 'INSERT' or old.status is distinct from 'completada') then
    update clients set
      visit_count = visit_count + 1,
      total_spent_cents = total_spent_cents + new.price_cents,
      last_visit_at = greatest(coalesce(last_visit_at, new.end_time), new.end_time),
      updated_at = now()
    where id = new.client_id;
  elsif tg_op = 'UPDATE'
        and old.status = 'completada' and new.status <> 'completada' then
    update clients set
      visit_count = greatest(visit_count - 1, 0),
      total_spent_cents = greatest(total_spent_cents - new.price_cents, 0),
      updated_at = now()
    where id = new.client_id;
  end if;
  return new;
end;
$$;
-- dice que ya rexciste
create trigger trg_update_client_stats
  after insert or update of status on appointments
  for each row execute function fn_update_client_stats();

-- updated_at automático en tablas mutables
create or replace function fn_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger trg_touch_services     before update on services     for each row execute function fn_touch_updated_at();
create trigger trg_touch_clients      before update on clients      for each row execute function fn_touch_updated_at();
create trigger trg_touch_appointments before update on appointments for each row execute function fn_touch_updated_at();
create trigger trg_touch_promotions   before update on promotions   for each row execute function fn_touch_updated_at();

-- revisar su exisrtencia
-- ============================================================
-- VISTAS PARA REPORTES
-- security_invoker = true: sin esto, las vistas corren con permisos del owner
-- y SALTAN RLS — cualquier autenticado vería datos de todos los salones.
-- ============================================================

create or replace view view_client_segments
with (security_invoker = true) as
select
  c.id as client_id,
  c.salon_id,
  case when c.total_spent_cents > 100000 then true else false end as is_vip, -- ej. > S/1000
  case when c.last_visit_at < now() - interval '60 days' then true else false end as is_inactive,
  case when extract(month from c.birth_date) = extract(month from now()) then true else false end as is_birthday_month
from clients c;

create or replace view view_promotions_with_status
with (security_invoker = true) as
select
  p.*,
  case
    when p.valid_from is not null and p.valid_from > current_date then 'programada'
    when p.valid_to   is not null and p.valid_to   < current_date then 'vencida'
    when p.usage_limit is not null and p.usage_count >= p.usage_limit then 'vencida'
    else 'activa'
  end as status
from promotions p;

create or replace view view_revenue_by_week
with (security_invoker = true) as
select
  salon_id,
  date_trunc('week', start_time) as week_start,
  sum(price_cents) as revenue_cents,
  count(*) as appointment_count
from appointments
where status = 'completada'
group by salon_id, date_trunc('week', start_time);

create or replace view view_top_services
with (security_invoker = true) as
select
  s.salon_id,
  s.id as service_id,
  s.name,
  count(a.id) as times_booked,
  sum(a.price_cents) as revenue_cents
from services s
join appointments a on a.service_id = s.id and a.status = 'completada'
group by s.salon_id, s.id, s.name
order by revenue_cents desc;

create or replace view view_staff_performance
with (security_invoker = true) as
select
  st.salon_id,
  st.id as staff_id,
  st.name,
  count(a.id) as appointment_count,
  sum(a.price_cents) as revenue_cents
from staff st
join appointments a on a.staff_id = st.id and a.status = 'completada'
group by st.salon_id, st.id, st.name;

-- ============================================================
-- ROW LEVEL SECURITY
-- Todas las tablas con RLS. Los inserts administrativos (alta de salones,
-- vínculo de usuarios) se hacen con la service role key, que salta RLS.
-- La página pública de reservas NO usa policies anónimas: usa Server Actions
-- con cliente service-role del lado del servidor.
-- ============================================================

alter table salons                enable row level security;
alter table users                 enable row level security;
alter table staff                 enable row level security;
alter table service_categories    enable row level security;
alter table services              enable row level security;
alter table service_staff_prices  enable row level security;
alter table combos                enable row level security;
alter table combo_services        enable row level security;
alter table clients               enable row level security;
alter table appointments          enable row level security;
alter table promotions            enable row level security;
alter table promotion_redemptions enable row level security;
alter table loyalty_programs      enable row level security;
alter table loyalty_progress      enable row level security;
alter table automation_rules      enable row level security;
alter table message_queue         enable row level security;
alter table whatsapp_messages     enable row level security;
alter table payments              enable row level security;

-- --- salons: cada usuario ve/edita solo su propio salón ---
create policy "salons_select" on salons for select
  using (id = fn_current_salon_id());
create policy "salons_update" on salons for update
  using (id = fn_current_salon_id())
  with check (id = fn_current_salon_id());

-- --- users: auto-lectura + ver al equipo del mismo salón. Escritura solo
-- --- vía service role (alta de cuentas es proceso administrativo). ---
create policy "users_select" on users for select
  using (id = (select auth.uid()) or salon_id = fn_current_salon_id());

-- --- Patrón estándar para tablas con salon_id ---
create policy "staff_select" on staff for select
  using (salon_id = fn_current_salon_id());
create policy "staff_all" on staff for all
  using (salon_id = fn_current_salon_id())
  with check (salon_id = fn_current_salon_id());

create policy "service_categories_select" on service_categories for select
  using (salon_id = fn_current_salon_id());
create policy "service_categories_all" on service_categories for all
  using (salon_id = fn_current_salon_id())
  with check (salon_id = fn_current_salon_id());

create policy "services_select" on services for select
  using (salon_id = fn_current_salon_id());
create policy "services_all" on services for all
  using (salon_id = fn_current_salon_id())
  with check (salon_id = fn_current_salon_id());

create policy "combos_select" on combos for select
  using (salon_id = fn_current_salon_id());
create policy "combos_all" on combos for all
  using (salon_id = fn_current_salon_id())
  with check (salon_id = fn_current_salon_id());

create policy "clients_select" on clients for select
  using (salon_id = fn_current_salon_id());
create policy "clients_all" on clients for all
  using (salon_id = fn_current_salon_id())
  with check (salon_id = fn_current_salon_id());

create policy "appointments_select" on appointments for select
  using (salon_id = fn_current_salon_id());
create policy "appointments_all" on appointments for all
  using (salon_id = fn_current_salon_id())
  with check (salon_id = fn_current_salon_id());

create policy "promotions_select" on promotions for select
  using (salon_id = fn_current_salon_id());
create policy "promotions_all" on promotions for all
  using (salon_id = fn_current_salon_id())
  with check (salon_id = fn_current_salon_id());

create policy "loyalty_programs_select" on loyalty_programs for select
  using (salon_id = fn_current_salon_id());
create policy "loyalty_programs_all" on loyalty_programs for all
  using (salon_id = fn_current_salon_id())
  with check (salon_id = fn_current_salon_id());

create policy "automation_rules_select" on automation_rules for select
  using (salon_id = fn_current_salon_id());
create policy "automation_rules_all" on automation_rules for all
  using (salon_id = fn_current_salon_id())
  with check (salon_id = fn_current_salon_id());

create policy "message_queue_select" on message_queue for select
  using (salon_id = fn_current_salon_id());
create policy "message_queue_all" on message_queue for all
  using (salon_id = fn_current_salon_id())
  with check (salon_id = fn_current_salon_id());

create policy "whatsapp_messages_select" on whatsapp_messages for select
  using (salon_id = fn_current_salon_id());
create policy "whatsapp_messages_all" on whatsapp_messages for all
  using (salon_id = fn_current_salon_id())
  with check (salon_id = fn_current_salon_id());

-- --- Tablas SIN salon_id: el tenant se resuelve vía join con su tabla padre ---

create policy "service_staff_prices_select" on service_staff_prices for select
  using (exists (select 1 from services s
                 where s.id = service_id and s.salon_id = fn_current_salon_id()));
create policy "service_staff_prices_all" on service_staff_prices for all
  using (exists (select 1 from services s
                 where s.id = service_id and s.salon_id = fn_current_salon_id()))
  with check (exists (select 1 from services s
                      where s.id = service_id and s.salon_id = fn_current_salon_id()));

create policy "combo_services_select" on combo_services for select
  using (exists (select 1 from combos c
                 where c.id = combo_id and c.salon_id = fn_current_salon_id()));
create policy "combo_services_all" on combo_services for all
  using (exists (select 1 from combos c
                 where c.id = combo_id and c.salon_id = fn_current_salon_id()))
  with check (exists (select 1 from combos c
                      where c.id = combo_id and c.salon_id = fn_current_salon_id()));

create policy "payments_select" on payments for select
  using (exists (select 1 from appointments a
                 where a.id = appointment_id and a.salon_id = fn_current_salon_id()));
create policy "payments_all" on payments for all
  using (exists (select 1 from appointments a
                 where a.id = appointment_id and a.salon_id = fn_current_salon_id()))
  with check (exists (select 1 from appointments a
                      where a.id = appointment_id and a.salon_id = fn_current_salon_id()));

create policy "promotion_redemptions_select" on promotion_redemptions for select
  using (exists (select 1 from promotions p
                 where p.id = promotion_id and p.salon_id = fn_current_salon_id()));
create policy "promotion_redemptions_all" on promotion_redemptions for all
  using (exists (select 1 from promotions p
                 where p.id = promotion_id and p.salon_id = fn_current_salon_id()))
  with check (exists (select 1 from promotions p
                      where p.id = promotion_id and p.salon_id = fn_current_salon_id()));

create policy "loyalty_progress_select" on loyalty_progress for select
  using (exists (select 1 from loyalty_programs lp
                 where lp.id = program_id and lp.salon_id = fn_current_salon_id()));
create policy "loyalty_progress_all" on loyalty_progress for all
  using (exists (select 1 from loyalty_programs lp
                 where lp.id = program_id and lp.salon_id = fn_current_salon_id()))
  with check (exists (select 1 from loyalty_programs lp
                      where lp.id = program_id and lp.salon_id = fn_current_salon_id()));
