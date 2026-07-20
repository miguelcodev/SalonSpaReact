"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useModal } from "./agenda-modal-context";
import { newAppointmentSchema } from "@/lib/agenda/schemas";
import { createAppointment } from "@/lib/agenda/actions";
import type { NewAppointmentInput } from "@/lib/agenda/schemas";
import { getServicesForNewAppointment, getStaffPricesForService, getStaffColumns } from "@/lib/agenda/queries";
import { Suspense } from "react";

interface NewAppointmentModalProps {
  dateISO: string;
}

function NewAppointmentModalContent({ dateISO }: NewAppointmentModalProps) {
  const { newModal, closeNewModal } = useModal();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [services, setServices] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [serviceLoading, setServiceLoading] = useState(true);

  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<NewAppointmentInput>({
    resolver: zodResolver(newAppointmentSchema),
    defaultValues: {
      clientId: "",
      serviceId: "",
      staffId: newModal.selectedStaffId || "",
      startTimeISO: "",
      notes: "",
    },
  });

  const selectedServiceId = watch("serviceId");
  const selectedHour = newModal.selectedHour || 9;

  // Load services on mount
  useState(() => {
    getServicesForNewAppointment().then((s) => {
      setServices(s);
      setServiceLoading(false);
    });
    getStaffColumns().then(setStaff);
  });

  async function onSubmit(data: NewAppointmentInput) {
    setIsLoading(true);
    setError(null);

    // Build the ISO timestamp: use the selected date + hour
    const date = new Date(`${dateISO}T00:00:00`);
    date.setHours(selectedHour, 0, 0, 0);

    const result = await createAppointment({
      ...data,
      startTimeISO: date.toISOString(),
    });

    if (!result.ok) {
      setError(result.error);
      setIsLoading(false);
      return;
    }

    reset();
    closeNewModal();
  }

  if (!newModal.isOpen) {
    return null;
  }

  const selectedService = services.find((s) => s.id === selectedServiceId);

  return (
    <div
      className="fixed inset-0 bg-black/45 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeNewModal();
      }}
    >
      <div className="bg-color-surface rounded-3xl max-w-md w-full max-h-[88vh] overflow-y-auto shadow-modal">
        {/* Header */}
        <div className="px-6 py-5 border-b border-color-line-soft sticky top-0 bg-color-surface flex items-start justify-between">
          <div>
            <h3 className="text-xl font-serif font-semibold text-color-ink">
              Nueva cita
            </h3>
            <div className="text-xs text-color-ink-soft mt-1 uppercase tracking-wide">
              Duración y precio vienen del catálogo
            </div>
          </div>
          <button
            onClick={closeNewModal}
            className="w-7 h-7 rounded-full bg-color-line-soft hover:bg-color-line flex items-center justify-center text-color-ink-soft flex-shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-4">
          {/* Client name */}
          <div>
            <Label htmlFor="clientId" className="block mb-2">
              Clienta
            </Label>
            <Input
              id="clientId"
              placeholder="Nombre de la clienta"
              {...register("clientId")}
              disabled={isLoading}
            />
            {errors.clientId && (
              <p className="text-xs text-red-600 mt-1">{errors.clientId.message}</p>
            )}
          </div>

          {/* Service + Hour */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="serviceId" className="block mb-2 text-xs">
                Servicio (catálogo)
              </Label>
              <select
                id="serviceId"
                {...register("serviceId")}
                disabled={serviceLoading || isLoading}
                className="w-full px-3 py-2 rounded-lg border border-color-line text-sm focus:border-color-accent-rose focus:outline-none"
              >
                <option value="">Elige servicio</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              {errors.serviceId && (
                <p className="text-xs text-red-600 mt-1">{errors.serviceId.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="startHour" className="block mb-2 text-xs">
                Hora de inicio
              </Label>
              <select
                id="startHour"
                defaultValue={newModal.selectedHour || 9}
                disabled={isLoading}
                className="w-full px-3 py-2 rounded-lg border border-color-line text-sm focus:border-color-accent-rose focus:outline-none"
              >
                {Array.from({ length: 11 }, (_, i) => i + 9).map((h) => (
                  <option key={h} value={h}>
                    {h % 12 === 0 ? 12 : h % 12}:00{" "}
                    {h >= 12 ? "pm" : "am"}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Staff selector */}
          <div>
            <Label htmlFor="staffId" className="block mb-2">
              Especialista (precio varía según nivel)
            </Label>
            <select
              id="staffId"
              {...register("staffId")}
              disabled={!selectedServiceId || isLoading}
              className="w-full px-3 py-2 rounded-lg border border-color-line text-sm focus:border-color-accent-rose focus:outline-none"
            >
              <option value="">Elige especialista</option>
              {selectedServiceId && (
                staff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))
              )}
            </select>
            {errors.staffId && (
              <p className="text-xs text-red-600 mt-1">{errors.staffId.message}</p>
            )}
          </div>

          {/* Service summary */}
          {selectedService && (
            <div className="bg-color-bg border border-color-line rounded-lg p-3 text-sm">
              <p>
                Durará <strong>{selectedService.duration_minutes} min</strong> + {" "}
                <strong>{selectedService.buffer_minutes} min de limpieza</strong>
              </p>
              <p className="mt-1">
                Precio: <strong>S/ {(selectedService.price_cents / 100).toFixed(2)}</strong>
              </p>
            </div>
          )}

          {/* Notes */}
          <div>
            <Label htmlFor="notes" className="block mb-2">
              Notas (opcional)
            </Label>
            <textarea
              id="notes"
              {...register("notes")}
              placeholder="Alergias, preferencias, etc."
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

          {/* Submit */}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Agendando..." : "Agendar cita"}
          </Button>
        </form>
      </div>
    </div>
  );
}

export function NewAppointmentModal({ dateISO }: NewAppointmentModalProps) {
  return (
    <Suspense fallback={null}>
      <NewAppointmentModalContent dateISO={dateISO} />
    </Suspense>
  );
}
