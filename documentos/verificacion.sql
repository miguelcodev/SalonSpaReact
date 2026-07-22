-- ============================================================
-- Bellamora — Verificación del schema corregido
-- Ejecutar en Supabase SQL Editor DESPUÉS de schema.sql + seed.sql.
-- Cada test imprime OK / FALLO vía RAISE NOTICE (pestaña "Messages").
-- No deja datos residuales: todo lo que inserta lo borra o revierte.
-- ============================================================

-- Por si esta sesión quedó con el rol cambiado de una corrida parcial
-- anterior (ej. solo se seleccionó y corrió el TEST 8 sin llegar a su
-- reset final) — TEST 8 más abajo cambia el rol a 'authenticated' para
-- probar RLS y lo devuelve a 'postgres' al final; esto asegura que
-- siempre arranca en el rol correcto sin importar el historial de la sesión.
reset role;

-- ------------------------------------------------------------
-- TEST 1 — Constraint no_overlap: doble reserva del MISMO
-- especialista debe fallar (Renata ya tiene 9:00–10:30 +10 buffer)
-- ------------------------------------------------------------
do $$
begin
  insert into appointments (salon_id, client_id, service_id, staff_id,
    start_time, end_time, buffer_minutes, duration_minutes, price_cents, status)
  values ('a0000000-0000-0000-0000-000000000001',
          'f0000000-0000-0000-0000-000000000002',
          'd0000000-0000-0000-0000-000000000002',
          'b0000000-0000-0000-0000-000000000001',      -- Renata
          '2026-07-16 09:30:00-05', '2026-07-16 10:00:00-05', 5, 30, 4500, 'pendiente');
  raise exception 'FALLO TEST 1: se permitió una doble reserva del mismo especialista';
exception
  when exclusion_violation then
    raise notice 'OK TEST 1: no_overlap bloqueó la doble reserva del mismo especialista';
end $$;

-- ------------------------------------------------------------
-- TEST 2 — Solape entre especialistas DISTINTOS sí se permite
-- (mismo horario 9:30, pero con Milagros en vez de Renata)
-- ------------------------------------------------------------
do $$
declare v_id uuid;
begin
  insert into appointments (salon_id, client_id, service_id, staff_id,
    start_time, end_time, buffer_minutes, duration_minutes, price_cents, status)
  values ('a0000000-0000-0000-0000-000000000001',
          'f0000000-0000-0000-0000-000000000002',
          'd0000000-0000-0000-0000-000000000005',
          'b0000000-0000-0000-0000-000000000003',      -- Milagros (libre a esa hora... no, tiene 10-11)
          '2026-07-16 08:00:00-05', '2026-07-16 08:30:00-05', 5, 30, 3500, 'pendiente')
  returning id into v_id;
  delete from appointments where id = v_id;
  raise notice 'OK TEST 2: reservas simultáneas de especialistas distintos permitidas';
end $$;

-- ------------------------------------------------------------
-- TEST 3 — fn_is_slot_free: el buffer cuenta como ocupado
-- Renata termina 10:30 con 10 min de buffer → 10:35 ocupado, 10:45 libre
-- ------------------------------------------------------------
do $$
begin
  if fn_is_slot_free('b0000000-0000-0000-0000-000000000001',
                     '2026-07-16 10:35:00-05', '2026-07-16 10:55:00-05') then
    raise exception 'FALLO TEST 3a: 10:35 debería estar ocupado (buffer hasta 10:40)';
  end if;
  raise notice 'OK TEST 3a: el buffer posterior cuenta como ocupado';

  if not fn_is_slot_free('b0000000-0000-0000-0000-000000000001',
                         '2026-07-16 12:00:00-05', '2026-07-16 12:30:00-05') then
    raise exception 'FALLO TEST 3b: 12:00 debería estar libre para Renata';
  end if;
  raise notice 'OK TEST 3b: slot libre detectado correctamente';
end $$;

