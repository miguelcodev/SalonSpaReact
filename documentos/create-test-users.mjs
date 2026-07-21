/**
 * Bellamora — Crear usuarios de prueba
 * ------------------------------------
 * Crea 3 cuentas para validar RLS antes de construir las API routes:
 *   1. admin@bellamora.test   → owner del salón Bellamora
 *   2. staff@bellamora.test   → staff del salón Bellamora (permisos limitados)
 *   3. admin@otrosalon.test   → owner de un SEGUNDO salón ficticio
 *                               (para probar que NO puede ver datos de Bellamora)
 *
 * Requiere la SERVICE ROLE KEY (nunca exponerla en frontend/cliente).
 * Uso:
 *   SUPABASE_URL=https://xxxx.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=xxxx \
 *   node create-test-users.mjs
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Faltan SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY como variables de entorno.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const BELLAMORA_SALON_ID = 'a0000000-0000-0000-0000-000000000001'; // mismo id que en seed.sql
const TEST_PASSWORD = 'BellamoraTest#2026'; // solo para pruebas locales, nunca en producción

async function createAuthUser(email, password) {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // evita el paso de confirmación por correo en pruebas
  });
  if (error) {
    // Si ya existe, lo recuperamos en vez de fallar (útil al re-correr el script)
    if (error.message?.includes('already registered')) {
      const { data: list } = await supabase.auth.admin.listUsers();
      const existing = list.users.find((u) => u.email === email);
      console.log(`ℹ️  ${email} ya existía, reutilizando su id.`);
      return existing;
    }
    throw error;
  }
  console.log(`✅ Auth user creado: ${email} → ${data.user.id}`);
  return data.user;
}

async function linkToSalon(authUserId, salonId, role, email) {
  const { error } = await supabase
    .from('users')
    .upsert(
      { id: authUserId, salon_id: salonId, role, email },
      { onConflict: 'id' }
    );
  if (error) throw error;
  console.log(`🔗 Vinculado ${email} → salón ${salonId} como "${role}"`);
}

async function main() {
  // 1) Crea un segundo salón ficticio para la prueba de aislamiento multi-tenant
  const { data: otroSalon, error: salonError } = await supabase
    .from('salons')
    .upsert(
      { id: 'a0000000-0000-0000-0000-000000000099', name: 'Otro Salón (prueba de aislamiento)' },
      { onConflict: 'id' }
    )
    .select()
    .single();
  if (salonError) throw salonError;
  console.log(`✅ Salón de prueba creado: ${otroSalon.name}`);

  // 2) Crea las 3 cuentas de Auth
  const admin = await createAuthUser('admin@bellamora.test', TEST_PASSWORD);
  const staff = await createAuthUser('staff@bellamora.test', TEST_PASSWORD);
  const otroAdmin = await createAuthUser('admin@otrosalon.test', TEST_PASSWORD);

  // 3) Vincula cada una a su salón y rol en la tabla `users`
  await linkToSalon(admin.id, BELLAMORA_SALON_ID, 'owner', 'admin@bellamora.test');
  await linkToSalon(staff.id, BELLAMORA_SALON_ID, 'staff', 'staff@bellamora.test');
  await linkToSalon(otroAdmin.id, otroSalon.id, 'owner', 'admin@otrosalon.test');

  console.log('\n✨ Listo. Credenciales de prueba (misma contraseña para las 3):');
  console.log(`   admin@bellamora.test   / ${TEST_PASSWORD}  → debería ver TODO Bellamora`);
  console.log(`   staff@bellamora.test   / ${TEST_PASSWORD}  → debería ver Bellamora con permisos limitados`);
  console.log(`   admin@otrosalon.test   / ${TEST_PASSWORD}  → NO debería ver NADA de Bellamora`);
}

main().catch((err) => {
  console.error('❌ Error creando usuarios de prueba:', err.message);
  process.exit(1);
});
