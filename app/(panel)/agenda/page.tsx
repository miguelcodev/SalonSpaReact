import { createClient } from "@/lib/supabase/server";

export default async function AgendaPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-serif font-semibold text-color-ink">
            Agenda de citas
          </h1>
          <p className="text-color-ink-soft mt-2">
            Próximamente: grid de especialistas, navegación de fechas, y gestión de citas.
          </p>
        </div>

        <div className="bg-color-surface rounded-lg border border-color-line p-6">
          <p className="text-color-ink-soft text-sm">
            Sesión activa como: <strong>{data.user?.email}</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