-- ------------------------------------------------------------
-- TEST 4 — fn_create_combo_appointments: caso exitoso
-- Combo Exprés (manicure con Milagros + maquillaje con Sofía) el 17 de julio
-- ------------------------------------------------------------
do $$
declare v_group uuid; v_count int;
begin
  v_group := fn_create_combo_appointments(
    'a0000000-0000-0000-0000-000000000001',
    'f0000000-0000-0000-0000-000000000005',
    'e0000000-0000-0000-0000-000000000003',
    '[{"service_id":"d0000000-0000-0000-0000-000000000005","staff_id":"b0000000-0000-0000-0000-000000000003","start_time":"2026-07-17 10:00:00-05"},
      {"service_id":"d0000000-0000-0000-0000-000000000010","staff_id":"b0000000-0000-0000-0000-000000000005","start_time":"2026-07-17 10:00:00-05"}]'::jsonb
  );
  select count(*) into v_count from appointments where combo_group_id = v_group;
  if v_count <> 2 then
    raise exception 'FALLO TEST 4: se esperaban 2 citas del combo, hay %', v_count;
  end if;
  raise notice 'OK TEST 4: combo creó 2 citas con el mismo combo_group_id';
  delete from appointments where combo_group_id = v_group;
end $$;

-- ------------------------------------------------------------
-- TEST 5 — Atomicidad del combo: si un slot está ocupado,
-- NO debe quedar ninguna de las citas (ni la del slot libre)
-- Item 1: Sofía libre el 17; Item 2: Renata OCUPADA el 16 a las 9:00
-- ------------------------------------------------------------
do $$
declare v_before int; v_after int;
begin
  select count(*) into v_before from appointments;
  begin
    perform fn_create_combo_appointments(
      'a0000000-0000-0000-0000-000000000001',
      'f0000000-0000-0000-0000-000000000005',
      'e0000000-0000-0000-0000-000000000001',
      '[{"service_id":"d0000000-0000-0000-0000-000000000009","staff_id":"b0000000-0000-0000-0000-000000000005","start_time":"2026-07-17 15:00:00-05"},
        {"service_id":"d0000000-0000-0000-0000-000000000002","staff_id":"b0000000-0000-0000-0000-000000000001","start_time":"2026-07-16 09:15:00-05"}]'::jsonb
    );
    raise exception 'FALLO TEST 5: el combo con slot ocupado no lanzó error';
  exception
    when others then
      raise notice 'OK TEST 5a: combo rechazado (%)', sqlerrm;
  end;
  select count(*) into v_after from appointments;
  if v_after <> v_before then
    raise exception 'FALLO TEST 5b: quedaron % citas huérfanas del combo fallido', v_after - v_before;
  end if;
  raise notice 'OK TEST 5b: atomicidad confirmada — cero citas huérfanas';
end $$;

-- ------------------------------------------------------------
-- TEST 6 — Trigger de estadísticas de clienta al completar cita
-- ------------------------------------------------------------
do $$
declare v_id uuid; v_visits_before int; v_visits_after int;
begin
  select visit_count into v_visits_before
  from clients where id = 'f0000000-0000-0000-0000-000000000009';

  insert into appointments (salon_id, client_id, service_id, staff_id,
    start_time, end_time, buffer_minutes, duration_minutes, price_cents, status)
  values ('a0000000-0000-0000-0000-000000000001',
          'f0000000-0000-0000-0000-000000000009',
          'd0000000-0000-0000-0000-000000000010',
          'b0000000-0000-0000-0000-000000000005',
          '2026-07-18 09:00:00-05', '2026-07-18 09:30:00-05', 5, 30, 6000, 'pendiente')
  returning id into v_id;

  update appointments set status = 'completada' where id = v_id;

  select visit_count into v_visits_after
  from clients where id = 'f0000000-0000-0000-0000-000000000009';

  if v_visits_after <> v_visits_before + 1 then
    raise exception 'FALLO TEST 6: visit_count no se incrementó (% → %)', v_visits_before, v_visits_after;
  end if;
  raise notice 'OK TEST 6: trigger incrementó visit_count al completar la cita';

  -- limpieza: revertir estado (el trigger descuenta) y borrar la cita
  update appointments set status = 'cancelada' where id = v_id;
  delete from appointments where id = v_id;
