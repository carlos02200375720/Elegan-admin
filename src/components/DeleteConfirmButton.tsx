"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";

type DeleteConfirmButtonProps = {
  onConfirm: () => Promise<void> | void;
  disabled?: boolean;
  label?: string;
};

export function DeleteConfirmButton({
  onConfirm,
  disabled = false,
  label = "Eliminar",
}: DeleteConfirmButtonProps) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className="confirm-group">
        <button
          type="button"
          className="button-danger"
          disabled={disabled}
          onClick={() => {
            setConfirming(false);
            void onConfirm();
          }}
        >
          Confirmar
        </button>
        <button
          type="button"
          className="button-secondary"
          disabled={disabled}
          onClick={() => setConfirming(false)}
        >
          Cancelar
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      className="button-secondary button-danger-outline"
      disabled={disabled}
      onClick={() => setConfirming(true)}
    >
      <Trash2 size={14} />
      <span>{label}</span>
    </button>
  );
}
