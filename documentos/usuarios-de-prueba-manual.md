# Crear usuarios de prueba — paso a paso manual (dashboard)

Alternativa al script `create-test-users.mjs`, para cuando prefieras hacerlo con clics en vez de código.

## 1. Crear las cuentas en Authentication

1. Entra a tu proyecto en [supabase.com](https://supabase.com) → **Authentication → Users**.
2. Clic en **Add user → Create new user**.
3. Crea estas 3 cuentas (marca **Auto Confirm User** para saltar el correo de verificación):

   | Email | Password |
   |---|---|
   | `admin@bellamora.test` | `BellamoraTest#2026` |
   | `staff@bellamora.test` | `BellamoraTest#2026` |
   | `admin@otrosalon.test` | `BellamoraTest#2026` |

4. Después de crear cada una, **copia su UUID** (columna `UID` en la tabla de usuarios) — lo necesitas en el paso 3.

## 2. Crear el segundo salón de prueba (para verificar aislamiento)

En **Table Editor → salons → Insert row**:

| Campo | Valor |
|---|---|
| `id` | `a0000000-0000-0000-0000-000000000099` |
| `name` | `Otro Salón (prueba de aislamiento)` |

Este salón ficticio sirve para comprobar que un usuario de otro negocio **no puede ver nada** de Bellamora — es la prueba más importante del modelo multi-tenant.

## 3. Vincular cada cuenta a su salón en la tabla `users`

En **Table Editor → users → Insert row**, crea 3 filas usando los UUIDs que copiaste en el paso 1:

| `id` (UUID de auth) | `salon_id` | `role` | `email` |
|---|---|---|---|
| *(uuid de admin@bellamora.test)* | `a0000000-0000-0000-0000-000000000001` | `owner` | `admin@bellamora.test` |
| *(uuid de staff@bellamora.test)* | `a0000000-0000-0000-0000-000000000001` | `staff` | `staff@bellamora.test` |
| *(uuid de admin@otrosalon.test)* | `a0000000-0000-0000-0000-000000000099` | `owner` | `admin@otrosalon.test` |

O, si prefieres SQL en vez de clics, corre esto en **SQL Editor** (reemplazando los UUIDs):

```sql
insert into users (id, salon_id, role, email) values
('<uuid-admin-bellamora>', 'a0000000-0000-0000-0000-000000000001', 'owner', 'admin@bellamora.test'),
('<uuid-staff-bellamora>', 'a0000000-0000-0000-0000-000000000001', 'staff', 'staff@bellamora.test'),
('<uuid-admin-otrosalon>', 'a0000000-0000-0000-0000-000000000099', 'owner', 'admin@otrosalon.test');
```

## 4. Verificar que RLS funciona antes de seguir

Con cada cuenta logueada (puedes probar rápido desde **SQL Editor → "Run as user"**, o desde un cliente Supabase autenticado):

- `admin@bellamora.test` → `select * from clients;` debe devolver las 9 clientas del seed.
- `staff@bellamora.test` → debe ver los mismos datos del salón (a menos que luego definas políticas más restrictivas por rol).
- `admin@otrosalon.test` → `select * from clients;` debe devolver **0 filas**. Si devuelve algo, hay un error en las políticas RLS de `schema.sql` — corrígelo antes de construir las API routes.

Solo cuando el punto 4 pase, tiene sentido avanzar a construir los endpoints de Next.js sobre este backend.
