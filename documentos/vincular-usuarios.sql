-- ============================================================
-- Bellamora — Vincular usuarios de Auth a public.users
-- Ejecutar en Supabase SQL Editor DESPUÉS de crear las cuentas
-- en Authentication (dashboard o create-test-users.mjs).
--
-- Resuelve por EMAIL, así no necesitas copiar UUIDs a mano.
-- Es el paso 3 de documentos/usuarios-de-prueba-manual.md.
-- Sin esta fila, fn_current_salon_id() devuelve null y TODAS
-- las policies RLS bloquean todo (0 filas en cualquier tabla).
-- ============================================================

insert into users (id, salon_id, role, email)
select id, 'a0000000-0000-0000-0000-000000000001', 'owner', email
from auth.users
where email = 'admin@bellamora.test'
on conflict (id) do update set salon_id = excluded.salon_id, role = excluded.role;

insert into users (id, salon_id, role, email)
select id, 'a0000000-0000-0000-0000-000000000001', 'staff', email
from auth.users
where email = 'staff@bellamora.test'
on conflict (id) do update set salon_id = excluded.salon_id, role = excluded.role;

-- Segundo salón ficticio, para probar aislamiento multi-tenant (opcional)
insert into salons (id, name)
values ('a0000000-0000-0000-0000-000000000099', 'Otro Salón (prueba de aislamiento)')
on conflict (id) do nothing;

insert into users (id, salon_id, role, email)
select id, 'a0000000-0000-0000-0000-000000000099', 'owner', email
from auth.users
where email = 'admin@otrosalon.test'
on conflict (id) do update set salon_id = excluded.salon_id, role = excluded.role;

-- Verificación: deberías ver 3 filas (o 2 si no creaste la cuenta de otro salón)
select email, salon_id, role from users order by email;
