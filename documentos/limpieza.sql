-- ============================================================
-- Bellamora — Limpieza total del schema público
-- Ejecutar en Supabase SQL Editor ANTES de schema.sql para
-- partir de cero. Idempotente: no falla si algo no existe
-- (cubre tanto la versión vieja del schema como la nueva).
--
-- ⚠️  BORRA TODOS LOS DATOS de las tablas de Bellamora.
-- No toca Supabase Auth (auth.users): las cuentas de prueba
-- creadas con create-test-users.mjs sobreviven; solo se pierde
-- su vínculo en public.users (se recrea al correr el script
-- de usuarios o el alta manual).
-- ============================================================

-- ------------------------------------------------------------
-- 1. VISTAS (primero, para que no bloqueen los drops de tablas)
-- ------------------------------------------------------------
drop view if exists view_client_segments        cascade;
drop view if exists view_promotions_with_status cascade;
drop view if exists view_revenue_by_week        cascade;
drop view if exists view_top_services           cascade;
drop view if exists view_staff_performance      cascade;

-- ------------------------------------------------------------
-- 2. TABLAS (hijas primero; cascade cubre policies, triggers,
--    índices y cualquier FK que quede)
-- ------------------------------------------------------------
drop table if exists payments               cascade;
drop table if exists whatsapp_messages      cascade;
drop table if exists message_queue          cascade;
drop table if exists automation_rules       cascade;
drop table if exists loyalty_progress       cascade;
drop table if exists loyalty_programs       cascade;
drop table if exists promotion_redemptions  cascade;
drop table if exists promotions             cascade;
drop table if exists appointments           cascade;
drop table if exists clients                cascade;
drop table if exists combo_services         cascade;
drop table if exists combos                 cascade;
drop table if exists service_staff_prices   cascade;
drop table if exists services               cascade;
drop table if exists service_categories     cascade;
drop table if exists users                  cascade;
drop table if exists staff                  cascade;
drop table if exists salons                 cascade;

-- ------------------------------------------------------------
-- 3. FUNCIONES (los triggers ya cayeron con sus tablas)
-- ------------------------------------------------------------
drop function if exists fn_current_salon_id()                              cascade;
drop function if exists fn_is_slot_free(uuid, timestamptz, timestamptz, int, uuid) cascade;
drop function if exists fn_create_combo_appointments(uuid, uuid, uuid, jsonb)      cascade;
drop function if exists fn_update_client_stats()                           cascade;
drop function if exists fn_touch_updated_at()                              cascade;

-- ------------------------------------------------------------
-- 4. EXTENSIONES — NO se borran a propósito:
--    uuid-ossp y btree_gist son compartidas a nivel de base y
--    schema.sql las crea con "if not exists" sin conflicto.
-- ------------------------------------------------------------

-- ------------------------------------------------------------
-- Verificación: debe devolver 0 filas si la limpieza fue total
-- ------------------------------------------------------------
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'salons','users','staff','service_categories','services',
    'service_staff_prices','combos','combo_services','clients',
    'appointments','promotions','promotion_redemptions',
    'loyalty_programs','loyalty_progress','automation_rules',
    'message_queue','whatsapp_messages','payments'
  );
