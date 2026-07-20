"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInWithPassword } from "@/lib/auth/actions";

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit } = useForm({
    defaultValues: {
      email: "admin@bellamora.test",
      password: "BellamoraTest#2026",
    },
  });

  async function onSubmit(formData: any) {
    setIsLoading(true);
    setError(null);

    const formDataObj = new FormData();
    formDataObj.append("email", formData.email);
    formDataObj.append("password", formData.password);

    const result = await signInWithPassword(formDataObj);

    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="email" className="block mb-2">
          Email
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="tu@email.com"
          {...register("email", { required: true })}
          disabled={isLoading}
        />
      </div>

      <div>
        <Label htmlFor="password" className="block mb-2">
          Contraseña
        </Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          {...register("password", { required: true })}
          disabled={isLoading}
        />
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Iniciando..." : "Iniciar sesión"}
      </Button>
    </form>
  );
}
