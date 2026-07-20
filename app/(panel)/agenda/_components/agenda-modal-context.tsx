"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import type { AppointmentWithRelations } from "@/lib/agenda/types";

interface ModalState {
  detailModal: {
    isOpen: boolean;
    appointment: AppointmentWithRelations | null;
  };
  newModal: {
    isOpen: boolean;
    selectedStaffId: string | null;
    selectedHour: number | null;
  };
}

interface ModalContextValue extends ModalState {
  openDetailModal: (appointment: AppointmentWithRelations) => void;
  closeDetailModal: () => void;
  openNewModal: (staffId?: string, hour?: number) => void;
  closeNewModal: () => void;
}

const ModalContext = createContext<ModalContextValue | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ModalState>({
    detailModal: { isOpen: false, appointment: null },
    newModal: { isOpen: false, selectedStaffId: null, selectedHour: null },
  });

  const openDetailModal = (appointment: AppointmentWithRelations) => {
    setState((s) => ({
      ...s,
      detailModal: { isOpen: true, appointment },
    }));
  };

  const closeDetailModal = () => {
    setState((s) => ({
      ...s,
      detailModal: { isOpen: false, appointment: null },
    }));
  };

  const openNewModal = (staffId?: string, hour?: number) => {
    setState((s) => ({
      ...s,
      newModal: { isOpen: true, selectedStaffId: staffId || null, selectedHour: hour || null },
    }));
  };

  const closeNewModal = () => {
    setState((s) => ({
      ...s,
      newModal: { isOpen: false, selectedStaffId: null, selectedHour: null },
    }));
  };

  return (
    <ModalContext.Provider
      value={{
        ...state,
        openDetailModal,
        closeDetailModal,
        openNewModal,
        closeNewModal,
      }}
    >
      {children}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModal must be used within ModalProvider");
  }
  return context;
}
