import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "@/components/login-form";

export default async function LoginPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (data.user) {
    redirect("/agenda");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-color-bg px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-color-accent-rose to-color-accent-gold mb-4">
            <span className="text-white font-serif font-bold text-lg">B</span>
          </div>
          <h1 className="text-3xl font-serif font-semibold text-color-ink">
            Bellamora
          </h1>
          <p className="text-xs text-color-ink-soft uppercase tracking-widest mt-1">
            Gestión de salón
          </p>
        </div>

        <div className="bg-color-surface rounded-2xl shadow-card p-8">
          <h2 className="text-xl font-semibold text-color-ink mb-6">
            Inicia sesión
          </h2>
          <LoginForm />

          <div className="mt-6 pt-6 border-t border-color-line-soft text-center text-sm text-color-ink-soft">
            <p>Credenciales de prueba:</p>
            <code className="block text-xs font-mono mt-2 text-color-ink">
              admin@bellamora.test
            </code>
            <code className="block text-xs font-mono text-color-ink">
              BellamoraTest#2026
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}
