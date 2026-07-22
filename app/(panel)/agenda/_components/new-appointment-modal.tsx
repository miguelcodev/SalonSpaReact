"use client";

import { useState, useEffect, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ClientPicker } from "@/components/client-picker";
import { useModal } from "./agenda-modal-context";
import { newAppointmentSchema } from "@/lib/agenda/schemas";
import { createAppointment } from "@/lib/agenda/actions";
import type { NewAppointmentInput } from "@/lib/agenda/schemas";
import { getServicesForNewAppointment, getStaffPricesForService } from "@/lib/agenda/queries";
import type { Service, ServiceCategory } from "@/types/database";
import type { StaffPriceOption } from "@/lib/agenda/types";
import type { ClientSearchResult } from "@/lib/crm/types";

interface NewAppointmentModalProps {
  dateISO: string;
}

type ServiceWithCategory = Service & { category: ServiceCategory };

function NewAppointmentModalContent({ dateISO }: NewAppointmentModalProps) {
  const { newModal, closeNewModal } = useModal();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [services, setServices] = useState<ServiceWithCategory[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [staffPrices, setStaffPrices] = useState<StaffPriceOption[]>([]);
  const [pricesLoading, setPricesLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
    setValue,
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
  const selectedStaffId = watch("staffId");
  const [selectedHour, setSelectedHour] = useState(newModal.selectedHour || 9);

  // Load services once on mount
  useEffect(() => {
    getServicesForNewAppointment().then((s) => {
      setServices(s);
      setServicesLoading(false);
    });
  }, []);

  // The modal component instance persists across opens/closes (it's always
  // mounted, just returns null while closed) — so state from a previous
  // open (a different grid cell's staff/hour) would otherwise leak into
  // the next one. Re-sync everything whenever it opens.
  useEffect(() => {
    if (!newModal.isOpen) return;
    setSelectedHour(newModal.selectedHour || 9);
    reset({
      clientId: "",
      serviceId: "",
      staffId: newModal.selectedStaffId || "",
      startTimeISO: "",
      notes: "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newModal.isOpen, newModal.selectedHour, newModal.selectedStaffId]);

  // startTimeISO is the field newAppointmentSchema actually validates, but
  // nothing wrote it into react-hook-form's tracked state — it stayed at
  // its defaultValue "" forever. zodResolver validates the form BEFORE
  // onSubmit runs, so every submit silently failed validation on this one
  // empty field and onSubmit was never called — the reported "el botón no
  // hace nada". Keeping it in sync here, tied to the actual hour dropdown,
  // fixes both that and the dropdown being visually present but inert.
  useEffect(() => {
    const date = new Date(`${dateISO}T00:00:00`);
    date.setHours(selectedHour, 0, 0, 0);
    setValue("startTimeISO", date.toISOString(), { shouldValidate: true });
  }, [dateISO, selectedHour, setValue]);

  // Load staff pricing options whenever the selected service changes
  // (only staff with a price entry for this service can be picked — mirrors
  // the prototype's staffOptions per service).
  useEffect(() => {
    if (!selectedServiceId) {
      setStaffPrices([]);
      return;
    }
    setPricesLoading(true);
    getStaffPricesForService(selectedServiceId).then((prices) => {
      setStaffPrices(prices);
      setPricesLoading(false);
      // Reset staff selection if it's no longer a valid option for this service
      if (!prices.some((p) => p.staff_id === selectedStaffId)) {
        setValue("staffId", "");
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedServiceId]);

  async function onSubmit(data: NewAppointmentInput) {
    setIsLoading(true);
    setError(null);

    const result = await createAppointment(data);

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
  const selectedPriceOption = staffPrices.find(
    (p) => p.staff_id === selectedStaffId
  );

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
          {/* Client picker — must resolve to a real clients.id (uuid) */}
          <div>
            <Label className="block mb-2">Clienta</Label>
            <ClientPicker
              onSelect={(client: ClientSearchResult) =>
                setValue("clientId", client.id, { shouldValidate: true })
              }
              disabled={isLoading}
              error={errors.clientId?.message}
            />
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
                disabled={servicesLoading || isLoading}
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
                value={selectedHour}
                onChange={(e) => setSelectedHour(parseInt(e.target.value, 10))}
                disabled={isLoading}
                className="w-full px-3 py-2 rounded-lg border border-color-line text-sm focus:border-color-accent-rose focus:outline-none"
              >
                {Array.from({ length: 11 }, (_, i) => i + 9).map((h) => (
                  <option key={h} value={h}>
                    {h % 12 === 0 ? 12 : h % 12}:00 {h >= 12 ? "pm" : "am"}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Staff selector — only staff with a price for the selected service */}
          <div>
            <Label htmlFor="staffId" className="block mb-2">
              Especialista (precio varía según nivel)
            </Label>
            <select
              id="staffId"
              {...register("staffId")}
              disabled={!selectedServiceId || pricesLoading || isLoading}
              className="w-full px-3 py-2 rounded-lg border border-color-line text-sm focus:border-color-accent-rose focus:outline-none"
            >
              <option value="">
                {pricesLoading ? "Cargando..." : "Elige especialista"}
              </option>
              {staffPrices.map((p) => (
                <option key={p.staff_id} value={p.staff_id}>
                  {p.staff_name} — S/ {(p.price_cents / 100).toFixed(2)}
                </option>
              ))}
            </select>
            {errors.staffId && (
              <p className="text-xs text-red-600 mt-1">{errors.staffId.message}</p>
            )}
          </div>

          {/* Service summary */}
          {selectedService && (
            <div className="bg-color-bg border border-color-line rounded-lg p-3 text-sm">
              <p>
                Durará <strong>{selectedService.duration_minutes} min</strong>{" "}
                + <strong>{selectedService.buffer_minutes} min de limpieza</strong>
              </p>
              {selectedPriceOption ? (
                <p className="mt-1">
                  Precio con {selectedPriceOption.staff_name}:{" "}
                  <strong>
                    S/ {(selectedPriceOption.price_cents / 100).toFixed(2)}
                  </strong>
                </p>
              ) : (
                <p className="mt-1 text-color-ink-soft">
                  Elige una especialista para ver el precio.
                </p>
              )}
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
