"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { newClientSchema, type NewClientInput } from "@/lib/crm/schemas";
import { addClient } from "@/lib/crm/actions";

export function NewClientModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<NewClientInput>({
    resolver: zodResolver(newClientSchema),
    defaultValues: { name: "", phone: "", email: "", birthDate: "", preferences: "" },
  });

  async function onSubmit(data: NewClientInput) {
    setIsLoading(true);
    setError(null);

    const result = await addClient(data);

    if (!result.ok) {
      setError(result.error);
      setIsLoading(false);
      return;
    }

    reset();
    setIsLoading(false);
    setOpen(false);
    router.push(`/crm?client=${result.clientId}`);
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>+ Nueva clienta</Button>

      {open && (
        <div
          className="fixed inset-0 bg-black/45 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="bg-color-surface rounded-3xl max-w-md w-full max-h-[88vh] overflow-y-auto shadow-modal">
            <div className="px-6 py-5 border-b border-color-line-soft sticky top-0 bg-color-surface flex items-start justify-between">
              <h3 className="text-xl font-serif font-semibold text-color-ink">
                Nueva clienta
              </h3>
              <button
                onClick={() => setOpen(false)}
                className="w-7 h-7 rounded-full bg-color-line-soft hover:bg-color-line flex items-center justify-center text-color-ink-soft flex-shrink-0"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-4">
              <div>
                <Label htmlFor="name" className="block mb-2">
                  Nombre
                </Label>
                <Input
                  id="name"
                  placeholder="Nombre completo"
                  {...register("name")}
                  disabled={isLoading}
                />
                {errors.name && (
                  <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="phone" className="block mb-2 text-xs">
                    Teléfono
                  </Label>
                  <Input
                    id="phone"
                    placeholder="+51..."
                    {...register("phone")}
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <Label htmlFor="birthDate" className="block mb-2 text-xs">
                    Fecha de nacimiento
                  </Label>
                  <Input
                    id="birthDate"
                    type="date"
                    {...register("birthDate")}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email" className="block mb-2">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="correo@ejemplo.com"
                  {...register("email")}
                  disabled={isLoading}
                />
                {errors.email && (
                  <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="preferences" className="block mb-2">
                  Preferencias / notas
                </Label>
                <textarea
                  id="preferences"
                  {...register("preferences")}
                  placeholder="Alergias, gustos, notas..."
                  className="w-full px-3 py-2 rounded-lg border border-color-line text-sm focus:border-color-accent-rose focus:outline-none"
                  rows={3}
                  disabled={isLoading}
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Guardando..." : "Crear clienta"}
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