end $$;

-- ------------------------------------------------------------
-- TEST 7 — Estados derivados de promociones
-- Esperado con el seed: 3 activas, 1 programada, 1 vencida
-- ------------------------------------------------------------
do $$
declare v_activas int; v_prog int; v_venc int;
begin
  select count(*) filter (where status = 'activa'),
         count(*) filter (where status = 'programada'),
         count(*) filter (where status = 'vencida')
  into v_activas, v_prog, v_venc
  from view_promotions_with_status
  where salon_id = 'a0000000-0000-0000-0000-000000000001';

  if (v_activas, v_prog, v_venc) = (3, 1, 1) then
    raise notice 'OK TEST 7: estados derivados correctos (3 activas, 1 programada, 1 vencida)';
  else
    raise notice 'AVISO TEST 7: % activas, % programadas, % vencidas — revisa si la fecha actual ya no es julio 2026', v_activas, v_prog, v_venc;
  end if;
end $$;

-- ------------------------------------------------------------
-- TEST 8 — Aislamiento multi-tenant (RLS)
-- Requiere haber corrido create-test-users.mjs (o el alta manual).
-- Impersona a cada usuario ajustando el JWT que lee auth.uid().
-- ------------------------------------------------------------
do $$
declare v_uid uuid; v_count int;
begin
  select id into v_uid from users where email = 'admin@otrosalon.test';
  if v_uid is null then
    raise notice 'SKIP TEST 8: crea primero los usuarios de prueba (create-test-users.mjs)';
    return;
  end if;

  -- a) El admin de OTRO salón no debe ver nada de Bellamora
  perform set_config('request.jwt.claims',
                     json_build_object('sub', v_uid, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);

  select count(*) into v_count from clients;
  if v_count <> 0 then
    raise exception 'FALLO TEST 8a: otro salón ve % clientas de Bellamora', v_count;
  end if;
  raise notice 'OK TEST 8a: otro salón ve 0 clientas';

  select count(*) into v_count from view_revenue_by_week;
  if v_count <> 0 then
    raise exception 'FALLO TEST 8b: otro salón ve % filas de ingresos vía vista (security_invoker roto)', v_count;
  end if;
  raise notice 'OK TEST 8b: las vistas de reportes también respetan RLS';

  -- b) El owner de Bellamora sí ve sus 9 clientas
  perform set_config('role', 'postgres', true);
  select id into v_uid from users where email = 'admin@bellamora.test';
  perform set_config('request.jwt.claims',
                     json_build_object('sub', v_uid, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);

  select count(*) into v_count from clients;
  if v_count <> 9 then
    raise exception 'FALLO TEST 8c: el owner de Bellamora ve % clientas (esperaba 9)', v_count;
  end if;
  raise notice 'OK TEST 8c: el owner de Bellamora ve sus 9 clientas';

  perform set_config('role', 'postgres', true);
end $$;

-- ------------------------------------------------------------
-- TEST 9 — fn_register_sale: venta simple de un producto, descuenta stock
-- Peine de cerámica arranca en 2 unidades (seed.sql)
-- ------------------------------------------------------------
do $$
declare v_sale_id uuid; v_stock_before int; v_stock_after int; v_items int;
begin
  select stock_quantity into v_stock_before
  from products where id = '51000000-0000-0000-0000-000000000005';

  v_sale_id := fn_register_sale(
    'a0000000-0000-0000-0000-000000000001',
    'f0000000-0000-0000-0000-000000000005',
    null, 'tienda',
    '[{"product_id":"51000000-0000-0000-0000-000000000005","quantity":1}]'::jsonb
  );

  select count(*) into v_items from sale_items where sale_id = v_sale_id;
  if v_items <> 1 then
    raise exception 'FALLO TEST 9a: se esperaba 1 sale_item, hay %', v_items;
  end if;
  raise notice 'OK TEST 9a: fn_register_sale creó la venta y su línea';

  select stock_quantity into v_stock_after
  from products where id = '51000000-0000-0000-0000-000000000005';
  if v_stock_after <> v_stock_before - 1 then
    raise exception 'FALLO TEST 9b: stock esperado %, quedó en %', v_stock_before - 1, v_stock_after;
  end if;
  raise notice 'OK TEST 9b: el trigger descontó el stock correctamente (% → %)', v_stock_before, v_stock_after;

  -- limpieza: revertir la venta de prueba (borra sale_items y stock_movements por cascade)
  delete from stock_movements where reference_sale_id = v_sale_id;
  delete from sales where id = v_sale_id;
  update products set stock_quantity = v_stock_before
    where id = '51000000-0000-0000-0000-000000000005';
end $$;

-- ------------------------------------------------------------
-- TEST 10 — fn_register_sale rechaza vender más stock del disponible
-- Peine de cerámica tiene 2 unidades — pedir 999 debe fallar sin tocar nada
-- ------------------------------------------------------------
do $$
declare v_stock_before int; v_stock_after int; v_sales_before int; v_sales_after int;
begin
  select stock_quantity into v_stock_before
  from products where id = '51000000-0000-0000-0000-000000000005';
  select count(*) into v_sales_before from sales;

  begin
    perform fn_register_sale(
      'a0000000-0000-0000-0000-000000000001',
      'f0000000-0000-0000-0000-000000000005',
      null, 'tienda',
      '[{"product_id":"51000000-0000-0000-0000-000000000005","quantity":999}]'::jsonb
    );
    raise exception 'FALLO TEST 10a: se permitió vender 999 unidades con solo % en stock', v_stock_before;
  exception
    when others then
      raise notice 'OK TEST 10a: venta rechazada por stock insuficiente (%)', sqlerrm;
  end;

  select stock_quantity into v_stock_after
  from products where id = '51000000-0000-0000-0000-000000000005';
  select count(*) into v_sales_after from sales;

  if v_stock_after <> v_stock_before or v_sales_after <> v_sales_before then
    raise exception 'FALLO TEST 10b: la venta rechazada dejó rastro (stock % → %, sales % → %)',
      v_stock_before, v_stock_after, v_sales_before, v_sales_after;
  end if;
  raise notice 'OK TEST 10b: rollback completo — ni stock ni sales quedaron afectados';
end $$;

-- ------------------------------------------------------------
-- TEST 11 — Venta combinada: servicio de una cita + producto, un solo cobro
-- ------------------------------------------------------------
do $$
declare v_sale_id uuid; v_total int; v_appt_price int;
begin
  select price_cents into v_appt_price
  from appointments where id = '10000000-0000-0000-0000-000000000002'; -- Ana Beltrán, corte de puntas

  v_sale_id := fn_register_sale(
    'a0000000-0000-0000-0000-000000000001',
    'f0000000-0000-0000-0000-000000000007',
    '10000000-0000-0000-0000-000000000002', 'cita',
    '[{"product_id":"51000000-0000-0000-0000-000000000004","quantity":1}]'::jsonb -- liga premium, S/15
  );

  select total_cents into v_total from sales where id = v_sale_id;
  if v_total <> v_appt_price + 1500 then
    raise exception 'FALLO TEST 11: total esperado % (servicio + producto), fue %', v_appt_price + 1500, v_total;
  end if;
  raise notice 'OK TEST 11: una venta combina el precio del servicio (%) + producto en un solo total (%)', v_appt_price, v_total;

  delete from stock_movements where reference_sale_id = v_sale_id;
  delete from sales where id = v_sale_id;
  update products set stock_quantity = stock_quantity + 1
    where id = '51000000-0000-0000-0000-000000000004';
end $$;

-- ============================================================
-- Si todos los NOTICE dicen OK, el backend está listo para
-- construir la app Next.js encima.
-- ============================================================
